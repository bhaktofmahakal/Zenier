import React, { useEffect } from 'react'
import { useUiStore } from './stores/ui-store'
import { useLibraryStore } from './stores/library-store'
import { HomePage } from './pages/HomePage'
import { RecordingPage } from './pages/RecordingPage'
import { CompletePage } from './pages/CompletePage'
import { LibraryPage } from './pages/LibraryPage'

export const ToastOverlay: React.FC = () => {
  const toasts = useUiStore((s) => s.toasts)
  const removeToast = useUiStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-8 z-[999] flex flex-col gap-3 pointer-events-none items-end">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`px-5 py-3.5 rounded-2xl shadow-2xl cursor-pointer transition-all flex items-center gap-3 text-sm min-w-[280px] border pointer-events-auto backdrop-blur-xl animate-in slide-in-from-right-8 fade-in duration-300 ${
            toast.type === 'error'
              ? 'bg-error-container/20 text-error border-error/20'
              : toast.type === 'success'
                ? 'bg-secondary-container/20 text-secondary border-secondary/20'
                : 'bg-surface-container-high/60 text-on-surface border-white/5'
          }`}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/5">
            <span className="material-symbols-outlined text-lg">
              {toast.type === 'error'
                ? 'error'
                : toast.type === 'success'
                  ? 'check_circle'
                  : 'info'}
            </span>
          </div>
          <div className="flex-grow font-medium tracking-tight">
            {toast.message}
          </div>
          <span className="material-symbols-outlined text-outline text-base opacity-40">close</span>
        </div>
      ))}
    </div>
  )
}

export default function App(): React.JSX.Element {
  const currentPage = useUiStore((s) => s.currentPage)
  const addToast = useUiStore((s) => s.addToast)

  useEffect(() => {
    if (!window.api) return
    const unsub = window.api.onSessionProcessed((meta) => {
      // Sync background processing results to stores
      const library = useLibraryStore.getState()
      library.setSessions(
        library.sessions.map((s) => (s.id === meta.id ? meta : s))
      )
      
      const ui = useUiStore.getState()
      if (ui.completedSession?.id === meta.id) {
        ui.setCompletedSession(meta)
        addToast(`MP4 processing complete for ${meta.name}`, 'success')
      }
    })
    return unsub
  }, [addToast])

  if (!window.api) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface text-on-surface p-12 text-center">
        <div className="max-w-md space-y-4">
          <span className="material-symbols-outlined text-primary text-6xl">desktop_windows</span>
          <h1 className="text-2xl font-bold">Electron Environment Required</h1>
          <p className="text-on-surface-variant">
            Zenier Recorder uses low-level desktop APIs only available in the Electron app. 
            Please use the application window launched by <code className="bg-surface-container px-1 rounded">pnpm dev</code>.
          </p>
          <div className="text-[10px] font-label text-outline uppercase tracking-widest pt-4">
            window.api is undefined
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <ToastOverlay />
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'recording' && <RecordingPage />}
      {currentPage === 'complete' && <CompletePage />}
      {currentPage === 'library' && <LibraryPage />}
    </>
  )
}
