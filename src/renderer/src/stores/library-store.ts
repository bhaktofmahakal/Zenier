import { create } from 'zustand'
import type { SessionMeta } from '@shared/types'

interface LibraryState {
  sessions: SessionMeta[]
  isLoading: boolean

  setSessions: (sessions: SessionMeta[]) => void
  setLoading: (loading: boolean) => void
  loadSessions: () => Promise<void>
  renameSession: (sessionId: string, newName: string) => Promise<SessionMeta | null>
  deleteSession: (sessionId: string) => Promise<boolean>
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  sessions: [],
  isLoading: false,

  setSessions: (sessions) => set({ sessions }),
  setLoading: (loading) => set({ isLoading: loading }),

  loadSessions: async () => {
    if (!window.api) {
      console.warn('window.api not found - possibly running outside Electron?')
      return
    }
    set({ isLoading: true })
    try {
      const result = await window.api.listSessions()
      if (result.success) {
        set({ sessions: result.data })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  renameSession: async (sessionId, newName) => {
    if (!window.api) return null
    const result = await window.api.renameSession({ sessionId, newName })
    if (result.success) {
      const sessions = get().sessions.map((s) =>
        s.id === sessionId ? { ...s, name: newName } : s
      )
      set({ sessions })
      return result.data
    }
    return null
  },

  deleteSession: async (sessionId) => {
    if (!window.api) return false
    const result = await window.api.deleteSession({ sessionId })
    if (result.success) {
      set({ sessions: get().sessions.filter((s) => s.id !== sessionId) })
      return true
    }
    return false
  }
}))
