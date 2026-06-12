use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

const WINDOW_WIDTH: f64 = 400.0;
const WINDOW_HEIGHT: f64 = 180.0;
const BOTTOM_OFFSET: f64 = 16.0;

#[derive(Clone, Serialize, Deserialize)]
pub struct CommandResultPayload {
    pub transcription: String,
}

#[cfg(target_os = "macos")]
pub fn setup_command_result_window(app: &AppHandle) -> tauri::Result<()> {

    let (pos_x, pos_y) = get_command_result_position().unwrap_or((100.0, 100.0));

    let window = WebviewWindowBuilder::new(
        app,
        "command-result",
        WebviewUrl::App("command-result.html".into()),
    )
    .title("Command Result")
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
    .inner_size(WINDOW_WIDTH, WINDOW_HEIGHT)
    .position(pos_x, pos_y)
    .visible(false)
    .focused(false)
    .build()?;

    configure_as_panel(&window);

    log::info!("Command result window setup complete");
    Ok(())
}

#[cfg(target_os = "macos")]
fn configure_as_panel(window: &tauri::WebviewWindow) {
    use tauri_nspanel::{cocoa::appkit::NSWindowCollectionBehavior, WebviewWindowExt};

    #[allow(deprecated)]
    match window.to_panel() {
        Ok(panel) => {
            panel.set_level(1001);
            panel.set_collection_behaviour(
                NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
                    | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary
                    | NSWindowCollectionBehavior::NSWindowCollectionBehaviorStationary
                    | NSWindowCollectionBehavior::NSWindowCollectionBehaviorIgnoresCycle,
            );
            panel.set_floating_panel(true);
            panel.set_hides_on_deactivate(false);
            log::debug!("Command result window converted to NSPanel");
        }
        Err(e) => log::error!("Failed to convert to NSPanel: {:?}", e),
    }
}

#[cfg(not(target_os = "macos"))]
pub fn setup_command_result_window(_app: &AppHandle) -> tauri::Result<()> {
    log::warn!("Command result window not supported on this platform");
    Ok(())
}

pub fn show_command_result_window(app: &AppHandle, transcription: &str) -> tauri::Result<()> {
    log::debug!("show_command_result_window");

    if let Some((x, y)) = get_command_result_position() {
        if let Some(window) = app.get_webview_window("command-result") {
            window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }))?;
        }
    }

    app.emit(
        "show-command-result",
        CommandResultPayload {
            transcription: transcription.to_string(),
        },
    )?;

    if let Some(window) = app.get_webview_window("command-result") {
        window.show()?;
    }

    Ok(())
}

pub fn hide_command_result_window(app: &AppHandle) -> tauri::Result<()> {
    log::debug!("hide_command_result_window");

    app.emit("hide-command-result", ())?;

    // Use std::thread for delayed hide - avoids Tokio runtime deadlocks with window IPC
    let app_clone = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(300));
        if let Some(window) = app_clone.get_webview_window("command-result") {
            let _ = window.hide();
        }
    });

    Ok(())
}

pub fn hide_command_result_window_immediate(app: &AppHandle) -> tauri::Result<()> {
    log::debug!("hide_command_result_window_immediate");

    let _ = app.emit("hide-command-result", ());

    if let Some(window) = app.get_webview_window("command-result") {
        window.hide()?;
    }

    Ok(())
}

#[cfg(target_os = "macos")]
fn get_command_result_position() -> Option<(f64, f64)> {
    use super::pill_window::query_screen_info_for_mouse;

    let screen_info = query_screen_info_for_mouse()?;
    let visible = &screen_info.target_visible_frame;
    let main = &screen_info.main_screen_frame;

    let x = visible.origin_x + (visible.width - WINDOW_WIDTH) / 2.0;
    let macos_window_top_y = visible.origin_y + BOTTOM_OFFSET + WINDOW_HEIGHT;
    let y = main.height - macos_window_top_y;

    Some((x, y))
}

#[cfg(not(target_os = "macos"))]
fn get_command_result_position() -> Option<(f64, f64)> {
    None
}
