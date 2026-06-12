mod cache;
pub mod commands;
mod store;

pub use cache::SettingsCache;

use tauri::AppHandle;

pub fn initialize(app: &AppHandle, cache: &SettingsCache) -> Result<(), String> {
    let settings = store::load(app)?;
    cache.initialize(settings);
    Ok(())
}

pub fn reload_cache(app: &AppHandle, cache: &SettingsCache) -> Result<(), String> {
    let settings = store::load(app)?;
    cache.update(settings);
    Ok(())
}
