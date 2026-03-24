import React from 'react'
import { useRecorderStore } from '../../stores/recorder-store'
import { useUiStore } from '../../stores/ui-store'

interface TopNavProps {
  minimal?: boolean
}

export const TopNav: React.FC<TopNavProps> = ({ minimal = false }) => {
  const recordingStatus = useRecorderStore((s) => s.recordingStatus)
  const { setPage, addToast } = useUiStore()

  return (
    <nav className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-surface-container-lowest/50 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent cursor-pointer" onClick={() => setPage('home')}>
          Zenier Recorder
        </h2>
        {!minimal && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium tracking-tight">
            <a
              className="text-indigo-400 font-semibold border-b-2 border-indigo-500 pb-1 cursor-pointer"
              href="#"
            >
              Library
            </a>
            <button 
              onClick={() => addToast('Templates are a Pro feature. Upgrade to Zenier Pro!', 'info')}
              className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Templates
            </button>
            <button 
              onClick={() => addToast('Team collaboration is coming soon!', 'info')}
              className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Team
            </button>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4 no-drag">
        {recordingStatus === 'recording' || recordingStatus === 'paused' ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/10">
            <span
              className="material-symbols-outlined text-error text-[18px] pulse-dot"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              fiber_manual_record
            </span>
            <span className="font-label text-xs tracking-widest text-on-surface-variant uppercase">
              Recording in Progress
            </span>
          </div>
        ) : (
          <>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-sm">
                search
              </span>
              <input
                className="bg-surface-container-lowest border-none rounded-lg pl-9 pr-4 py-1.5 text-sm text-on-surface-variant w-64 focus:ring-2 focus:ring-primary-container transition-all outline-none"
                placeholder="Search sessions..."
                type="text"
                onKeyDown={(e) => e.key === 'Enter' && addToast('Search is indexed after recording finalizes.', 'info')}
              />
            </div>
            <button className="p-2 text-slate-400 hover:bg-surface-container rounded-md transition-all">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            <button className="p-2 text-slate-400 hover:bg-surface-container rounded-md transition-all">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs border border-white/10">
              U
            </div>
          </>
        )}
      </div>
    </nav>
  )
}
