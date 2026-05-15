import { create } from 'zustand'

const useStore = create((set, get) => ({
  // ── Auth ────────────────────────────────────────────────
  user: JSON.parse(localStorage.getItem('eduko_user') || 'null'),
  token: localStorage.getItem('eduko_token') || null,

  setUser: (user) => {
    localStorage.setItem('eduko_user', JSON.stringify(user))
    set({ user })
  },
  setToken: (token) => {
    localStorage.setItem('eduko_token', token)
    set({ token })
  },
  logout: () => {
    localStorage.removeItem('eduko_user')
    localStorage.removeItem('eduko_token')
    set({ user: null, token: null })
  },

  // ── UI ──────────────────────────────────────────────────
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // ── Offline ─────────────────────────────────────────────
  isOnline: navigator.onLine,
  setOnline: (v) => set({ isOnline: v }),

  // ── Chat ────────────────────────────────────────────────
  chatMessages: [],
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  clearChat: () => set({ chatMessages: [] }),

  // ── Dashboard data ───────────────────────────────────────
  dashboardData: null,
  setDashboardData: (data) => set({ dashboardData: data }),

  learningPlan: null,
  setLearningPlan: (plan) => set({ learningPlan: plan }),

  lessons: [],
  setLessons: (lessons) => set({ lessons }),

  // ── Sync queue (offline) ─────────────────────────────────
  syncQueue: JSON.parse(localStorage.getItem('eduko_sync') || '[]'),
  addToSyncQueue: (item) => {
    const q = [...get().syncQueue, item]
    localStorage.setItem('eduko_sync', JSON.stringify(q))
    set({ syncQueue: q })
  },
  clearSyncQueue: () => {
    localStorage.removeItem('eduko_sync')
    set({ syncQueue: [] })
  },
}))

export default useStore
