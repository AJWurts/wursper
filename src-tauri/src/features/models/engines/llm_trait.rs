//! Trait definition for local LLM engines used for post-processing
//!
//! This module defines the interface that all local LLM engines must implement.

use super::{ModelConfig, ModelInfo, ModelStatus};
use serde::{Deserialize, Serialize};

/// Configuration for text generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationConfig {
    /// Maximum number of tokens to generate
    pub max_tokens: usize,
    /// Temperature for sampling (0.0 = deterministic, 1.0 = creative)
    pub temperature: f32,
    /// Top-p (nucleus) sampling parameter
    pub top_p: f32,
    /// Top-k sampling parameter (0 = disabled)
    pub top_k: u32,
    /// Repetition penalty (1.0 = no penalty)
    pub repeat_penalty: f32,
}

impl Default for GenerationConfig {
    fn default() -> Self {
        Self {
            max_tokens: 4096,
            temperature: 0.3, // Low for consistent formatting
            top_p: 0.9,
            top_k: 40,
            repeat_penalty: 1.1,
        }
    }
}

/// Trait for local LLM engines (text generation)
///
/// This trait is separate from LocalModelEngine because:
/// 1. LLMs generate text, not transcribe audio
/// 2. Different input/output types (prompt + config -> generated text)
/// 3. Different loading requirements (GGUF format, context sizes, etc.)
pub trait LocalLLMEngine: Send + Sync {
    /// Load a model into memory
    ///
    /// # Arguments
    /// * `config` - Model configuration including path and name
    fn load_model(&mut self, config: ModelConfig) -> Result<(), String>;

    /// Unload the currently loaded model from memory
    fn unload_model(&mut self);

    /// Generate text completion
    ///
    /// # Arguments
    /// * `system_prompt` - System instructions for the model
    /// * `user_prompt` - User input text to process
    /// * `config` - Generation configuration parameters
    ///
    /// # Returns
    /// The generated text response
    fn generate(
        &mut self,
        system_prompt: &str,
        user_prompt: &str,
        config: GenerationConfig,
    ) -> Result<String, String>;

    /// Get current status of the engine
    fn get_status(&self) -> ModelStatus;

    /// Get information about the currently loaded model (if any)
    fn get_loaded_model_info(&self) -> Option<ModelInfo>;

    /// Get the engine type identifier
    fn engine_type(&self) -> &'static str;
}
