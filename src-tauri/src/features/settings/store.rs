use crate::types::settings::Settings;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_NAME: &str = "settings";
const SETTINGS_KEY: &str = "settings";

pub fn load(app: &AppHandle) -> Result<Settings, String> {
    let store = app
        .store(STORE_NAME)
        .map_err(|e| format!("Failed to get settings store: {}", e))?;

    match store.get(SETTINGS_KEY) {
        Some(value) => {
            serde_json::from_value(value).map_err(|e| format!("Failed to parse settings: {}", e))
        }
        None => Ok(Settings::default()),
    }
}

pub fn save(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    let store = app
        .store(STORE_NAME)
        .map_err(|e| format!("Failed to get settings store: {}", e))?;

    let value = serde_json::to_value(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    store.set(SETTINGS_KEY, value);

    log::debug!("HANG DIAGNOSTIC: About to save settings store (blocking disk I/O)");
    let start = std::time::Instant::now();

    store
        .save()
        .map_err(|e| format!("Failed to save settings store: {}", e))?;

    let elapsed = start.elapsed();
    if elapsed.as_millis() > 200 {
        log::warn!(
            "HANG DIAGNOSTIC: Settings store.save() took {:?} (slow disk I/O)",
            elapsed
        );
    } else {
        log::debug!("Settings store saved in {:?}", elapsed);
    }

    Ok(())
}
