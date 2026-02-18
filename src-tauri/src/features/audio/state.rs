//! Recording state machine with lock-free state transitions.
//!
//! Uses atomic operations for the recording state to avoid mutex deadlocks
//! in the audio callback path. Other metadata uses parking_lot::Mutex for
//! faster locking than std::sync::Mutex.

use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::atomic::{AtomicU8, Ordering};
use ts_rs::TS;

/// Recording state machine
///
/// The state transitions are validated to ensure correct operation:
/// - Idle -> Starting -> Recording -> Stopping -> Transcribing -> Idle
/// - Error can be entered from any state and recovered from
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/features/voice-input/types/generated/")]
#[serde(rename_all = "lowercase")]
#[repr(u8)]
pub enum RecordingState {
    Idle = 0,
    Starting = 1,
    Recording = 2,
    Stopping = 3,
    Transcribing = 4,
    Error = 5,
}

impl RecordingState {
    /// Check if we can transition to the target state
    pub fn can_transition_to(&self, target: &RecordingState) -> bool {
        use RecordingState::*;

        match (self, target) {
            // From Idle
            (Idle, Starting) => true,
            // From Starting
            (Starting, Recording) | (Starting, Error) | (Starting, Idle) => true,
            // From Recording
            (Recording, Stopping) | (Recording, Error) => true,
            // From Stopping
            (Stopping, Transcribing) | (Stopping, Idle) | (Stopping, Error) => true,
            // From Transcribing
            (Transcribing, Idle) | (Transcribing, Error) => true,
            // From Error - allow recovery to Starting or back to Idle
            (Error, Idle) | (Error, Starting) => true,
            // Same state is always allowed
            (a, b) if a == b => true,
            // All other transitions are invalid
            _ => false,
        }
    }

    /// Convert from u8, clamping to valid range
    #[inline]
    fn from_u8(value: u8) -> Self {
        match value {
            0 => RecordingState::Idle,
            1 => RecordingState::Starting,
            2 => RecordingState::Recording,
            3 => RecordingState::Stopping,
            4 => RecordingState::Transcribing,
            _ => RecordingState::Error, // Default to Error for invalid values
        }
    }

    /// Convert to u8
    #[inline]
    fn to_u8(self) -> u8 {
        self as u8
    }

    /// Check if this is an active state (recording in progress)
    #[inline]
    pub fn is_active(&self) -> bool {
        !matches!(self, RecordingState::Idle | RecordingState::Error)
    }
}

/// Global recording state manager with lock-free state access.
///
/// The state field uses atomic operations to avoid blocking in the audio callback.
/// Metadata fields use parking_lot::Mutex which is faster than std::sync::Mutex.
pub struct RecordingStateManager {
    /// Recording state - accessed atomically for lock-free reads/writes
    state: AtomicU8,
    /// Current recording file path
    current_file: Mutex<Option<PathBuf>>,
    /// Error message if in error state
    error_message: Mutex<Option<String>>,
    /// Recording device name
    recording_device: Mutex<Option<String>>,
    /// Recording start timestamp
    start_time: Mutex<Option<i64>>,
}

impl RecordingStateManager {
    pub fn new() -> Self {
        Self {
            state: AtomicU8::new(RecordingState::Idle.to_u8()),
            current_file: Mutex::new(None),
            error_message: Mutex::new(None),
            recording_device: Mutex::new(None),
            start_time: Mutex::new(None),
        }
    }

    /// Get current state (lock-free read)
    #[inline]
    pub fn get_state(&self) -> RecordingState {
        RecordingState::from_u8(self.state.load(Ordering::Acquire))
    }

    /// Set state with validation (lock-free compare-exchange)
    ///
    /// Returns Ok(()) if the transition was valid and successful.
    /// Returns Err with a message if the transition is invalid.
    pub fn set_state(&self, new_state: RecordingState) -> Result<(), String> {
        let current = self.get_state();

        if !current.can_transition_to(&new_state) {
            return Err(format!(
                "Invalid state transition: {:?} -> {:?}",
                current, new_state
            ));
        }

        // Use compare_exchange to atomically update state
        // This handles the race condition where another thread might have changed the state
        match self.state.compare_exchange(
            current.to_u8(),
            new_state.to_u8(),
            Ordering::SeqCst,
            Ordering::SeqCst,
        ) {
            Ok(_) => Ok(()),
            Err(actual) => {
                // State changed between load and CAS - retry validation
                let actual_state = RecordingState::from_u8(actual);
                if actual_state.can_transition_to(&new_state) {
                    // Try once more with the actual state
                    self.state
                        .compare_exchange(
                            actual,
                            new_state.to_u8(),
                            Ordering::SeqCst,
                            Ordering::SeqCst,
                        )
                        .map(|_| ())
                        .map_err(|_| "State changed during transition".to_string())
                } else {
                    Err(format!(
                        "Invalid state transition: {:?} -> {:?}",
                        actual_state, new_state
                    ))
                }
            }
        }
    }

    /// Atomically try to transition from expected state to new state.
    ///
    /// Returns true if the transition succeeded, false otherwise.
    /// This is useful when you know the expected current state.
    #[inline]
    pub fn try_transition(&self, from: RecordingState, to: RecordingState) -> bool {
        if !from.can_transition_to(&to) {
            return false;
        }

        self.state
            .compare_exchange(from.to_u8(), to.to_u8(), Ordering::SeqCst, Ordering::SeqCst)
            .is_ok()
    }

    /// Force set state (bypass validation - use for error recovery only)
    #[inline]
    pub fn force_set_state(&self, new_state: RecordingState) {
        self.state.store(new_state.to_u8(), Ordering::Release);
    }

    /// Set current recording file
    pub fn set_current_file(&self, path: Option<PathBuf>) {
        *self.current_file.lock() = path;
    }

    /// Get current recording file
    pub fn get_current_file(&self) -> Option<PathBuf> {
        self.current_file.lock().clone()
    }

    /// Set error message
    pub fn set_error(&self, message: Option<String>) {
        *self.error_message.lock() = message;
    }

    /// Get error message
    pub fn get_error(&self) -> Option<String> {
        self.error_message.lock().clone()
    }

    /// Check if currently recording (lock-free)
    #[inline]
    pub fn is_recording(&self) -> bool {
        self.get_state() == RecordingState::Recording
    }

    /// Check if in active state (lock-free)
    #[inline]
    pub fn is_active(&self) -> bool {
        self.get_state().is_active()
    }

    /// Set recording device
    pub fn set_recording_device(&self, device: Option<String>) {
        *self.recording_device.lock() = device;
    }

    /// Get recording device
    pub fn get_recording_device(&self) -> Option<String> {
        self.recording_device.lock().clone()
    }

    /// Set recording start time
    pub fn set_start_time(&self, time: Option<i64>) {
        *self.start_time.lock() = time;
    }

    /// Get recording start time
    pub fn get_start_time(&self) -> Option<i64> {
        *self.start_time.lock()
    }

    /// Reset all state to initial values
    pub fn reset(&self) {
        self.force_set_state(RecordingState::Idle);
        *self.current_file.lock() = None;
        *self.error_message.lock() = None;
        *self.recording_device.lock() = None;
        *self.start_time.lock() = None;
    }
}

impl Default for RecordingStateManager {
    fn default() -> Self {
        Self::new()
    }
}

// Safety: RecordingStateManager is safe to share between threads
// - AtomicU8 is inherently thread-safe
// - parking_lot::Mutex is Send + Sync
unsafe impl Send for RecordingStateManager {}
unsafe impl Sync for RecordingStateManager {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_state_transitions() {
        use RecordingState::*;

        // Valid transitions
        assert!(Idle.can_transition_to(&Starting));
        assert!(Starting.can_transition_to(&Recording));
        assert!(Recording.can_transition_to(&Stopping));
        assert!(Stopping.can_transition_to(&Transcribing));
        assert!(Transcribing.can_transition_to(&Idle));

        // Invalid transitions
        assert!(!Idle.can_transition_to(&Recording)); // Must go through Starting
        assert!(!Recording.can_transition_to(&Transcribing)); // Must go through Stopping
    }

    #[test]
    fn test_state_manager() {
        let manager = RecordingStateManager::new();

        assert_eq!(manager.get_state(), RecordingState::Idle);

        // Test valid transition
        let result = manager.set_state(RecordingState::Starting);
        assert!(result.is_ok());
        assert_eq!(manager.get_state(), RecordingState::Starting);

        // Test invalid transition
        let result = manager.set_state(RecordingState::Transcribing);
        assert!(result.is_err());
    }

    #[test]
    fn test_atomic_try_transition() {
        let manager = RecordingStateManager::new();

        // Correct from state
        assert!(manager.try_transition(RecordingState::Idle, RecordingState::Starting));
        assert_eq!(manager.get_state(), RecordingState::Starting);

        // Wrong from state - should fail
        assert!(!manager.try_transition(RecordingState::Idle, RecordingState::Recording));
        assert_eq!(manager.get_state(), RecordingState::Starting); // Unchanged
    }

    #[test]
    fn test_force_set_state() {
        let manager = RecordingStateManager::new();

        // Force set to any state
        manager.force_set_state(RecordingState::Transcribing);
        assert_eq!(manager.get_state(), RecordingState::Transcribing);
    }

    #[test]
    fn test_state_from_u8() {
        assert_eq!(RecordingState::from_u8(0), RecordingState::Idle);
        assert_eq!(RecordingState::from_u8(2), RecordingState::Recording);
        assert_eq!(RecordingState::from_u8(255), RecordingState::Error); // Invalid -> Error
    }

    #[test]
    fn test_concurrent_access() {
        use std::sync::Arc;
        use std::thread;

        let manager = Arc::new(RecordingStateManager::new());
        let mut handles = vec![];

        // Spawn multiple threads trying to read/write state
        for i in 0..10 {
            let m = Arc::clone(&manager);
            handles.push(thread::spawn(move || {
                for _ in 0..100 {
                    let _ = m.get_state();
                    if i % 2 == 0 {
                        let _ = m.try_transition(RecordingState::Idle, RecordingState::Starting);
                    } else {
                        m.force_set_state(RecordingState::Idle);
                    }
                }
            }));
        }

        for handle in handles {
            handle.join().unwrap();
        }

        // Should complete without deadlock
    }
}
