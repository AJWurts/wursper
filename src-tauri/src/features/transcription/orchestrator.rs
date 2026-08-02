use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{command, AppHandle, Emitter, State};
use tauri_plugin_store::StoreExt;
use tokio::sync::Mutex;

use crate::features::clipboard;
use crate::features::models::LocalModelManager;
use crate::features::security;
use crate::features::settings::SettingsCache;
use crate::features::transcriptions::{latest_transcription, save_record, TranscriptionRecord};
use crate::types::settings::Settings;
use crate::utils::logger;
use crate::utils::retry::{with_retry, RetryConfig};

use super::providers::{assemblyai, azure, deepgram, elevenlabs, google, local_whisper, openai};

// Global state for debouncing paste operations (using parking_lot for faster locking)
static LAST_PASTE_TIME: parking_lot::Mutex<Option<Instant>> = parking_lot::Mutex::new(None);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscribeRequest {
    pub audio_data: Vec<u8>,
    pub timestamp: i64,
    pub duration: Option<f64>,
    pub language: Option<String>, // ISO 639-1 language code (e.g., "en", "es", "fr")
    pub recording_device: Option<String>,
    #[serde(default)]
    pub translate: bool, // If true, translate to English (Whisper-specific)
}

/// Unified transcription command that handles the entire flow:
/// 1. Get selected model
/// 2. Transcribe using the appropriate provider
/// 3. Persist the transcript to SQLite
/// 4. Copy and/or paste text
/// 5. Emit events for UI updates
#[command]
pub async fn transcribe_and_process(
    request: TranscribeRequest,
    app: AppHandle,
    local_model_state: State<'_, Arc<Mutex<LocalModelManager>>>,
    settings_cache: State<'_, Arc<SettingsCache>>,
) -> Result<Option<TranscriptionRecord>, String> {
    // Get Arc<Settings> snapshot - avoids cloning entire struct
    let settings = settings_cache.get();

    // Step 1: Get selected transcription model
    let selected_model = get_selected_model(&app, &settings)?;

    if is_audio_silent(&request.audio_data)? {
        logger::debug("Audio is silent, skipping transcription");

        // Show toast for silent audio
        let _ = crate::features::window::show_toast(
            &app,
            "No speech detected",
            crate::features::window::ToastType::Info,
            1.0,
        );

        // Clean up the recording folder since audio is silent
        let recordings_dir = crate::features::recordings::get_recordings_dir(&app)?;
        let recording_folder = recordings_dir.join(request.timestamp.to_string());

        if crate::utils::async_fs::exists(&recording_folder).await {
            if let Err(e) = crate::utils::async_fs::remove_dir_all(&recording_folder).await {
                log::warn!(
                    "Failed to cleanup recording folder after silent audio detection: {}",
                    e
                );
            } else {
                log::info!("Cleaned up recording folder for silent audio");
            }
        }

        return Ok(None);
    }

    // Step 2: Transcribe using appropriate provider
    let transcription = transcribe_with_provider(
        &app,
        request.audio_data.clone(),
        &selected_model,
        request.language.clone(),
        request.translate,
        local_model_state,
    )
    .await?;

    // Skip if transcription is empty
    if transcription.trim().is_empty() {
        logger::debug("Transcription is empty, skipping");
        return Ok(None);
    }

    // Step 3: Handle the saved audio file based on the user setting
    let recordings_dir = crate::features::recordings::get_recordings_dir(&app)?;
    let recording_folder = recordings_dir.join(request.timestamp.to_string());
    let audio_path = recording_folder.join("audio.wav");

    if !settings.system.save_audio_recordings && crate::utils::async_fs::exists(&audio_path).await {
        if let Err(e) = crate::utils::async_fs::remove_file(&audio_path).await {
            logger::warn(&format!("Failed to delete audio file: {}", e));
        } else {
            logger::debug("Audio file deleted (saveAudioRecordings disabled)");
        }
    }

    // Step 4: Build and persist the record
    let record = TranscriptionRecord {
        id: request.timestamp.to_string(),
        text: transcription.clone(),
        timestamp: request.timestamp,
        duration: request.duration,
        word_count: transcription.split_whitespace().count() as u32,
        model_id: selected_model.id.clone(),
        provider: selected_model.provider.clone(),
    };

    if let Err(e) = save_record(&app, &record) {
        logger::error(&format!("Failed to store transcription: {}", e));
    }

    // Step 5: Handle auto-paste/copy (do this BEFORE showing success toast)
    let auto_paste = settings.transcription.auto_paste;
    let auto_copy_to_clipboard = settings.transcription.auto_copy_to_clipboard;

    if auto_paste {
        app.emit("hide_voice_input", ())
            .map_err(|e| format!("Failed to emit hide event: {}", e))?;

        if let Err(e) = clipboard::copy_and_paste(transcription.clone()).await {
            logger::error(&format!("Failed to copy and paste: {}", e));
        }
    } else if auto_copy_to_clipboard {
        use tauri_plugin_clipboard_manager::ClipboardExt;
        if let Err(e) = app.clipboard().write_text(transcription.clone()) {
            logger::error(&format!("Failed to copy to clipboard: {}", e));
        }
    }

    // Step 6: Show success toast AFTER paste/copy step
    let _ = crate::features::window::show_toast(
        &app,
        "Transcription saved",
        crate::features::window::ToastType::Success,
        0.4,
    );

    // Step 7: Emit events for UI updates
    app.emit("transcriptions-changed", ())
        .map_err(|e| format!("Failed to emit sync event: {}", e))?;

    Ok(Some(record))
}

fn get_selected_model(app: &AppHandle, settings: &Settings) -> Result<SelectedModel, String> {
    let selected_model_id = settings
        .transcription
        .speech_to_text_model_id
        .as_ref()
        .ok_or("No speech-to-text model selected in settings")?;

    let models_store = app
        .store("models.json")
        .map_err(|e| format!("Failed to get models store: {}", e))?;

    let models_value = models_store
        .get("models")
        .ok_or("No models found in store")?;
    let models = models_value.as_array().ok_or("Models is not an array")?;

    for model_value in models {
        let model = model_value.as_object().ok_or("Model is not an object")?;
        let id = model.get("id").and_then(|v| v.as_str()).unwrap_or("");

        if id == selected_model_id {
            let provider = model
                .get("provider")
                .and_then(|v| v.as_str())
                .ok_or("Model provider not found")?
                .to_string();

            let path = model.get("path").and_then(|v| v.as_str()).map(String::from);

            return Ok(SelectedModel {
                id: id.to_string(),
                provider,
                path,
            });
        }
    }

    Err(format!(
        "Model '{}' not found in models store",
        selected_model_id
    ))
}

/// Get the last (most recent) transcript from the transcription database
#[command]
pub async fn get_last_transcript(app: AppHandle) -> Result<String, String> {
    latest_transcription(&app)?.ok_or_else(|| "No transcriptions found".to_string())
}

/// Paste the last transcript using the clipboard
#[command]
pub async fn paste_last_transcript(app: AppHandle) -> Result<(), String> {
    // Debounce: prevent rapid repeated calls (within 500ms)
    const DEBOUNCE_DURATION: Duration = Duration::from_millis(500);

    {
        let mut last_time = LAST_PASTE_TIME.lock();
        let now = Instant::now();

        if let Some(last) = *last_time {
            if now.duration_since(last) < DEBOUNCE_DURATION {
                logger::debug("Paste triggered too soon, debouncing");
                return Ok(());
            }
        }

        *last_time = Some(now);
    }

    logger::info("Pasting last transcript");

    // Get the last transcript
    let text = get_last_transcript(app).await?;

    // Copy and paste it
    clipboard::copy_and_paste(text)
        .await
        .map_err(|e| format!("Failed to paste transcript: {}", e))?;

    Ok(())
}

/// Route transcription to the appropriate provider
async fn transcribe_with_provider(
    app: &AppHandle,
    audio_data: Vec<u8>,
    model: &SelectedModel,
    language: Option<String>,
    translate: bool,
    local_model_state: State<'_, Arc<Mutex<LocalModelManager>>>,
) -> Result<String, String> {
    // Retry configuration for cloud STT providers
    let retry_config = RetryConfig::for_stt_providers();

    let response = match model.provider.as_str() {
        "openai" => {
            let api_key = security::get_api_key_internal(app, &model.id)
                .await
                .map_err(|_| "OpenAI API key not found. Please add your API key in settings.")?;

            // OpenAI Whisper supports prompt parameter for vocabulary hints
            // Wrap with retry for transient network failures
            let audio = audio_data.clone();
            let key = api_key.clone();
            let model_id = model.id.clone();
            let lang = language.clone();

            with_retry(retry_config, || {
                let audio = audio.clone();
                let key = key.clone();
                let model_id = model_id.clone();
                let lang = lang.clone();
                async move {
                    openai::transcribe_with_openai(audio, key, Some(model_id), lang, None, None)
                        .await
                }
            })
            .await?
        }
        "google" => {
            let api_key = security::get_api_key_internal(app, &model.id)
                .await
                .map_err(|_| "Google API key not found. Please add your API key in settings.")?;

            // Convert ISO 639-1 code to Google's format (e.g., "en" -> "en-US")
            // Note: Google API doesn't support translation in transcription
            let google_language = language
                .clone()
                .map(|lang| format!("{}-US", lang.to_uppercase()))
                .or(Some("en-US".to_string()));

            // Google Speech supports speechContexts for phrase hints
            // Wrap with retry for transient network failures
            let audio = audio_data.clone();
            let key = api_key.clone();
            let lang = google_language.clone();

            with_retry(retry_config, || {
                let audio = audio.clone();
                let key = key.clone();
                let lang = lang.clone();
                async move { google::transcribe_with_google(audio, key, lang, None).await }
            })
            .await?
        }
        "local-whisper" => {
            // Local Whisper (whisper.cpp) supports initial_prompt
            local_whisper::transcribe_with_local_whisper(
                audio_data,
                Some(model.id.clone()),
                language.clone(),
                translate,
                None,
                local_model_state,
            )
            .await?
        }
        "elevenlabs" => {
            let api_key = security::get_api_key_internal(app, &model.id)
                .await
                .map_err(|_| {
                    "ElevenLabs API key not found. Please add your API key in settings."
                })?;

            let audio = audio_data.clone();
            let key = api_key.clone();
            let model_id = model.id.clone();

            with_retry(retry_config, || {
                let audio = audio.clone();
                let key = key.clone();
                let model_id = model_id.clone();
                async move {
                    elevenlabs::transcribe_with_elevenlabs(audio, key, Some(model_id), None).await
                }
            })
            .await?
        }
        // Candle engine (Pure Rust with Metal GPU)
        "candle" => {
            local_whisper::transcribe_with_local_engine(
                audio_data,
                "candle",
                model.path.clone(),
                Some(model.id.clone()),
                language.clone(),
                translate,
                None,
                local_model_state,
            )
            .await?
        }
        // WhisperKit engine (CoreML/Neural Engine)
        "whisperkit" => {
            local_whisper::transcribe_with_local_engine(
                audio_data,
                "whisperkit",
                model.path.clone(),
                Some(model.id.clone()),
                language.clone(),
                translate,
                None,
                local_model_state,
            )
            .await?
        }
        // Apple Speech Recognition (built-in macOS)
        "apple-speech" => {
            // Apple Speech doesn't support vocabulary hints
            local_whisper::transcribe_with_local_engine(
                audio_data,
                "apple-speech",
                model.path.clone(),
                Some(model.id.clone()),
                language.clone(),
                translate,
                None, // Apple Speech doesn't use prompt
                local_model_state,
            )
            .await?
        }
        // AssemblyAI - supports word_boost for vocabulary
        "assemblyai" => {
            let api_key = security::get_api_key_internal(app, &model.id)
                .await
                .map_err(|_| {
                    "AssemblyAI API key not found. Please add your API key in settings."
                })?;

            let audio = audio_data.clone();
            let key = api_key.clone();
            let lang = language.clone();

            with_retry(retry_config, || {
                let audio = audio.clone();
                let key = key.clone();
                let lang = lang.clone();
                async move { assemblyai::transcribe_with_assemblyai(audio, key, lang, None).await }
            })
            .await?
        }
        // Deepgram - supports keywords for vocabulary
        "deepgram" => {
            let api_key = security::get_api_key_internal(app, &model.id)
                .await
                .map_err(|_| "Deepgram API key not found. Please add your API key in settings.")?;

            let audio = audio_data.clone();
            let key = api_key.clone();
            let lang = language.clone();

            with_retry(retry_config, || {
                let audio = audio.clone();
                let key = key.clone();
                let lang = lang.clone();
                async move { deepgram::transcribe_with_deepgram(audio, key, lang, None).await }
            })
            .await?
        }
        // Azure Speech Services - supports phrase lists
        "azure" => {
            let api_key = security::get_api_key_internal(app, &model.id)
                .await
                .map_err(|_| "Azure API key not found. Please add your API key in settings.")?;

            // Azure language codes use format like "en-US"
            let azure_language = language.clone().map(|lang| {
                if lang.contains('-') {
                    lang
                } else {
                    format!("{}-US", lang)
                }
            });

            let audio = audio_data.clone();
            let key = api_key.clone();
            let lang = azure_language.clone();

            with_retry(retry_config, || {
                let audio = audio.clone();
                let key = key.clone();
                let lang = lang.clone();
                async move { azure::transcribe_with_azure(audio, key, None, lang, None).await }
            })
            .await?
        }
        _ => return Err(format!("Unsupported provider: {}", model.provider)),
    };

    Ok(response.text)
}

#[derive(Debug, Clone)]
pub struct SelectedModel {
    pub id: String,
    pub provider: String,
    pub path: Option<String>,
}

/// Detects if audio is silent by analyzing the waveform
/// Returns true if audio is mostly silent (no speech detected)
fn is_audio_silent(audio_data: &[u8]) -> Result<bool, String> {
    use hound::WavReader;
    use std::io::Cursor;

    // Parse WAV file
    let cursor = Cursor::new(audio_data);
    let mut reader =
        WavReader::new(cursor).map_err(|e| format!("Failed to parse WAV audio: {}", e))?;

    let spec = reader.spec();

    // Read all samples and calculate RMS (Root Mean Square)
    let samples: Vec<f32> = match spec.sample_format {
        hound::SampleFormat::Float => reader
            .samples::<f32>()
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to read samples: {}", e))?,
        hound::SampleFormat::Int => {
            // Convert i16 samples to f32
            let max_val = i16::MAX as f32;
            reader
                .samples::<i16>()
                .map(|s| s.map(|v| v as f32 / max_val))
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| format!("Failed to read samples: {}", e))?
        }
    };

    if samples.is_empty() {
        return Ok(true); // Empty audio is considered silent
    }

    // Calculate RMS
    let sum_squares: f32 = samples.iter().map(|&s| s * s).sum();
    let rms = (sum_squares / samples.len() as f32).sqrt();

    // Also check peak amplitude
    let peak = samples.iter().map(|&s| s.abs()).fold(0.0f32, f32::max);

    // Thresholds for silence detection
    const RMS_THRESHOLD: f32 = 0.01; // Very low RMS indicates silence
    const PEAK_THRESHOLD: f32 = 0.02; // Very low peak indicates silence

    // Audio is considered silent if both RMS and peak are below thresholds
    let is_silent = rms < RMS_THRESHOLD && peak < PEAK_THRESHOLD;

    logger::debug(&format!(
        "Audio analysis - RMS: {:.4}, Peak: {:.4}, Silent: {}",
        rms, peak, is_silent
    ));

    Ok(is_silent)
}
