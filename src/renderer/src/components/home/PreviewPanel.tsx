import React from 'react'
import { useRecorderStore } from '../../stores/recorder-store'
import { useMediaCapture } from '../../hooks/use-media-capture'
import { useRecorder } from '../../hooks/use-recorder'

export const PreviewPanel: React.FC = () => {
  const selectedSource = useRecorderStore((s) => s.selectedSource)
  const webcamEnabled = useRecorderStore((s) => s.webcamEnabled)
  const setWebcamEnabled = useRecorderStore((s) => s.setWebcamEnabled)
  const webcamDeviceLabel = useRecorderStore((s) => s.webcamDeviceLabel)
  const sessionName = useRecorderStore((s) => s.sessionName)
  const setSessionName = useRecorderStore((s) => s.setSessionName)
  const errorMessage = useRecorderStore((s) => s.errorMessage)
  const bitrate = useRecorderStore((s) => s.bitrate)
  const setBitrate = useRecorderStore((s) => s.setBitrate)
  const format = useRecorderStore((s) => s.format)
  const setFormat = useRecorderStore((s) => s.setFormat)

  const { screenVideoRef, webcamVideoRef } = useMediaCapture()
  const { startRecording } = useRecorder()

  return (
    <div className="col-span-12 lg:col-span-5 space-y-6">
      <div className="glass border border-white/5 rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-semibold">Recording Settings</h3>

        <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-container-lowest border border-white/5 group">
          {selectedSource ? (
            <video
              ref={screenVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-outline">
                  monitor
                </span>
                <p className="text-sm text-on-surface-variant">
                  Select a source to preview
                </p>
              </div>
            </div>
          )}

          {selectedSource && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg">
              <span className="text-xs font-label">LIVE PREVIEW</span>
              <span className="text-[10px] font-label flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                READY
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">videocam</span>
            </div>
            <div>
              <p className="text-sm font-medium">Include Webcam</p>
              <p className="text-xs text-on-surface-variant">
                {webcamEnabled && webcamDeviceLabel ? webcamDeviceLabel : 'Not connected'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={webcamEnabled}
              onChange={(e) => setWebcamEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>

        {webcamEnabled && (
          <div className="aspect-video rounded-xl overflow-hidden bg-surface-container-lowest border border-white/5 max-h-32">
            <video
              ref={webcamVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-label text-on-surface-variant px-1 uppercase tracking-widest">
            Session Name
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-container transition-all outline-none mt-1.5 text-on-surface"
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder={`Recording ${new Date().toLocaleDateString()}`}
            />
          </label>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-sm text-primary">tune</span>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
              Export Settings
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-label text-outline ml-1">
                Bitrate
              </label>
              <select 
                value={bitrate.toString()}
                onChange={(e) => setBitrate(Number(e.target.value))}
                className="w-full bg-surface-container-lowest border-none rounded-lg px-3 py-2.5 text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer hover:bg-surface-container-highest"
              >
                <option value="2500000">Standard (2.5 Mbps)</option>
                <option value="5000000">High (5 Mbps)</option>
                <option value="8000000">Studio (8 Mbps)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-label text-outline ml-1">
                Format
              </label>
              <select 
                value={format}
                onChange={(e) => setFormat(e.target.value as 'webm' | 'mp4')}
                className="w-full bg-surface-container-lowest border-none rounded-lg px-3 py-2.5 text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer hover:bg-surface-container-highest"
              >
                <option value="webm">WebM (Native)</option>
                <option value="mp4">MP4 (Merged)</option>
              </select>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-error-container/20 text-error text-sm">
            <span className="material-symbols-outlined text-lg">error</span>
            {errorMessage}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="flex items-center justify-center gap-2 py-4 rounded-xl border border-outline-variant hover:bg-surface-container-high transition-all text-sm font-semibold opacity-50 cursor-not-allowed">
          <span className="material-symbols-outlined">schedule</span>
          Schedule
        </button>
        <button
          onClick={startRecording}
          className="flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-bold text-sm shadow-xl hover:shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            fiber_manual_record
          </span>
          Start Session
        </button>
      </div>
    </div>
  )
}
