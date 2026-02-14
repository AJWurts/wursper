//! Cache module for frequently accessed data.
//!
//! Provides in-memory caching to reduce disk I/O overhead,
//! particularly for settings that are read multiple times per recording cycle.

pub mod settings_cache;

pub use settings_cache::SettingsCache;
