use crate::types::settings::{Settings, VoiceInputDisplayMode};
use parking_lot::RwLock;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

pub struct SettingsCache {
    cached: RwLock<Arc<Settings>>,
    initialized: AtomicBool,
}

impl SettingsCache {
    pub fn new() -> Self {
        Self {
            cached: RwLock::new(Arc::new(Settings::default())),
            initialized: AtomicBool::new(false),
        }
    }

    #[inline]
    fn get_snapshot(&self) -> Arc<Settings> {
        let start = std::time::Instant::now();
        let result = self.cached.read().clone();
        let elapsed = start.elapsed();
        if elapsed.as_millis() > 50 {
            log::warn!(
                "HANG DIAGNOSTIC: Settings cache read took {:?} (slow)",
                elapsed
            );
        }
        result
    }

    pub fn initialize(&self, settings: Settings) {
        let start = std::time::Instant::now();
        *self.cached.write() = Arc::new(settings);
        self.initialized.store(true, Ordering::Release);
        let elapsed = start.elapsed();
        if elapsed.as_millis() > 50 {
            log::warn!(
                "HANG DIAGNOSTIC: Settings cache initialize took {:?} (slow)",
                elapsed
            );
        } else {
            log::debug!("Settings cache initialized in {:?}", elapsed);
        }
    }

    pub fn update(&self, settings: Settings) {
        let start = std::time::Instant::now();
        *self.cached.write() = Arc::new(settings);
        let elapsed = start.elapsed();
        if elapsed.as_millis() > 50 {
            log::warn!(
                "HANG DIAGNOSTIC: Settings cache update took {:?} (slow)",
                elapsed
            );
        } else {
            log::debug!("Settings cache updated in {:?}", elapsed);
        }
    }

    pub fn get(&self) -> Arc<Settings> {
        self.get_snapshot()
    }

    #[inline]
    pub fn is_initialized(&self) -> bool {
        self.initialized.load(Ordering::Acquire)
    }

    #[inline]
    pub fn get_microphone_device_id(&self) -> Option<String> {
        self.get_snapshot().voice_input.microphone_device_id.clone()
    }

    #[inline]
    pub fn get_play_sound_on_recording(&self) -> bool {
        self.get_snapshot().system.play_sound_on_recording
    }

    #[inline]
    pub fn get_voice_input_shortcut(&self) -> String {
        self.get_snapshot().voice_input.shortcut.clone()
    }

    #[inline]
    pub fn get_ptt_shortcut(&self) -> String {
        self.get_snapshot().voice_input.push_to_talk_shortcut.clone()
    }

    #[inline]
    pub fn get_enable_push_to_talk(&self) -> bool {
        self.get_snapshot().voice_input.enable_push_to_talk
    }

    #[inline]
    pub fn get_paste_shortcut(&self) -> String {
        self.get_snapshot().shortcuts.paste_last_transcript.clone()
    }

    #[inline]
    pub fn get_command_mode_shortcut(&self) -> String {
        self.get_snapshot().shortcuts.command_mode_shortcut.clone()
    }

    #[inline]
    pub fn get_global_shortcuts_enabled(&self) -> bool {
        self.get_snapshot().shortcuts.global_shortcuts_enabled
    }

    #[inline]
    pub fn get_enable_command_mode(&self) -> bool {
        self.get_snapshot().shortcuts.enable_command_mode
    }

    #[inline]
    pub fn get_display_mode(&self) -> VoiceInputDisplayMode {
        self.get_snapshot().voice_input.display_mode.clone()
    }

    #[inline]
    pub fn get_transcription_language(&self) -> String {
        self.get_snapshot().transcription.language.clone()
    }

    #[inline]
    pub fn get_auto_detect_language(&self) -> bool {
        self.get_snapshot().transcription.auto_detect_language
    }

    #[inline]
    pub fn get_translate_to_english(&self) -> bool {
        self.get_snapshot().transcription.translate_to_english
    }

    #[inline]
    pub fn get_auto_paste(&self) -> bool {
        self.get_snapshot().transcription.auto_paste
    }

    #[inline]
    pub fn get_auto_copy_to_clipboard(&self) -> bool {
        self.get_snapshot().transcription.auto_copy_to_clipboard
    }

    #[inline]
    pub fn get_speech_to_text_model_id(&self) -> Option<String> {
        self.get_snapshot()
            .transcription
            .speech_to_text_model_id
            .clone()
    }

    #[inline]
    pub fn get_ai_processing_enabled(&self) -> bool {
        self.get_snapshot().ai_processing.enabled
    }

    #[inline]
    pub fn get_post_processing_model_id(&self) -> Option<String> {
        self.get_snapshot()
            .ai_processing
            .post_processing_model_id
            .clone()
    }

    #[inline]
    pub fn get_save_audio_recordings(&self) -> bool {
        self.get_snapshot().system.save_audio_recordings
    }

    #[inline]
    pub fn get_analytics_enabled(&self) -> bool {
        self.get_snapshot().privacy.analytics
    }

    #[inline]
    pub fn get_onboarding_completed(&self) -> bool {
        self.get_snapshot().onboarding.completed
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
    use std::thread;

    #[test]
    fn test_new_cache_not_initialized() {
        let cache = SettingsCache::new();
        assert!(!cache.is_initialized());
    }

    #[test]
    fn test_initialize_sets_flag() {
        let cache = SettingsCache::new();
        cache.initialize(Settings::default());
        assert!(cache.is_initialized());
    }

    #[test]
    fn test_get_returns_settings() {
        let cache = SettingsCache::new();
        let settings = Settings::default();
        cache.initialize(settings);

        let retrieved = cache.get();
        assert!(cache.is_initialized());
        // Verify it's a valid Settings struct
        assert!(!retrieved.onboarding.completed); // default is false
    }

    #[test]
    fn test_update_changes_settings() {
        let cache = SettingsCache::new();
        cache.initialize(Settings::default());

        let mut new_settings = Settings::default();
        new_settings.transcription.auto_paste = false;
        cache.update(new_settings);

        assert!(!cache.get_auto_paste());
    }

    #[test]
    fn test_concurrent_read_write() {
        // Test that concurrent reads and writes don't cause data corruption
        // or deadlocks (similar to state.rs:372-400)
        use std::sync::Arc;

        let cache = Arc::new(SettingsCache::new());
        cache.initialize(Settings::default());

        let mut handles = vec![];

        // Spawn reader threads
        for _ in 0..5 {
            let c = Arc::clone(&cache);
            handles.push(thread::spawn(move || {
                for _ in 0..100 {
                    let _ = c.get();
                    let _ = c.get_auto_paste();
                    let _ = c.is_initialized();
                }
            }));
        }

        // Spawn writer threads
        for i in 0..3 {
            let c = Arc::clone(&cache);
            handles.push(thread::spawn(move || {
                for _ in 0..50 {
                    let mut settings = Settings::default();
                    settings.transcription.auto_paste = i % 2 == 0;
                    c.update(settings);
                }
            }));
        }

        // All threads should complete without deadlock
        for handle in handles {
            handle.join().expect("Thread should not panic");
        }
    }

    #[test]
    fn test_arc_swap_consistency() {
        // Test that readers see consistent snapshots even during updates
        use std::sync::Arc;
        use std::sync::atomic::{AtomicUsize, Ordering};

        let cache = Arc::new(SettingsCache::new());

        // Initialize with language "en"
        let mut settings = Settings::default();
        settings.transcription.language = "en".to_string();
        cache.initialize(settings);

        let inconsistencies = Arc::new(AtomicUsize::new(0));
        let mut handles = vec![];

        // Readers: get snapshot and verify language is valid
        for _ in 0..5 {
            let c = Arc::clone(&cache);
            let inc = Arc::clone(&inconsistencies);
            handles.push(thread::spawn(move || {
                for _ in 0..100 {
                    let lang = c.get_transcription_language();
                    // Language should be either "en" or "es" - never partial
                    if lang != "en" && lang != "es" {
                        inc.fetch_add(1, Ordering::SeqCst);
                    }
                }
            }));
        }

        // Writer: switch between "en" and "es"
        for i in 0..50 {
            let mut settings = Settings::default();
            settings.transcription.language = if i % 2 == 0 {
                "es".to_string()
            } else {
                "en".to_string()
            };
            cache.update(settings);
        }

        for handle in handles {
            handle.join().expect("Thread should not panic");
        }

        // Should have zero torn reads
        assert_eq!(
            inconsistencies.load(Ordering::SeqCst),
            0,
            "Should not have any torn reads"
        );
    }
}
