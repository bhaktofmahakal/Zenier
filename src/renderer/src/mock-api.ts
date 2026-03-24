import { CaptureSource, SessionMeta, Result } from '@shared/types'

// High-fidelity mocks to make the Vercel preview feel alive
export const mockSources: CaptureSource[] = [
  { id: 'screen:0', name: 'Entire Screen', thumbnailDataUrl: '', displayId: '0' },
  { id: 'window:1', name: 'Visual Studio Code', thumbnailDataUrl: '', displayId: '' },
  { id: 'window:2', name: 'Google Chrome', thumbnailDataUrl: '', displayId: '' },
  { id: 'window:3', name: 'Spotify', thumbnailDataUrl: '', displayId: '' }
]

export const mockSessions: SessionMeta[] = [
  {
    id: 'demo-1',
    name: 'Product Walkthrough',
    createdAt: new Date().toISOString(),
    duration: 125,
    sourceName: 'Entire Screen',
    hasWebcam: true,
    hasAudio: true,
    status: 'complete',
    savePath: '',
    screenFile: '',
    format: 'mp4'
  },
  {
    id: 'demo-2',
    name: 'Bug Report: UI Glitch',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    duration: 45,
    sourceName: 'VS Code',
    hasWebcam: false,
    hasAudio: true,
    status: 'complete',
    savePath: '',
    screenFile: '',
    format: 'webm'
  }
]

const wrap = <T>(data: T): Result<T> => ({ success: true, data })

export const setupMockApi = () => {
  if (typeof window !== 'undefined' && !window.api) {
    console.warn('[Zenier] Electron API missing. Initializing Mock Layer for Browser Preview.')
    
    // @ts-ignore
    window.api = {
      listSources: async () => wrap(mockSources),
      createSession: async () => wrap({ sessionId: 'mock-session', savePath: '' }),
      appendChunk: async () => wrap(undefined),
      finalizeSession: async (args: { sessionId: string }) => wrap({ ...mockSessions[0], id: args.sessionId }),
      abortSession: async () => wrap(undefined),
      listSessions: async () => wrap(mockSessions),
      deleteSession: async () => wrap(undefined),
      renameSession: async (args: { sessionId: string; newName: string }) => 
        wrap({ ...mockSessions[0], id: args.sessionId, name: args.newName }),
      openFolder: async () => { 
        alert('Desktop App Required to open folders'); 
        return wrap(undefined) 
      },
      
      onShutdownRequested: () => () => {},
      onSessionProcessed: () => () => {}
    }
    
    // @ts-ignore
    window.isBrowserDemo = true
  }
}
