import { create } from 'zustand';

export const useScheduleStore = create((set, get) => ({
  vessels: [],
  fetchedAt: null,
  fromCache: false,
  loading: false,
  error: null,
  selectedVessel: null,
  search: '',
  filterTerminal: 'ALL',
  filterOperator: 'ALL',
  filterDays: 14,

  setSearch: (s) => set({ search: s }),
  setFilterTerminal: (t) => set({ filterTerminal: t }),
  setFilterOperator: (o) => set({ filterOperator: o }),
  setFilterDays: (d) => set({ filterDays: d }),
  selectVessel: (v) => set((s) => ({
    selectedVessel: s.selectedVessel?.imo === v?.imo &&
      s.selectedVessel?.voyageNumber === v?.voyageNumber ? null : v
  })),

  fetch: async (forceRefresh = false) => {
    set({ loading: true, error: null });
    try {
      const url = forceRefresh
        ? 'http://localhost:3001/schedules?refresh=true'
        : 'http://localhost:3001/schedules';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({
        vessels: data.vessels || [],
        fetchedAt: data.fetchedAt,
        fromCache: data.fromCache,
        loading: false,
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  getFiltered: () => {
    const { vessels, search, filterTerminal, filterOperator, filterDays } = get();
    const now = new Date();
    const cutoff = new Date(now.getTime() + filterDays * 24 * 60 * 60 * 1000);
    const q = search.toLowerCase();

    return vessels.filter(v => {
      if (v.isDummy) return false;
      const eta = v.etaEstimated || v.etaPlanned;
      if (!eta) return false;
      const etaDate = new Date(eta);
      if (etaDate < now || etaDate > cutoff) return false;
      if (filterTerminal !== 'ALL' && v.facilitySMDGCode !== filterTerminal) return false;

      // Operator filter
      if (filterOperator !== 'ALL') {
        if (filterOperator === 'OTHER') {
          if (v.operator) return false;
        } else {
          if (v.operator !== filterOperator) return false;
        }
      }

      if (q && !v.name?.toLowerCase().includes(q) &&
          !v.serviceName?.toLowerCase().includes(q) &&
          !v.voyageNumber?.toLowerCase().includes(q) &&
          !v.operator?.toLowerCase().includes(q)) return false;
      return true;
    });
  },
}));