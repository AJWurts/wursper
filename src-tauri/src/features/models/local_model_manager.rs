use std::collections::HashMap;

use super::engines::{
    candle_whisper::CandleWhisperEngine, whisper::WhisperEngine, LocalModelEngine, ModelConfig,
    ModelInfo, ModelStatus,
};

use super::engines::llama::LlamaEngine;
use super::engines::llm_trait::{GenerationConfig, LocalLLMEngine};

#[cfg(target_os = "macos")]
use super::engines::apple_speech::AppleSpeechEngine;

#[cfg(target_os = "macos")]
use super::engines::whisperkit::WhisperKitEngine;

/// Generic manager for all local model engines
///
/// This manager can handle any type of local model (Whisper, Llama, Mistral, etc.)
/// as long as they implement the LocalModelEngine trait.
///
/// The manager maintains a registry of available engines and routes commands
/// to the appropriate engine based on the model's engine type.
pub struct LocalModelManager {
    /// Available STT engine instances (speech-to-text)
    engines: HashMap<String, Box<dyn LocalModelEngine>>,

    /// Currently active STT engine type (if any)
    active_engine: Option<String>,

    /// Available LLM engine instances (text generation for post-processing)
    llm_engines: HashMap<String, Box<dyn LocalLLMEngine>>,

    /// Currently active LLM engine type (if any)
    active_llm_engine: Option<String>,
}

impl LocalModelManager {
    /// Creates a new LocalModelManager with all available engines registered
    pub fn new() -> Self {
        let mut engines: HashMap<String, Box<dyn LocalModelEngine>> = HashMap::new();

        // Register Whisper engine (whisper.cpp via whisper-rs)
        engines.insert("whisper".to_string(), Box::new(WhisperEngine::new()));

        // Register Candle Whisper engine (Pure Rust with Metal GPU)
        engines.insert("candle".to_string(), Box::new(CandleWhisperEngine::new()));

        // Register Apple Speech engine (macOS only)
        #[cfg(target_os = "macos")]
        engines.insert(
            "apple-speech".to_string(),
            Box::new(AppleSpeechEngine::new()),
        );

        // Register WhisperKit engine (macOS only - requires Swift bridge)
        #[cfg(target_os = "macos")]
        engines.insert("whisperkit".to_string(), Box::new(WhisperKitEngine::new()));

        // Register LLM engines for post-processing
        let mut llm_engines: HashMap<String, Box<dyn LocalLLMEngine>> = HashMap::new();
        llm_engines.insert("llama".to_string(), Box::new(LlamaEngine::new()));

        Self {
            engines,
            active_engine: None,
            llm_engines,
            active_llm_engine: None,
        }
    }

    /// Load a model using the specified engine
    ///
    /// # Arguments
    /// * `engine_type` - The engine to use (e.g., "whisper", "llama")
    /// * `config` - Configuration for loading the model
    ///
    /// # Returns
    /// * `Ok(())` if the model was loaded successfully
    /// * `Err(String)` if loading failed
    pub fn load_model(&mut self, engine_type: &str, config: ModelConfig) -> Result<(), String> {
        // Check that the engine exists first
        if !self.engines.contains_key(engine_type) {
            return Err(format!("Unknown engine type: {}", engine_type));
        }

        // Unload any currently active model
        if let Some(active) = &self.active_engine {
            if active != engine_type {
                if let Some(active_engine) = self.engines.get_mut(active) {
                    active_engine.unload_model();
                }
            }
        }

        // Get the engine and load the new model
        let engine = self
            .engines
            .get_mut(engine_type)
            .ok_or_else(|| format!("Unknown engine type: {}", engine_type))?;

        engine.load_model(config)?;

        self.active_engine = Some(engine_type.to_string());
        Ok(())
    }

    /// Unload the currently active model
    pub fn unload_model(&mut self) {
        if let Some(active) = &self.active_engine {
            if let Some(engine) = self.engines.get_mut(active) {
                engine.unload_model();
            }
            self.active_engine = None;
        }
    }

    /// Transcribe audio using the currently active engine
    ///
    /// # Arguments
    /// * `audio_data` - Raw audio data
    /// * `language` - Optional language code
    /// * `translate` - If true, translate output to English (Whisper-specific)
    ///
    /// # Returns
    /// * `Ok(String)` containing the transcription
    /// * `Err(String)` if transcription failed or no model is loaded
    pub fn transcribe(
        &mut self,
        audio_data: Vec<u8>,
        language: Option<String>,
        translate: bool,
    ) -> Result<String, String> {
        let active = self
            .active_engine
            .as_ref()
            .ok_or("No model is currently loaded")?;

        let engine = self
            .engines
            .get_mut(active)
            .ok_or("Active engine not found")?;

        engine.transcribe(audio_data, language, translate)
    }

    /// Get the current status of the active engine
    pub fn get_status(&self) -> ModelStatus {
        if let Some(active) = &self.active_engine {
            if let Some(engine) = self.engines.get(active) {
                return engine.get_status();
            }
        }
        ModelStatus::Stopped
    }

    /// Get information about the currently loaded model
    pub fn get_loaded_model_info(&self) -> Option<ModelInfo> {
        if let Some(active) = &self.active_engine {
            if let Some(engine) = self.engines.get(active) {
                return engine.get_loaded_model_info();
            }
        }
        None
    }

    /// Get the name of the currently loaded model (if any)
    pub fn get_loaded_model_name(&self) -> Option<String> {
        self.get_loaded_model_info().map(|info| info.name)
    }

    /// Check if a specific engine type is available
    pub fn has_engine(&self, engine_type: &str) -> bool {
        self.engines.contains_key(engine_type)
    }

    /// Get the currently active engine type
    pub fn get_active_engine_type(&self) -> Option<&String> {
        self.active_engine.as_ref()
    }

    // ========== LLM Engine Methods ==========

    /// Load an LLM model for post-processing
    ///
    /// # Arguments
    /// * `engine_type` - The LLM engine to use (e.g., "llama")
    /// * `config` - Configuration for loading the model
    pub fn load_llm_model(&mut self, engine_type: &str, config: ModelConfig) -> Result<(), String> {
        // Check that the engine exists first
        if !self.llm_engines.contains_key(engine_type) {
            return Err(format!("Unknown LLM engine type: {}", engine_type));
        }

        // Unload any currently active LLM model
        if let Some(active) = &self.active_llm_engine {
            if active != engine_type {
                if let Some(active_engine) = self.llm_engines.get_mut(active) {
                    active_engine.unload_model();
                }
            }
        }

        // Get the engine and load the new model
        let engine = self
            .llm_engines
            .get_mut(engine_type)
            .ok_or_else(|| format!("Unknown LLM engine type: {}", engine_type))?;

        engine.load_model(config)?;

        self.active_llm_engine = Some(engine_type.to_string());
        Ok(())
    }

    /// Unload the currently active LLM model
    pub fn unload_llm_model(&mut self) {
        if let Some(active) = &self.active_llm_engine {
            if let Some(engine) = self.llm_engines.get_mut(active) {
                engine.unload_model();
            }
            self.active_llm_engine = None;
        }
    }

    /// Generate text using the currently active LLM engine
    ///
    /// # Arguments
    /// * `system_prompt` - System instructions for the model
    /// * `user_prompt` - User input text to process
    /// * `config` - Generation configuration parameters
    pub fn generate(
        &mut self,
        system_prompt: &str,
        user_prompt: &str,
        config: GenerationConfig,
    ) -> Result<String, String> {
        let active = self
            .active_llm_engine
            .as_ref()
            .ok_or("No LLM model is currently loaded")?;

        let engine = self
            .llm_engines
            .get_mut(active)
            .ok_or("Active LLM engine not found")?;

        engine.generate(system_prompt, user_prompt, config)
    }

    /// Get the status of the active LLM engine
    pub fn get_llm_status(&self) -> ModelStatus {
        if let Some(active) = &self.active_llm_engine {
            if let Some(engine) = self.llm_engines.get(active) {
                return engine.get_status();
            }
        }
        ModelStatus::Stopped
    }

    /// Get information about the currently loaded LLM model
    pub fn get_loaded_llm_model_info(&self) -> Option<ModelInfo> {
        if let Some(active) = &self.active_llm_engine {
            if let Some(engine) = self.llm_engines.get(active) {
                return engine.get_loaded_model_info();
            }
        }
        None
    }

    /// Check if an LLM engine type is available
    pub fn has_llm_engine(&self, engine_type: &str) -> bool {
        self.llm_engines.contains_key(engine_type)
    }

    /// Get the currently active LLM engine type
    pub fn get_active_llm_engine_type(&self) -> Option<&String> {
        self.active_llm_engine.as_ref()
    }
}

impl Default for LocalModelManager {
    fn default() -> Self {
        Self::new()
    }
}
