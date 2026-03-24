import { useEffect, useRef, useCallback } from 'react'
import { useRecorderStore } from '../stores/recorder-store'

// Binds local hardware streams to global Zustand state for cross-component PiP previews
export function useMediaCapture() {
  const selectedSource = useRecorderStore((s) => s.selectedSource)
  const webcamEnabled = useRecorderStore((s) => s.webcamEnabled)
  const setWebcamDeviceLabel = useRecorderStore((s) => s.setWebcamDeviceLabel)
  const setPreviewScreenStream = useRecorderStore((s) => s.setPreviewScreenStream)
  const setPreviewWebcamStream = useRecorderStore((s) => s.setPreviewWebcamStream)
  
  const screenStreamRef = useRef<MediaStream | null>(null)
  const webcamStreamRef = useRef<MediaStream | null>(null)
  const screenVideoRef = useRef<HTMLVideoElement | null>(null)
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null)

  // Stop and release hardware track locks
  const stopStream = useCallback((stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // Initialize screen capture stream for the selected OS source
  const startScreenPreview = useCallback(async () => {
    stopStream(screenStreamRef.current)
    screenStreamRef.current = null
    setPreviewScreenStream(null)

    if (!selectedSource) return null

    try {
      // @ts-ignore
      const isBrowserDemo = window.isBrowserDemo
      let stream: MediaStream

      if (isBrowserDemo) {
        // Use standard browser API for the Vercel/Web demo
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        })
      } else {
        // Use Electron-specific desktop capture for the production app
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: selectedSource.id,
              maxWidth: 1920,
              maxHeight: 1080
            }
          } as MediaTrackConstraints
        })
      }

      screenStreamRef.current = stream
      setPreviewScreenStream(stream)

      const videoTrack = stream.getVideoTracks()[0]
      console.log(`[Capture] Screen preview started: ${videoTrack?.label}, readyState: ${videoTrack?.readyState}`)

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream
        screenVideoRef.current.play().catch(() => {})
      }

      return stream
    } catch (err) {
      console.error('Screen preview failed:', err)
      return null
    }
  }, [selectedSource, stopStream, setPreviewScreenStream])

  // Initialize USB camera stream with basic user permissions
  const startWebcamPreview = useCallback(async () => {
    // Clean up previous
    stopStream(webcamStreamRef.current)
    webcamStreamRef.current = null
    setPreviewWebcamStream(null)

    if (!webcamEnabled) return null

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 360 },
        audio: false
      })

      webcamStreamRef.current = stream
      setPreviewWebcamStream(stream)

      // Grab device label
      const videoTrack = stream.getVideoTracks()[0]
      console.log(`[Capture] Webcam preview started: ${videoTrack?.label}, readyState: ${videoTrack?.readyState}`)
      if (videoTrack) {
        setWebcamDeviceLabel(videoTrack.label || 'Webcam')
      }

      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream
        webcamVideoRef.current.play().catch(() => {})
      }

      return stream
    } catch (err) {
      console.error('Webcam preview failed:', err)
      return null
    }
  }, [webcamEnabled, stopStream, setPreviewWebcamStream, setWebcamDeviceLabel])

  // Effect: Auto-recovery for screen capture tracks if they go stale
  useEffect(() => {
    const stream = screenStreamRef.current
    const track = stream?.getVideoTracks()[0]
    
    // Only re-start if source changed OR track died
    if (selectedSource && (!track || track.readyState === 'ended')) {
      console.log('[Capture] Initializing or recovering screen preview...')
      startScreenPreview()
    }
  }, [selectedSource, startScreenPreview])

  // Effect: Sync webcam stream state with the `webcamEnabled` global toggle
  useEffect(() => {
    if (webcamEnabled) {
      startWebcamPreview()
    } else {
      stopStream(webcamStreamRef.current)
      webcamStreamRef.current = null
      setPreviewWebcamStream(null)
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = null
      }
    }
  }, [webcamEnabled, startWebcamPreview, setPreviewWebcamStream, stopStream])

  const getScreenStream = useCallback(() => screenStreamRef.current, [])
  const getWebcamStream = useCallback(() => webcamStreamRef.current, [])

  return {
    screenVideoRef,
    webcamVideoRef,
    screenStreamRef,
    webcamStreamRef,
    getScreenStream,
    getWebcamStream,
    startScreenPreview,
    startWebcamPreview,
    stopStream
  }
}
