import React from 'react'
import { useRecorderStore } from '../../stores/recorder-store'

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const RecordingCanvas: React.FC = () => {
  const isPaused = useRecorderStore((s) => s.isPaused)
  const screenStream = useRecorderStore((s) => s.screenStream)
  const webcamStream = useRecorderStore((s) => s.webcamStream)
  const elapsedSeconds = useRecorderStore((s) => s.elapsedSeconds)
  const selectedSource = useRecorderStore((s) => s.selectedSource)
  const webcamEnabled = useRecorderStore((s) => s.webcamEnabled)

  const videoRef = React.useRef<HTMLVideoElement>(null)
  const webcamRef = React.useRef<HTMLVideoElement>(null)

  React.useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream
    }
  }, [screenStream])

  React.useEffect(() => {
    if (webcamRef.current && webcamStream) {
      webcamRef.current.srcObject = webcamStream
    }
  }, [webcamStream])

  return (
    <div className="relative h-[calc(100vh-64px)] w-full flex items-center justify-center p-8">
      {/* Primary Video Plate */}
      <div className="absolute inset-8 rounded-xl bg-black/40 overflow-hidden flex items-center justify-center border border-white/5 shadow-2xl">
        {screenStream ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-contain transition-opacity duration-500 ${
              isPaused ? 'opacity-30 blur-sm' : 'opacity-100'
            }`}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <span className="material-symbols-outlined text-6xl animate-pulse">videocam_off</span>
            <p className="text-sm">Video stream lost</p>
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-background/20 pointer-events-none" />

      <div className="z-10 text-center space-y-4">
        <div className="font-label text-5xl text-white tracking-tighter tabular-nums">
          {formatTime(elapsedSeconds || 0)}
        </div>
        <p className="text-on-surface-variant font-medium text-sm">
          {isPaused ? 'Paused' : `Capturing ${selectedSource?.name || 'Desktop'} + Audio`}
        </p>
      </div>

      {/* PiP Overlay */}
      {webcamEnabled && (
        <div className="absolute bottom-8 right-8 w-64 aspect-video rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 z-30 bg-black">
          {webcamStream ? (
            <video
              ref={webcamRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-surface-container-lowest flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-outline">videocam</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2 pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#4edea3]" />
            <span className="text-[10px] font-label text-white uppercase tracking-widest">Live Cam</span>
          </div>
        </div>
      )}

      {/* Notification Layer */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50">
        <div className="px-4 py-2 bg-surface-container-high rounded-full border border-outline-variant/20 shadow-xl flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[18px]">screen_share</span>
          <span className="text-xs font-medium text-on-surface-variant">
            Recording &quot;{selectedSource?.name || 'Desktop'}&quot;
          </span>
        </div>
      </div>
    </div>
  )
}
