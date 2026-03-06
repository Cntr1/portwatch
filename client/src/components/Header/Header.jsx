import { useState, useEffect } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { timeAgo } from '../../utils/formatters';

export default function Header() {
  const { fetchedAt, loading, fetch, getFiltered, vessels } = useScheduleStore();
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(`${String(n.getUTCHours()).padStart(2,'0')}:${String(n.getUTCMinutes()).padStart(2,'0')}:${String(n.getUTCSeconds()).padStart(2,'0')} UTC`);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  const filtered = getFiltered();
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 24 * 3600000);
  const next7 = vessels.filter(v => {
    if (v.isDummy) return false;
    const eta = new Date(v.etaEstimated || v.etaPlanned);
    return eta >= now && eta <= in7;
  }).length;
  const urgentCount = vessels
    .flatMap(v => Object.values(v.cutoffs || {}))
    .filter(d => { if (!d) return false; const h = (new Date(d) - now) / 3600000; return h > 0 && h < 48; }).length;
  const termCount = [...new Set(filtered.map(v => v.facilitySMDGCode).filter(Boolean))].length;

  const sep = { width: 1, height: 20, background: 'var(--border)', flexShrink: 0 };

  const hstat = (val, label, color) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', padding: '0 1rem' }}>
      <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: '1rem', color, lineHeight: 1 }}>{val}</span>
      <span style={{ fontSize: '0.52rem', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1.5rem', height: 48, minHeight: 48,
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      gap: '1rem', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexShrink: 0 }}>
        <div style={{
          width: 26, height: 26, border: '1.5px solid var(--cyan)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--cyan)', fontSize: '0.75rem', position: 'relative', flexShrink: 0,
        }}>⚓</div>
        <div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            PortWatch
          </div>
          <div style={{ fontSize: '0.5rem', color: 'var(--text-dim)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 1 }}>
            Colombo · Vessel Schedule Intelligence
          </div>
        </div>
      </div>

      {/* Stats pills */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <div style={{ ...sep }} />
        {hstat(filtered.length, 'in view', 'var(--cyan)')}
        <div style={{ ...sep }} />
        {hstat(next7, 'next 7 days', 'var(--green)')}
        <div style={{ ...sep }} />
        {hstat(urgentCount, 'urgent cut-offs', 'var(--amber)')}
        <div style={{ ...sep }} />
        {hstat(termCount, 'terminals', 'var(--text-mid)')}
        <div style={{ ...sep }} />
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
        {fetchedAt && (
          <div style={{ fontSize: '0.58rem', color: 'var(--text-mid)', letterSpacing: '0.06em' }}>
            Updated {timeAgo(fetchedAt)}
          </div>
        )}
        <button
          onClick={() => fetch(true)}
          disabled={loading}
          style={{
            background: 'none', border: '1px solid var(--border)',
            color: loading ? 'var(--text-dim)' : 'var(--cyan)',
            padding: '0.25rem 0.65rem', fontSize: '0.58rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: loading ? 'default' : 'pointer',
            fontFamily: "'IBM Plex Mono', monospace",
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            transition: 'border-color 0.15s',
          }}
        >
          <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.08em', minWidth: 112, textAlign: 'right' }}>
          {time}
        </div>
      </div>
    </header>
  );
}
