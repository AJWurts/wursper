//! Llama.cpp engine for local LLM inference
//!
//! This engine uses llama-cpp-2 to run GGUF format models locally
//! with Metal GPU acceleration on macOS.

use std::num::NonZeroU32;

use llama_cpp_2::context::params::LlamaContextParams;
use llama_cpp_2::llama_backend::LlamaBackend;
use llama_cpp_2::llama_batch::LlamaBatch;
use llama_cpp_2::model::params::LlamaModelParams;
use llama_cpp_2::model::{LlamaModel, Special};
use llama_cpp_2::sampling::LlamaSampler;

use super::llm_trait::{GenerationConfig, LocalLLMEngine};
use super::{ModelConfig, ModelInfo, ModelStatus};

/// Stop sequences that indicate end of generation
const STOP_SEQUENCES: &[&str] = &[
    // ChatML tokens (SmolLM, Qwen)
    "<|im_start|>",
    "<|im_end|>",
    // Llama 3.x tokens
    "<|eot_id|>",
    "<|end_of_text|>",
    "<|start_header_id|>",
    // Gemma tokens
    "<end_of_turn>",
    "<start_of_turn>",
    // Phi tokens
    "<|end|>",
    "<|user|>",
    "<|system|>",
    // Mistral tokens
    "[INST]",
    "[/INST]",
    // Alpaca format
    "### Instruction",
    "### Input",
    "### Response",
];

/// Prefixes to strip from output
const OUTPUT_PREFIXES: &[&str] = &[
    "Here is the corrected text:",
    "Here's the corrected text:",
    "Here is the corrected version:",
    "Here's the corrected version:",
    "Here is the fixed text:",
    "Here's the fixed text:",
    "Corrected text:",
    "Corrected version:",
    "Fixed text:",
    "Output:",
    "Result:",
    "Answer:",
    "Response:",
    "❯",
];

/// Model family for prompt formatting
#[derive(Debug, Clone, Copy, PartialEq)]
enum ModelFamily {
    Llama,   // Llama 3.x models
    Mistral, // Mistral models
    SmolLM,  // SmolLM2 models (ChatML format)
    Qwen,    // Qwen2/2.5 models (ChatML format)
    Gemma,   // Gemma models
    Phi,     // Phi models
    Unknown,
}

/// Llama.cpp based LLM engine
pub struct LlamaEngine {
    backend: Option<LlamaBackend>,
    model: Option<LlamaModel>,
    status: ModelStatus,
    current_model_info: Option<ModelInfo>,
    model_family: ModelFamily,
}

impl LlamaEngine {
    pub fn new() -> Self {
        Self {
            backend: None,
            model: None,
            status: ModelStatus::Stopped,
            current_model_info: None,
            model_family: ModelFamily::Unknown,
        }
    }

    /// Detect model family from model name/path
    fn detect_model_family(model_name: &str) -> ModelFamily {
        let name_lower = model_name.to_lowercase();
        if name_lower.contains("smollm") {
            ModelFamily::SmolLM
        } else if name_lower.contains("mistral") {
            ModelFamily::Mistral
        } else if name_lower.contains("llama") {
            ModelFamily::Llama
        } else if name_lower.contains("qwen") {
            ModelFamily::Qwen
        } else if name_lower.contains("gemma") {
            ModelFamily::Gemma
        } else if name_lower.contains("phi") {
            ModelFamily::Phi
        } else {
            ModelFamily::Unknown
        }
    }

    /// Format prompt based on model family
    /// Each model family uses different special tokens
    fn format_prompt(&self, system_prompt: &str, user_prompt: &str) -> String {
        match self.model_family {
            ModelFamily::SmolLM | ModelFamily::Qwen => {
                // ChatML format for SmolLM2 and Qwen
                format!(
                    "<|im_start|>system\n{}<|im_end|>\n<|im_start|>user\n{}<|im_end|>\n<|im_start|>assistant\n",
                    system_prompt, user_prompt
                )
            }
            ModelFamily::Mistral => {
                // Mistral Instruct format
                format!(
                    "[INST] {}\n\nText to format:\n{} [/INST]",
                    system_prompt, user_prompt
                )
            }
            ModelFamily::Llama => {
                // Llama 3.x format
                format!(
                    "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
                    system_prompt, user_prompt
                )
            }
            ModelFamily::Gemma => {
                // Gemma format
                format!(
                    "<start_of_turn>user\n{}\n\nText to format:\n{}<end_of_turn>\n<start_of_turn>model\n",
                    system_prompt, user_prompt
                )
            }
            ModelFamily::Phi => {
                // Phi-3 format
                format!(
                    "<|system|>\n{}<|end|>\n<|user|>\n{}<|end|>\n<|assistant|>\n",
                    system_prompt, user_prompt
                )
            }
            ModelFamily::Unknown => {
                // Fallback to Alpaca format (widely compatible)
                format!(
                    "### Instruction:\n{}\n\n### Input:\n{}\n\n### Response:\n",
                    system_prompt, user_prompt
                )
            }
        }
    }

    /// Clean the output to remove any prompt leakage or artifacts
    fn clean_output(&self, output: &str) -> String {
        let mut result = output.to_string();

        // Check for stop sequences and truncate
        for stop_seq in STOP_SEQUENCES {
            if let Some(pos) = result.find(stop_seq) {
                result = result[..pos].to_string();
            }
        }

        // Remove any remaining special tokens (all model formats)
        let tokens_to_remove = [
            // ChatML
            "<|im_start|>",
            "<|im_end|>",
            // Llama 3.x
            "<|eot_id|>",
            "<|end_of_text|>",
            "<|begin_of_text|>",
            "<|start_header_id|>",
            "<|end_header_id|>",
            // Gemma
            "<end_of_turn>",
            "<start_of_turn>",
            // Phi
            "<|end|>",
            "<|user|>",
            "<|system|>",
            "<|assistant|>",
            // Mistral
            "[INST]",
            "[/INST]",
        ];
        for token in tokens_to_remove {
            result = result.replace(token, "");
        }

        // Remove "assistant" if it appears at the start
        let mut trimmed = result.trim().to_string();
        if trimmed.starts_with("assistant") {
            trimmed = trimmed
                .strip_prefix("assistant")
                .unwrap_or(&trimmed)
                .trim()
                .to_string();
        }

        // Strip output prefixes like "Here is the corrected text:"
        for prefix in OUTPUT_PREFIXES {
            if trimmed.starts_with(prefix) {
                trimmed = trimmed
                    .strip_prefix(prefix)
                    .unwrap_or(&trimmed)
                    .trim()
                    .to_string();
                break;
            }
        }

        // Also check case-insensitive for common prefixes
        let lower = trimmed.to_lowercase();
        for prefix in OUTPUT_PREFIXES {
            if lower.starts_with(&prefix.to_lowercase()) {
                trimmed = trimmed[prefix.len()..].trim().to_string();
                break;
            }
        }

        trimmed
    }
}

impl Default for LlamaEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl LocalLLMEngine for LlamaEngine {
    fn load_model(&mut self, config: ModelConfig) -> Result<(), String> {
        log::info!("Loading LLM model: {}", config.model_name);
        self.status = ModelStatus::Loading;

        // Detect model family from name or path
        self.model_family = Self::detect_model_family(&config.model_name);
        if self.model_family == ModelFamily::Unknown {
            self.model_family = Self::detect_model_family(&config.model_path);
        }
        log::info!("Detected model family: {:?}", self.model_family);

        if self.backend.is_none() {
            self.backend = Some(
                LlamaBackend::init()
                    .map_err(|e| format!("Failed to initialize llama backend: {}", e))?,
            );
        }

        let backend = self.backend.as_ref().unwrap();

        let model_params = LlamaModelParams::default().with_n_gpu_layers(99);

        let model = LlamaModel::load_from_file(backend, &config.model_path, &model_params)
            .map_err(|e| format!("Failed to load model: {}", e))?;

        self.model = Some(model);
        self.current_model_info = Some(ModelInfo {
            name: config.model_name.clone(),
            path: config.model_path.clone(),
            engine_type: "llama".to_string(),
        });
        self.status = ModelStatus::Ready;

        log::info!("LLM model loaded: {}", config.model_name);
        Ok(())
    }

    fn unload_model(&mut self) {
        if let Some(info) = &self.current_model_info {
            log::info!("Unloading LLM model: {}", info.name);
        }
        self.model = None;
        self.current_model_info = None;
        self.status = ModelStatus::Stopped;
    }

    fn generate(
        &mut self,
        system_prompt: &str,
        user_prompt: &str,
        config: GenerationConfig,
    ) -> Result<String, String> {
        let model = self.model.as_ref().ok_or("No model loaded")?;

        let full_prompt = self.format_prompt(system_prompt, user_prompt);

        let ctx_params = LlamaContextParams::default()
            .with_n_ctx(NonZeroU32::new(8192))
            .with_n_batch(4096);

        let mut ctx = model
            .new_context(&self.backend.as_ref().unwrap(), ctx_params)
            .map_err(|e| format!("Failed to create context: {}", e))?;

        let tokens = model
            .str_to_token(&full_prompt, llama_cpp_2::model::AddBos::Always)
            .map_err(|e| format!("Failed to tokenize: {}", e))?;

        let batch_size = std::cmp::max(tokens.len() + 512, 4096);
        let mut batch = LlamaBatch::new(batch_size, 1);

        for (i, token) in tokens.iter().enumerate() {
            batch
                .add(*token, i as i32, &[0], i == tokens.len() - 1)
                .map_err(|e| format!("Failed to add token: {}", e))?;
        }

        ctx.decode(&mut batch)
            .map_err(|e| format!("Failed to decode prompt: {}", e))?;

        let mut sampler = LlamaSampler::chain_simple([
            LlamaSampler::penalties(64, config.repeat_penalty, 0.0, 0.0),
            LlamaSampler::top_k(config.top_k as i32),
            LlamaSampler::top_p(config.top_p, 1),
            LlamaSampler::temp(config.temperature),
            LlamaSampler::dist(42),
        ]);

        let mut output_tokens = Vec::new();
        let mut n_cur = tokens.len();
        let mut generated_text = String::new();

        // Limit output tokens for small models
        let max_output = std::cmp::min(config.max_tokens, 512);

        for _ in 0..max_output {
            let token = sampler.sample(&ctx, -1);

            if model.is_eog_token(token) {
                break;
            }

            output_tokens.push(token);

            // Decode token to text incrementally to check for stop sequences
            if let Ok(text) = model.token_to_str(token, Special::Plaintext) {
                generated_text.push_str(&text);

                // Check for stop sequences
                let should_stop = STOP_SEQUENCES
                    .iter()
                    .any(|seq| generated_text.contains(seq));

                if should_stop {
                    break;
                }
            }

            batch.clear();
            batch
                .add(token, n_cur as i32, &[0], true)
                .map_err(|e| format!("Failed to add token: {}", e))?;

            n_cur += 1;

            ctx.decode(&mut batch)
                .map_err(|e| format!("Failed to decode: {}", e))?;
        }

        // Clean the output
        log::debug!("Raw LLM output: {}", generated_text);
        let cleaned = self.clean_output(&generated_text);
        log::debug!("Cleaned LLM output: {}", cleaned);

        log::info!("LLM generation complete: {} tokens", output_tokens.len());
        Ok(cleaned)
    }

    fn get_status(&self) -> ModelStatus {
        self.status
    }

    fn get_loaded_model_info(&self) -> Option<ModelInfo> {
        self.current_model_info.clone()
    }

    fn engine_type(&self) -> &'static str {
        "llama"
    }
}
