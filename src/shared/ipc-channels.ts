// ──────────────────────────────────────────────
// Typed IPC channel constants
// Import in main handlers and preload bridge
// ──────────────────────────────────────────────

/** Renderer → Main invoke channels */
export const IPC = {
  CAPTURE_LIST_SOURCES: 'capture:listSources',
  SESSION_CREATE: 'session:create',
  SESSION_APPEND_CHUNK: 'session:appendChunk',
  SESSION_FINALIZE: 'session:finalize',
  SESSION_ABORT: 'session:abort',
  SESSION_LIST: 'session:list',
  SESSION_RENAME: 'session:rename',
  SESSION_OPEN_FOLDER: 'session:openFolder',
  SESSION_DELETE: 'session:delete'
} as const

/** Main → Renderer event channels */
export const IPC_EVENTS = {
  SHUTDOWN_REQUESTED: 'app:shutdown-requested',
  SESSION_PROCESSED: 'session:processed'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
export type IpcEvent = (typeof IPC_EVENTS)[keyof typeof IPC_EVENTS]
