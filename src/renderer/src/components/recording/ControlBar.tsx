import React from 'react'
import { useRecorderStore } from '../../stores/recorder-store'
import { useRecorder } from '../../hooks/use-recorder'

// Utility for time-string generation in UI
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const ControlBar: React.FC = () => {
  const elapsedSeconds = useRecorderStore((s) => s.elapsedSeconds)
  const isPaused = useRecorderStore((s) => s.isPaused)
  const isMicMuted = useRecorderStore((s) => s.isMicMuted)
  const audioLevel = useRecorderStore((s) => s.audioLevel)
  const recordingStatus = useRecorderStore((s) => s.recordingStatus)

  const { stopRecording, togglePause, toggleMicMute } = useRecorder()

  const isStopping = recordingStatus === 'stopping'

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8 border border-white/10 rounded-full max-w-fit mx-auto mb-8 px-8 py-4 glass-panel shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-3 pr-4 border-r border-white/10">
        <span
          className={`material-symbols-outlined text-tertiary-container ${
            isPaused ? '' : 'pulse-dot'
          }`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          fiber_manual_record
        </span>
        <span className="font-label text-sm text-white tracking-widest">
          {formatTime(elapsedSeconds)}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={togglePause}
          disabled={isStopping}
          className="flex flex-col items-center gap-1 group transition-all active:scale-95 disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-slate-300 group-hover:text-white">
              {isPaused ? 'play_arrow' : 'pause'}
            </span>
          </div>
          <span className="font-label text-[9px] uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-200">
            {isPaused ? 'Resume' : 'Pause'}
          </span>
        </button>

        <button
          onClick={toggleMicMute}
          disabled={isStopping}
          className="flex flex-col items-center gap-1 group transition-all active:scale-95 disabled:opacity-50"
        >
          <div className={`w-10 h-10 rounded-full flex flex-col items-center justify-center transition-colors ${
            isMicMuted ? 'bg-error-container/20 ring-1 ring-error/20' : 'bg-white/5 hover:bg-white/10'
          }`}>
            <span className={`material-symbols-outlined ${
              isMicMuted ? 'text-error animate-pulse' : 'text-slate-300 group-hover:text-white'
            }`}>
              {isMicMuted ? 'mic_off' : 'mic'}
            </span>
            
            {/* Audio Level Meter */}
            {!isMicMuted && (
              <div className="flex gap-[1px] h-1 items-end mt-[2px]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i}
                    className="w-[2px] bg-primary transition-all duration-75"
                    style={{ 
                      height: `${Math.max(10, audioLevel * (100 - (i * 10)))}%`,
                      opacity: audioLevel > 0.1 ? 1 : 0.3
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <span className={`font-label text-[9px] uppercase tracking-[0.2em] ${
            isMicMuted ? 'text-error font-bold' : 'text-slate-400 group-hover:text-slate-200'
          }`}>
            {isMicMuted ? 'Muted' : 'Mute'}
          </span>
        </button>

        <button
          onClick={stopRecording}
          disabled={isStopping}
          className="flex flex-col items-center gap-1 group transition-all active:scale-95 disabled:opacity-50"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-error-container/80 hover:bg-error-container shadow-lg shadow-error-container/20 transition-all">
            {isStopping ? (
              <span className="material-symbols-outlined text-white animate-spin">
                progress_activity
              </span>
            ) : (
              <span
                className="material-symbols-outlined text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                stop_circle
              </span>
            )}
          </div>
          <span className="font-label text-[9px] uppercase tracking-[0.2em] text-tertiary font-bold">
            {isStopping ? 'Saving...' : 'Stop'}
          </span>
        </button>
      </div>

      <div className="pl-4 border-l border-white/10">
        <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all opacity-50 cursor-not-allowed">
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
      </div>
    </nav>
  )
}
