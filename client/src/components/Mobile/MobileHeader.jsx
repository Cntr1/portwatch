import { useScheduleStore } from '../../store/scheduleStore';

export default function MobileHeader() {
  const { loading, fetch, vessels } = useScheduleStore();
  const now = new Date();
  const urgentCount = vessels
    .flatMap(v => Object.values(v.cutoffs || {}))
    .filter(d => { if (!d) return false; const h = (new Date(d) - now) / 3600000; return h > 0 && h < 48; }).length;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1rem', height: 48, flexShrink: 0,
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: 22, height: 22, border: '1.5px solid var(--cyan)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--cyan)', fontSize: '0.65rem',
        }}>⚓</div>
        <div>
          <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text)', letterSpacing: '0.1em' }}>
            PORTWATCH
          </div>
          <div style={{ fontSize: '0.45rem', color: 'var(--text-dim)', letterSpacing: '0.15em' }}>
            COLOMBO · VESSEL INTELLIGENCE
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {urgentCount > 0 && (
          <div style={{
            background: 'var(--amber-dim)', border: '1px solid var(--amber)',
            color: 'var(--amber)', padding: '2px 8px',
            fontSize: '0.55rem', letterSpacing: '0.08em',
          }}>
            {urgentCount} URGENT
          </div>
        )}
        <button
          onClick={() => fetch(true)}
          disabled={loading}
          style={{
            background: 'none', border: '1px solid var(--border)',
            color: loading ? 'var(--text-dim)' : 'var(--cyan)',
            width: 30, height: 30, cursor: loading ? 'default' : 'pointer',
            fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
        </button>
      </div>
    </div>
  );
}