import { useScheduleStore } from '../../store/scheduleStore';
import VesselRow from './VesselRow';

const TH = ({ children, style = {} }) => (
  <th style={{
    padding: '0 0.75rem', height: 30, textAlign: 'left',
    fontSize: '0.5rem', letterSpacing: '0.18em', textTransform: 'uppercase',
    color: 'var(--text-dim)', fontWeight: 500,
    borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
    background: 'var(--surface)', position: 'sticky', top: 0,
    whiteSpace: 'nowrap', zIndex: 5,
    ...style,
  }}>
    {children}
  </th>
);

const TH_CO = ({ children }) => (
  <th style={{
    padding: '0 0.75rem', height: 30, textAlign: 'center',
    fontSize: '0.5rem', letterSpacing: '0.18em', textTransform: 'uppercase',
    color: 'var(--text-dim)', fontWeight: 500,
    borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.015)', position: 'sticky', top: 0,
    whiteSpace: 'nowrap', zIndex: 5,
  }}>
    {children}
  </th>
);

export default function ScheduleTable() {
  const { loading, error, getFiltered, vessels } = useScheduleStore();
  const filtered = getFiltered();

  // Footer counts
  const now = new Date();
  let warnCount = 0, critCount = 0;
  filtered.forEach(v => {
    Object.values(v.cutoffs || {}).forEach(d => {
      if (!d) return;
      const h = (new Date(d) - now) / 3600000;
      if (h >= 0 && h < 12) critCount++;
      else if (h >= 0 && h < 48) warnCount++;
    });
  });

  if (loading && filtered.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: '1rem', color: 'var(--text-dim)' }}>
        <div style={{ width: 22, height: 22, border: '2px solid var(--border)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em' }}>LOADING SCHEDULES…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--red)', fontSize: '0.7rem' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Scrollable table */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1080 }}>
          <colgroup>
            <col style={{ width: 205 }} />
            <col style={{ width: 185 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 128 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 88 }} />
            <col style={{ width: 88 }} />
            <col style={{ width: 88 }} />
            <col style={{ width: 88 }} />
            <col style={{ width: 88 }} />
          </colgroup>
          <thead>
            <tr>
              <TH style={{ paddingLeft: '1rem' }}>Vessel</TH>
              <TH>Service / Voyage</TH>
              <TH style={{ textAlign: 'center' }}>Term.</TH>
              <TH>ETA Colombo</TH>
              <TH style={{ borderRight: '1px solid var(--border)' }}>ETD</TH>
              <TH_CO>On-Board</TH_CO>
              <TH_CO>Docs</TH_CO>
              <TH_CO>VGM</TH_CO>
              <TH_CO>FCO</TH_CO>
              <TH_CO style={{ borderRight: 'none' }}>Empty</TH_CO>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)', fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                  No vessels match current filters
                </td>
              </tr>
            ) : (
              filtered.map((v, i) => (
                <VesselRow
                  key={`${v.imo || v.name}-${v.voyageNumber}-${i}`}
                  vessel={v}
                  index={i}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.5rem', height: 26, minHeight: 26,
        borderTop: '1px solid var(--border)', background: 'var(--surface)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.54rem', color: 'var(--text-dim)', letterSpacing: '0.07em' }}>
          <span>{filtered.length} vessel{filtered.length !== 1 ? 's' : ''} shown</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }} />
            <span>{warnCount} urgent cut-offs (≤48h)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
            <span>{critCount} critical (≤12h)</span>
          </div>
        </div>
        <div style={{ fontSize: '0.54rem', color: 'var(--text-dim)', letterSpacing: '0.07em' }}>
          {vessels.length} total vessels · Maersk DCSA API
        </div>
      </div>
    </div>
  );
}
