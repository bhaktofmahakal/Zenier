# Zenier Recorder

A studio-grade Screen & Webcam Recorder built with Electron, React, TypeScript, and the Obsidian Lens design system.

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start in development mode
pnpm dev

# Build for production
pnpm build
```

## Architecture

```
src/
├── main/                # Electron main process (Node.js)
│   ├── index.ts         # BrowserWindow, CSP, lifecycle
│   ├── ipc/             # IPC handlers (capture, session)
│   └── services/        # SessionWriterService (fs, UUID dirs)
├── preload/             # Secure bridge (contextBridge)
│   ├── index.ts         # Typed API wrappers
│   └── index.d.ts       # window.api declarations
├── renderer/            # React application (no Node access)
│   └── src/
│       ├── components/  # UI components (layout, home, recording, complete)
│       ├── hooks/       # useMediaCapture, useRecorder
│       ├── pages/       # HomePage, RecordingPage, CompletePage
│       ├── stores/      # Zustand (recorder, library, ui)
│       └── assets/      # CSS (Tailwind + Obsidian tokens)
└── shared/              # Types & IPC channel constants
    ├── types.ts         # Result<T>, CaptureSource, SessionMeta, etc.
    └── ipc-channels.ts  # Typed channel string constants
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Chunk streaming** | `MediaRecorder.start(1000)` + IPC `appendChunk` avoids unbounded renderer memory |
| **Dual MediaRecorder** | Screen + webcam recorded independently as per spec |
| **UUID folders** | Each session gets `videos/<uuid>/` with `session.json` metadata |
| **Zustand separation** | `recorderStore` (ephemeral recording state) vs `libraryStore` (persisted sessions) vs `uiStore` (page navigation, toasts) |
| **No raw Node in renderer** | All fs/shell operations go through typed IPC handlers via `contextBridge` |
| **CSP headers** | Strict CSP set via `onHeadersReceived` — only `'self'`, fonts, and media URLs |

### Storage Structure

```
%USERPROFILE%\Videos\Zenier\videos\
├── <uuid>/
│   ├── screen.webm
│   ├── webcam.webm     (if webcam enabled)
│   └── session.json    (metadata: name, duration, timestamps, source)
```

### Recording Flow

1. User selects a screen/window source from `desktopCapturer` thumbnails
2. Live preview starts via `getUserMedia` with `chromeMediaSourceId`
3. User clicks **Start Session** → `session:create` IPC creates UUID dir + write streams
4. `MediaRecorder` sends 1-second chunks → `session:appendChunk` IPC → `fs.createWriteStream`
5. User clicks **Stop** → `MediaRecorder.stop()` → `session:finalize` writes `session.json`
6. Complete screen shows with **Open Folder** (via `shell.openPath`) and **Rename**

### Post-Processing & Quality
- **Auto-Merge**: Seamlessly creates a `final.mp4` using the integrated FFmpeg engine (`@ffmpeg-installer/ffmpeg`). No local FFmpeg install is required.
- **Audio Logic**: Intelligent mapping ensures microphone audio is bridged into the final MP4.
- **Visual Feedback**: Real-time **Audio Level Meter** and distinct **Mute State** indicators provide immediate proof of capture.

## Implementation Status

- **Assignment Tasks**: 100% Complete. Meets all mandatory and bonus requirements (UUID folders, independent capture, PiP, renaming, merged MP4).
- **Audio Verification**: Hardened pipeline with `AnalyserNode` for visual volume feedback and `MediaRecorder` track management.
- **Stability**: Tested for sequential recording sessions and large file (5min+) handling.

## Tech Stack

- **Electron 33** & **electron-vite**
- **React 18** & **TypeScript 5**
- **Tailwind CSS 3** (Obsidian Lens design system)
- **FFmpeg** (via `@ffmpeg-installer/ffmpeg` for portable post-processing)
- **Zustand** (triple-store architecture: Recorder, Library, UI)
