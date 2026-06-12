# Dicta Project TODOs

Tracked improvements and technical debt identified during engineering review (2026-03-20).

## High Priority

### 1. Extract Orchestrator Mode Handlers
**What:** Split `transcribe_and_process()` (500+ lines) into `handle_dictation_mode()` and `handle_command_mode()` functions.

**Why:** Reduces cognitive complexity, improves testability, makes code easier to maintain and modify.

**Pros:**
- Better separation of concerns
- Easier to test each mode independently
- Clearer code flow for new contributors

**Cons:**
- Significant refactor with many shared variables
- Need to carefully manage state across function boundaries
- Risk of introducing bugs during extraction

**Context:**
- Current function at `src-tauri/src/features/transcription/orchestrator.rs:65-507`
- Command mode handles LLM generation flow (lines 138-309)
- Dictation mode handles transcription + optional post-processing (lines 311-506)
- Shared: settings, selected_model, raw_transcription, request data

**Depends on:** None
**Blocked by:** None

---

### 2. Migrate to Typed Errors in Orchestrator
**What:** Replace `Result<T, String>` with `Result<T, TranscriptionError>` in orchestrator.rs and provider functions.

**Why:** Typed errors enable better error handling, pattern matching, and debugging. The error types already exist in `src-tauri/src/error.rs`.

**Pros:**
- Better error context preservation
- Enables error categorization (network vs config vs model)
- Compiler helps catch unhandled error cases

**Cons:**
- Breaking change for Tauri IPC (need From<Error> for String)
- Requires updating multiple files in chain
- ~171 functions still use String errors

**Context:**
- Typed error system exists: `DictaError`, `RecordingError`, `TranscriptionError`, `ModelError`
- All have `impl From<Error> for String` for Tauri compatibility
- Start with orchestrator.rs, expand incrementally

**Depends on:** None
**Blocked by:** None

---

## Completed (2026-03-20)

- [x] Fix llama.rs unwrap() panics - replaced with proper error handling
- [x] Add retry logic for STT providers - exponential backoff with `utils/retry.rs`
- [x] Add SettingsCache concurrent tests - 6 new tests for Arc-swap pattern
- [x] Use Arc<Settings> references - avoids cloning in orchestrator

---

## Low Priority

### Add Provider Mock Tests
**What:** Create mock STT provider for unit testing transcription flow.

**Why:** Currently no tests for provider routing, error handling in transcription path.

**Context:** Would enable testing orchestrator without real API calls.

**Depends on:** Typed errors migration (for better test assertions)

---

### Add E2E IPC Tests
**What:** Test full Tauri IPC flow from frontend to backend.

**Why:** Would catch integration issues between React and Rust layers.

**Context:** Requires test harness setup, possibly using Tauri's test utilities.

**Depends on:** None
