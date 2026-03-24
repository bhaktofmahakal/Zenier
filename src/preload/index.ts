import { contextBridge, ipcRenderer } from 'electron'
import { IPC, IPC_EVENTS } from '../shared/ipc-channels'
import type { Result, CaptureSource, SessionMeta, ChunkTarget } from '../shared/types'

// Context bridge API for secure main <-> renderer communication
const api = {

  listSources: (): Promise<Result<CaptureSource[]>> =>
    ipcRenderer.invoke(IPC.CAPTURE_LIST_SOURCES),


  createSession: (args: {
    sessionName: string
    sourceName: string
    webcamEnabled: boolean
    format?: 'webm' | 'mp4'
  }): Promise<Result<{ sessionId: string; savePath: string }>> =>
    ipcRenderer.invoke(IPC.SESSION_CREATE, args),

  appendChunk: (args: {
    sessionId: string
    target: ChunkTarget
    chunk: Uint8Array
  }): Promise<Result<void>> =>
    ipcRenderer.invoke(IPC.SESSION_APPEND_CHUNK, args),

  finalizeSession: (args: {
    sessionId: string
    duration: number
  }): Promise<Result<SessionMeta>> =>
    ipcRenderer.invoke(IPC.SESSION_FINALIZE, args),

  abortSession: (args: { sessionId: string }): Promise<Result<void>> =>
    ipcRenderer.invoke(IPC.SESSION_ABORT, args),

  listSessions: (): Promise<Result<SessionMeta[]>> =>
    ipcRenderer.invoke(IPC.SESSION_LIST),

  renameSession: (args: {
    sessionId: string
    newName: string
  }): Promise<Result<SessionMeta>> =>
    ipcRenderer.invoke(IPC.SESSION_RENAME, args),

  openFolder: (args: { sessionId: string }): Promise<Result<void>> =>
    ipcRenderer.invoke(IPC.SESSION_OPEN_FOLDER, args),

  deleteSession: (args: { sessionId: string }): Promise<Result<void>> =>
    ipcRenderer.invoke(IPC.SESSION_DELETE, args),


  onShutdownRequested: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on(IPC_EVENTS.SHUTDOWN_REQUESTED, handler)
    return () => ipcRenderer.removeListener(IPC_EVENTS.SHUTDOWN_REQUESTED, handler)
  },
  onSessionProcessed: (callback: (meta: SessionMeta) => void): (() => void) => {
    const handler = (_: any, meta: SessionMeta): void => callback(meta)
    ipcRenderer.on(IPC_EVENTS.SESSION_PROCESSED, handler)
    return () => ipcRenderer.removeListener(IPC_EVENTS.SESSION_PROCESSED, handler)
  }
}

console.log('[Preload] API exposed to window.api')
contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
