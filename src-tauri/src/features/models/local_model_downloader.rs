use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{command, AppHandle, Emitter, Manager};
use tokio::io::AsyncWriteExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    pub downloaded: u64,
    pub total: u64,
    pub percentage: f64,
    pub model_id: String,
}

/// Get the base directory for storing local models
fn get_models_base_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let models_dir = app_data_dir.join("local_models");

    // Create directory if it doesn't exist
    std::fs::create_dir_all(&models_dir)
        .map_err(|e| format!("Failed to create models directory: {}", e))?;

    Ok(models_dir)
}

/// Get the directory for a specific engine type
fn get_engine_dir(app: &AppHandle, engine_type: &str) -> Result<PathBuf, String> {
    let base_dir = get_models_base_dir(app)?;
    let engine_dir = base_dir.join(engine_type);

    std::fs::create_dir_all(&engine_dir)
        .map_err(|e| format!("Failed to create engine directory: {}", e))?;

    Ok(engine_dir)
}

/// Download a local model from a URL
///
/// # Arguments
/// * `model_id` - The model identifier (e.g., "whisper-tiny", "llama-3-8b")
/// * `download_url` - The URL to download the model from (supports http://, https://, and hf:// schemes)
/// * `filename` - The filename to save the model as
/// * `engine_type` - The engine type (e.g., "whisper", "llama")
#[command]
pub async fn download_local_model(
    app: AppHandle,
    model_id: String,
    download_url: String,
    filename: String,
    engine_type: String,
) -> Result<String, String> {
    // Handle hf:// URLs for HuggingFace models (used by Candle engine)
    if download_url.starts_with("hf://") {
        return download_hf_model(app, model_id, download_url, engine_type).await;
    }

    let engine_dir = get_engine_dir(&app, &engine_type)?;
    let model_path = engine_dir.join(&filename);

    // Check if already downloaded
    if model_path.exists() {
        return Ok(model_path.to_string_lossy().to_string());
    }

    // Download the model with progress tracking
    let client = reqwest::Client::new();
    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| format!("Failed to start download: {}", e))?;

    let total_size = response.content_length().unwrap_or(0);

    // Create the file
    let mut file = tokio::fs::File::create(&model_path)
        .await
        .map_err(|e| format!("Failed to create file: {}", e))?;

    let mut downloaded: u64 = 0;

    // Read the response in chunks
    use bytes::Buf;
    use futures_util::StreamExt;

    let mut stream = response.bytes_stream();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("Error downloading chunk: {}", e))?;

        file.write_all(chunk.chunk())
            .await
            .map_err(|e| format!("Error writing to file: {}", e))?;

        downloaded += chunk.len() as u64;

        // Emit progress event every 100KB to avoid too many events
        if downloaded % 102400 == 0 || downloaded >= total_size {
            let percentage = if total_size > 0 {
                (downloaded as f64 / total_size as f64) * 100.0
            } else {
                0.0
            };

            let progress = DownloadProgress {
                downloaded,
                total: total_size,
                percentage,
                model_id: model_id.clone(),
            };

            let _ = app.emit("local-model-download-progress", progress);
        }
    }

    // Emit final progress
    let progress = DownloadProgress {
        downloaded,
        total: total_size,
        percentage: 100.0,
        model_id: model_id.clone(),
    };
    let _ = app.emit("local-model-download-progress", progress);

    file.flush()
        .await
        .map_err(|e| format!("Error flushing file: {}", e))?;

    Ok(model_path.to_string_lossy().to_string())
}

/// Download a HuggingFace model using hf:// URL scheme
///
/// Downloads model.safetensors, config.json, and tokenizer.json from HuggingFace
/// and stores them in the local model cache directory.
///
/// # Arguments
/// * `app` - Tauri app handle
/// * `model_id` - The model identifier (e.g., "candle-tiny")
/// * `download_url` - The HuggingFace URL (e.g., "hf://openai/whisper-tiny")
/// * `engine_type` - The engine type (e.g., "candle")
async fn download_hf_model(
    app: AppHandle,
    model_id: String,
    download_url: String,
    engine_type: String,
) -> Result<String, String> {
    use bytes::Buf;
    use futures_util::StreamExt;

    // Parse the repo ID from hf:// URL (e.g., "hf://openai/whisper-tiny" -> "openai/whisper-tiny")
    let repo_id = download_url
        .strip_prefix("hf://")
        .ok_or_else(|| "Invalid hf:// URL format".to_string())?
        .to_string();

    // Extract model name from model_id (e.g., "candle-tiny" -> "tiny")
    let model_name = model_id
        .strip_prefix("candle-")
        .unwrap_or(&model_id)
        .to_string();

    let engine_dir = get_engine_dir(&app, &engine_type)?;
    let model_dir = engine_dir.join(&model_name);

    // Check if model.safetensors already exists
    let safetensors_path = model_dir.join("model.safetensors");
    if safetensors_path.exists() {
        return Ok(safetensors_path.to_string_lossy().to_string());
    }

    // Create model directory
    std::fs::create_dir_all(&model_dir)
        .map_err(|e| format!("Failed to create model directory: {}", e))?;

    // Files to download for Whisper models
    let files = ["config.json", "tokenizer.json", "model.safetensors"];

    // Calculate approximate total size for progress (config ~1KB, tokenizer ~1MB, model varies)
    // We'll update this as we get actual sizes
    let client = reqwest::Client::new();
    let mut total_downloaded: u64 = 0;
    let mut total_size: u64 = 0;

    // First, get the sizes of all files
    for file in &files {
        let url = format!("https://huggingface.co/{}/resolve/main/{}", repo_id, file);
        if let Ok(response) = client.head(&url).send().await {
            if let Some(size) = response.content_length() {
                total_size += size;
            }
        }
    }

    // If we couldn't get sizes, estimate based on model type
    if total_size == 0 {
        total_size = 100_000_000; // 100MB default estimate
    }

    // Emit initial progress
    let _ = app.emit(
        "local-model-download-progress",
        DownloadProgress {
            downloaded: 0,
            total: total_size,
            percentage: 0.0,
            model_id: model_id.clone(),
        },
    );

    // Download each file
    for file in &files {
        let url = format!("https://huggingface.co/{}/resolve/main/{}", repo_id, file);

        let response = client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to download {}: {}", file, e))?;

        if !response.status().is_success() {
            return Err(format!(
                "Failed to download {}: HTTP {}",
                file,
                response.status()
            ));
        }

        let dest_path = model_dir.join(file);
        let mut dest_file = tokio::fs::File::create(&dest_path)
            .await
            .map_err(|e| format!("Failed to create file {}: {}", file, e))?;

        let mut stream = response.bytes_stream();

        while let Some(chunk_result) = stream.next().await {
            let chunk = chunk_result.map_err(|e| format!("Error downloading {}: {}", file, e))?;

            dest_file
                .write_all(chunk.chunk())
                .await
                .map_err(|e| format!("Error writing {}: {}", file, e))?;

            total_downloaded += chunk.len() as u64;

            // Emit progress every 100KB
            if total_downloaded % 102400 == 0 {
                let percentage = if total_size > 0 {
                    (total_downloaded as f64 / total_size as f64) * 100.0
                } else {
                    0.0
                };

                let _ = app.emit(
                    "local-model-download-progress",
                    DownloadProgress {
                        downloaded: total_downloaded,
                        total: total_size,
                        percentage,
                        model_id: model_id.clone(),
                    },
                );
            }
        }

        dest_file
            .flush()
            .await
            .map_err(|e| format!("Error flushing {}: {}", file, e))?;
    }

    // Emit completion
    let _ = app.emit(
        "local-model-download-progress",
        DownloadProgress {
            downloaded: total_size,
            total: total_size,
            percentage: 100.0,
            model_id,
        },
    );

    Ok(safetensors_path.to_string_lossy().to_string())
}

/// Delete a local model file
///
/// # Arguments
/// * `model_path` - The full path to the model file to delete
#[command]
pub async fn delete_local_model(model_path: String) -> Result<(), String> {
    let path = PathBuf::from(&model_path);

    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| format!("Failed to delete model: {}", e))?;
    }

    Ok(())
}
