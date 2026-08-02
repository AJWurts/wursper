<div align="center">
  <img src="public/icon.png" alt="Wursper" width="100" height="100">

# Wursper

Local voice-to-text for macOS. Press a shortcut, speak, and your words appear as text.

[![macOS](https://img.shields.io/badge/platform-macOS-lightgrey.svg)](https://www.apple.com/macos)
[![License](https://img.shields.io/github/license/AJWurts/wursper)](LICENSE)

</div>

---

## What is Wursper?

Wursper is a minimal, fully local dictation app — a stripped-down fork of
[Dicta](https://github.com/nitintf/dicta) (MIT). It sits in your menu bar; a global
shortcut opens a floating recording window, speech is transcribed on-device with
Whisper, the text is copied to your clipboard (or pasted directly), and every
transcription is saved to a local SQLite database you can browse in the history view.

- **Record** — hold or toggle a global shortcut, speak, done
- **Transcribe locally** — whisper.cpp with Metal GPU; no cloud, no API keys, audio never leaves your Mac
- **Store** — history persisted to SQLite (`wursper.db` in the app data folder)
- **Review** — searchable, filterable transcription history

## Installation

### Build from source

```bash
git clone https://github.com/AJWurts/wursper.git
cd wursper
pnpm install
pnpm tauri build
```

The app bundle will be in `src-tauri/target/release/bundle/macos/`. Launch it and
grant microphone and accessibility access when prompted. On first use, download a
Whisper model from the Models page.

## Usage

1. Press `Option + Space` (configurable) to open the voice input window
2. Speak your text
3. Release the shortcut or press it again to stop
4. Text is transcribed locally and copied to your clipboard (or pasted directly)
5. Open the main window to review past transcriptions

## Development

### Requirements

- Node.js 20.19+ or 22.12+
- pnpm 8+
- Rust 1.75+
- Xcode Command Line Tools

### Commands

```bash
pnpm install         # Install dependencies
pnpm tauri dev       # Development mode with hot reload
pnpm tauri build     # Production build
pnpm typecheck       # TypeScript check
pnpm lint            # ESLint
cd src-tauri && cargo test   # Rust tests (also regenerates ts-rs bindings)
```

## Tech Stack

**Frontend:** React 19, TypeScript, Tailwind CSS 4, Radix UI, Zustand

**Backend:** Tauri 2.5, Rust, rusqlite, whisper-rs (whisper.cpp) + Candle with Metal

## License

MIT — see [LICENSE](LICENSE). Forked from [nitintf/dicta](https://github.com/nitintf/dicta).
