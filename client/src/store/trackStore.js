import { create } from 'zustand';

const STORAGE_KEY = 'portwatch_saved_shipments';

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function persistSaved(saved) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

export const useTrackStore = create((set, get) => ({
  events: [],
  loading: false,
  error: null,
  query: '',
  queryType: 'carrierBookingReference',
  searched: false,
  activeRef: null,
  saved: loadSaved(),

  setQuery: (q) => set({ query: q }),
  setQueryType: (t) => set({ queryType: t }),
  clear: () => set({ events: [], error: null, searched: false, activeRef: null }),

  saveShipment: (queryType, query) => {
    const saved = get().saved;
    const exists = saved.some(s => s.query === query && s.queryType === queryType);
    if (exists) return;
    const updated = [{ queryType, query, savedAt: new Date().toISOString() }, ...saved];
    persistSaved(updated);
    set({ saved: updated });
  },

  removeSaved: (query, queryType) => {
    const updated = get().saved.filter(s => !(s.query === query && s.queryType === queryType));
    persistSaved(updated);
    set({ saved: updated });
  },

  search: async (queryType, query) => {
    if (!query.trim()) return;
    set({ loading: true, error: null, events: [], searched: false, activeRef: query.trim() });
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const params = new URLSearchParams({ [queryType]: query.trim() });
      const res = await fetch(`${base}/track?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      set({ events: data.events || [], loading: false, searched: true });
    } catch (err) {
      set({ error: err.message, loading: false, searched: true });
    }
  },
}));