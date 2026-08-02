//! Transcription history storage backed by SQLite.
//!
//! Records are stored in `<app_data_dir>/wursper.db`. The connection is opened
//! once at app setup and kept in Tauri managed state behind a mutex.

pub mod db;
pub mod migration;

pub use db::{
    clear_transcriptions, delete_transcription, latest_transcription, list_transcriptions,
    save_record, save_transcription, setup_database, TranscriptionRecord,
};
