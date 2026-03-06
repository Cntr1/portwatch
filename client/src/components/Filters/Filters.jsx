import { useScheduleStore } from '../../store/scheduleStore';

const TERMINALS = [
  { code: 'ALL',   label: 'All Terminals' },
  { code: 'CWIT',  label: 'CWIT' },
  { code: 'LKJCT', label: 'JCT' },
  { code: 'SAGT',  label: 'SAGT' },
  { code: 'CICT',  label: 'CICT' },
  { code: 'CECT',  label: 'CECT' },
];

const OPERATORS = [
  { code: 'ALL',   label: 'All Carriers',  activeClass: 'text' },
  { code: 'MSK',   label: 'Maersk',        color: 'var(--cyan)',   dimColor: 'rgba(41,196,224,0.10)'  },
  { code: 'HLC',   label: 'Hapag-Lloyd',   color: 'var(--amber)',  dimColor: 'rgba(240,165,0,0.10)'   },
  { code: 'CMA',   label: 'CMA CGM',       color: 'var(--purple)', dimColor: 'rgba(155,109,255,0.10)' },
  { code: 'OTHER', label: 'Feeders',       color: 'var(--green)',  dimColor: 'rgba(45,216,144,0.10)'  },
];

const DAY_RANGES = [7, 14, 30, 60, 90];

const SEP = () => (
  <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0, margin: '0 0.75rem' }} />
);

const FLABEL = ({ children }) => (
  <span style={{ fontSize: '0.5rem', color: 'var(--text-dim)', letterSpacing: '0.2em', textTransform: 'uppercase', marginRight: '0.4rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
    {children}
  </span>
);

export default function Filters() {
  const {
    search, setSearch,
    filterTerminal, setFilterTerminal,
    filterOperator, setFilterOperator,
    filterDays, setFilterDays,
    vessels,
  } = useScheduleStore();

  const now = new Date();
  const cutoff = new Date(now.getTime() + filterDays * 24 * 3600000);
  const active = vessels.filter(v => {
    if (v.isDummy) return false;
    const eta = new Date(v.etaEstimated || v.etaPlanned);
    return eta >= now && eta <= cutoff;
  });
  const counts = {
    ALL:   active.length,
    MSK:   active.filter(v => v.operator === 'MSK').length,
    HLC:   active.filter(v => v.operator === 'HLC').length,
    CMA:   active.filter(v => v.operator === 'CMA').length,
    OTHER: active.filter(v => !v.operator).length,
  };

  const chip = (label, isActive, color, dimColor, onClick, count) => {
    const base = {
      background: isActive ? (dimColor || 'var(--panel)') : 'none',
      border: `1px solid ${isActive ? (color || 'var(--border-hi)') : 'transparent'}`,
      color: isActive ? (color || 'var(--text)') : 'var(--text-dim)',
      padding: '0.18rem 0.48rem',
      fontSize: '0.56rem', letterSpacing: '0.06em',
      cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace",
      transition: 'all 0.1s', borderRadius: 2,
      display: 'flex', alignItems: 'center', gap: '0.3rem',
      whiteSpace: 'nowrap', flexShrink: 0,
    };
    return (
      <button key={label} onClick={onClick} style={base}>
        {label}
        {count !== undefined && (
          <span style={{
            fontSize: '0.5rem', fontWeight: 600,
            padding: '0 3px', borderRadius: 2,
            background: 'rgba(255,255,255,0.06)',
            lineHeight: 1.5,
          }}>{count}</span>
        )}
      </button>
    );
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '0 1.5rem', height: 36, minHeight: 36,
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      flexShrink: 0, overflow: 'hidden', gap: 0,
    }}>
      <FLABEL>Carrier</FLABEL>
      <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
        {OPERATORS.map(op => chip(
          op.label,
          filterOperator === op.code,
          op.color || 'var(--text)',
          op.dimColor || 'var(--panel)',
          () => setFilterOperator(op.code),
          counts[op.code],
        ))}
      </div>

      <SEP />
      <FLABEL>Terminal</FLABEL>
      <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
        {TERMINALS.map(t => chip(
          t.label,
          filterTerminal === t.code,
          'var(--cyan)', 'var(--cyan-dim)',
          () => setFilterTerminal(t.code),
        ))}
      </div>

      <SEP />
      <FLABEL>Window</FLABEL>
      <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
        {DAY_RANGES.map(d => chip(
          `${d}d`,
          filterDays === d,
          'var(--cyan)', 'var(--cyan-dim)',
          () => setFilterDays(d),
        ))}
      </div>

      <SEP />
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search vessel, service, voyage…"
        style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          color: 'var(--text)', padding: '0.18rem 0.6rem',
          fontSize: '0.6rem', fontFamily: "'IBM Plex Mono', monospace",
          width: 200, outline: 'none', height: 22, borderRadius: 2, flexShrink: 0,
        }}
      />
    </div>
  );
}
