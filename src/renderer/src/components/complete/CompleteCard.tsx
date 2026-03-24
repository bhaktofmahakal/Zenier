import React, { useState } from 'react'
import { useUiStore } from '../../stores/ui-store'
import { useRecorderStore } from '../../stores/recorder-store'
import { useLibraryStore } from '../../stores/library-store'

// Utility for timestamp generation in UI
function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export const CompleteCard: React.FC = () => {
  const completedSession = useUiStore((s) => s.completedSession)
  const setPage = useUiStore((s) => s.setPage)
  const addToast = useUiStore((s) => s.addToast)
  const reset = useRecorderStore((s) => s.reset)
  const renameSession = useLibraryStore((s) => s.renameSession)

  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(completedSession?.name || '')

  if (!completedSession) return null

  const handleOpenFolder = async () => {
    if (!window.api) return // Existing null check
    const result = await window.api.openFolder({ sessionId: completedSession.id })
    if (!result.success) {
      addToast(`Failed to open folder: ${result.error}`, 'error')
    }
  }

  const handleNewRecording = () => {
    reset()
    setPage('home')
  }

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleRename = async () => {
    if (isSubmitting) return
    if (newName.trim() && newName !== completedSession.name) {
      setIsSubmitting(true)
      const result = await renameSession(completedSession.id, newName.trim())
      if (result) {
        addToast('Session renamed', 'success')
        useUiStore.getState().setCompletedSession(result)
      }
      setIsSubmitting(false)
    }
    setIsRenaming(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-surface-container-lowest relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-xl z-10">
        <div className="glass-effect rounded-xl p-10 flex flex-col items-center text-center space-y-8 success-glow border border-outline-variant/10">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-secondary-container/20 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-secondary text-5xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
              Recording Complete
            </h1>
            <p className="text-on-surface-variant text-sm">
              Your capture has been processed and saved successfully.
            </p>
          </div>

          <div className="w-full">
            {isRenaming ? (
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-surface-container-lowest border-none rounded-lg px-4 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary-container outline-none"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  autoFocus
                />
                <button
                  onClick={handleRename}
                  className="px-3 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setNewName(completedSession.name)
                  setIsRenaming(true)
                }}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1 mx-auto"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                {completedSession.name}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="bg-surface-container rounded-lg p-5 flex flex-col items-start space-y-2 text-left transition-all hover:bg-surface-container-high">
              <span className="text-[0.65rem] font-label uppercase tracking-widest text-on-surface-variant">
                Duration
              </span>
              <span className="text-xl font-label text-on-surface">
                {formatDuration(completedSession.duration)}
              </span>
            </div>
            <div className="bg-surface-container rounded-lg p-5 flex flex-col items-start space-y-2 text-left transition-all hover:bg-surface-container-high">
              <span className="text-[0.65rem] font-label uppercase tracking-widest text-on-surface-variant">
                Format
              </span>
              <span className="text-xl font-label text-on-surface flex items-center gap-2">
                {completedSession.format?.toUpperCase() || 'WEBM'}
                {completedSession.format === 'mp4' && completedSession.screenFile === 'screen.webm' && (
                  <span className="flex items-center gap-1 text-[10px] text-primary animate-pulse font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    PROCESSING
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="w-full bg-surface-container-lowest/50 rounded-lg p-4 flex items-center justify-between group">
            <div className="flex items-center overflow-hidden">
              <span className="material-symbols-outlined text-on-surface-variant mr-3 text-lg">
                folder_open
              </span>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-[0.6rem] font-label uppercase tracking-tighter text-outline">
                  Save Destination
                </span>
                <span className="text-xs font-label text-on-surface-variant truncate w-full">
                  {completedSession.savePath}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={handleOpenFolder}
              className="flex-1 bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-semibold py-3 px-6 rounded-lg transition-transform active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-lg">folder_zip</span>
              Open Folder
            </button>
            <button
              onClick={handleNewRecording}
              className="flex-1 bg-surface-container-highest text-on-surface font-semibold py-3 px-6 rounded-lg transition-all hover:bg-surface-bright active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">videocam</span>
              New Recording
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-[10px] font-label uppercase text-on-surface-variant tracking-widest">
                Local Storage Optimized
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-label text-outline">v1.0.0</span>
            <span className="material-symbols-outlined text-outline text-sm">
              help_outline
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
