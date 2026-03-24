import { ipcMain, shell, app, BrowserWindow } from 'electron'
import { IPC, IPC_EVENTS } from '../../shared/ipc-channels'
import { SessionWriterService } from '../services/session-writer'
import type { Result, SessionMeta, ChunkTarget } from '../../shared/types'
import { randomUUID } from 'crypto'

let writerService: SessionWriterService

export function registerSessionHandlers(mainWindow: BrowserWindow): void {
  // Boot instance bound to OS userData
  writerService = new SessionWriterService(app.getPath('userData'))

  // Emit processing completion events to the renderer for UI updates
  writerService.on('processed', (meta: SessionMeta) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_EVENTS.SESSION_PROCESSED, meta)
    }
  })

  // Initialize session directory and hardware write streams
  ipcMain.handle(
    IPC.SESSION_CREATE,
    async (
      _,
      args: { sessionName: string; sourceName: string; webcamEnabled: boolean; format?: 'webm' | 'mp4' }
    ): Promise<Result<{ sessionId: string; savePath: string }>> => {
      try {
        const sessionId = randomUUID()
        const result = await writerService.createSession({
          sessionId,
          sessionName: args.sessionName,
          sourceName: args.sourceName,
          webcamEnabled: args.webcamEnabled,
          format: args.format
        })
        return { success: true, data: result }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    }
  )

  // Append raw media buffer slices (WebM/Opus) from the renderer
  ipcMain.handle(
    IPC.SESSION_APPEND_CHUNK,
    async (
      _,
      args: { sessionId: string; target: ChunkTarget; chunk: Uint8Array }
    ): Promise<Result<void>> => {
      try {
        await writerService.appendChunk(args.sessionId, args.target, Buffer.from(args.chunk))
        return { success: true, data: undefined }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    }
  )

  // Close write streams and trigger FFmpeg post-processing (webm -> mp4)
  ipcMain.handle(
    IPC.SESSION_FINALIZE,
    async (
      _,
      args: { sessionId: string; duration: number }
    ): Promise<Result<SessionMeta>> => {
      try {
        const meta = await writerService.finalizeSession(args.sessionId, args.duration)
        return { success: true, data: meta }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    }
  )

  // Immediately stop writes and cleanup partial recording fragments
  ipcMain.handle(
    IPC.SESSION_ABORT,
    async (_, args: { sessionId: string }): Promise<Result<void>> => {
      try {
        await writerService.abortSession(args.sessionId)
        return { success: true, data: undefined }
      } catch (err) {
        console.error('[IPC] Session abort failed:', err)
        return { success: true, data: undefined }
      }
    }
  )

  // Trigger OS-native file explorer
  ipcMain.handle(
    IPC.SESSION_OPEN_FOLDER,
    async (_, args: { sessionId: string }): Promise<Result<void>> => {
      try {
        const sessionPath = writerService.getSessionPath(args.sessionId)
        const result = await shell.openPath(sessionPath)
        if (result) return { success: false, error: result }
        return { success: true, data: undefined }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    }
  )

  // Retrieve index of all persisted sessions from the metadata store
  ipcMain.handle(IPC.SESSION_LIST, async (): Promise<Result<SessionMeta[]>> => {
    try {
      const sessions = await writerService.listSessions()
      return { success: true, data: sessions }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle(
    IPC.SESSION_RENAME,
    async (
      _,
      args: { sessionId: string; newName: string }
    ): Promise<Result<SessionMeta>> => {
      try {
        const meta = await writerService.renameSession(args.sessionId, args.newName)
        return { success: true, data: meta }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    }
  )

  ipcMain.handle(
    IPC.SESSION_DELETE,
    async (_, args: { sessionId: string }): Promise<Result<void>> => {
      try {
        await writerService.deleteSession(args.sessionId)
        return { success: true, data: undefined }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    }
  )
}
