use rand::Rng;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};

const TOAST_WIDTH: f64 = 360.0;
const TOAST_HEIGHT: f64 = 72.0;
const PILL_HEIGHT: f64 = 40.0;
const BOTTOM_OFFSET: f64 = 16.0;
const GAP: f64 = 12.0;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ToastType {
    Info,
    Success,
    Error,
    Warning,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToastMessage {
    pub message: String,
    #[serde(rename = "type")]
    pub toast_type: ToastType,
}

pub fn show_toast(
    app: &AppHandle,
    message: &str,
    toast_type: ToastType,
    probability: f64,
) -> Result<(), String> {
    log::debug!("show_toast: '{}' type={:?}", message, toast_type);

    if probability < 1.0 && !should_show_with_probability(probability) {
        return Ok(());
    }

    if let Err(e) = position_toast_window(app) {
        log::warn!("Failed to position toast: {}", e);
    }

    if let Some(window) = app.get_webview_window("toast") {
        let _ = window.show();
    }

    app.emit(
        "show_toast",
        ToastMessage {
            message: message.to_string(),
            toast_type,
        },
    )
    .map_err(|e| format!("Failed to emit toast: {}", e))
}

fn should_show_with_probability(probability: f64) -> bool {
    let roll: f64 = rand::rng().random();
    roll <= probability
}

pub fn hide_toast(app: &AppHandle) -> Result<(), String> {
    log::debug!("hide_toast");
    app.emit("hide_toast", ())
        .map_err(|e| format!("Failed to emit hide_toast: {}", e))
}

#[cfg(target_os = "macos")]
fn position_toast_window(app: &AppHandle) -> tauri::Result<()> {
    use objc2::MainThreadMarker;

    let window = app
        .get_webview_window("toast")
        .ok_or_else(|| tauri::Error::WindowNotFound)?;

    let Some(mtm) = MainThreadMarker::new() else {
        log::warn!("position_toast_window: not on main thread");
        return Ok(());
    };

    let (x, y) = calculate_toast_position(mtm);
    window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }))?;

    Ok(())
}

#[cfg(target_os = "macos")]
fn calculate_toast_position(mtm: objc2::MainThreadMarker) -> (f64, f64) {
    use objc2_app_kit::{NSEvent, NSScreen};

    let mouse_location = NSEvent::mouseLocation();
    let screens = NSScreen::screens(mtm);
    let main_screen = NSScreen::mainScreen(mtm).expect("Failed to get main screen");
    let main_frame = main_screen.frame();

    let target_screen = find_screen_for_point(&screens, mouse_location.x, mouse_location.y)
        .unwrap_or(main_screen);
    let visible = target_screen.visibleFrame();

    let x = visible.origin.x + (visible.size.width - TOAST_WIDTH) / 2.0;
    let toast_top_y = visible.origin.y + BOTTOM_OFFSET + PILL_HEIGHT + GAP + TOAST_HEIGHT;
    let y = main_frame.size.height - toast_top_y;

    (x, y)
}

#[cfg(target_os = "macos")]
fn find_screen_for_point(
    screens: &objc2_foundation::NSArray<objc2_app_kit::NSScreen>,
    x: f64,
    y: f64,
) -> Option<objc2::rc::Retained<objc2_app_kit::NSScreen>> {
    for i in 0..screens.len() {
        let screen = screens.objectAtIndex(i);
        let frame = screen.frame();
        if x >= frame.origin.x
            && x < frame.origin.x + frame.size.width
            && y >= frame.origin.y
            && y < frame.origin.y + frame.size.height
        {
            return Some(screen);
        }
    }
    None
}

#[cfg(target_os = "macos")]
pub fn setup_toast_window(app: &AppHandle) -> tauri::Result<()> {
    use objc2::MainThreadMarker;
    use tauri::{WebviewUrl, WebviewWindowBuilder};

    log::info!("Setting up toast window");

    let mtm = MainThreadMarker::new().ok_or_else(|| {
        tauri::Error::Io(std::io::Error::new(
            std::io::ErrorKind::Other,
            "setup_toast_window must be called from main thread",
        ))
    })?;

    let (toast_x, toast_y) = calculate_initial_toast_position(mtm);

    let toast_builder =
        WebviewWindowBuilder::new(app, "toast", WebviewUrl::App("toast.html".into()))
            .title("Toast")
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
            .inner_size(TOAST_WIDTH, TOAST_HEIGHT)
            .position(toast_x, toast_y)
            .visible(false)
            .focused(false);

    #[cfg(not(debug_assertions))]
    let toast_builder = toast_builder.initialization_script(
        "document.addEventListener('contextmenu', e => e.preventDefault());",
    );

    #[cfg(debug_assertions)]
    let toast_builder = toast_builder;

    let toast_window = toast_builder.build()?;
    log::info!("Toast window built at ({}, {})", toast_x, toast_y);

    configure_toast_as_panel(&toast_window);

    Ok(())
}

#[cfg(target_os = "macos")]
fn calculate_initial_toast_position(mtm: objc2::MainThreadMarker) -> (f64, f64) {
    use objc2_app_kit::NSScreen;

    let screen = NSScreen::mainScreen(mtm).expect("Failed to get main screen");
    let screen_frame = screen.frame();
    let visible = screen.visibleFrame();

    let x = visible.origin.x + (visible.size.width - TOAST_WIDTH) / 2.0;
    let toast_top_y = visible.origin.y + BOTTOM_OFFSET + PILL_HEIGHT + GAP + TOAST_HEIGHT;
    let y = screen_frame.size.height - toast_top_y;

    (x, y)
}

#[cfg(target_os = "macos")]
fn configure_toast_as_panel(window: &tauri::WebviewWindow) {
    use tauri_nspanel::WebviewWindowExt;

    if let Ok(ns_window) = window.ns_window() {
        unsafe {
            use objc2::msg_send;
            use objc2::runtime::Bool;
            let ns_window: *mut objc2::runtime::AnyObject = ns_window.cast();
            let _: () = msg_send![ns_window, setIgnoresMouseEvents: Bool::from(true)];
        }
    }

    #[allow(deprecated)]
    match window.to_panel() {
        Ok(panel) => {
            panel.set_level(1001);

            use tauri_nspanel::cocoa::appkit::NSWindowCollectionBehavior;
            panel.set_collection_behaviour(
                NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
                    | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary
                    | NSWindowCollectionBehavior::NSWindowCollectionBehaviorStationary
                    | NSWindowCollectionBehavior::NSWindowCollectionBehaviorIgnoresCycle,
            );

            panel.set_floating_panel(true);
            panel.set_hides_on_deactivate(false);
            log::info!("Toast panel configured");
        }
        Err(e) => log::error!("Failed to convert toast to NSPanel: {:?}", e),
    }
}
