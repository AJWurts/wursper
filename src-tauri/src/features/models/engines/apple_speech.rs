//! Apple Speech Framework Engine
//!
//! Uses macOS built-in SFSpeechRecognizer for transcription.
//! No model downloads required - uses system speech recognition.

use super::{LocalModelEngine, ModelConfig, ModelInfo, ModelStatus};

/// Apple Speech engine using macOS SFSpeechRecognizer
///
/// This engine uses the built-in macOS Speech framework for transcription.
/// No model downloads are required - it uses the system's speech recognition.
///
/// Features:
/// - Zero downloads required
/// - Privacy-focused (on-device when available)
/// - Supports ~50 languages
/// - Fast startup time
///
/// Limitations:
/// - Less accurate than Whisper models for some use cases
/// - One-minute audio limit per request
/// - May require internet for enhanced recognition (device-dependent)
pub struct AppleSpeechEngine {
    status: ModelStatus,
    language: String,
}

impl AppleSpeechEngine {
    /// Creates a new AppleSpeechEngine
    pub fn new() -> Self {
        Self {
            status: ModelStatus::Stopped,
            language: "en-US".to_string(),
        }
    }

    #[cfg(target_os = "macos")]
    fn transcribe_audio_internal(audio_path: &str, locale_id: &str) -> Result<String, String> {
        use block2::RcBlock;
        use objc2::rc::Retained;
        use objc2::{msg_send_id, ClassType};
        use objc2_foundation::{NSError, NSLocale, NSString, NSURL};
        use objc2_speech::{
            SFSpeechRecognitionResult, SFSpeechRecognizer, SFSpeechRecognizerAuthorizationStatus,
            SFSpeechURLRecognitionRequest,
        };
        use std::sync::mpsc;
        use std::sync::{Arc, Mutex};
        use std::time::Duration;

        log::info!(
            "Apple Speech: Starting transcription for {} with locale {}",
            audio_path,
            locale_id
        );

        // Check authorization status first
        let auth_status = unsafe { SFSpeechRecognizer::authorizationStatus() };
        log::info!("Apple Speech: Authorization status = {:?}", auth_status);

        match auth_status {
            SFSpeechRecognizerAuthorizationStatus::Denied => {
                return Err(
                    "Speech recognition access denied. Please enable it in System Settings > Privacy & Security > Speech Recognition.".to_string()
                );
            }
            SFSpeechRecognizerAuthorizationStatus::Restricted => {
                return Err("Speech recognition is restricted on this device.".to_string());
            }
            SFSpeechRecognizerAuthorizationStatus::NotDetermined => {
                log::warn!("Apple Speech: Authorization not determined, will attempt to proceed");
                // Note: requestAuthorization should be called from the UI, not here
                // We'll try to proceed and let the system prompt if needed
            }
            SFSpeechRecognizerAuthorizationStatus::Authorized => {
                log::info!("Apple Speech: Authorization confirmed");
            }
            _ => {
                log::warn!("Apple Speech: Unknown authorization status");
            }
        }

        // Create locale
        let locale_string = NSString::from_str(locale_id);
        let locale = NSLocale::localeWithLocaleIdentifier(&locale_string);
        log::info!("Apple Speech: Created locale for {}", locale_id);

        // Create speech recognizer
        let recognizer: Option<Retained<SFSpeechRecognizer>> = unsafe {
            msg_send_id![
                msg_send_id![SFSpeechRecognizer::class(), alloc],
                initWithLocale: &*locale
            ]
        };

        let recognizer = recognizer.ok_or("Failed to create speech recognizer")?;
        log::info!("Apple Speech: Recognizer created successfully");

        // Check if recognizer is available
        if unsafe { !recognizer.isAvailable() } {
            return Err(
                "Speech recognition is not available for this locale. Try en-US.".to_string(),
            );
        }
        log::info!("Apple Speech: Recognizer is available");

        // Create URL from path using fileURLWithPath (proper method for file paths)
        let path = std::path::Path::new(audio_path);
        if !path.exists() {
            return Err(format!("Audio file not found: {}", audio_path));
        }

        let path_string = NSString::from_str(audio_path);
        let url = NSURL::fileURLWithPath(&path_string);
        log::info!("Apple Speech: Created file URL for {}", audio_path);

        // Create recognition request
        let request: Retained<SFSpeechURLRecognitionRequest> = unsafe {
            msg_send_id![
                msg_send_id![SFSpeechURLRecognitionRequest::class(), alloc],
                initWithURL: &*url
            ]
        };
        log::info!("Apple Speech: Recognition request created");

        // Set up channel for result communication
        let (tx, rx) = mpsc::channel::<Result<String, String>>();
        let tx = Arc::new(Mutex::new(Some(tx)));

        // Create the result handler block
        // Note: The handler can be called multiple times with partial results (isFinal = false)
        // We should only send the result when isFinal is true or when there's an error
        let tx_clone = Arc::clone(&tx);
        let handler = RcBlock::new(
            move |result: *mut SFSpeechRecognitionResult, error: *mut NSError| {
                log::debug!(
                    "Apple Speech: Handler called - result_ptr: {:?}, error_ptr: {:?}",
                    !result.is_null(),
                    !error.is_null()
                );

                // Handle error case - always send immediately
                if !error.is_null() {
                    let error_ref = unsafe { &*error };
                    let description = error_ref.localizedDescription();
                    log::error!("Apple Speech: Recognition error - {}", description);

                    if let Ok(mut tx_guard) = tx_clone.lock() {
                        if let Some(sender) = tx_guard.take() {
                            let _ = sender.send(Err(description.to_string()));
                        }
                    }
                    return;
                }

                // Handle result case
                if !result.is_null() {
                    let result_ref = unsafe { &*result };
                    let is_final = unsafe { result_ref.isFinal() };

                    // Get current transcription for logging
                    let transcription = unsafe { result_ref.bestTranscription() };
                    let text = unsafe { transcription.formattedString() };
                    let text_string = text.to_string();

                    log::debug!(
                        "Apple Speech: Result received - isFinal: {}, text: '{}'",
                        is_final,
                        text_string
                    );

                    // Only send when final
                    if is_final {
                        log::info!("Apple Speech: Final transcription: '{}'", text_string);

                        if let Ok(mut tx_guard) = tx_clone.lock() {
                            if let Some(sender) = tx_guard.take() {
                                let _ = sender.send(Ok(text_string));
                            }
                        }
                    }
                    // If not final, just log and wait for more results
                    return;
                }

                // Both result and error are null - recognition completed with no speech
                // This is the final callback when no speech was detected
                log::warn!("Apple Speech: No speech detected (null result and error)");
                if let Ok(mut tx_guard) = tx_clone.lock() {
                    if let Some(sender) = tx_guard.take() {
                        let _ = sender.send(Ok(String::new()));
                    }
                }
            },
        );

        log::info!("Apple Speech: Starting recognition task");

        // Start recognition task - keep the task alive
        let task =
            unsafe { recognizer.recognitionTaskWithRequest_resultHandler(&request, &handler) };

        // Keep task reference to prevent early deallocation
        let _task_holder = task;

        log::info!("Apple Speech: Waiting for recognition result...");

        // Wait for result with timeout (60 seconds for up to 1 minute of audio)
        match rx.recv_timeout(Duration::from_secs(60)) {
            Ok(result) => {
                log::info!("Apple Speech: Recognition completed");
                result
            }
            Err(mpsc::RecvTimeoutError::Timeout) => {
                log::error!("Apple Speech: Recognition timed out after 60 seconds");
                Err("Speech recognition timed out. The audio may be too long or no speech was detected.".to_string())
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => {
                log::error!("Apple Speech: Channel disconnected unexpectedly");
                Err("Speech recognition was interrupted".to_string())
            }
        }
    }

    fn save_audio_to_temp_file(audio_data: &[u8]) -> Result<String, String> {
        use std::io::Write;

        log::debug!(
            "Apple Speech: Saving {} bytes of audio to temp file",
            audio_data.len()
        );

        let temp_dir = std::env::temp_dir();
        let file_name = format!("apple_speech_{}.wav", uuid::Uuid::new_v4());
        let file_path = temp_dir.join(file_name);

        let mut file = std::fs::File::create(&file_path)
            .map_err(|e| format!("Failed to create temp file: {}", e))?;

        file.write_all(audio_data)
            .map_err(|e| format!("Failed to write audio data: {}", e))?;

        log::info!("Apple Speech: Audio saved to {}", file_path.display());
        Ok(file_path.to_string_lossy().to_string())
    }
}

impl LocalModelEngine for AppleSpeechEngine {
    fn load_model(&mut self, config: ModelConfig) -> Result<(), String> {
        #[cfg(not(target_os = "macos"))]
        {
            self.status = ModelStatus::Error;
            return Err("Apple Speech is only available on macOS".to_string());
        }

        #[cfg(target_os = "macos")]
        {
            use block2::RcBlock;
            use objc2_speech::{SFSpeechRecognizer, SFSpeechRecognizerAuthorizationStatus};
            use std::sync::mpsc;
            use std::time::Duration;

            // Check current authorization status
            let current_status = unsafe { SFSpeechRecognizer::authorizationStatus() };
            log::info!(
                "Apple Speech: Current authorization status: {:?}",
                current_status
            );

            // If not yet determined, request authorization
            if matches!(
                current_status,
                SFSpeechRecognizerAuthorizationStatus::NotDetermined
            ) {
                log::info!("Apple Speech: Requesting authorization...");

                // Create channel for result communication
                let (tx, rx) = mpsc::channel::<SFSpeechRecognizerAuthorizationStatus>();

                // Create the handler block
                let handler = RcBlock::new(move |status: SFSpeechRecognizerAuthorizationStatus| {
                    log::info!(
                        "Apple Speech: Authorization callback received: {:?}",
                        status
                    );
                    let _ = tx.send(status);
                });

                // Request authorization - this will show the system dialog
                unsafe {
                    SFSpeechRecognizer::requestAuthorization(&handler);
                }

                // Wait for the callback with a timeout
                match rx.recv_timeout(Duration::from_secs(60)) {
                    Ok(status) => {
                        log::info!("Apple Speech: Authorization result: {:?}", status);
                        if !matches!(status, SFSpeechRecognizerAuthorizationStatus::Authorized) {
                            self.status = ModelStatus::Error;
                            return Err(
                                "Speech recognition permission denied. Please enable it in System Settings > Privacy & Security > Speech Recognition.".to_string()
                            );
                        }
                    }
                    Err(_) => {
                        log::warn!(
                            "Apple Speech: Authorization request timed out, checking status..."
                        );
                        // Check status anyway
                        let final_status = unsafe { SFSpeechRecognizer::authorizationStatus() };
                        if !matches!(
                            final_status,
                            SFSpeechRecognizerAuthorizationStatus::Authorized
                        ) {
                            self.status = ModelStatus::Error;
                            return Err("Speech recognition authorization timed out.".to_string());
                        }
                    }
                }
            } else if matches!(
                current_status,
                SFSpeechRecognizerAuthorizationStatus::Denied
            ) {
                self.status = ModelStatus::Error;
                return Err(
                    "Speech recognition access denied. Please enable it in System Settings > Privacy & Security > Speech Recognition.".to_string()
                );
            } else if matches!(
                current_status,
                SFSpeechRecognizerAuthorizationStatus::Restricted
            ) {
                self.status = ModelStatus::Error;
                return Err("Speech recognition is restricted on this device.".to_string());
            }

            // Set language from config or default to en-US
            self.language = config.language.unwrap_or_else(|| "en-US".to_string());
            self.status = ModelStatus::Ready;

            log::info!(
                "Apple Speech engine initialized with language: {}",
                self.language
            );

            Ok(())
        }
    }

    fn unload_model(&mut self) {
        self.status = ModelStatus::Stopped;
        log::info!("Apple Speech engine stopped");
    }

    fn transcribe(
        &mut self,
        audio_data: Vec<u8>,
        language: Option<String>,
        _translate: bool,
    ) -> Result<String, String> {
        log::info!(
            "Apple Speech: transcribe() called with {} bytes of audio",
            audio_data.len()
        );

        if self.status != ModelStatus::Ready {
            log::error!("Apple Speech: Engine not ready, status = {:?}", self.status);
            return Err("Apple Speech engine is not ready".to_string());
        }

        #[cfg(not(target_os = "macos"))]
        {
            return Err("Apple Speech is only available on macOS".to_string());
        }

        #[cfg(target_os = "macos")]
        {
            // Use provided language or default
            // Note: translate parameter not supported by Apple Speech
            let lang = language.as_ref().unwrap_or(&self.language);
            log::info!("Apple Speech: Using language: {}", lang);

            // Save audio to temp file
            let temp_path = Self::save_audio_to_temp_file(&audio_data)?;

            // Perform transcription
            let result = Self::transcribe_audio_internal(&temp_path, lang);

            // Clean up temp file
            if let Err(e) = std::fs::remove_file(&temp_path) {
                log::warn!("Apple Speech: Failed to clean up temp file: {}", e);
            }

            match &result {
                Ok(text) => log::info!("Apple Speech: Transcription successful: '{}'", text),
                Err(e) => log::error!("Apple Speech: Transcription failed: {}", e),
            }

            result
        }
    }

    fn get_status(&self) -> ModelStatus {
        self.status
    }

    fn get_loaded_model_info(&self) -> Option<ModelInfo> {
        if self.status == ModelStatus::Ready {
            Some(ModelInfo {
                name: format!("Apple Speech ({})", self.language),
                path: "system://apple-speech".to_string(),
                engine_type: "apple-speech".to_string(),
            })
        } else {
            None
        }
    }

    fn engine_type(&self) -> &'static str {
        "apple-speech"
    }
}

impl Default for AppleSpeechEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_creation() {
        let engine = AppleSpeechEngine::new();
        assert_eq!(engine.get_status(), ModelStatus::Stopped);
        assert_eq!(engine.engine_type(), "apple-speech");
    }
}
