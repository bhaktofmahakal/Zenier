import { create } from 'zustand'
import type { CaptureSource, RecordingStatus } from '@shared/types'

interface RecorderState {
  sources: CaptureSource[]
  selectedSource: CaptureSource | null
  sourceFilter: 'screen' | 'window'

  webcamEnabled: boolean
  webcamDeviceLabel: string

  recordingStatus: RecordingStatus
  sessionId: string | null
  sessionName: string
  elapsedSeconds: number
  isMicMuted: boolean
  isPaused: boolean
  sourceName: string
  screenStream: MediaStream | null
  webcamStream: MediaStream | null
  previewScreenStream: MediaStream | null
  previewWebcamStream: MediaStream | null
  audioLevel: number // 0 to 1

  errorMessage: string | null

  setSources: (sources: CaptureSource[]) => void
  setSelectedSource: (source: CaptureSource | null) => void
  setSourceFilter: (filter: 'screen' | 'window') => void
  setWebcamEnabled: (enabled: boolean) => void
  setWebcamDeviceLabel: (label: string) => void
  setRecordingStatus: (status: RecordingStatus) => void
  setSessionId: (id: string | null) => void
  setSessionName: (name: string) => void
  setElapsedSeconds: (secs: number) => void
  incrementElapsed: () => void
  setMicMuted: (muted: boolean) => void
  toggleMicMuted: () => void
  setPaused: (paused: boolean) => void
  togglePaused: () => void
  setSourceName: (name: string) => void
  setScreenStream: (stream: MediaStream | null) => void
  setWebcamStream: (stream: MediaStream | null) => void
  setPreviewScreenStream: (stream: MediaStream | null) => void
  setPreviewWebcamStream: (stream: MediaStream | null) => void
  setAudioLevel: (level: number) => void
  setError: (msg: string | null) => void
  
  bitrate: number
  format: 'webm' | 'mp4'
  setBitrate: (bitrate: number) => void
  setFormat: (format: 'webm' | 'mp4') => void
  
  reset: () => void
}

const initialState = {
  sources: [],
  selectedSource: null,
  sourceFilter: 'screen' as const,
  webcamEnabled: false,
  webcamDeviceLabel: '',
  recordingStatus: 'idle' as RecordingStatus,
  sessionId: null,
  sessionName: '',
  elapsedSeconds: 0,
  isMicMuted: false,
  isPaused: false,
  sourceName: '',
  errorMessage: null,
  screenStream: null,
  webcamStream: null,
  previewScreenStream: null,
  previewWebcamStream: null,
  audioLevel: 0,
  bitrate: 2500000,
  format: 'webm' as const
}

export const useRecorderStore = create<RecorderState>((set, get) => ({
  ...initialState,

  setSources: (sources) => set({ sources }),
  setSelectedSource: (source) =>
    set({ selectedSource: source, errorMessage: null }),
  setSourceFilter: (filter) => set({ sourceFilter: filter }),
  setWebcamEnabled: (enabled) => set({ webcamEnabled: enabled }),
  setWebcamDeviceLabel: (label) => set({ webcamDeviceLabel: label }),
  setRecordingStatus: (status) => set({ recordingStatus: status }),
  setSessionId: (id) => set({ sessionId: id }),
  setSessionName: (name) => set({ sessionName: name }),
  setElapsedSeconds: (secs) => set({ elapsedSeconds: secs }),
  incrementElapsed: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),
  setMicMuted: (muted) => set({ isMicMuted: muted }),
  toggleMicMuted: () => set((s) => ({ isMicMuted: !s.isMicMuted })),
  setPaused: (paused) => set({ isPaused: paused }),
  togglePaused: () => set((s) => ({ isPaused: !s.isPaused })),
  setSourceName: (name) => set({ sourceName: name }),
  setScreenStream: (stream) => set({ screenStream: stream }),
  setWebcamStream: (stream) => set({ webcamStream: stream }),
  setPreviewScreenStream: (stream) => set({ previewScreenStream: stream }),
  setPreviewWebcamStream: (stream) => set({ previewWebcamStream: stream }),
  setAudioLevel: (level: number) => set({ audioLevel: level }),
  setError: (msg) => set({ errorMessage: msg }),
  setBitrate: (bitrate) => set({ bitrate }),
  setFormat: (format) => set({ format }),
  reset: () => {
    const state = get()
    // Stop only the recording streams, NOT the preview streams
    state.screenStream?.getTracks().forEach((t) => t.stop())
    state.webcamStream?.getTracks().forEach((t) => t.stop())
    // Preserve preview streams so user can immediately start another recording
    const { previewScreenStream, previewWebcamStream, selectedSource, webcamEnabled, sourceFilter } = state
    set({
      ...initialState,
      previewScreenStream,
      previewWebcamStream,
      selectedSource,
      webcamEnabled,
      sourceFilter
    })
  }
}))
