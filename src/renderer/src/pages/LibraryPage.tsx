import React, { useEffect, useState } from 'react'
import { useLibraryStore } from '../stores/library-store'
import { useUiStore } from '../stores/ui-store'

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const LibraryPage: React.FC = () => {
  const sessions = useLibraryStore((s) => s.sessions)
  const isLoading = useLibraryStore((s) => s.isLoading)
  const loadSessions = useLibraryStore((s) => s.loadSessions)
  const renameSession = useLibraryStore((s) => s.renameSession)
  const deleteSession = useLibraryStore((s) => s.deleteSession)
  const setPage = useUiStore((s) => s.setPage)
  const addToast = useUiStore((s) => s.addToast)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const handleOpenFolder = async (sessionId: string) => {
    if (!window.api || editingId) return
    await window.api.openFolder({ sessionId })
  }

  const handleDelete = async (e: React.MouseEvent, sessionId: string, sessionName: string) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to delete "${sessionName}"? This action cannot be undone.`)) {
      const success = await deleteSession(sessionId)
      if (success) {
        addToast('Session deleted permanentely', 'success')
      } else {
        addToast('Failed to delete session', 'error')
      }
    }
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
      } else {
        addToast('Failed to rename session', 'error')
      }
      setIsSubmitting(false)
    }
    setEditingId(null)
  }

  return (
    <div className="h-screen bg-surface text-on-surface flex flex-col overflow-hidden animate-in fade-in duration-500">
      <header className="flex items-center justify-between p-10 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setPage('home')}
            className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recording Library</h1>
            <p className="text-on-surface-variant text-sm">Manage and review all your captured sessions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-lg border border-white/5">
          <span className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Total Sessions:</span>
          <span className="text-sm font-bold text-primary">{sessions.length}</span>
        </div>
      </header>
 
      <main className="flex-1 overflow-y-auto p-10 pt-4">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
            <p className="text-sm text-outline animate-pulse">Scanning video directory...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <span className="material-symbols-outlined text-6xl text-outline">video_library</span>
            <p className="text-lg">No recordings found</p>
            <button 
              onClick={() => setPage('home')}
              className="text-primary hover:underline text-sm"
            >
              Go start your first recording
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => handleOpenFolder(session.id)}
                className="group bg-surface-container rounded-2xl p-5 hover:bg-surface-container-high transition-all border border-transparent hover:border-primary/20 cursor-pointer flex flex-col space-y-4 shadow-xl shadow-black/20"
              >
                <div className="aspect-video rounded-xl overflow-hidden bg-black/40 relative flex items-center justify-center group-hover:bg-black/20 transition-all">
                  <span className="material-symbols-outlined text-5xl text-outline group-hover:text-primary transition-colors duration-500">
                    {session.format === 'mp4' ? 'movie' : 'videocam'}
                  </span>
                  
                  <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[9px] font-bold text-white/80 uppercase tracking-tighter border border-white/10">
                    {session.screenFile?.endsWith('.mp4') ? 'MP4 Merged' : 'WebM Raw'}
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 transform scale-90 group-hover:scale-100 transition-transform">
                      <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        play_arrow
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {editingId === session.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => !isSubmitting && handleRenameSubmit(session.id)}
                        onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleRenameSubmit(session.id)}
                        className={`flex-1 bg-surface-container-lowest border-primary/30 border rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-primary outline-none ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
                        disabled={isSubmitting}
                      />
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors" title={session.name}>
                          {session.name}
                        </h3>
                        <p className="text-[10px] text-on-surface-variant font-label opacity-70">
                          {formatDate(session.createdAt)}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => handleDelete(e, session.id, session.name)}
                        className="p-1.5 hover:bg-error/10 rounded-lg text-outline hover:text-error transition-all"
                        title="Delete Session"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingId(session.id)
                          setEditName(session.name)
                        }}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-outline hover:text-primary transition-all"
                        title="Rename"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] font-label text-outline">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {formatDuration(session.duration)}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-label text-outline">
                        <span className="material-symbols-outlined text-sm">data_usage</span>
                        {session.format?.toUpperCase() || 'WEBM'}
                      </div>
                    </div>
                    
                    <button className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      OPEN FOLDER
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
