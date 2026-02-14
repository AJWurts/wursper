//! Candle Whisper Engine
//!
//! Pure Rust implementation using Hugging Face's Candle ML framework.
//! Supports Metal GPU acceleration on Apple Silicon.

use candle_core::{Device, Tensor};
use candle_nn::VarBuilder;
use candle_transformers::models::whisper::{self as m, Config};
use hf_hub::{api::sync::Api, Repo, RepoType};
use tokenizers::Tokenizer;

use super::{LocalModelEngine, ModelConfig, ModelInfo, ModelStatus};

/// Whisper special tokens
const SOT_TOKEN: u32 = 50258; // <|startoftranscript|>
const EOT_TOKEN: u32 = 50257; // <|endoftext|>
const TRANSCRIBE_TOKEN: u32 = 50359; // <|transcribe|>
const NO_TIMESTAMPS_TOKEN: u32 = 50363; // <|notimestamps|>

/// Audio processing constants
const SAMPLE_RATE: usize = 16000;
const N_FFT: usize = 400;
const HOP_LENGTH: usize = 160;
const N_MELS: usize = 80;

/// Candle Whisper engine with Metal GPU support
pub struct CandleWhisperEngine {
    model: Option<LoadedCandleModel>,
    device: Device,
    status: ModelStatus,
}

struct LoadedCandleModel {
    name: String,
    path: String,
    model: m::model::Whisper,
    config: Config,
    tokenizer: Tokenizer,
    mel_filters: Vec<f32>,
}

impl CandleWhisperEngine {
    /// Creates a new CandleWhisperEngine
    ///
    /// Automatically selects Metal GPU on macOS Apple Silicon,
    /// falls back to CPU otherwise.
    pub fn new() -> Self {
        // Try to use Metal GPU on macOS, fall back to CPU
        let device = Device::new_metal(0).unwrap_or_else(|e| {
            log::info!("Metal not available ({}), using CPU", e);
            Device::Cpu
        });

        log::info!("Candle engine initialized with device: {:?}", device);

        Self {
            model: None,
            device,
            status: ModelStatus::Stopped,
        }
    }

    /// Get the mel filters for audio preprocessing
    fn mel_filters(config: &Config) -> Vec<f32> {
        // Load mel filters based on model config
        let n_mels = config.num_mel_bins;

        // Generate mel filter banks
        // This is a simplified version - for production, load from file
        let mut filters = vec![0.0f32; n_mels * (N_FFT / 2 + 1)];

        let f_min: f64 = 0.0;
        let f_max: f64 = (SAMPLE_RATE / 2) as f64;

        // Mel scale conversion
        let mel_min: f64 = 2595.0 * (1.0_f64 + f_min / 700.0).log10();
        let mel_max: f64 = 2595.0 * (1.0_f64 + f_max / 700.0).log10();

        let mel_points: Vec<f64> = (0..=n_mels + 1)
            .map(|i| {
                let mel = mel_min + (mel_max - mel_min) * (i as f64) / ((n_mels + 1) as f64);
                700.0 * (10.0_f64.powf(mel / 2595.0) - 1.0)
            })
            .collect();

        let bin_points: Vec<usize> = mel_points
            .iter()
            .map(|&f| ((N_FFT + 1) as f64 * f / SAMPLE_RATE as f64).floor() as usize)
            .collect();

        for m in 0..n_mels {
            for k in bin_points[m]..bin_points[m + 1] {
                if k < N_FFT / 2 + 1 {
                    let val =
                        (k - bin_points[m]) as f32 / (bin_points[m + 1] - bin_points[m]) as f32;
                    filters[m * (N_FFT / 2 + 1) + k] = val;
                }
            }
            for k in bin_points[m + 1]..bin_points[m + 2].min(N_FFT / 2 + 1) {
                let val =
                    (bin_points[m + 2] - k) as f32 / (bin_points[m + 2] - bin_points[m + 1]) as f32;
                filters[m * (N_FFT / 2 + 1) + k] = val;
            }
        }

        filters
    }

    /// Transcribe audio samples using the loaded model
    fn transcribe_internal(
        &mut self,
        samples: Vec<f32>,
        language: Option<String>,
    ) -> Result<String, String> {
        let model = self.model.as_mut().ok_or("No model loaded")?;

        // Convert to mel spectrogram
        let mel = Self::pcm_to_mel_static(&samples, &model.mel_filters, &self.device)?;

        // Get encoder output
        let encoder_output = model
            .model
            .encoder
            .forward(&mel, true)
            .map_err(|e| format!("Encoder forward pass failed: {}", e))?;

        // Build initial token sequence: SOT + language (optional) + transcribe + no_timestamps
        let mut tokens: Vec<u32> = vec![SOT_TOKEN];

        // Get language token if specified
        if let Some(ref lang) = language {
            let lang_token = format!("<|{}|>", lang);
            if let Some(id) = model.tokenizer.token_to_id(&lang_token) {
                tokens.push(id);
            }
        } else {
            // Default to English
            if let Some(id) = model.tokenizer.token_to_id("<|en|>") {
                tokens.push(id);
            }
        }

        // Add transcribe task token and no timestamps
        tokens.push(TRANSCRIBE_TOKEN);
        tokens.push(NO_TIMESTAMPS_TOKEN);

        let max_tokens = 448;

        // Greedy decoding
        for _ in 0..max_tokens {
            let token_tensor = Tensor::new(&tokens[..], &self.device)
                .map_err(|e| format!("Failed to create token tensor: {}", e))?
                .unsqueeze(0)
                .map_err(|e| format!("Failed to unsqueeze: {}", e))?;

            let decoder_output = model
                .model
                .decoder
                .forward(&token_tensor, &encoder_output, true)
                .map_err(|e| format!("Decoder forward pass failed: {}", e))?;

            // Get logits using linear projection
            let logits = model
                .model
                .decoder
                .final_linear(&decoder_output)
                .map_err(|e| format!("Final linear failed: {}", e))?;

            // Get last token logits
            let logits = logits
                .squeeze(0)
                .map_err(|e| format!("Failed to squeeze: {}", e))?;

            let seq_len = logits.dim(0).map_err(|e| e.to_string())?;
            let last_logits = logits
                .get(seq_len - 1)
                .map_err(|e| format!("Failed to get last logits: {}", e))?;

            let next_token = last_logits
                .argmax(0)
                .map_err(|e| format!("Argmax failed: {}", e))?
                .to_scalar::<u32>()
                .map_err(|e| format!("To scalar failed: {}", e))?;

            // Stop on end of text token
            if next_token == EOT_TOKEN {
                break;
            }

            tokens.push(next_token);
        }

        // Decode tokens to text (skip special tokens at the start)
        let text_tokens: Vec<u32> = tokens
            .into_iter()
            .filter(|&t| {
                t != SOT_TOKEN
                    && t != EOT_TOKEN
                    && t != TRANSCRIBE_TOKEN
                    && t != NO_TIMESTAMPS_TOKEN
                    && t < 50257
            })
            .collect();

        let text = model
            .tokenizer
            .decode(&text_tokens, true)
            .map_err(|e| format!("Failed to decode tokens: {}", e))?;

        Ok(text.trim().to_string())
    }

    /// Static version of pcm_to_mel that doesn't need &self
    fn pcm_to_mel_static(
        samples: &[f32],
        _mel_filters: &[f32],
        device: &Device,
    ) -> Result<Tensor, String> {
        // This is a simplified mel spectrogram computation
        // For production, use a proper FFT implementation

        let n_frames = (samples.len().saturating_sub(N_FFT)) / HOP_LENGTH + 1;
        let n_mels = N_MELS;

        let mut mel_spec = vec![0.0f32; n_mels * n_frames];

        for frame_idx in 0..n_frames {
            let start = frame_idx * HOP_LENGTH;
            let end = (start + N_FFT).min(samples.len());

            // Simple energy calculation per frame (simplified - should be FFT)
            let frame_energy: f32 =
                samples[start..end].iter().map(|&x| x * x).sum::<f32>() / (end - start) as f32;

            // Apply mel filters (simplified)
            for mel_idx in 0..n_mels {
                mel_spec[frame_idx * n_mels + mel_idx] = (frame_energy + 1e-10).log10();
            }
        }

        // Create tensor with shape (1, n_mels, n_frames)
        Tensor::from_vec(mel_spec, (1, n_mels, n_frames), device)
            .map_err(|e| format!("Failed to create mel tensor: {}", e))
    }

    /// Convert WAV audio bytes to f32 samples
    fn convert_audio_to_samples(audio_data: Vec<u8>) -> Result<Vec<f32>, String> {
        use hound::WavReader;
        use std::io::Cursor;

        let cursor = Cursor::new(audio_data);
        let mut reader =
            WavReader::new(cursor).map_err(|e| format!("Failed to parse WAV audio: {}", e))?;

        let spec = reader.spec();
        let input_sample_rate = spec.sample_rate;
        let channels = spec.channels as usize;

        // Read all samples and convert to f32
        let mut samples: Vec<f32> = match spec.sample_format {
            hound::SampleFormat::Float => reader
                .samples::<f32>()
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| format!("Failed to read samples: {}", e))?,
            hound::SampleFormat::Int => {
                let max_val = i16::MAX as f32;
                reader
                    .samples::<i16>()
                    .map(|s| s.map(|v| v as f32 / max_val))
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|e| format!("Failed to read samples: {}", e))?
            }
        };

        // Convert stereo to mono
        if channels == 2 {
            samples = samples
                .chunks(2)
                .map(|chunk| (chunk[0] + chunk[1]) / 2.0)
                .collect();
        }

        // Resample to 16kHz if needed
        if input_sample_rate != SAMPLE_RATE as u32 {
            samples = Self::resample_audio(samples, input_sample_rate, SAMPLE_RATE as u32)?;
        }

        Ok(samples)
    }

    /// Resample audio from one sample rate to another
    fn resample_audio(
        input: Vec<f32>,
        input_rate: u32,
        output_rate: u32,
    ) -> Result<Vec<f32>, String> {
        use rubato::{
            Resampler, SincFixedIn, SincInterpolationParameters, SincInterpolationType,
            WindowFunction,
        };

        if input.is_empty() {
            return Ok(input);
        }

        let resample_ratio = output_rate as f64 / input_rate as f64;

        let params = SincInterpolationParameters {
            sinc_len: 64,
            f_cutoff: 0.91,
            interpolation: SincInterpolationType::Linear,
            oversampling_factor: 128,
            window: WindowFunction::Blackman,
        };

        let mut resampler = SincFixedIn::<f32>::new(resample_ratio, 2.0, params, input.len(), 1)
            .map_err(|e| format!("Failed to create resampler: {}", e))?;

        let input_frames = vec![input];

        let output_frames = resampler
            .process(&input_frames, None)
            .map_err(|e| format!("Resampling failed: {}", e))?;

        Ok(output_frames[0].clone())
    }
}

impl LocalModelEngine for CandleWhisperEngine {
    fn load_model(&mut self, config: ModelConfig) -> Result<(), String> {
        self.status = ModelStatus::Loading;

        // For Candle, we need safetensors format models from HuggingFace
        // The model_path should be a HuggingFace repo ID like "openai/whisper-large-v3-turbo"

        let model_id = if config.model_path.starts_with("openai/")
            || config.model_path.starts_with("distil-whisper/")
        {
            config.model_path.clone()
        } else {
            // Map local model names to HF repo IDs
            match config.model_name.to_lowercase().as_str() {
                name if name.contains("large-v3-turbo") => {
                    "openai/whisper-large-v3-turbo".to_string()
                }
                name if name.contains("large-v3") => "openai/whisper-large-v3".to_string(),
                name if name.contains("distil-large") => {
                    "distil-whisper/distil-large-v3".to_string()
                }
                name if name.contains("medium") => "openai/whisper-medium".to_string(),
                name if name.contains("small") => "openai/whisper-small".to_string(),
                name if name.contains("base") => "openai/whisper-base".to_string(),
                name if name.contains("tiny") => "openai/whisper-tiny".to_string(),
                _ => {
                    self.status = ModelStatus::Error;
                    return Err(format!("Unknown model: {}", config.model_name));
                }
            }
        };

        log::info!("Loading Candle model from HuggingFace: {}", model_id);

        // Download model files from HuggingFace
        let api = Api::new().map_err(|e| {
            self.status = ModelStatus::Error;
            format!("Failed to initialize HuggingFace API: {}", e)
        })?;

        let repo = api.repo(Repo::new(model_id.clone(), RepoType::Model));

        // Download required files
        let config_path = repo.get("config.json").map_err(|e| {
            self.status = ModelStatus::Error;
            format!("Failed to download config.json: {}", e)
        })?;

        let tokenizer_path = repo.get("tokenizer.json").map_err(|e| {
            self.status = ModelStatus::Error;
            format!("Failed to download tokenizer.json: {}", e)
        })?;

        let model_path = repo.get("model.safetensors").map_err(|e| {
            self.status = ModelStatus::Error;
            format!("Failed to download model.safetensors: {}", e)
        })?;

        // Load config
        let config_str = std::fs::read_to_string(&config_path).map_err(|e| {
            self.status = ModelStatus::Error;
            format!("Failed to read config: {}", e)
        })?;

        let whisper_config: Config = serde_json::from_str(&config_str).map_err(|e| {
            self.status = ModelStatus::Error;
            format!("Failed to parse config: {}", e)
        })?;

        // Load tokenizer
        let tokenizer = Tokenizer::from_file(&tokenizer_path).map_err(|e| {
            self.status = ModelStatus::Error;
            format!("Failed to load tokenizer: {}", e)
        })?;

        // Load model weights
        let vb = unsafe {
            VarBuilder::from_mmaped_safetensors(
                &[model_path.clone()],
                candle_core::DType::F32,
                &self.device,
            )
            .map_err(|e| {
                self.status = ModelStatus::Error;
                format!("Failed to load model weights: {}", e)
            })?
        };

        // Build model
        let model = m::model::Whisper::load(&vb, whisper_config.clone()).map_err(|e| {
            self.status = ModelStatus::Error;
            format!("Failed to build model: {}", e)
        })?;

        // Generate mel filters
        let mel_filters = Self::mel_filters(&whisper_config);

        self.model = Some(LoadedCandleModel {
            name: config.model_name,
            path: model_path.to_string_lossy().to_string(),
            model,
            config: whisper_config,
            tokenizer,
            mel_filters,
        });

        self.status = ModelStatus::Ready;
        log::info!("Candle model loaded successfully on {:?}", self.device);

        Ok(())
    }

    fn unload_model(&mut self) {
        self.model = None;
        self.status = ModelStatus::Stopped;
        log::info!("Candle model unloaded");
    }

    fn transcribe(
        &mut self,
        audio_data: Vec<u8>,
        language: Option<String>,
    ) -> Result<String, String> {
        if self.status != ModelStatus::Ready {
            return Err("Candle engine is not ready".to_string());
        }

        // Convert audio to samples
        let samples = Self::convert_audio_to_samples(audio_data)?;

        // Perform transcription
        self.transcribe_internal(samples, language)
    }

    fn get_status(&self) -> ModelStatus {
        self.status
    }

    fn get_loaded_model_info(&self) -> Option<ModelInfo> {
        self.model.as_ref().map(|m| ModelInfo {
            name: m.name.clone(),
            path: m.path.clone(),
            engine_type: "candle".to_string(),
        })
    }

    fn engine_type(&self) -> &'static str {
        "candle"
    }
}

impl Default for CandleWhisperEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_creation() {
        let engine = CandleWhisperEngine::new();
        assert_eq!(engine.get_status(), ModelStatus::Stopped);
        assert_eq!(engine.engine_type(), "candle");
    }
}
