use parking_lot::Mutex;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{command, AppHandle, Manager, State};
use ts_rs::TS;

/// A single transcription history entry.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(
    export,
    export_to = "../../src/features/transcriptions/types/generated/"
)]
#[serde(rename_all = "camelCase")]
pub struct TranscriptionRecord {
    pub id: String,
    pub text: String,
    /// Epoch milliseconds
    #[ts(type = "number")]
    pub timestamp: i64,
    /// Recording duration in seconds
    pub duration: Option<f64>,
    pub word_count: u32,
    pub model_id: String,
    pub provider: String,
}

/// Managed state holding the SQLite connection.
pub struct TranscriptionDb(pub Arc<Mutex<Connection>>);

const DB_FILE_NAME: &str = "wursper.db";

const CREATE_TABLE_SQL: &str = "CREATE TABLE IF NOT EXISTS transcriptions (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    duration REAL,
    word_count INTEGER NOT NULL,
    model_id TEXT NOT NULL,
    provider TEXT NOT NULL
)";

/// Open (creating if needed) the transcription database and register it in
/// managed state. Also runs the one-time JSON store import.
pub fn setup_database(app: &AppHandle) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;

    if !app_data_dir.exists() {
        std::fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }

    let db_path = app_data_dir.join(DB_FILE_NAME);
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open transcription database: {}", e))?;

    conn.execute_batch(&format!(
        "PRAGMA journal_mode=WAL;\nPRAGMA foreign_keys=ON;\n{};\nCREATE INDEX IF NOT EXISTS idx_transcriptions_timestamp ON transcriptions(timestamp DESC);",
        CREATE_TABLE_SQL
    ))
    .map_err(|e| format!("Failed to initialize transcription database: {}", e))?;

    log::info!("Transcription database ready at {}", db_path.display());

    // One-time import from the legacy tauri-plugin-store JSON file.
    if let Err(e) = super::migration::import_legacy_store(&app_data_dir, &conn) {
        log::warn!("Legacy transcription import failed: {}", e);
    }

    app.manage(TranscriptionDb(Arc::new(Mutex::new(conn))));

    Ok(())
}

fn row_to_record(row: &rusqlite::Row<'_>) -> rusqlite::Result<TranscriptionRecord> {
    Ok(TranscriptionRecord {
        id: row.get(0)?,
        text: row.get(1)?,
        timestamp: row.get(2)?,
        duration: row.get(3)?,
        word_count: row.get::<_, i64>(4)?.max(0) as u32,
        model_id: row.get(5)?,
        provider: row.get(6)?,
    })
}

/// Insert (or replace) a record using an already-open connection.
pub fn insert_record(conn: &Connection, record: &TranscriptionRecord) -> Result<(), String> {
    conn.execute(
        "INSERT OR REPLACE INTO transcriptions
            (id, text, timestamp, duration, word_count, model_id, provider)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![
            record.id,
            record.text,
            record.timestamp,
            record.duration,
            record.word_count as i64,
            record.model_id,
            record.provider,
        ],
    )
    .map_err(|e| format!("Failed to save transcription: {}", e))?;

    Ok(())
}

/// Save a record using the app's managed connection (usable outside commands).
pub fn save_record(app: &AppHandle, record: &TranscriptionRecord) -> Result<(), String> {
    let state = app
        .try_state::<TranscriptionDb>()
        .ok_or_else(|| "Transcription database is not initialized".to_string())?;
    let conn = state.0.lock();
    insert_record(&conn, record)
}

/// Most recent transcription text, if any.
pub fn latest_transcription(app: &AppHandle) -> Result<Option<String>, String> {
    let state = app
        .try_state::<TranscriptionDb>()
        .ok_or_else(|| "Transcription database is not initialized".to_string())?;
    let conn = state.0.lock();

    conn.query_row(
        "SELECT text FROM transcriptions ORDER BY timestamp DESC LIMIT 1",
        [],
        |row| row.get::<_, String>(0),
    )
    .map(Some)
    .or_else(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => Ok(None),
        other => Err(format!("Failed to read last transcription: {}", other)),
    })
}

/// List all transcriptions, newest first.
#[command]
pub fn list_transcriptions(
    db: State<'_, TranscriptionDb>,
) -> Result<Vec<TranscriptionRecord>, String> {
    let conn = db.0.lock();

    let mut stmt = conn
        .prepare(
            "SELECT id, text, timestamp, duration, word_count, model_id, provider
             FROM transcriptions ORDER BY timestamp DESC",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let records = stmt
        .query_map([], row_to_record)
        .map_err(|e| format!("Failed to query transcriptions: {}", e))?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| format!("Failed to read transcriptions: {}", e))?;

    Ok(records)
}

/// Insert or update a transcription record.
#[command]
pub fn save_transcription(
    record: TranscriptionRecord,
    db: State<'_, TranscriptionDb>,
) -> Result<(), String> {
    let conn = db.0.lock();
    insert_record(&conn, &record)
}

/// Delete a single transcription (and its recording folder, if present).
#[command]
pub fn delete_transcription(
    id: String,
    app: AppHandle,
    db: State<'_, TranscriptionDb>,
) -> Result<(), String> {
    {
        let conn = db.0.lock();
        conn.execute("DELETE FROM transcriptions WHERE id = ?1", [&id])
            .map_err(|e| format!("Failed to delete transcription: {}", e))?;
    }

    // Best effort: remove the associated audio recording folder (named by timestamp).
    if let Ok(recordings_dir) = crate::features::recordings::get_recordings_dir(&app) {
        let folder = recordings_dir.join(&id);
        if folder.is_dir() {
            let _ = std::fs::remove_dir_all(&folder);
        }
    }

    Ok(())
}

/// Remove all transcriptions.
#[command]
pub fn clear_transcriptions(db: State<'_, TranscriptionDb>) -> Result<(), String> {
    let conn = db.0.lock();
    conn.execute("DELETE FROM transcriptions", [])
        .map_err(|e| format!("Failed to clear transcriptions: {}", e))?;

    Ok(())
}
