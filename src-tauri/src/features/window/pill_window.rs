use tauri::AppHandle;

#[cfg(target_os = "macos")]
use std::sync::atomic::{AtomicBool, Ordering};
#[cfg(target_os = "macos")]
use std::sync::Arc;

#[cfg(target_os = "macos")]
static MONITOR_ACTIVE: std::sync::OnceLock<Arc<AtomicBool>> = std::sync::OnceLock::new();

/// Sets whether the pill window monitor should actively poll for screen changes.
/// When active (during recording), polls every 500ms.
/// When inactive (idle), polls every 2000ms to reduce CPU usage.
#[cfg(target_os = "macos")]
pub fn set_pill_monitor_active(active: bool) {
    let flag = MONITOR_ACTIVE.get_or_init(|| Arc::new(AtomicBool::new(false)));
    flag.store(active, Ordering::SeqCst);
    log::debug!("Pill window monitor active: {}", active);
}

#[cfg(target_os = "macos")]
fn is_monitor_active() -> bool {
    MONITOR_ACTIVE
        .get()
        .map(|flag| flag.load(Ordering::SeqCst))
        .unwrap_or(false)
}

#[cfg(target_os = "macos")]
/// Positions the voice input window on the screen containing the mouse cursor
pub fn position_pill_window_on_current_screen(app: &AppHandle) -> tauri::Result<()> {
    use objc2::MainThreadMarker;
    use objc2_app_kit::{NSEvent, NSScreen};
    use tauri::Manager;

    let window = app
        .get_webview_window("voice-input")
        .ok_or_else(|| tauri::Error::WindowNotFound)?;

    let (pos_x, pos_y) = unsafe {
        let mtm = MainThreadMarker::new_unchecked();

        // Get the mouse location (in macOS global coordinates - origin at bottom-left of primary)
        let mouse_location = NSEvent::mouseLocation();

        // Find the screen containing the mouse cursor
        let screens = NSScreen::screens(mtm);
        let main_screen = NSScreen::mainScreen(mtm).expect("Failed to get main screen");
        let main_screen_frame = main_screen.frame();
        let mut target_screen = main_screen.clone();

        // Check each screen to find which one contains the mouse cursor
        for i in 0..screens.len() {
            let screen = screens.objectAtIndex(i);
            let frame = screen.frame();
            // Check if mouse is within this screen's bounds
            if mouse_location.x >= frame.origin.x
                && mouse_location.x < frame.origin.x + frame.size.width
                && mouse_location.y >= frame.origin.y
                && mouse_location.y < frame.origin.y + frame.size.height
            {
                target_screen = screen;
                break;
            }
        }

        let screen_frame = target_screen.frame();
        let visible_frame = target_screen.visibleFrame();

        log::debug!(
            "Pill position: mouse=({}, {}), main_screen={}x{}, target_screen={}x{} at ({}, {})",
            mouse_location.x,
            mouse_location.y,
            main_screen_frame.size.width,
            main_screen_frame.size.height,
            screen_frame.size.width,
            screen_frame.size.height,
            screen_frame.origin.x,
            screen_frame.origin.y
        );

        let pill_width = 240.0;
        let pill_height = 40.0;
        let bottom_offset = 16.0;

        // Center horizontally on the visible area of target screen
        let x = visible_frame.origin.x + (visible_frame.size.width - pill_width) / 2.0;

        // Position at bottom of visible area (above dock if present)
        let macos_window_top_y = visible_frame.origin.y + bottom_offset + pill_height;
        let y = main_screen_frame.size.height - macos_window_top_y;

        log::debug!("Pill calculated position: x={}, y={}", x, y);

        (x, y)
    };

    window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
        x: pos_x,
        y: pos_y,
    }))?;

    Ok(())
}

#[cfg(target_os = "macos")]
/// Starts monitoring dock/screen changes and repositions pill window when needed
pub fn start_pill_window_monitor(app: AppHandle) {
    static MONITOR_RUNNING: std::sync::OnceLock<Arc<AtomicBool>> = std::sync::OnceLock::new();
    let running = MONITOR_RUNNING.get_or_init(|| Arc::new(AtomicBool::new(false)));

    if running.swap(true, Ordering::SeqCst) {
        log::debug!("Pill window monitor already running");
        return;
    }

    log::info!("Starting pill window position monitor");

    tauri::async_runtime::spawn(async move {
        use tauri::Manager;

        let mut last_visible_frames: Vec<(f64, f64, f64, f64)> = Vec::new();

        loop {
            // When actively recording, poll frequently (500ms) for screen changes
            // When idle, poll less frequently (2000ms) to reduce CPU usage
            let poll_interval = if is_monitor_active() { 500 } else { 2000 };
            tokio::time::sleep(tokio::time::Duration::from_millis(poll_interval)).await;

            let current_frames: Vec<(f64, f64, f64, f64)> = {
                match app.get_webview_window("voice-input") {
                    Some(_window) => unsafe {
                        use objc2::MainThreadMarker;
                        use objc2_app_kit::NSScreen;

                        let mtm = MainThreadMarker::new_unchecked();
                        let screens = NSScreen::screens(mtm);
                        let mut frames = Vec::new();

                        for i in 0..screens.len() {
                            let screen = screens.objectAtIndex(i);
                            let visible = screen.visibleFrame();
                            frames.push((
                                visible.origin.x,
                                visible.origin.y,
                                visible.size.width,
                                visible.size.height,
                            ));
                        }
                        frames
                    },
                    None => continue,
                }
            };

            let frames_changed = if current_frames.len() != last_visible_frames.len() {
                true
            } else {
                current_frames
                    .iter()
                    .zip(last_visible_frames.iter())
                    .any(|(current, last)| {
                        (current.0 - last.0).abs() > 1.0
                            || (current.1 - last.1).abs() > 1.0
                            || (current.2 - last.2).abs() > 1.0
                            || (current.3 - last.3).abs() > 1.0
                    })
            };

            if frames_changed && !last_visible_frames.is_empty() {
                log::debug!("Screen visible frames changed, checking pill window");

                if let Some(window) = app.get_webview_window("voice-input") {
                    if window.is_visible().unwrap_or(false) {
                        log::debug!("Repositioning visible pill window after dock change");
                        if let Err(e) = position_pill_window_on_current_screen(&app) {
                            log::warn!("Failed to reposition pill window: {:?}", e);
                        }
                    }
                }
            }

            last_visible_frames = current_frames;
        }
    });
}

#[cfg(target_os = "macos")]
pub fn setup_pill_window(app: &AppHandle) -> tauri::Result<()> {
    use objc2::MainThreadMarker;
    use objc2_app_kit::NSScreen;
    use tauri::{WebviewUrl, WebviewWindowBuilder};

    log::info!("Setting up pill window");

    let (pos_x, pos_y) = unsafe {
        let mtm = MainThreadMarker::new_unchecked();
        let screen = NSScreen::mainScreen(mtm).expect("Failed to get main screen");
        let screen_frame = screen.frame();
        let visible_frame = screen.visibleFrame();

        let pill_width = 240.0;
        let pill_height = 40.0;
        let bottom_offset = 16.0;

        let x = visible_frame.origin.x + (visible_frame.size.width - pill_width) / 2.0;
        let macos_y = visible_frame.origin.y + bottom_offset;
        let y = screen_frame.size.height - macos_y - pill_height;

        (x, y)
    };

    let pill_builder = WebviewWindowBuilder::new(
        app,
        "voice-input",
        WebviewUrl::App("voice-input.html".into()),
    )
    .title("Voice Input")
    .resizable(false)
    .maximizable(false)
    .minimizable(false)
    .decorations(false)
    .always_on_top(true)
    .visible_on_all_workspaces(true)
    .content_protected(true)
    .skip_taskbar(true)
    .transparent(true)
    .shadow(false)
    .inner_size(240.0, 40.0)
    .position(pos_x, pos_y)
    .visible(false)
    .focused(false);

    #[cfg(not(debug_assertions))]
    let pill_builder = pill_builder.initialization_script(
        "document.addEventListener('contextmenu', e => e.preventDefault());",
    );

    #[cfg(debug_assertions)]
    let pill_builder = pill_builder;

    let pill_window = pill_builder.build()?;
    log::info!("Pill window built successfully");

    // Convert to NSPanel and configure using direct Cocoa APIs
    use tauri_nspanel::WebviewWindowExt;

    match pill_window.to_panel() {
        Ok(panel) => {
            log::info!("Pill window converted to NSPanel");

            // Configure panel for Raycast-like behavior using tauri-nspanel's built-in methods
            // These wrap the underlying objc calls safely

            // Set window level high enough to appear above full-screen apps
            // Level 1000 is kCGScreenSaverWindowLevel
            panel.set_level(1000);

            // Set collection behavior for full-screen support
            use tauri_nspanel::cocoa::appkit::NSWindowCollectionBehavior;
            panel.set_collection_behaviour(
                NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
                    | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary
                    | NSWindowCollectionBehavior::NSWindowCollectionBehaviorStationary
                    | NSWindowCollectionBehavior::NSWindowCollectionBehaviorIgnoresCycle,
            );

            // Make it a floating panel that doesn't hide when app is not active
            panel.set_floating_panel(true);
            panel.set_hides_on_deactivate(false);

            log::info!("Pill panel configured for full-screen and multi-monitor support");
        }
        Err(e) => log::error!("Failed to convert pill to NSPanel: {:?}", e),
    }

    log::info!("Pill window ready at ({}, {})", pos_x, pos_y);

    Ok(())
}
