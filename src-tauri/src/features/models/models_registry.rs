use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Manager};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/features/models/types/generated/")]
#[serde(rename_all = "lowercase")]
pub enum ModelType {
    Cloud,
    Local,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/features/models/types/generated/")]
#[serde(rename_all = "kebab-case")]
pub enum ModelPurpose {
    SpeechToText,
    PostProcessing,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/features/models/types/generated/")]
pub enum ModelProvider {
    #[serde(rename = "openai")]
    OpenAI,
    #[serde(rename = "anthropic")]
    Anthropic,
    #[serde(rename = "google")]
    Google,
    #[serde(rename = "assemblyai")]
    AssemblyAI,
    #[serde(rename = "deepgram")]
    Deepgram,
    #[serde(rename = "azure")]
    Azure,
    #[serde(rename = "elevenlabs")]
    ElevenLabs,
    #[serde(rename = "local-whisper")]
    LocalWhisper,
    #[serde(rename = "candle")]
    Candle,
    #[serde(rename = "whisperkit")]
    WhisperKit,
    #[serde(rename = "apple-speech")]
    AppleSpeech,
    #[serde(rename = "ollama")]
    Ollama,
    #[serde(rename = "lmstudio")]
    LMStudio,
    #[serde(rename = "local-llm")]
    LocalLLM,
}

/// Language support for speech-to-text models
/// Models with `.en` suffix are English-only, others support 99+ languages
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/features/models/types/generated/")]
#[serde(rename_all = "snake_case")]
pub enum LanguageSupport {
    /// Supports 99+ languages (standard Whisper models)
    Multilingual,
    /// English only (models with .en suffix)
    EnglishOnly,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/features/models/types/generated/")]
#[serde(rename_all = "camelCase")]
pub struct ModelDefinition {
    pub id: String,
    pub name: String,
    pub provider: ModelProvider,
    #[serde(rename = "type")]
    pub model_type: ModelType,
    pub purpose: ModelPurpose,
    /// Engine type for local models (e.g., "whisper", "llama")
    /// None for cloud models
    pub engine: Option<String>,
    pub size: Option<String>,
    pub requires_api_key: bool,
    pub is_selected: bool,
    pub is_downloaded: Option<bool>,
    pub path: Option<String>,
    pub description: Option<String>,
    /// Download URL for local models
    pub download_url: Option<String>,
    /// Filename to save the model as (for local models)
    pub filename: Option<String>,
    /// Whether this model is recommended
    #[serde(default)]
    pub is_recommended: bool,
    /// Language support for STT models (None for post-processing models)
    pub language_support: Option<LanguageSupport>,
    /// Cost per hour (for display purposes)
    pub cost_per_hour: Option<String>,
    /// Number of languages supported (for display)
    pub languages_count: Option<String>,
    /// Whether this model supports vocabulary/phrase hints
    #[serde(default)]
    pub supports_vocabulary: bool,
}

// Speech-to-Text cloud models
// Format: (id, name, provider, description, cost_per_hour, languages, supports_vocab)
const STT_CLOUD_MODELS: &[(&str, &str, &str, &str, &str, &str, bool)] = &[
    (
        "whisper-1",
        "Whisper",
        "openai",
        "OpenAI Whisper - Fast and accurate speech recognition",
        "$0.36/hr",
        "99+ languages",
        true, // Supports prompt parameter
    ),
    (
        "google-cloud-speech",
        "Cloud Speech-to-Text",
        "google",
        "Google Cloud Speech-to-Text API - High accuracy transcription",
        "$0.96/hr",
        "125+ languages",
        true, // Supports speechContexts
    ),
    (
        "scribe_v1",
        "Scribe V1",
        "elevenlabs",
        "ElevenLabs Scribe - High-quality speech-to-text with multilingual support",
        "$0.50/hr",
        "99+ languages",
        false, // No vocabulary support
    ),
    (
        "assemblyai-best",
        "Universal-2",
        "assemblyai",
        "AssemblyAI Universal-2 - Best-in-class accuracy with word boost",
        "$0.27/hr",
        "99+ languages",
        true, // Supports word_boost
    ),
    (
        "deepgram-nova-2",
        "Nova-2",
        "deepgram",
        "Deepgram Nova-2 - Fastest transcription with 8.4% WER",
        "$0.26/hr",
        "35+ languages",
        true, // Supports keywords
    ),
    (
        "azure-speech",
        "Azure Speech",
        "azure",
        "Microsoft Azure Speech - Enterprise-grade with phrase lists",
        "$0.36/hr",
        "100+ languages",
        true, // Supports phrase lists
    ),
];

// Post-Processing cloud models
const POST_PROCESSING_CLOUD_MODELS: &[(&str, &str, &str, &str)] = &[
    (
        "claude-3-5-sonnet-20241022",
        "Claude 3.5 Sonnet",
        "anthropic",
        "Anthropic's most intelligent model - excellent for text enhancement and formatting",
    ),
    (
        "claude-3-5-haiku-20241022",
        "Claude 3.5 Haiku",
        "anthropic",
        "Fastest Claude model - great for quick post-processing",
    ),
    (
        "gpt-4o",
        "GPT-4o",
        "openai",
        "OpenAI's most advanced model - powerful text processing and enhancement",
    ),
    (
        "gpt-4o-mini",
        "GPT-4o Mini",
        "openai",
        "Affordable and fast OpenAI model - good for basic post-processing",
    ),
];

// Local Whisper models
// Format: (id, url, size, description, category, remote_filename)
// remote_filename: The actual filename on HuggingFace (None means use "ggml-{id}.bin")
pub const WHISPER_MODELS: &[(&str, &str, &str, &str, &str, Option<&str>)] = &[
    // Standard models
    (
        "tiny",
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
        "78 MB",
        "Fastest, basic accuracy",
        "standard",
        None,
    ),
    (
        "base",
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
        "148 MB",
        "Fast, good accuracy",
        "standard",
        None,
    ),
    (
        "small",
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin",
        "488 MB",
        "Balanced speed and accuracy",
        "standard",
        None,
    ),
    (
        "medium",
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin",
        "1.53 GB",
        "High accuracy, slower",
        "standard",
        None,
    ),
    // Turbo model - Best quality with good speed (Recommended)
    (
        "large-v3-turbo",
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin",
        "1.62 GB",
        "Best quality, 8x faster than large-v3",
        "turbo",
        None,
    ),
    // Distilled models - 6x faster with minimal quality loss
    (
        "distil-large-v3",
        "https://huggingface.co/distil-whisper/distil-large-v3-ggml/resolve/main/ggml-distil-large-v3.bin",
        "1.52 GB",
        "Near-best quality, 6x faster",
        "distilled",
        None,
    ),
    (
        "distil-medium.en",
        "https://huggingface.co/distil-whisper/distil-medium.en/resolve/main/ggml-medium-32-2.en.bin",
        "794 MB",
        "English-only, 6x faster",
        "distilled",
        Some("ggml-medium-32-2.en.bin"),
    ),
    (
        "distil-small.en",
        "https://huggingface.co/distil-whisper/distil-small.en/resolve/main/ggml-distil-small.en.bin",
        "336 MB",
        "English-only, compact and fast",
        "distilled",
        Some("ggml-distil-small.en.bin"),
    ),
];

// Candle Whisper models (safetensors format, pure Rust implementation)
// Format: (id, hf_repo, size, description)
// Note: Uses CPU - Metal backend lacks layer-norm support for Whisper
pub const CANDLE_MODELS: &[(&str, &str, &str, &str)] = &[
    (
        "large-v3-turbo",
        "openai/whisper-large-v3-turbo",
        "1.6 GB",
        "Best quality, pure Rust implementation",
    ),
    (
        "large-v3",
        "openai/whisper-large-v3",
        "3.1 GB",
        "Highest accuracy, pure Rust",
    ),
    (
        "distil-large-v3",
        "distil-whisper/distil-large-v3",
        "1.5 GB",
        "Near-best quality, 6x faster",
    ),
    (
        "medium",
        "openai/whisper-medium",
        "1.5 GB",
        "High accuracy, pure Rust",
    ),
    (
        "small",
        "openai/whisper-small",
        "488 MB",
        "Balanced speed and accuracy",
    ),
    (
        "base",
        "openai/whisper-base",
        "148 MB",
        "Fast and lightweight",
    ),
    (
        "tiny",
        "openai/whisper-tiny",
        "78 MB",
        "Fastest, basic accuracy",
    ),
];

// WhisperKit models (CoreML format, Apple Neural Engine optimized)
// Format: (id, size, description)
// Note: Models are downloaded from argmaxinc/whisperkit-coreml HuggingFace repo
pub const WHISPERKIT_MODELS: &[(&str, &str, &str)] = &[
    (
        "large-v3-turbo",
        "800 MB",
        "Best quality with Neural Engine acceleration",
    ),
    ("large-v3", "1.5 GB", "Highest accuracy with Neural Engine"),
    (
        "distil-large-v3",
        "750 MB",
        "Near-best quality, optimized for speed",
    ),
    ("small", "250 MB", "Balanced performance with Neural Engine"),
    ("base", "80 MB", "Fast and lightweight"),
    ("tiny", "45 MB", "Fastest, minimal footprint"),
];

#[command]
pub async fn get_all_models(app: AppHandle) -> Result<Vec<ModelDefinition>, String> {
    let mut models = Vec::new();

    // Add speech-to-text cloud models
    for (id, name, provider, description, cost, languages, supports_vocab) in STT_CLOUD_MODELS {
        models.push(ModelDefinition {
            id: id.to_string(),
            name: name.to_string(),
            provider: match *provider {
                "openai" => ModelProvider::OpenAI,
                "google" => ModelProvider::Google,
                "assemblyai" => ModelProvider::AssemblyAI,
                "deepgram" => ModelProvider::Deepgram,
                "azure" => ModelProvider::Azure,
                "elevenlabs" => ModelProvider::ElevenLabs,
                _ => continue,
            },
            model_type: ModelType::Cloud,
            purpose: ModelPurpose::SpeechToText,
            engine: None,
            size: None,
            requires_api_key: true,
            is_selected: false,
            is_downloaded: None,
            path: None,
            description: Some(description.to_string()),
            download_url: None,
            filename: None,
            is_recommended: *id == "assemblyai-best", // AssemblyAI is recommended for best accuracy
            // All cloud STT models support multiple languages
            language_support: Some(LanguageSupport::Multilingual),
            cost_per_hour: Some(cost.to_string()),
            languages_count: Some(languages.to_string()),
            supports_vocabulary: *supports_vocab,
        });
    }

    // Add post-processing cloud models
    for (id, name, provider, description) in POST_PROCESSING_CLOUD_MODELS {
        models.push(ModelDefinition {
            id: id.to_string(),
            name: name.to_string(),
            provider: match *provider {
                "anthropic" => ModelProvider::Anthropic,
                "openai" => ModelProvider::OpenAI,
                _ => continue,
            },
            model_type: ModelType::Cloud,
            purpose: ModelPurpose::PostProcessing,
            engine: None,
            size: None,
            requires_api_key: true,
            is_selected: false,
            is_downloaded: None,
            path: None,
            description: Some(description.to_string()),
            download_url: None,
            filename: None,
            is_recommended: *id == "claude-3-5-sonnet-20241022",
            // Post-processing models don't have language support (not STT)
            language_support: None,
            cost_per_hour: None,
            languages_count: None,
            supports_vocabulary: false, // N/A for post-processing
        });
    }

    // Add local Whisper models with download status
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let whisper_dir = app_data_dir.join("local_models").join("whisper");

    for (name, url, size, description, category, remote_filename) in WHISPER_MODELS {
        // Use remote_filename if provided, otherwise generate from name
        let filename = remote_filename
            .map(|f| f.to_string())
            .unwrap_or_else(|| format!("ggml-{}.bin", name));
        let model_path = whisper_dir.join(&filename);
        let downloaded = model_path.exists();

        // Format display name based on model type
        let model_name = match *category {
            "turbo" => format!("Whisper Large V3 Turbo"),
            "distilled" => {
                let base_name = name.replace("distil-", "").replace(".en", "");
                let capitalized =
                    base_name.chars().next().unwrap().to_uppercase().to_string() + &base_name[1..];
                format!("Distil Whisper {}", capitalized)
            }
            _ => format!(
                "Whisper {}",
                name.chars().next().unwrap().to_uppercase().to_string() + &name[1..]
            ),
        };

        // Determine if this should be the default selected model
        // Prefer large-v3-turbo if available, otherwise tiny
        let is_default = *name == "large-v3-turbo"
            || (*name == "tiny"
                && !WHISPER_MODELS
                    .iter()
                    .any(|(n, _, _, _, _, _)| *n == "large-v3-turbo"));

        // Mark distil-large-v3 as recommended for STT
        let is_recommended = *name == "distil-large-v3";

        // Models with .en suffix are English-only, others support 99+ languages
        let language_support = if name.ends_with(".en") {
            LanguageSupport::EnglishOnly
        } else {
            LanguageSupport::Multilingual
        };

        models.push(ModelDefinition {
            id: format!("whisper-{}", name),
            name: model_name.clone(),
            provider: ModelProvider::LocalWhisper,
            model_type: ModelType::Local,
            purpose: ModelPurpose::SpeechToText,
            engine: Some("whisper".to_string()),
            size: Some(size.to_string()),
            requires_api_key: false,
            is_selected: is_default,
            is_downloaded: Some(downloaded),
            path: if downloaded {
                Some(model_path.to_string_lossy().to_string())
            } else {
                None
            },
            description: Some(format!("{} - Runs locally", description)),
            download_url: Some(url.to_string()),
            filename: Some(filename),
            is_recommended,
            language_support: Some(language_support),
            cost_per_hour: Some("Free".to_string()),
            languages_count: if name.ends_with(".en") {
                Some("English only".to_string())
            } else {
                Some("99+ languages".to_string())
            },
            supports_vocabulary: true, // Local Whisper supports initial_prompt
        });
    }

    // NOTE: Candle Whisper models are hidden from UI for now
    // To re-enable, uncomment the following block
    /*
    let candle_dir = app_data_dir.join("local_models").join("candle");
    for (name, hf_repo, size, description) in CANDLE_MODELS {
        // Candle models are downloaded from HuggingFace and cached
        // Check if model.safetensors exists in the cache directory
        let cache_path = candle_dir.join(*name).join("model.safetensors");
        let downloaded = cache_path.exists();

        let model_name = if name.contains("large-v3-turbo") {
            "Candle Large V3 Turbo".to_string()
        } else if name.contains("large-v3") {
            "Candle Large V3".to_string()
        } else if name.contains("distil") {
            format!(
                "Candle Distil {}",
                name.replace("distil-", "")
                    .chars()
                    .next()
                    .unwrap()
                    .to_uppercase()
                    .to_string()
                    + &name.replace("distil-", "")[1..]
            )
        } else {
            format!(
                "Candle {}",
                name.chars().next().unwrap().to_uppercase().to_string() + &name[1..]
            )
        };

        models.push(ModelDefinition {
            id: format!("candle-{}", name),
            name: model_name,
            provider: ModelProvider::Candle,
            model_type: ModelType::Local,
            purpose: ModelPurpose::SpeechToText,
            engine: Some("candle".to_string()),
            size: Some(size.to_string()),
            requires_api_key: false,
            is_selected: false,
            is_downloaded: Some(downloaded),
            path: if downloaded {
                Some(cache_path.to_string_lossy().to_string())
            } else {
                None
            },
            description: Some(format!("{} - Pure Rust implementation", description)),
            download_url: Some(format!("hf://{}", hf_repo)),
            filename: Some("model.safetensors".to_string()),
        });
    }
    */ // End of Candle models block

    // NOTE: WhisperKit and Apple Speech models are hidden from UI for now
    // To re-enable, uncomment the following blocks
    /*
    // Add WhisperKit models (macOS only, CoreML/Neural Engine)
    #[cfg(target_os = "macos")]
    {
        let whisperkit_dir = app_data_dir.join("local_models").join("whisperkit");
        for (name, size, description) in WHISPERKIT_MODELS {
            let model_path = whisperkit_dir.join(*name);
            let downloaded = model_path.exists();

            let model_name = if name.contains("large-v3-turbo") {
                "WhisperKit Large V3 Turbo".to_string()
            } else if name.contains("large-v3") {
                "WhisperKit Large V3".to_string()
            } else if name.contains("distil") {
                format!(
                    "WhisperKit Distil {}",
                    name.replace("distil-", "")
                        .chars()
                        .next()
                        .unwrap()
                        .to_uppercase()
                        .to_string()
                        + &name.replace("distil-", "")[1..]
                )
            } else {
                format!(
                    "WhisperKit {}",
                    name.chars().next().unwrap().to_uppercase().to_string() + &name[1..]
                )
            };

            models.push(ModelDefinition {
                id: format!("whisperkit-{}", name),
                name: model_name,
                provider: ModelProvider::WhisperKit,
                model_type: ModelType::Local,
                purpose: ModelPurpose::SpeechToText,
                engine: Some("whisperkit".to_string()),
                size: Some(size.to_string()),
                requires_api_key: false,
                is_selected: false,
                is_downloaded: Some(downloaded),
                path: if downloaded {
                    Some(model_path.to_string_lossy().to_string())
                } else {
                    None
                },
                description: Some(format!("{} - CoreML with Neural Engine", description)),
                download_url: Some(format!("hf://argmaxinc/whisperkit-coreml/{}", name)),
                filename: None,
            });
        }
    }

    // Add Apple Speech model (macOS only, no download needed)
    #[cfg(target_os = "macos")]
    {
        models.push(ModelDefinition {
            id: "apple-speech".to_string(),
            name: "Apple Speech Recognition".to_string(),
            provider: ModelProvider::AppleSpeech,
            model_type: ModelType::Local,
            purpose: ModelPurpose::SpeechToText,
            engine: Some("apple-speech".to_string()),
            size: Some("Built-in".to_string()),
            requires_api_key: false,
            is_selected: false,
            is_downloaded: Some(true), // Always available on macOS
            path: Some("system://apple-speech".to_string()),
            description: Some(
                "macOS built-in speech recognition - No download required, instant setup"
                    .to_string(),
            ),
            download_url: None,
            filename: None,
        });
    }
    */ // End of WhisperKit and Apple Speech blocks

    Ok(models)
}
