// ──────────────────────────────────────────────
// Shared type contracts for IPC communication
// Used by main, preload, and renderer processes
// ──────────────────────────────────────────────

/** Generic Result wrapper for all IPC returns */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/** A screen or window source from desktopCapturer */
export interface CaptureSource {
  id: string
  name: string
  thumbnailDataUrl: string
  displayId: string
  appIconDataUrl?: string
}

/** Recording lifecycle state */
export type RecordingStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'complete'
  | 'error'

/** Options passed when starting a recording */
export interface RecordingOptions {
  sourceId: string
  webcamEnabled: boolean
  sessionName: string
}

/** Persisted session metadata (stored in session.json) */
export interface SessionMeta {
  id: string
  name: string
  createdAt: string
  completedAt?: string
  duration: number
  sourceName: string
  hasWebcam: boolean
  hasAudio: boolean
  status: 'recording' | 'complete' | 'aborted'
  savePath: string
  screenFile: string
  webcamFile?: string
  thumbnailFile?: string
  format?: 'webm' | 'mp4'
  bitrate?: number
}

/** Lightweight session item for the library list */
export interface SessionHistoryItem {
  id: string
  name: string
  createdAt: string
  duration: number
  thumbnailDataUrl?: string
}

/** Target stream for chunk writes */
export type ChunkTarget = 'screen' | 'webcam'
