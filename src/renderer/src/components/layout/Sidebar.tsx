import React from 'react'
import { useRecorderStore } from '../../stores/recorder-store'
import { useUiStore } from '../../stores/ui-store'

const navItems = [
  { icon: 'video_library', label: 'All Recordings', active: true },
  { icon: 'group', label: 'Shared with me', active: false },
  { icon: 'star', label: 'Favorites', active: false },
  { icon: 'inventory_2', label: 'Archive', active: false },
  { icon: 'delete', label: 'Trash', active: false }
]

export const Sidebar: React.FC = () => {
  const { setPage, addToast } = useUiStore()
  const reset = useRecorderStore((s) => s.reset)
  const recordingStatus = useRecorderStore((s) => s.recordingStatus)

  const handleNewRecording = () => {
    reset()
    setPage('home')
  }

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col bg-surface-container-low w-64 z-30 gap-6 p-4">
      <div className="flex items-center gap-3 px-3 py-4 cursor-pointer group" onClick={() => setPage('home')}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-bold text-sm group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
          Z
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white leading-none">Personal Space</h2>
          <p className="text-[10px] text-primary mt-1 font-label uppercase tracking-wider">
            Pro Plan
          </p>
        </div>
      </div>

      <button
        onClick={handleNewRecording}
        className="mx-3 bg-gradient-to-br from-primary to-primary-container py-2.5 rounded-lg text-on-primary-container font-semibold text-sm shadow-lg active:opacity-80 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
      >
        <span className="material-symbols-outlined text-sm">add_circle</span>
        New Recording
      </button>

      <nav className="flex-1 space-y-1 custom-scrollbar overflow-y-auto">
        {navItems.map((item) => (
          <div
            key={item.label}
            onClick={() => !item.active && addToast(`${item.label} is currently empty in this workspace.`, 'info')}
            className={`px-3 py-2 flex items-center gap-3 cursor-pointer rounded-lg transition-all ${
              item.active
                ? 'bg-surface-container text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-container-high'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${item.active ? 'text-primary' : ''}`}
            >
              {item.icon}
            </span>
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-8 space-y-1">
        <button 
          onClick={() => addToast('Guide: Select a source -> Press Start -> Stop to save to Videos/Zenier.', 'info')}
          className="w-full flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-primary transition-all text-xs font-medium group rounded-lg"
        >
          <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">
            description
          </span>
          Desktop Guide
        </button>
        <button 
          onClick={() => addToast('Zenier is currently FREE for early adopters!', 'success')}
          className="w-full flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-primary transition-colors text-xs font-medium group"
        >
          <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
            payments
          </span>
          Billing
        </button>
      </div>
    </aside>
  )
}
