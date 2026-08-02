use std::fs;
use std::path::PathBuf;
use tauri::{command, AppHandle, Manager};

/// Get the recordings directory path
pub fn get_recordings_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let recordings_dir = app_data_dir.join("recordings");

    // Create recordings directory if it doesn't exist
    if !recordings_dir.exists() {
        fs::create_dir_all(&recordings_dir)
            .map_err(|e| format!("Failed to create recordings directory: {}", e))?;
    }

    Ok(recordings_dir)
}

/// Create a new recording folder and return its path
pub fn create_recording_folder(app: &AppHandle, timestamp: i64) -> Result<PathBuf, String> {
    let recordings_dir = get_recordings_dir(app)?;
    let recording_folder = recordings_dir.join(timestamp.to_string());

    fs::create_dir_all(&recording_folder)
        .map_err(|e| format!("Failed to create recording folder: {}", e))?;

    // Create an empty meta.json file
    let meta_path = recording_folder.join("meta.json");
    fs::write(&meta_path, "{}").map_err(|e| format!("Failed to create empty meta.json: {}", e))?;

    Ok(recording_folder)
}

/// Save audio data to the recording folder
pub fn save_audio_file(recording_folder: &PathBuf, audio_data: &[u8]) -> Result<(), String> {
    let audio_path = recording_folder.join("audio.wav");

    fs::write(&audio_path, audio_data).map_err(|e| format!("Failed to save audio file: {}", e))?;

    Ok(())
}

/// Get all recording folders sorted by timestamp (newest first)
pub fn get_all_recordings(app: &AppHandle) -> Result<Vec<PathBuf>, String> {
    let recordings_dir = get_recordings_dir(app)?;

    let mut folders: Vec<PathBuf> = fs::read_dir(&recordings_dir)
        .map_err(|e| format!("Failed to read recordings directory: {}", e))?
        .filter_map(|entry| {
            entry.ok().and_then(|e| {
                let path = e.path();
                if path.is_dir() {
                    Some(path)
                } else {
                    None
                }
            })
        })
        .collect();

    // Sort by folder name (timestamp) descending
    folders.sort_by(|a, b| {
        let a_name = a.file_name().and_then(|n| n.to_str()).unwrap_or("");
        let b_name = b.file_name().and_then(|n| n.to_str()).unwrap_or("");
        b_name.cmp(a_name) // Reverse order for newest first
    });

    Ok(folders)
}

/// Delete a recording by timestamp
#[command]
pub async fn delete_recording(app: AppHandle, timestamp: i64) -> Result<(), String> {
    let recordings_dir = get_recordings_dir(&app)?;
    let recording_folder = recordings_dir.join(timestamp.to_string());

    if crate::utils::async_fs::exists(&recording_folder).await {
        crate::utils::async_fs::remove_dir_all(&recording_folder).await?;
    }

    Ok(())
}

/// Get the audio file as base64 encoded string for a recording by timestamp
#[command]
pub async fn get_recording_audio_path(app: AppHandle, timestamp: i64) -> Result<String, String> {
    use base64::Engine;

    let recordings_dir = get_recordings_dir(&app)?;
    let audio_path = recordings_dir.join(timestamp.to_string()).join("audio.wav");

    if !crate::utils::async_fs::exists(&audio_path).await {
        return Err("Audio file not found".to_string());
    }

    let audio_bytes = crate::utils::async_fs::read_file(&audio_path).await?;

    let base64_string = base64::engine::general_purpose::STANDARD.encode(&audio_bytes);

    Ok(base64_string)
}
