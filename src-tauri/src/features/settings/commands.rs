use super::cache::SettingsCache;
use super::store;
use crate::types::settings::Settings;
use std::sync::Arc;
use tauri::{command, AppHandle, Emitter, State};

#[command]
pub fn get_settings(cache: State<'_, Arc<SettingsCache>>) -> Settings {
    (*cache.get()).clone()
}

#[command]
pub fn save_settings(
    settings: Settings,
    app: AppHandle,
    cache: State<'_, Arc<SettingsCache>>,
) -> Result<(), String> {
    store::save(&app, &settings)?;
    cache.update(settings.clone());
    let _ = app.emit("settings-changed", settings);
    Ok(())
}

#[command]
pub fn update_onboarding(
    completed: bool,
    app: AppHandle,
    cache: State<'_, Arc<SettingsCache>>,
) -> Result<(), String> {
    let mut settings = (*cache.get()).clone();
    settings.onboarding.completed = completed;
    store::save(&app, &settings)?;
    cache.update(settings.clone());
    let _ = app.emit("settings-changed", settings);
    Ok(())
}

#[command]
pub fn update_voice_input_settings(
    shortcut: Option<String>,
    microphone_device_id: Option<Option<String>>,
    enable_push_to_talk: Option<bool>,
    push_to_talk_shortcut: Option<String>,
    display_mode: Option<String>,
    app: AppHandle,
    cache: State<'_, Arc<SettingsCache>>,
) -> Result<(), String> {
    let mut settings = (*cache.get()).clone();

    if let Some(s) = shortcut {
        settings.voice_input.shortcut = s;
    }
    if let Some(id) = microphone_device_id {
        settings.voice_input.microphone_device_id = id;
    }
    if let Some(e) = enable_push_to_talk {
        settings.voice_input.enable_push_to_talk = e;
    }
    if let Some(s) = push_to_talk_shortcut {
        settings.voice_input.push_to_talk_shortcut = s;
    }
    if let Some(mode) = display_mode {
        settings.voice_input.display_mode = match mode.as_str() {
            "minimal" => crate::types::settings::VoiceInputDisplayMode::Minimal,
            _ => crate::types::settings::VoiceInputDisplayMode::Standard,
        };
    }

    store::save(&app, &settings)?;
    cache.update(settings.clone());
    let _ = app.emit("settings-changed", settings);
    Ok(())
}

#[command]
pub fn update_transcription_settings(
    language: Option<String>,
    auto_paste: Option<bool>,
    auto_copy_to_clipboard: Option<bool>,
    speech_to_text_model_id: Option<Option<String>>,
    translate_to_english: Option<bool>,
    auto_detect_language: Option<bool>,
    app: AppHandle,
    cache: State<'_, Arc<SettingsCache>>,
) -> Result<(), String> {
    let mut settings = (*cache.get()).clone();

    if let Some(l) = language {
        settings.transcription.language = l;
    }
    if let Some(a) = auto_paste {
        settings.transcription.auto_paste = a;
    }
    if let Some(a) = auto_copy_to_clipboard {
        settings.transcription.auto_copy_to_clipboard = a;
    }
    if let Some(id) = speech_to_text_model_id {
        settings.transcription.speech_to_text_model_id = id;
    }
    if let Some(t) = translate_to_english {
        settings.transcription.translate_to_english = t;
    }
    if let Some(a) = auto_detect_language {
        settings.transcription.auto_detect_language = a;
        if a {
            settings.transcription.translate_to_english = false;
        }
    }

    store::save(&app, &settings)?;
    cache.update(settings.clone());
    let _ = app.emit("settings-changed", settings);
    Ok(())
}

#[command]
pub fn update_shortcuts_settings(
    paste_last_transcript: Option<String>,
    global_shortcuts_enabled: Option<bool>,
    app: AppHandle,
    cache: State<'_, Arc<SettingsCache>>,
) -> Result<(), String> {
    let mut settings = (*cache.get()).clone();

    if let Some(s) = paste_last_transcript {
        settings.shortcuts.paste_last_transcript = s;
    }
    if let Some(e) = global_shortcuts_enabled {
        settings.shortcuts.global_shortcuts_enabled = e;
    }

    store::save(&app, &settings)?;
    cache.update(settings.clone());
    let _ = app.emit("settings-changed", settings);
    Ok(())
}

#[command]
pub fn update_system_settings(
    show_in_dock: Option<bool>,
    save_audio_recordings: Option<bool>,
    play_sound_on_recording: Option<bool>,
    app: AppHandle,
    cache: State<'_, Arc<SettingsCache>>,
) -> Result<(), String> {
    let mut settings = (*cache.get()).clone();

    if let Some(s) = show_in_dock {
        settings.system.show_in_dock = s;
    }
    if let Some(s) = save_audio_recordings {
        settings.system.save_audio_recordings = s;
    }
    if let Some(p) = play_sound_on_recording {
        settings.system.play_sound_on_recording = p;
    }

    store::save(&app, &settings)?;
    cache.update(settings.clone());
    let _ = app.emit("settings-changed", settings);
    Ok(())
}

#[command]
pub fn update_privacy_settings(
    analytics: Option<bool>,
    app: AppHandle,
    cache: State<'_, Arc<SettingsCache>>,
) -> Result<(), String> {
    let mut settings = (*cache.get()).clone();

    if let Some(a) = analytics {
        settings.privacy.analytics = a;
    }

    store::save(&app, &settings)?;
    cache.update(settings.clone());
    let _ = app.emit("settings-changed", settings);
    Ok(())
}

#[command]
pub fn reset_settings(app: AppHandle, cache: State<'_, Arc<SettingsCache>>) -> Result<(), String> {
    let settings = Settings::default();
    store::save(&app, &settings)?;
    cache.update(settings.clone());
    let _ = app.emit("settings-changed", settings);
    Ok(())
}
