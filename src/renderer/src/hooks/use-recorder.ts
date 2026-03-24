import { useCallback, useEffect } from 'react'
import { useRecorderStore } from '../stores/recorder-store'
import { useUiStore } from '../stores/ui-store'
import { useLibraryStore } from '../stores/library-store'

const CHUNK_INTERVAL_MS = 1000

// Hoisted singleton state avoids stale closures and React HMR ghosting
let screenRecorder: MediaRecorder | null = null
let webcamRecorder: MediaRecorder | null = null
let timerId: ReturnType<typeof setInterval> | null = null
let activeSessionId: string | null = null
let elapsedSecondsCounter = 0
let activeMicTrack: MediaStreamTrack | null = null

let pendingTasks = 0
let ipcQueue = Promise.resolve()

export function useRecorder() {
  const {
    selectedSource,
    webcamEnabled,
    sessionName,
    recordingStatus,
    isMicMuted,
    isPaused,
    bitrate,
    format,
    setRecordingStatus,
    setSessionId,
    setElapsedSeconds,
    incrementElapsed,
    setError,
    reset
  } = useRecorderStore()

  const { setPage, setCompletedSession, addToast } = useUiStore()
  const { loadSessions } = useLibraryStore()

  const stopTimer = useCallback(() => {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  }, [])

  const queueIpcTask = useCallback((task: () => Promise<any>) => {
    pendingTasks++
    ipcQueue = ipcQueue
      .then(async () => {
        try {
          const res = await task()
          
          // Bubble fatal IPC drops to UI state immediately
          if (res && res.success === false) {
            throw new Error(res.error || 'Unknown IPC stream failure')
          }
        } catch (err) {
          console.error('[Recorder] IPC Error:', err)
          
          useRecorderStore.getState().setRecordingStatus('error')
          useRecorderStore.getState().setError((err as Error).message)
          
          if (timerId) {
            clearInterval(timerId)
            timerId = null
          }

          // Reset promise chain to prevent cascaded deadlocks
          ipcQueue = Promise.resolve()
        } finally {
          pendingTasks--
        }
      })
    return ipcQueue
  }, [])

  const startRecording = useCallback(async () => {
    if (!window.api || !selectedSource) return
    
    try {
      setRecordingStatus('recording')
      setError(null)
      pendingTasks = 0
      ipcQueue = Promise.resolve()

      const res = await window.api.createSession({
        sessionName: sessionName || `Session ${new Date().toLocaleTimeString()}`,
        sourceName: selectedSource.name,
        webcamEnabled,
        format
      })

      if (!res.success) throw new Error(res.error)

      activeSessionId = res.data.sessionId
      setSessionId(res.data.sessionId)

      const previewScreen = useRecorderStore.getState().previewScreenStream
      if (!previewScreen) throw new Error('Screen preview stream is missing')
      const screenStream = previewScreen.clone()

      // Acquire microphone audio — sandbox is off so getUserMedia works directly
      let micTrack: MediaStreamTrack | null = null
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: false
        })
        const track = micStream.getAudioTracks()[0]
        if (track && track.readyState === 'live') {
          console.log(`[Recorder] Mic acquired: ${track.label}, state: ${track.readyState}`)
          track.enabled = !isMicMuted
          micTrack = track
          activeMicTrack = track

          // Setup audio analyzer for the UI level meter
          const audioCtx = new AudioContext()
          const source = audioCtx.createMediaStreamSource(micStream)
          const analyser = audioCtx.createAnalyser()
          analyser.fftSize = 256
          source.connect(analyser)
          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          
          const updateLevel = () => {
            if (!activeMicTrack) { audioCtx.close(); return }
            analyser.getByteFrequencyData(dataArray)
            let sum = 0; for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
            const avg = sum / dataArray.length
            // Push to store for visual feedback
            useRecorderStore.getState().setAudioLevel(avg / 128)
            if (activeSessionId) requestAnimationFrame(updateLevel)
            else audioCtx.close()
          }
          updateLevel()
        } else {
          console.warn('[Recorder] Mic track not live:', track?.readyState)
        }
      } catch (err: any) {
        console.warn('[Recorder] Mic unavailable:', err.name, err.message)
        addToast('Microphone unavailable. Recording without audio.', 'error')
      }

      const allTracks = [...screenStream.getVideoTracks(), ...(micTrack ? [micTrack] : [])]
      console.log(`[Recorder] Recording tracks — video: ${screenStream.getVideoTracks().length}, audio: ${micTrack ? 1 : 0}`)
      const comb = new MediaStream(allTracks)
      const sRec = new MediaRecorder(comb, { 
        mimeType: 'video/webm;codecs=vp9,opus', 
        videoBitsPerSecond: bitrate,
        audioBitsPerSecond: 128000 
      })
      
      sRec.ondataavailable = (e) => {
        if (e.data.size > 0 && activeSessionId) {
          const blob = e.data
          queueIpcTask(async () => {
            const buf = new Uint8Array(await blob.arrayBuffer())
            return window.api.appendChunk({ sessionId: activeSessionId!, target: 'screen', chunk: buf })
          })
        }
      }

      sRec.onerror = (err) => {
        console.error('[Recorder] Screen recorder error:', err)
        setError(`Screen recorder error: ${err.type}`)
      }

      screenRecorder = sRec
      sRec.start(CHUNK_INTERVAL_MS)

      if (webcamEnabled) {
        const previewWebcam = useRecorderStore.getState().previewWebcamStream
        if (!previewWebcam) throw new Error('Webcam preview stream is missing')
        const cStr = previewWebcam.clone()
        const cRec = new MediaRecorder(cStr, { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: Math.floor(bitrate / 2) })
        cRec.ondataavailable = (e) => {
          if (e.data.size > 0 && activeSessionId) {
            const blob = e.data
            queueIpcTask(async () => {
              const buf = new Uint8Array(await blob.arrayBuffer())
              return window.api.appendChunk({ sessionId: activeSessionId!, target: 'webcam', chunk: buf })
            })
          }
        }
        cRec.onerror = (err) => {
          console.error('[Recorder] Webcam recorder error:', err)
          addToast(`Webcam recorder error: ${err.type}`, 'error')
        }

        webcamRecorder = cRec
        cRec.start(CHUNK_INTERVAL_MS)
      }

      useRecorderStore.getState().setScreenStream(comb)
      if (webcamEnabled && webcamRecorder) {
        useRecorderStore.getState().setWebcamStream(webcamRecorder.stream)
      }

      elapsedSecondsCounter = 0
      setElapsedSeconds(0)
      timerId = setInterval(() => { elapsedSecondsCounter++; incrementElapsed() }, 1000)
      setPage('recording')
    } catch (err) {
      setRecordingStatus('error')
      setError((err as Error).message)
    }
  }, [selectedSource, webcamEnabled, sessionName, isMicMuted, bitrate, format, setRecordingStatus, setSessionId, setElapsedSeconds, incrementElapsed, setError, setPage, queueIpcTask])

  const stopRecording = useCallback(async () => {
    if (useRecorderStore.getState().recordingStatus === 'stopping' || useRecorderStore.getState().recordingStatus === 'complete') return
    
    setRecordingStatus('stopping')
    stopTimer()

    const stop = (r: MediaRecorder | null) => new Promise(v => {
      if (!r || r.state === 'inactive') return v(null)
      let resolved = false
      const done = () => { if (!resolved) { resolved = true; v(null) } }
      r.onstop = done
      r.stop()
      setTimeout(done, 1500) // Failsafe for frozen MediaRecorders
    })

    await Promise.all([stop(screenRecorder), stop(webcamRecorder)])

    // Safety timeout for residual chunk flush
    const start = Date.now()
    while (pendingTasks > 0 && Date.now() - start < 10000) {
      await new Promise(r => setTimeout(r, 100))
    }
    
    // Await pristine queues; ignore timed-out chains
    if (pendingTasks === 0) {
      await ipcQueue
    }

    const stopTracks = (r: MediaRecorder | null) => {
      if (r && r.stream) {
        console.log(`[Recorder] Stopping tracks for ${r === screenRecorder ? 'screen' : 'webcam'} recorder`)
        // No longer stopping all tracks from r.stream to avoid hardware lock issues
        // The hardware tracks are managed by useMediaCapture
      }
    }
    stopTracks(screenRecorder)
    stopTracks(webcamRecorder)

    // ONLY stop the mic track we explicitly created for this recording
    if (activeMicTrack) {
      console.log(`[Recorder] Stopping active mic track: ${activeMicTrack.label}`)
      activeMicTrack.stop()
      activeMicTrack = null
    }

    if (activeSessionId && window.api) {
      const res = await window.api.finalizeSession({ sessionId: activeSessionId, duration: elapsedSecondsCounter })
      useRecorderStore.getState().setScreenStream(null)
      useRecorderStore.getState().setWebcamStream(null)
      
      screenRecorder = null
      webcamRecorder = null
      activeSessionId = null // Ensure session ID is cleared
      
      if (res.success) {
        setCompletedSession(res.data); setRecordingStatus('complete'); setPage('complete'); loadSessions()
      } else {
        setRecordingStatus('error'); setError(res.error)
      }
    }
  }, [setRecordingStatus, stopTimer, setCompletedSession, setPage, setError, loadSessions])

  const abortRecording = useCallback(async () => {
    stopTimer()
    screenRecorder?.stop()
    webcamRecorder?.stop()
    if (activeSessionId && window.api) await window.api.abortSession({ sessionId: activeSessionId })
    
    screenRecorder = null
    webcamRecorder = null
    activeMicTrack = null
    
    reset(); setPage('home')
  }, [stopTimer, reset, setPage])

  const togglePause = useCallback(() => {
    const s = screenRecorder; const w = webcamRecorder
    if (!s) return
    if (s.state === 'recording') {
      s.pause(); w?.pause(); stopTimer(); useRecorderStore.getState().setPaused(true); addToast('Paused', 'info')
    } else if (s.state === 'paused') {
      s.resume(); w?.resume(); timerId = setInterval(() => { elapsedSecondsCounter++; incrementElapsed() }, 1000)
      useRecorderStore.getState().setPaused(false); addToast('Resumed', 'info')
    }
  }, [stopTimer, incrementElapsed, addToast])

  const toggleMicMute = useCallback(() => {
    const t = activeMicTrack
    if (t) { t.enabled = !t.enabled; useRecorderStore.getState().toggleMicMuted(); addToast(t.enabled ? 'Mic active' : 'Mic muted', 'info') }
  }, [addToast])

  useEffect(() => {
    if (!window.api) return
    const cleanup = window.api.onShutdownRequested(() => stopRecording())
    return cleanup
  }, [stopRecording])

  return { startRecording, stopRecording, abortRecording, togglePause, toggleMicMute, recordingStatus }
}
