//! One-time import of transcription history from the legacy
//! `tauri-plugin-store` JSON file (`transcriptions.json`) into SQLite.

use rusqlite::Connection;
use serde::Deserialize;
use std::path::Path;

use super::db::{insert_record, TranscriptionRecord};

const LEGACY_FILE: &str = "transcriptions.json";
const MIGRATED_SUFFIX: &str = "transcriptions.json.migrated";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacyRecord {
    id: String,
    text: String,
    timestamp: i64,
    #[serde(default)]
    duration: Option<f64>,
    #[serde(default)]
    word_count: Option<u32>,
    #[serde(default)]
    model_id: Option<String>,
    #[serde(default)]
    provider: Option<String>,
}

#[derive(Debug, Deserialize)]
struct LegacyStore {
    #[serde(default)]
    transcriptions: Vec<LegacyRecord>,
}

/// Import legacy records if the JSON file exists and the table is empty.
/// The file is renamed to `transcriptions.json.migrated` afterwards.
pub fn import_legacy_store(app_data_dir: &Path, conn: &Connection) -> Result<(), String> {
    let legacy_path = app_data_dir.join(LEGACY_FILE);
    if !legacy_path.is_file() {
        return Ok(());
    }

    let existing: i64 = conn
        .query_row("SELECT COUNT(*) FROM transcriptions", [], |row| row.get(0))
        .map_err(|e| format!("Failed to count transcriptions: {}", e))?;

    if existing > 0 {
        log::debug!("Transcription table already populated, skipping legacy import");
        return Ok(());
    }

    let contents = std::fs::read_to_string(&legacy_path)
        .map_err(|e| format!("Failed to read {}: {}", legacy_path.display(), e))?;

    let store: LegacyStore = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse {}: {}", legacy_path.display(), e))?;

    let mut imported = 0usize;
    for legacy in store.transcriptions {
        let word_count = legacy
            .word_count
            .unwrap_or_else(|| legacy.text.split_whitespace().count() as u32);

        let record = TranscriptionRecord {
            id: legacy.id,
            text: legacy.text,
            timestamp: legacy.timestamp,
            duration: legacy.duration,
            word_count,
            model_id: legacy.model_id.unwrap_or_default(),
            provider: legacy.provider.unwrap_or_default(),
        };

        match insert_record(conn, &record) {
            Ok(()) => imported += 1,
            Err(e) => log::warn!("Skipping legacy transcription: {}", e),
        }
    }

    log::info!(
        "Imported {} transcriptions from legacy JSON store",
        imported
    );

    let migrated_path = app_data_dir.join(MIGRATED_SUFFIX);
    if let Err(e) = std::fs::rename(&legacy_path, &migrated_path) {
        log::warn!("Failed to rename legacy transcriptions file: {}", e);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::super::db::tests::{open_test_db, record};
    use super::*;

    fn count(conn: &Connection) -> i64 {
        conn.query_row("SELECT COUNT(*) FROM transcriptions", [], |row| row.get(0))
            .unwrap()
    }

    #[test]
    fn imports_legacy_json_and_renames_file() {
        let dir = tempfile::tempdir().unwrap();
        let legacy = dir.path().join(LEGACY_FILE);
        std::fs::write(
            &legacy,
            r#"{"transcriptions":[
                {"id":"one","text":"hello there","timestamp":100},
                {"id":"two","text":"bye","timestamp":200,"wordCount":9,"modelId":"m","provider":"p"}
            ]}"#,
        )
        .unwrap();

        let conn = open_test_db();
        import_legacy_store(dir.path(), &conn).unwrap();

        assert_eq!(count(&conn), 2);
        // Missing wordCount falls back to a whitespace count.
        let wc: i64 = conn
            .query_row(
                "SELECT word_count FROM transcriptions WHERE id = 'one'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(wc, 2);
        assert!(!legacy.exists());
        assert!(dir.path().join(MIGRATED_SUFFIX).is_file());
    }

    #[test]
    fn skips_import_when_table_already_populated() {
        let dir = tempfile::tempdir().unwrap();
        std::fs::write(
            dir.path().join(LEGACY_FILE),
            r#"{"transcriptions":[{"id":"legacy","text":"old","timestamp":1}]}"#,
        )
        .unwrap();

        let conn = open_test_db();
        crate::features::transcriptions::db::insert_record(&conn, &record("existing", "kept", 5))
            .unwrap();
        import_legacy_store(dir.path(), &conn).unwrap();

        assert_eq!(count(&conn), 1);
        // File stays in place so nothing is lost.
        assert!(dir.path().join(LEGACY_FILE).is_file());
    }

    #[test]
    fn missing_legacy_file_is_a_noop() {
        let dir = tempfile::tempdir().unwrap();
        let conn = open_test_db();
        import_legacy_store(dir.path(), &conn).unwrap();
        assert_eq!(count(&conn), 0);
    }
}
