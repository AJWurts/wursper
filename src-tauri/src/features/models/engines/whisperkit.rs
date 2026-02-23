//! WhisperKit Engine
//!
//! Swift-based Whisper implementation optimized for Apple Silicon.
//! Uses CoreML and Apple Neural Engine for fastest on-device transcription.
//!
//! Note: Full implementation requires Swift bridge (swift-bridge crate or
//! Objective-C wrapper with @objc exports).

use super::{LocalModelEngine, ModelConfig, ModelInfo, ModelStatus};

/// WhisperKit engine using Swift/CoreML
///
/// This engine uses the WhisperKit Swift package for transcription.
/// It leverages CoreML and the Apple Neural Engine for optimal performance
/// on Apple Silicon Macs.
///
/// Current Status: Placeholder - requires Swift bridge for full implementation.
///
/// Implementation options:
/// 1. Use swift-bridge crate to call Swift code directly
/// 2. Create a Swift framework with @objc exports callable via objc2
/// 3. Use uniffi for cross-language bindings
///
/// Benefits (when fully implemented):
/// - Fastest transcription on Apple Silicon (uses Neural Engine)
/// - ~50% smaller models (CoreML format)
/// - Optimized for macOS power efficiency
pub struct WhisperKitEngine {
    status: ModelStatus,
    model_name: Option<String>,
    model_path: Option<String>,
}

impl WhisperKitEngine {
    /// Creates a new WhisperKitEngine
    pub fn new() -> Self {
        log::info!("WhisperKit engine initialized (placeholder)");
        Self {
            status: ModelStatus::Stopped,
            model_name: None,
            model_path: None,
        }
    }
}

impl LocalModelEngine for WhisperKitEngine {
    fn load_model(&mut self, config: ModelConfig) -> Result<(), String> {
        #[cfg(not(target_os = "macos"))]
        {
            self.status = ModelStatus::Error;
            return Err("WhisperKit is only available on macOS".to_string());
        }

        #[cfg(target_os = "macos")]
        {
            // Store model info for when Swift bridge is implemented
            self.model_name = Some(config.model_name.clone());
            self.model_path = Some(config.model_path.clone());

            // For now, return an error indicating Swift bridge is needed
            self.status = ModelStatus::Error;
            Err("WhisperKit engine is not yet fully implemented. \
                 It requires a Swift bridge to call the WhisperKit Swift package. \
                 Please use the Candle engine (Pure Rust with Metal GPU) or \
                 the whisper-rs engine (whisper.cpp) for now."
                .to_string())
        }
    }

    fn unload_model(&mut self) {
        self.model_name = None;
        self.model_path = None;
        self.status = ModelStatus::Stopped;
        log::info!("WhisperKit engine stopped");
    }

    fn transcribe(
        &mut self,
        _audio_data: Vec<u8>,
        _language: Option<String>,
        _translate: bool,
        _initial_prompt: Option<String>,
    ) -> Result<String, String> {
        if self.status != ModelStatus::Ready {
            return Err("WhisperKit engine is not ready".to_string());
        }

        // When Swift bridge is implemented:
        // 1. Save audio_data to temp file
        // 2. Call WhisperKit.transcribe(audioPath:) via Swift bridge
        // 3. Return the transcription result
        // Note: translate parameter can be passed to WhisperKit when implemented

        Err("WhisperKit engine transcription is not yet implemented. \
             Requires Swift bridge to call WhisperKit Swift package."
            .to_string())
    }

    fn get_status(&self) -> ModelStatus {
        self.status
    }

    fn get_loaded_model_info(&self) -> Option<ModelInfo> {
        if self.status == ModelStatus::Ready {
            Some(ModelInfo {
                name: self
                    .model_name
                    .clone()
                    .unwrap_or_else(|| "WhisperKit".to_string()),
                path: self
                    .model_path
                    .clone()
                    .unwrap_or_else(|| "whisperkit://".to_string()),
                engine_type: "whisperkit".to_string(),
            })
        } else {
            None
        }
    }

    fn engine_type(&self) -> &'static str {
        "whisperkit"
    }
}

impl Default for WhisperKitEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_creation() {
        let engine = WhisperKitEngine::new();
        assert_eq!(engine.get_status(), ModelStatus::Stopped);
        assert_eq!(engine.engine_type(), "whisperkit");
    }
}
