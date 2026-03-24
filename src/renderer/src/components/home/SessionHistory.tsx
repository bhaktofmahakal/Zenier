import React, { useEffect, useState } from 'react'
import { useLibraryStore } from '../../stores/library-store'
import { useUiStore } from '../../stores/ui-store'

// Utility for timestamp generation in UI
function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// Utility for localized date formatting
function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const SessionHistory: React.FC = () => {
  const sessions = useLibraryStore((s) => s.sessions)
  const isLoading = useLibraryStore((s) => s.isLoading)
  const loadSessions = useLibraryStore((s) => s.loadSessions)
  const renameSession = useLibraryStore((s) => s.renameSession)
  const addToast = useUiStore((s) => s.addToast)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const recentSessions = sessions.filter((s) => s.status === 'complete').slice(0, 6)

  const handleOpenFolder = async (sessionId: string) => {
    if (!window.api || editingId) return
    await window.api.openFolder({ sessionId })
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRenameSubmit = async (sessionId: string) => {
    if (isSubmitting) return
    const currentSession = sessions.find(s => s.id === sessionId)
    const trimmedNewName = editName.trim()

    if (trimmedNewName && trimmedNewName !== currentSession?.name) {
      setIsSubmitting(true)
      const res = await renameSession(sessionId, trimmedNewName)
      if (res) {
        addToast('Session renamed successfully', 'success')
      }
      setIsSubmitting(false)
    }
    setEditingId(null)
  }

  if (recentSessions.length === 0 && !isLoading) {
    return null
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant">history</span>
          Recent Sessions
        </h3>
        <button 
          onClick={() => useUiStore.getState().setPage('library')}
          className="text-xs font-label text-primary hover:underline hover:text-primary-container transition-all"
        >
          View All
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="material-symbols-outlined text-primary animate-spin text-3xl">
            progress_activity
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {recentSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleOpenFolder(session.id)}
              className="group bg-surface-container p-4 rounded-xl hover:bg-surface-container-high transition-all border border-transparent hover:border-white/5 cursor-pointer relative"
            >
              <div className="aspect-video rounded-lg overflow-hidden bg-surface-container-lowest mb-4 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-outline group-hover:text-primary transition-colors">
                  videocam
                </span>
              </div>

              {editingId === session.id ? (
                <input
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => !isSubmitting && handleRenameSubmit(session.id)}
                  onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleRenameSubmit(session.id)}
                  className={`w-full bg-surface-container-highest border-none rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-primary outline-none mb-1 shadow-inner ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
                  disabled={isSubmitting}
                />
              ) : (
                <div className="flex items-center justify-between mb-1 group/rename">
                  <h4 className="text-sm font-semibold truncate pr-2" title={session.name}>
                    {session.name}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingId(session.id)
                      setEditName(session.name)
                    }}
                    className="opacity-0 group-hover/rename:opacity-100 p-1 hover:text-primary transition-all rounded hover:bg-white/5"
                    title="Rename session"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] font-label text-on-surface-variant">
                <span>{formatDate(session.createdAt)}</span>
                <span>{formatDuration(session.duration)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
