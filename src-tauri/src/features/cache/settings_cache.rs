//! Settings cache for reducing disk I/O during recording cycles.
//!
//! This module provides an in-memory cache for frequently accessed settings,
//! eliminating redundant disk reads. The cache is initialized on app startup
//! and invalidated when settings change.
//!
//! Uses parking_lot::RwLock instead of std::sync::RwLock because:
//! - No lock poisoning on panic (more resilient)
//! - Faster locking operations
//! - Consistent with other locks in the codebase

use parking_lot::RwLock;
use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

/// Thread-safe settings cache.
///
/// Uses parking_lot::RwLock for efficient concurrent read access with exclusive write access.
/// Unlike std::sync::RwLock, parking_lot doesn't poison locks on panic, making it more
/// resilient to crashes in other parts of the application.
///
/// The cache stores both the full settings object and extracted values for
/// frequently accessed settings to minimize JSON traversal overhead.
pub struct SettingsCache {
    settings: RwLock<Option<Value>>,
    microphone_device_id: RwLock<Option<String>>,
    play_sound_on_recording: RwLock<Option<bool>>,
    voice_input_shortcut: RwLock<Option<String>>,
    ptt_shortcut: RwLock<Option<String>>,
    enable_push_to_talk: RwLock<Option<bool>>,
    paste_shortcut: RwLock<Option<String>>,
    global_shortcuts_enabled: RwLock<Option<bool>>,
}

impl SettingsCache {
    pub fn new() -> Self {
        Self {
            settings: RwLock::new(None),
            microphone_device_id: RwLock::new(None),
            play_sound_on_recording: RwLock::new(None),
            voice_input_shortcut: RwLock::new(None),
            ptt_shortcut: RwLock::new(None),
            enable_push_to_talk: RwLock::new(None),
            paste_shortcut: RwLock::new(None),
            global_shortcuts_enabled: RwLock::new(None),
        }
    }

    /// Initialize the cache from the settings store.
    ///
    /// Call this during app startup after the store is available.
    pub fn initialize(&self, app: &AppHandle) -> Result<(), String> {
        let store = app
            .store("settings")
            .map_err(|e| format!("Failed to get settings store: {}", e))?;

        let settings = store.get("settings");

        if let Some(settings_value) = settings {
            self.update_from_value(&settings_value);
        }

        log::debug!("Settings cache initialized");
        Ok(())
    }

    /// Invalidate the cache and reload from disk.
    ///
    /// Call this when settings are modified to ensure cache consistency.
    pub fn invalidate(&self, app: &AppHandle) -> Result<(), String> {
        let store = app
            .store("settings")
            .map_err(|e| format!("Failed to get settings store: {}", e))?;

        // Force reload from disk to get latest changes
        store
            .reload()
            .map_err(|e| format!("Failed to reload store: {}", e))?;

        let settings = store.get("settings");

        if let Some(settings_value) = settings {
            self.update_from_value(&settings_value);
            log::debug!("Settings cache invalidated and reloaded");
        } else {
            // Clear cache if no settings found
            self.clear();
            log::debug!("Settings cache cleared (no settings found)");
        }

        Ok(())
    }

    /// Update cache from a settings Value.
    ///
    /// parking_lot::RwLock never panics on lock acquisition, so we can
    /// safely use it without Result handling.
    fn update_from_value(&self, settings: &Value) {
        // Store full settings
        *self.settings.write() = Some(settings.clone());

        // Extract and cache frequently accessed values
        if let Some(obj) = settings.as_object() {
            // voiceInput settings
            if let Some(voice_input) = obj.get("voiceInput").and_then(|v| v.as_object()) {
                *self.microphone_device_id.write() = voice_input
                    .get("microphoneDeviceId")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                *self.voice_input_shortcut.write() = voice_input
                    .get("shortcut")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                *self.ptt_shortcut.write() = voice_input
                    .get("pushToTalkShortcut")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                *self.enable_push_to_talk.write() = voice_input
                    .get("enablePushToTalk")
                    .and_then(|v| v.as_bool());
            }

            // system settings
            if let Some(system) = obj.get("system").and_then(|v| v.as_object()) {
                *self.play_sound_on_recording.write() =
                    system.get("playSoundOnRecording").and_then(|v| v.as_bool());
            }

            // shortcuts settings
            if let Some(shortcuts) = obj.get("shortcuts").and_then(|v| v.as_object()) {
                *self.paste_shortcut.write() = shortcuts
                    .get("pasteLastTranscript")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                *self.global_shortcuts_enabled.write() = shortcuts
                    .get("globalShortcutsEnabled")
                    .and_then(|v| v.as_bool());
            }
        }
    }

    /// Clear all cached values.
    fn clear(&self) {
        *self.settings.write() = None;
        *self.microphone_device_id.write() = None;
        *self.play_sound_on_recording.write() = None;
        *self.voice_input_shortcut.write() = None;
        *self.ptt_shortcut.write() = None;
        *self.enable_push_to_talk.write() = None;
        *self.paste_shortcut.write() = None;
        *self.global_shortcuts_enabled.write() = None;
    }

    /// Get the full cached settings value.
    pub fn get_settings(&self) -> Option<Value> {
        self.settings.read().clone()
    }

    /// Get cached microphone device ID.
    /// Returns None if auto-detect is selected or cache is not initialized.
    pub fn get_microphone_device_id(&self) -> Option<String> {
        self.microphone_device_id.read().clone()
    }

    /// Get cached play sound on recording setting.
    /// Returns None if cache is not initialized.
    pub fn get_play_sound_on_recording(&self) -> Option<bool> {
        *self.play_sound_on_recording.read()
    }

    /// Get cached voice input shortcut.
    pub fn get_voice_input_shortcut(&self) -> Option<String> {
        self.voice_input_shortcut.read().clone()
    }

    /// Get cached push-to-talk shortcut.
    pub fn get_ptt_shortcut(&self) -> Option<String> {
        self.ptt_shortcut.read().clone()
    }

    /// Get cached enable push-to-talk setting.
    pub fn get_enable_push_to_talk(&self) -> Option<bool> {
        *self.enable_push_to_talk.read()
    }

    /// Get cached paste last transcript shortcut.
    pub fn get_paste_shortcut(&self) -> Option<String> {
        self.paste_shortcut.read().clone()
    }

    /// Get cached global shortcuts enabled setting.
    pub fn get_global_shortcuts_enabled(&self) -> Option<bool> {
        *self.global_shortcuts_enabled.read()
    }

    /// Check if the cache has been initialized.
    pub fn is_initialized(&self) -> bool {
        self.settings.read().is_some()
    }
}

impl Default for SettingsCache {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_cache_new_is_empty() {
        let cache = SettingsCache::new();
        assert!(!cache.is_initialized());
        assert!(cache.get_settings().is_none());
        assert!(cache.get_microphone_device_id().is_none());
        assert!(cache.get_play_sound_on_recording().is_none());
    }

    #[test]
    fn test_update_from_value() {
        let cache = SettingsCache::new();

        let settings = json!({
            "voiceInput": {
                "microphoneDeviceId": "device-123",
                "shortcut": "Alt+Space",
                "pushToTalkShortcut": "Alt+R",
                "enablePushToTalk": true
            },
            "system": {
                "playSoundOnRecording": false
            },
            "shortcuts": {
                "pasteLastTranscript": "CmdOrCtrl+Shift+V",
                "globalShortcutsEnabled": true
            }
        });

        cache.update_from_value(&settings);

        assert!(cache.is_initialized());
        assert_eq!(
            cache.get_microphone_device_id(),
            Some("device-123".to_string())
        );
        assert_eq!(cache.get_play_sound_on_recording(), Some(false));
        assert_eq!(
            cache.get_voice_input_shortcut(),
            Some("Alt+Space".to_string())
        );
        assert_eq!(cache.get_ptt_shortcut(), Some("Alt+R".to_string()));
        assert_eq!(cache.get_enable_push_to_talk(), Some(true));
        assert_eq!(
            cache.get_paste_shortcut(),
            Some("CmdOrCtrl+Shift+V".to_string())
        );
        assert_eq!(cache.get_global_shortcuts_enabled(), Some(true));
    }

    #[test]
    fn test_clear() {
        let cache = SettingsCache::new();

        let settings = json!({
            "voiceInput": {
                "microphoneDeviceId": "device-123"
            },
            "system": {
                "playSoundOnRecording": true
            }
        });

        cache.update_from_value(&settings);
        assert!(cache.is_initialized());

        cache.clear();
        assert!(!cache.is_initialized());
        assert!(cache.get_microphone_device_id().is_none());
    }

    #[test]
    fn test_null_microphone_device_id() {
        let cache = SettingsCache::new();

        let settings = json!({
            "voiceInput": {
                "microphoneDeviceId": null,
                "shortcut": "Alt+Space"
            }
        });

        cache.update_from_value(&settings);

        // null should be treated as None (auto-detect)
        assert!(cache.get_microphone_device_id().is_none());
        assert_eq!(
            cache.get_voice_input_shortcut(),
            Some("Alt+Space".to_string())
        );
    }

    #[test]
    fn test_thread_safety() {
        use std::sync::Arc;
        use std::thread;

        let cache = Arc::new(SettingsCache::new());

        let settings = json!({
            "voiceInput": {
                "shortcut": "Alt+Space"
            },
            "system": {
                "playSoundOnRecording": true
            }
        });

        cache.update_from_value(&settings);

        // Spawn multiple reader threads
        let handles: Vec<_> = (0..10)
            .map(|_| {
                let cache_clone = Arc::clone(&cache);
                thread::spawn(move || {
                    for _ in 0..100 {
                        let _ = cache_clone.get_settings();
                        let _ = cache_clone.get_voice_input_shortcut();
                        let _ = cache_clone.get_play_sound_on_recording();
                    }
                })
            })
            .collect();

        for handle in handles {
            handle.join().unwrap();
        }

        // Cache should still be valid
        assert!(cache.is_initialized());
    }
}
