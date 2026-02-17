//! Tauri commands for managing local models

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;
use tauri::{command, AppHandle, Emitter, State};
use tauri_plugin_store::StoreExt;
use tokio::sync::Mutex;

use super::engines::{ModelConfig, ModelStatus};
use super::local_model_manager::LocalModelManager;

/// Shared state type for local model manager
pub type LocalModelState = Arc<Mutex<LocalModelManager>>;

/// Information about the current local model status
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalModelStatusInfo {
    pub status: ModelStatus,
    pub model_name: Option<String>,
    pub model_id: Option<String>,
}

/// Start (load) a local model into memory
#[command]
pub async fn start_local_model(
    model_id: String,
    model_name: String,
    model_path: String,
    engine_type: String,
    state: State<'_, LocalModelState>,
    app: AppHandle,
) -> Result<(), String> {
    log::info!(
        "Starting local model: {} (engine: {})",
        model_id,
        engine_type
    );

    // Update AI processing settings for LLM models
    if model_id.starts_with("llm-") || engine_type == "llama" {
        update_ai_settings(&app, &model_id);
    }

    let mut manager = state.lock().await;

    // Emit loading event
    let _ = app.emit(
        "local-model-status",
        LocalModelStatusInfo {
            status: ModelStatus::Loading,
            model_name: Some(model_name.clone()),
            model_id: Some(model_id.clone()),
        },
    );

    let config = ModelConfig {
        model_path,
        model_name: model_name.clone(),
        language: None,
    };

    // Route to correct engine type
    let result = if engine_type == "llama" {
        manager.load_llm_model(&engine_type, config)
    } else {
        manager.load_model(&engine_type, config)
    };

    match result {
        Ok(()) => {
            let _ = app.emit(
                "local-model-status",
                LocalModelStatusInfo {
                    status: ModelStatus::Ready,
                    model_name: Some(model_name),
                    model_id: Some(model_id),
                },
            );
            Ok(())
        }
        Err(e) => {
            let _ = app.emit(
                "local-model-status",
                LocalModelStatusInfo {
                    status: ModelStatus::Error,
                    model_name: Some(model_name),
                    model_id: Some(model_id),
                },
            );
            Err(e)
        }
    }
}

/// Update AI processing settings for LLM models
fn update_ai_settings(app: &AppHandle, model_id: &str) {
    let Ok(store) = app.store("settings") else {
        return;
    };

    let Some(settings_value) = store.get("settings") else {
        return;
    };

    let mut settings = settings_value.clone();
    let Some(obj) = settings.as_object_mut() else {
        return;
    };

    obj.insert(
        "aiProcessing".to_string(),
        serde_json::json!({
            "enabled": true,
            "postProcessingModelId": model_id
        }),
    );

    store.set("settings", settings);
    let _ = store.save();
}

/// Stop (unload) a specific local model from memory
#[command]
pub async fn stop_local_model(
    model_id: Option<String>,
    state: State<'_, LocalModelState>,
    app: AppHandle,
) -> Result<(), String> {
    let mut manager = state.lock().await;

    match &model_id {
        Some(id) if id.starts_with("llm-") => {
            log::info!("Stopping LLM model: {}", id);
            manager.unload_llm_model();
        }
        Some(id) => {
            log::info!("Stopping STT model: {}", id);
            manager.unload_model();
        }
        None => {
            log::info!("Stopping all local models");
            manager.unload_model();
            manager.unload_llm_model();
        }
    }

    let _ = app.emit(
        "local-model-status",
        LocalModelStatusInfo {
            status: ModelStatus::Stopped,
            model_name: None,
            model_id: model_id.clone(),
        },
    );

    Ok(())
}

/// Debug command to check AI processing settings
#[command]
pub async fn debug_ai_settings(app: AppHandle) -> Result<Value, String> {
    let store = app
        .store("settings")
        .map_err(|e| format!("Failed to get settings store: {}", e))?;

    let settings = store
        .get("settings")
        .ok_or("No settings found in store")?
        .clone();

    settings
        .get("aiProcessing")
        .cloned()
        .ok_or_else(|| "aiProcessing not found".to_string())
}

/// Get the current local model status
#[command]
pub async fn get_local_model_status(
    model_id: Option<String>,
    state: State<'_, LocalModelState>,
) -> Result<LocalModelStatusInfo, String> {
    let manager = state.lock().await;

    let stt_model_info = manager.get_loaded_model_info();
    let llm_model_info = manager.get_loaded_llm_model_info();

    if let Some(requested_id) = model_id.clone() {
        if requested_id.starts_with("llm-") {
            if let Some(info) = llm_model_info {
                let matches = requested_id.contains(&info.name.to_lowercase().replace(" ", "-"))
                    || requested_id.contains(&info.name.to_lowercase().replace(" ", ""));

                if matches {
                    return Ok(LocalModelStatusInfo {
                        status: manager.get_llm_status(),
                        model_name: Some(info.name),
                        model_id: Some(requested_id),
                    });
                }
            }
        } else if let Some(info) = stt_model_info {
            if requested_id.contains(&info.name) {
                return Ok(LocalModelStatusInfo {
                    status: manager.get_status(),
                    model_name: Some(info.name),
                    model_id: Some(requested_id),
                });
            }
        }

        return Ok(LocalModelStatusInfo {
            status: ModelStatus::Stopped,
            model_name: None,
            model_id: Some(requested_id),
        });
    }

    if let Some(info) = llm_model_info {
        Ok(LocalModelStatusInfo {
            status: manager.get_llm_status(),
            model_name: Some(info.name),
            model_id: None,
        })
    } else {
        Ok(LocalModelStatusInfo {
            status: manager.get_status(),
            model_name: stt_model_info.as_ref().map(|i| i.name.clone()),
            model_id: None,
        })
    }
}
