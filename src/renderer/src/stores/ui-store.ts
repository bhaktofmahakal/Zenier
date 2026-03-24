import { create } from 'zustand'
import type { SessionMeta } from '@shared/types'

export type AppPage = 'home' | 'recording' | 'complete' | 'library'

interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'error'
}

interface UiState {
  currentPage: AppPage
  completedSession: SessionMeta | null
  toasts: Toast[]

  setPage: (page: AppPage) => void
  setCompletedSession: (session: SessionMeta | null) => void
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

let toastCounter = 0

export const useUiStore = create<UiState>((set, get) => ({
  currentPage: 'home',
  completedSession: null,
  toasts: [],

  setPage: (page) => set({ currentPage: page }),
  setCompletedSession: (session) => set({ completedSession: session }),

  addToast: (message, type = 'info') => {
    const id = `toast-${++toastCounter}`
    set({ toasts: [...get().toasts, { id, message, type }] })
    // Auto-remove after 4 seconds
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) })
    }, 4000)
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  }
}))
