# Screen & Webcam Recorder Plan

## Summary
Build a new Windows-first Electron app in `u:\Zenier` using `electron-vite`, React, TypeScript, Tailwind CSS, Zustand, and typed IPC. The first implementation phase will ship the full core recorder flow plus local session history/library, using the Obsidian React/Tailwind references and `app-design/` as the visual source of truth. Bonus features like FFmpeg export, save-location settings, and real settings screens stay out of v1, but the architecture will leave clean extension points for them.

## Implementation Changes
### Phase 1: Foundation and secure app shell
- Scaffold the app at workspace root with `src/main`, `src/preload`, `src/renderer`, `src/shared`, `tests`, and keep `app-design/` as reference-only assets.
- Use `BrowserWindow` with `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, plus a strict local CSP.
- Use `pnpm` as the package manager, `electron-vite` for dev/build, and Electron Forge for packaging.
- Create shared contracts for `Result<T>`, `CaptureSource`, `RecordingStatus`, `RecordingOptions`, `SessionMeta`, and `SessionHistoryItem`.
- Use typed `ipcRenderer.invoke` wrappers only; no raw Electron or Node exposure in the renderer.
- Build the Obsidian token layer first: colors, spacing, radii, motion timings, local fonts, and icon system so the three screens stay visually consistent.

### Phase 2: Capture selection and preview
- Implement a `CaptureCatalogService` in the main process that uses `desktopCapturer.getSources()` to return screen/window sources with thumbnails and metadata.
- Render the home/library screen with the full shell from the reference: sidebar, top nav, source tabs, selected-source card state, settings panel, and recent sessions section.
- Use the selected `desktopCapturer` source ID in the renderer to start a live preview stream with `getUserMedia` desktop constraints; replace and clean up the preview stream whenever the selection changes.
- Implement webcam toggle and live webcam preview independently from the screen preview.
- Make `All Recordings` active in v1; keep the other nav items present but inactive.
- Keep `Schedule`, `Upload to Workspace`, and the recording-screen settings gear visible but disabled with honest “coming soon” affordances.

### Phase 3: Recording pipeline and storage
- Keep capture/recording logic in the renderer because `MediaRecorder`, `getUserMedia`, and Web Audio live there; keep filesystem and shell work in the main process.
- Use two independent `MediaRecorder` instances: one for `screen.webm`, one for `webcam.webm` when webcam is enabled.
- Route audio so `screen.webm` contains screen video plus mixed system audio and microphone audio when available; `webcam.webm` stays webcam-video-only.
- Use a small `MediaRecorder.start(timeslice)` interval and send chunks incrementally to the main process, where a `SessionWriterService` appends them to open write streams to avoid unbounded renderer memory growth.
- Default storage root to `%USERPROFILE%\Videos\Obsidian Recorder\videos\`; each session gets `videos/<uuid>/`.
- Persist required files plus metadata needed for history:
```text
videos/<uuid>/
  screen.webm
  webcam.webm        # optional
  session.json
  thumbnail.webp
```
- `session.json` stores display name, UUID, timestamps, duration, source label, output paths, webcam/audio flags, and status.
- “Rename session” updates metadata only; the folder remains UUID-based.
- Handle stop, pause/resume, mute mic, interrupted tracks, and app-close shutdown by finalizing or aborting writers cleanly and stopping all tracks.

### Phase 4: UI state, screen transitions, and history
- Use separate Zustand stores: `useRecorderStore` for capture/recording lifecycle, `useLibraryStore` for persisted sessions, and `useUiStore` for page state, toasts, and disabled-action messaging.
- Implement the three main app surfaces exactly from the references:
  - Home/library with source selection, preview, webcam toggle, session name, and recent sessions.
  - Recording-in-progress canvas with timer, recording status, webcam overlay, pause, mute, and stop.
  - Recording-complete card with summary, open-folder action, new-recording action, and renamed session display.
- Keep transitions lightweight at 200–300ms and use the glass/tonal layering rules from the design spec.
- Store a session thumbnail at record start so recent-session cards are real local history, not placeholders.
- Make “Change” during recording resolve to a confirmation flow that stops the current recording and returns to source selection instead of attempting live source switching.

### IPC / public interfaces
- Implement invoke channels for `capture:listSources`, `session:create`, `session:appendChunk`, `session:finalize`, `session:abort`, `session:list`, `session:rename`, and `session:openFolder`.
- `session:create` returns session ID, writable targets, and resolved save path.
- `session:appendChunk` accepts `{ sessionId, target, chunk }` where `target` is `screen` or `webcam`.
- `session:finalize` returns the completed `SessionMeta` used by the success screen and history list.
- Use one main-to-renderer event, `app:shutdown-requested`, so the renderer can flush active recorders before the window closes.

## Test Plan
- App launches with secure Electron flags and renders the Obsidian home screen with local assets and no remote font dependency.
- Source list loads, switching between tabs works, selecting a source updates the live preview, and preview cleanup stops old tracks.
- Starting without a selected source is blocked with a visible inline error.
- Webcam permission denial shows a recoverable error and still allows screen-only recording.
- Recording produces a UUID session folder with `screen.webm`, optional `webcam.webm`, metadata, and thumbnail.
- Long recordings do not keep growing in-memory chunk arrays because chunks are streamed to the main-process writer.
- Pause/resume, mic mute, stop, and unexpected track end all leave the app in a consistent state.
- Rename updates the library card and complete screen without renaming the UUID folder.
- Open Folder uses `shell.openPath` on the session directory and reports failures gracefully.
- Playwright Electron tests run against a temp storage directory and stub/fake media sources where real capture is not practical.

## Assumptions and defaults
- UI source of truth is the Obsidian React/Tailwind reference set plus `/app-design`.
- v1 includes the core recorder flow and local session history/library; FFmpeg merge, real settings screens, format switching, and custom save locations are deferred.
- Windows is the only first-class verified platform in this phase; the code stays cross-platform-ready but macOS/Linux-specific permission handling is not a v1 acceptance target.
- `screen.webm` carries mixed mic + system audio when available; if the selected source exposes no system-audio track, recording falls back to mic-only with user feedback.
- The workspace root becomes the app codebase; `app-design/` remains untouched as design/reference material.
- `Schedule`, `Upload to Workspace`, secondary sidebar items, and the in-recording settings button are rendered but disabled rather than faked.
