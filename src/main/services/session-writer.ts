import { createWriteStream, existsSync, readdirSync, statSync, readFileSync, writeFileSync, rmSync } from 'fs'
import { mkdir } from 'fs/promises'
import { EventEmitter } from 'events'
import { join } from 'path'
import { WriteStream } from 'fs'
import type { SessionMeta } from '../../shared/types'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export type ChunkTarget = 'screen' | 'webcam'

interface ActiveSession {
  sessionId: string
  sessionName: string
  sourceName: string
  savePath: string
  screenStream: WriteStream
  webcamStream?: WriteStream
  isFinalizing: boolean
  format: 'webm' | 'mp4'
  error?: Error
}

export class SessionWriterService extends EventEmitter {
  private activeSessions = new Map<string, ActiveSession>()
  private userDataPath: string

  constructor(userDataPath: string) {
    super()
    this.userDataPath = userDataPath
    // Defer to createSession to prevent sync I/O blocking
  }

  private setupStream(stream: WriteStream, session: ActiveSession, name: string) {
    // Prevent MaxListenersExceededWarning during rapid chunk flushes
    stream.setMaxListeners(100)
    
    stream.on('error', (err) => {
      console.error(`[Writer] Stream error (${name}):`, err)
      session.error = err
    })
  }

  // Initialize recording session and streams
  async createSession(args: {
    sessionId: string
    sessionName: string
    sourceName: string
    webcamEnabled: boolean
    format?: 'webm' | 'mp4'
  }): Promise<{ sessionId: string; savePath: string }> {
    const sessionDir = join(this.userDataPath, 'videos', args.sessionId)
    await mkdir(sessionDir, { recursive: true })

    const screenPath = join(sessionDir, 'screen.webm')
    const screenStream = createWriteStream(screenPath)

    const session: ActiveSession = {
      sessionId: args.sessionId,
      sessionName: args.sessionName,
      sourceName: args.sourceName,
      savePath: sessionDir,
      screenStream,
      isFinalizing: false,
      format: args.format || 'webm'
    }

    this.setupStream(screenStream, session, 'screen')

    if (args.webcamEnabled) {
      const webcamPath = join(sessionDir, 'webcam.webm')
      const webcamStream = createWriteStream(webcamPath)
      session.webcamStream = webcamStream
      this.setupStream(webcamStream, session, 'webcam')
    }

    this.activeSessions.set(args.sessionId, session)
    return { sessionId: args.sessionId, savePath: sessionDir }
  }

  // Stream raw bytes to disk
  async appendChunk(sessionId: string, target: ChunkTarget, chunk: Buffer): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    if (session.error) throw session.error

    const stream = target === 'screen' ? session.screenStream : session.webcamStream
    if (!stream) throw new Error(`Stream for ${target} not initialized`)
    if (stream.destroyed || stream.closed) throw new Error(`Stream ${target} is already closed`)

    return new Promise<void>((resolve, reject) => {
      stream.write(chunk, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  // Seal session and trigger FFmpeg merge
  async finalizeSession(sessionId: string, duration: number): Promise<SessionMeta> {
    const session = this.activeSessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)

    session.isFinalizing = true

    const closeStream = async (stream: WriteStream): Promise<void> => {
      return new Promise((resolve) => {
        if (stream.destroyed || stream.closed) {
          resolve()
          return
        }

        const timer = setTimeout(() => {
          console.warn('[Writer] Stream finalization timed out, forcing destroy')
          stream.destroy()
          resolve()
        }, 5000)

        stream.end(() => {
          clearTimeout(timer)
          resolve()
        })
      })
    }

    await closeStream(session.screenStream)
    if (session.webcamStream) {
      await closeStream(session.webcamStream)
    }

    const meta: SessionMeta = {
      id: sessionId,
      name: session.sessionName || `Recording (${sessionId.substring(0, 8)})`,
      createdAt: new Date().toISOString(),
      duration: duration,
      sourceName: session.sourceName || 'Screen',
      hasWebcam: !!session.webcamStream,
      hasAudio: true,
      status: 'complete',
      savePath: session.savePath,
      screenFile: 'screen.webm',
      webcamFile: session.webcamStream ? 'webcam.webm' : undefined,
      format: session.format,
      bitrate: 2500000 // TODO: Pipe from UI state
    }

    const metaPath = join(session.savePath, 'session.json')
    writeFileSync(metaPath, JSON.stringify(meta, null, 2))

    // Handle background merging if needed
    if (session.format === 'mp4') {
      // 1000ms delay to ensure OS has fully flushed and released the webm files
      await new Promise(r => setTimeout(r, 1000))
      await this.processMp4(session)
    }

    this.activeSessions.delete(sessionId)
    return meta
  }

  private processMp4(session: ActiveSession): Promise<void> {
    const screenPath = join(session.savePath, 'screen.webm')
    const webcamPath = join(session.savePath, 'webcam.webm')
    const outputPath = join(session.savePath, 'final.mp4')

    if (existsSync(screenPath)) {
      console.log(`[FFmpeg] Screen file size: ${statSync(screenPath).size} bytes`)
    }
    if (session.webcamStream && existsSync(webcamPath)) {
      const webcamSize = statSync(webcamPath).size
      console.log(`[FFmpeg] Webcam file size: ${webcamSize} bytes`)
      // Threshold avoids FFmpeg crashes on broken pipeline dumps
      if (webcamSize < 1000) {
        console.warn('[FFmpeg] Webcam file is too small, fallback to screen-only merge.')
        delete session.webcamStream
      }
    }

    // Final check for screen file
    if (!existsSync(screenPath) || statSync(screenPath).size < 1000) {
      console.error('[FFmpeg] Screen file missing or empty, aborting merge.')
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const cmd: any = ffmpeg(screenPath)
      .inputOptions(['-fflags +genpts'])

    if (session.webcamStream && existsSync(webcamPath)) {
      cmd.input(webcamPath)
        .inputOptions(['-fflags +genpts'])
        .complexFilter([
          '[1:v]scale=320:-2[pip]', // -2 dynamically preserves aspect ratio while enforcing H.264 even heights
          '[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2[main]',
          '[main][pip]overlay=W-w-20:H-h-20[video_out]'
        ])
        .outputOptions([
          '-map [video_out]',
          '-map 0:a?'
        ])
    } else {
      cmd.videoFilters('scale=trunc(iw/2)*2:trunc(ih/2)*2')
        .outputOptions([
          '-map 0:v',
          '-map 0:a?'
        ])
    }

    cmd
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 22',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart',
        '-pix_fmt yuv420p'
      ])
      .on('start', (commandLine: string) => {
        console.log('[FFmpeg] Spawned:', commandLine)
      })
      .on('error', (err: any, _stdout: string, stderr: string) => {
        console.error('[FFmpeg] Error:', err?.message || err)
        console.error('[FFmpeg] Stderr:', stderr)
        reject(err)
      })
      .on('end', () => {
        console.log('[FFmpeg] Completed:', outputPath)
        const metaPath = join(session.savePath, 'session.json')
        if (existsSync(metaPath)) {
          const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as SessionMeta
          meta.screenFile = 'final.mp4'
          writeFileSync(metaPath, JSON.stringify(meta, null, 2))
          this.emit('processed', meta)
        }
        resolve()
      })

      cmd.save(outputPath)
    })
  }

  // Halt recording and purge buffers
  async abortSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    // Gracefully flush remaining internal V8 buffers instead of violently destroying the socket
    const closeAndUnlink = (stream: WriteStream, pathStr: string) => {
      if (stream.destroyed || stream.closed) {
        if (existsSync(pathStr)) rmSync(pathStr, { force: true })
        return
      }
      stream.end(() => {
        if (existsSync(pathStr)) rmSync(pathStr, { force: true })
      })
    }

    closeAndUnlink(session.screenStream, join(session.savePath, 'screen.webm'))
    if (session.webcamStream) {
      closeAndUnlink(session.webcamStream, join(session.savePath, 'webcam.webm'))
    }

    this.activeSessions.delete(sessionId)
  }

  // Rehydrate history from disk
  async listSessions(): Promise<SessionMeta[]> {
    const sessionsDir = join(this.userDataPath, 'videos')
    if (!existsSync(sessionsDir)) return []

    return readdirSync(sessionsDir)
      .map(dir => {
        const dirPath = join(sessionsDir, dir)
        try {
          const stats = statSync(dirPath)
          if (!stats.isDirectory()) return null

          const metaPath = join(dirPath, 'session.json')
          let diskMeta: Partial<SessionMeta> = {}

          if (existsSync(metaPath)) {
            try {
              diskMeta = JSON.parse(readFileSync(metaPath, 'utf8')) as SessionMeta
            } catch (jsonErr) {
              console.error(`[Writer] Failed to parse session.json for ${dir}:`, jsonErr)
            }
          }

          const hasWebcam = existsSync(join(dirPath, 'webcam.webm'))
          const hasThumbnail = existsSync(join(dirPath, 'thumbnail.jpg'))

          return {
            id: diskMeta.id || dir,
            name: diskMeta.name || `Recording (${dir.substring(0, 8)})`,
            createdAt: diskMeta.createdAt || stats.birthtime.toISOString(),
            duration: diskMeta.duration || 0,
            filePath: dirPath,
            savePath: dirPath,
            screenFile: diskMeta.screenFile || 'screen.webm',
            webcamFile: hasWebcam ? 'webcam.webm' : undefined,
            thumbnailFile: hasThumbnail ? 'thumbnail.jpg' : diskMeta.thumbnailFile,
            sourceName: diskMeta.sourceName || 'Screen',
            hasWebcam: diskMeta.hasWebcam ?? hasWebcam,
            hasAudio: diskMeta.hasAudio ?? false,
            status: diskMeta.status || 'complete'
          } as SessionMeta
        } catch (err) {
          console.error(`[Writer] Failed to read session ${dir}:`, err)
          return null
        }
      })
      .filter((s): s is SessionMeta => s !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // sort newest first
  }

  // Patch metadata file
  async renameSession(sessionId: string, newName: string): Promise<SessionMeta> {
    console.log(`[Service] Renaming session ${sessionId} to "${newName}"`)
    const sessionDir = this.getSessionPath(sessionId)
    const metaPath = join(sessionDir, 'session.json')

    if (!existsSync(metaPath)) {
      console.error(`[Service] Meta not found at ${metaPath}`)
      throw new Error(`Session ${sessionId} metadata not found`)
    }

    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as SessionMeta
      meta.name = newName
      writeFileSync(metaPath, JSON.stringify(meta, null, 2))
      console.log(`[Service] Successfully updated ${metaPath}`)
      return meta
    } catch (err) {
      console.error(`[Service] disk IO error during rename:`, err)
      throw err
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessionDir = this.getSessionPath(sessionId)
    if (existsSync(sessionDir)) {
      rmSync(sessionDir, { recursive: true, force: true })
    }
  }

  getSessionPath(sessionId: string): string {
    return join(this.userDataPath, 'videos', sessionId)
  }
}
