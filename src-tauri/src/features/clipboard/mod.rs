use crate::utils::logger;
use tauri::command;

#[cfg(target_os = "macos")]
use tokio::process::Command;

#[cfg(target_os = "macos")]
use serde::{Deserialize, Serialize};

#[cfg(target_os = "macos")]
use std::process::Stdio;

use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(
    export,
    export_to = "../../src/features/transcriptions/types/generated/"
)]
#[serde(rename_all = "camelCase")]
pub struct FocusedApp {
    pub name: String,
    pub bundle_id: String,
}

/// Get the currently focused application (macOS only)
#[command]
pub async fn get_focused_app() -> Result<FocusedApp, String> {
    #[cfg(target_os = "macos")]
    {
        // Use AppleScript to get frontmost application info
        let script = r#"
            tell application "System Events"
                set frontApp to first application process whose frontmost is true
                set appName to name of frontApp
                set appBundleID to bundle identifier of frontApp
                return appName & "|" & appBundleID
            end tell
        "#;

        let output = Command::new("osascript")
            .arg("-e")
            .arg(script)
            .output()
            .await
            .map_err(|e| format!("Failed to get focused app: {}", e))?;

        let result = String::from_utf8_lossy(&output.stdout);
        let parts: Vec<&str> = result.trim().split('|').collect();

        if parts.len() >= 2 {
            Ok(FocusedApp {
                name: parts[0].to_string(),
                bundle_id: parts[1].to_string(),
            })
        } else {
            Err("Failed to parse focused app info".to_string())
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("get_focused_app is only supported on macOS".to_string())
    }
}

/// Copy text to clipboard and simulate paste at cursor position
#[command]
pub async fn copy_and_paste(text: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        // DEBUG: Check which app is focused before pasting
        let focused_app = match get_focused_app().await {
            Ok(app) => {
                logger::debug("=== PASTE DEBUG ===");
                logger::debug(&format!("Focused app: {} ({})", app.name, app.bundle_id));
                logger::debug(&format!("Text to paste: {}", &text[..text.len().min(50)]));
                app
            }
            Err(e) => {
                logger::debug("=== PASTE DEBUG ===");
                logger::error(&format!("ERROR: Could not get focused app: {}", e));
                return Err(e);
            }
        };

        // Copy to clipboard using pbcopy
        let mut pbcopy = Command::new("pbcopy")
            .stdin(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn pbcopy: {}", e))?;

        use tokio::io::AsyncWriteExt;
        if let Some(mut stdin) = pbcopy.stdin.take() {
            stdin
                .write_all(text.as_bytes())
                .await
                .map_err(|e| format!("Failed to write to pbcopy: {}", e))?;
        }

        pbcopy
            .wait()
            .await
            .map_err(|e| format!("Failed to wait for pbcopy: {}", e))?;

        logger::debug("Clipboard updated, waiting before paste...");

        // Wait for clipboard to be ready (async, non-blocking)
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        // Combined script: Activate app, wait, then paste
        // This reduces 2 osascript calls to 1, saving ~50ms process spawn overhead
        let combined_script = format!(
            r#"
            tell application "{app_name}"
                activate
            end tell
            tell application "System Events"
                tell process "{app_name}"
                    set frontmost to true
                end tell
                delay 0.15
                keystroke "v" using command down
            end tell
            "#,
            app_name = focused_app.name
        );

        logger::debug(&format!(
            "Activating {} and pasting in single script...",
            focused_app.name
        ));

        let output = Command::new("osascript")
            .arg("-e")
            .arg(&combined_script)
            .output()
            .await
            .map_err(|e| format!("Failed to execute paste command: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            logger::error(&format!("Paste command failed: {}", stderr));
        } else {
            logger::debug("Paste command sent successfully");
        }

        logger::debug("===================");

        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Auto-paste is only supported on macOS".to_string())
    }
}
