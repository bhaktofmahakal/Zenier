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
  // @ts-ignore
  const isBrowserDemo = window.isBrowserDemo

  useEffect(() => {
    if (!window.api) return
    const unsub = window.api.onSessionProcessed((meta) => {
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

  return (
    <>
      <ToastOverlay />
      
      {isBrowserDemo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 bg-primary/20 backdrop-blur-2xl border border-primary/30 rounded-full flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-lg">info</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest whitespace-nowrap">Interactive Design Demo</span>
            <span className="text-[10px] text-on-surface-variant font-medium">Recording requires the Desktop App</span>
          </div>
          <button 
            onClick={() => window.open('https://github.com/bhaktofmahakal/Zenier', '_blank')}
            className="ml-2 px-4 py-1.5 bg-primary text-on-primary text-[10px] font-bold rounded-lg hover:brightness-110 transition-all uppercase tracking-wider"
          >
            Get Desktop App
          </button>
        </div>
      )}

      <main className="h-screen w-screen overflow-hidden bg-surface select-none">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'recording' && <RecordingPage />}
        {currentPage === 'complete' && <CompletePage />}
        {currentPage === 'library' && <LibraryPage />}
      </main>
    </>
  )
}
