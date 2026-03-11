import { useState } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { formatDateTime, daysUntil, isUrgent, isPast } from '../../utils/formatters';

const TERMINAL_COLORS = {
  CWIT: '#0077aa', SAGT: '#007a4d', CICT: '#6b3fa0', LKJCT: '#b36200', CECT: '#cc2233',
};

function CutoffDot({ value }) {
  if (!value) return null;
  const urgent = isUrgent(value);
  const past = isPast(value);
  if (past) return null;
  return (
    <div style={{
      width: 7, height: 7, borderRadius: '50%',
      background: urgent ? 'var(--amber)' : 'var(--green)',
      animation: urgent ? 'critpulse 1s ease-in-out infinite' : 'none',
      flexShrink: 0,
    }} />
  );
}

function VesselCard({ vessel, onSelect, isSelected }) {
  const eta = vessel.etaEstimated || vessel.etaPlanned;
  const days = daysUntil(eta);
  const termColor = TERMINAL_COLORS[vessel.facilitySMDGCode] || 'var(--text-dim)';
  const urgentCutoffs = Object.values(vessel.cutoffs || {}).filter(d => d && isUrgent(d));
  const hasCritical = Object.values(vessel.cutoffs || {}).some(d => {
    if (!d) return false;
    const h = (new Date(d) - new Date()) / 3600000;
    return h > 0 && h < 12;
  });

  return (
    <div
      onClick={() => onSelect(isSelected ? null : vessel)}
      style={{
        background: 'var(--surface)',
        borderLeft: `3px solid ${termColor}`,
        padding: '0.75rem 1rem',
        marginBottom: 1,
        cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
          <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {vessel.name}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: 2 }}>
            {vessel.serviceName || '—'} · VOY {vessel.voyageNumber}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {urgentCutoffs.length > 0 && <CutoffDot value={urgentCutoffs[0]} />}
          <span style={{
            fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em',
            color: termColor, background: `${termColor}18`,
            padding: '2px 6px', border: `1px solid ${termColor}44`,
          }}>
            {vessel.facilitySMDGCode}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 600 }}>
            {formatDateTime(eta)}
          </div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)' }}>
            {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`} · {vessel.etaEstimated ? 'EST' : 'PLN'}
          </div>
        </div>
        {hasCritical && (
          <div style={{
            fontSize: '0.5rem', letterSpacing: '0.1em',
            color: 'var(--red)', border: '1px solid var(--red)',
            padding: '2px 6px', animation: 'critpulse 1s ease-in-out infinite',
          }}>
            CRITICAL
          </div>
        )}
      </div>

      {/* Expanded cut-offs */}
      {isSelected && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.52rem', color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: 6 }}>CUT-OFF DEADLINES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[
              { code: 'OBC', label: 'On-Board' },
              { code: 'DCO', label: 'Docs' },
              { code: 'VCO', label: 'VGM' },
              { code: 'FCO', label: 'FCO' },
              { code: 'ECP', label: 'Empty' },
            ].map(({ code, label }) => {
              const val = vessel.cutoffs?.[code];
              const urgent = val && isUrgent(val);
              const past = val && isPast(val);
              return (
                <div key={code} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: '0.48rem', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>{label}</div>
                  <div style={{
                    fontSize: '0.58rem',
                    color: !val ? 'var(--text-dim)' : past ? 'var(--text-dim)' : urgent ? 'var(--amber)' : 'var(--green)',
                    textDecoration: past ? 'line-through' : 'none',
                  }}>
                    {val ? formatDateTime(val) : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MobileSchedules() {
  const { getFiltered, search, setSearch, filterTerminal, setFilterTerminal } = useScheduleStore();
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const vessels = getFiltered();

  const TERMINALS = ['ALL', 'CWIT', 'LKJCT', 'SAGT', 'CICT', 'CECT'];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Search + filter bar */}
      <div style={{
        padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', display: 'flex', gap: '0.5rem', flexShrink: 0,
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vessel, service…"
          style={{
            flex: 1, background: 'var(--panel)', border: '1px solid var(--border)',
            color: 'var(--text)', padding: '0.4rem 0.65rem',
            fontSize: '0.75rem', fontFamily: 'IBM Plex Mono, monospace', outline: 'none',
            borderRadius: 0,
          }}
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            background: showFilters ? 'var(--cyan-dim)' : 'none',
            border: `1px solid ${showFilters ? 'var(--cyan)' : 'var(--border)'}`,
            color: showFilters ? 'var(--cyan)' : 'var(--text-mid)',
            padding: '0 0.75rem', fontSize: '0.6rem',
            letterSpacing: '0.1em', cursor: 'pointer',
            fontFamily: 'IBM Plex Mono, monospace',
          }}
        >
          FILTER {filterTerminal !== 'ALL' ? '●' : ''}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div style={{
          padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)',
          background: 'var(--panel)', display: 'flex', gap: '0.3rem', flexWrap: 'wrap', flexShrink: 0,
        }}>
          {TERMINALS.map(t => (
            <button key={t} onClick={() => setFilterTerminal(t)} style={{
              background: filterTerminal === t ? 'var(--cyan-dim)' : 'none',
              border: `1px solid ${filterTerminal === t ? 'var(--cyan)' : 'var(--border)'}`,
              color: filterTerminal === t ? 'var(--cyan)' : 'var(--text-mid)',
              padding: '0.25rem 0.6rem', fontSize: '0.58rem',
              cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: '0.08em',
            }}>
              {t === 'ALL' ? 'All' : t}
            </button>
          ))}
        </div>
      )}

      {/* Count bar */}
      <div style={{
        padding: '0.35rem 0.75rem', background: 'var(--panel)',
        borderBottom: '1px solid var(--border)',
        fontSize: '0.55rem', color: 'var(--text-dim)', letterSpacing: '0.1em', flexShrink: 0,
      }}>
        {vessels.length} VESSELS IN VIEW
      </div>

      {/* Vessel cards */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {vessels.map(v => (
          <VesselCard
            key={`${v.imo}-${v.voyageNumber}`}
            vessel={v}
            isSelected={selectedVessel?.imo === v.imo && selectedVessel?.voyageNumber === v.voyageNumber}
            onSelect={setSelectedVessel}
          />
        ))}
        {vessels.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
            No vessels match current filters
          </div>
        )}
      </div>
    </div>
  );
}