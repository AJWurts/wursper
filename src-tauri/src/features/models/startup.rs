//! Auto-start module for local models on app startup

use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tauri_plugin_store::StoreExt;
use tokio::sync::Mutex;

use super::engines::ModelConfig;
use super::LocalModelManager;

/// Auto-start selected local models if they're downloaded
pub async fn auto_start_selected_models(
    app: &AppHandle,
    model_manager: Arc<Mutex<LocalModelManager>>,
) -> Result<(), String> {
    let settings_store = app
        .store("settings")
        .map_err(|e| format!("Failed to get settings store: {}", e))?;

    let settings = settings_store
        .get("settings")
        .ok_or("No settings found in store")?;

    let speech_to_text_id = settings
        .get("transcription")
        .and_then(|t| t.get("speechToTextModelId"))
        .and_then(|v| v.as_str());

    let models_store = app
        .store("models.json")
        .map_err(|e| format!("Failed to get models store: {}", e))?;

    let models = models_store
        .get("models")
        .and_then(|v| v.as_array().cloned())
        .ok_or("No models found in store")?;

    let mut models_to_download = Vec::new();

    // Auto-start STT model
    if let Some(stt_id) = speech_to_text_id {
        if let Some(result) = try_start_model(app, &model_manager, &models, stt_id).await {
            match result {
                Ok(name) => log::info!("Auto-started STT model: {}", name),
                Err(ModelStartError::NotDownloaded(name)) => models_to_download.push(name),
                Err(ModelStartError::Failed(e)) => log::error!("Failed to start STT model: {}", e),
                Err(ModelStartError::NotLocal) => {}
            }
        }
    }

    // Show toast if models need download
    if !models_to_download.is_empty() {
        let msg = if models_to_download.len() == 1 {
            format!("Model needs download: {}", models_to_download[0])
        } else {
            format!("Models need download: {}", models_to_download.join(", "))
        };
        let _ = crate::features::window::show_toast(
            app,
            &msg,
            crate::features::window::ToastType::Warning,
            1.0,
        );
    }

    Ok(())
}

enum ModelStartError {
    NotLocal,
    NotDownloaded(String),
    Failed(String),
}

/// Try to start a model, returning the model name on success
async fn try_start_model(
    app: &AppHandle,
    model_manager: &Arc<Mutex<LocalModelManager>>,
    models: &[serde_json::Value],
    model_id: &str,
) -> Option<Result<String, ModelStartError>> {
    let model_data = models.iter().find(|m| {
        m.get("id")
            .and_then(|v| v.as_str())
            .map(|id| id == model_id)
            .unwrap_or(false)
    })?;

    let obj = model_data.as_object()?;
    let model_type = obj.get("type").and_then(|v| v.as_str()).unwrap_or("");

    if model_type != "local" {
        return Some(Err(ModelStartError::NotLocal));
    }

    let is_downloaded = obj
        .get("isDownloaded")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    let model_name = obj
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or(model_id)
        .to_string();

    if !is_downloaded {
        return Some(Err(ModelStartError::NotDownloaded(model_name)));
    }

    let model_path = obj.get("path").and_then(|v| v.as_str())?;
    let engine_type = obj.get("engine").and_then(|v| v.as_str())?;

    let config = ModelConfig {
        model_path: model_path.to_string(),
        model_name: model_name.clone(),
        language: None,
    };

    let mut manager = model_manager.lock().await;

    let result = manager.load_model(engine_type, config);

    if let Err(e) = result {
        return Some(Err(ModelStartError::Failed(e)));
    }

    let _ = app.emit(
        "local-model-status",
        serde_json::json!({
            "status": "ready",
            "modelName": model_name,
            "modelId": model_id,
        }),
    );

    Some(Ok(model_name))
}
