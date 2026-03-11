import { useScheduleStore } from '../../store/scheduleStore';
import { formatDateTime, daysUntil, TERMINAL_SHORT } from '../../utils/formatters';
import CutoffCell from './CutoffBadge';

const OP_STYLES = {
  MSK:  { color: 'var(--cyan)',   border: 'rgba(41,196,224,0.3)',  bg: 'rgba(41,196,224,0.08)'  },
  HLC:  { color: 'var(--amber)',  border: 'rgba(240,165,0,0.3)',   bg: 'rgba(240,165,0,0.08)'   },
  CMA:  { color: 'var(--purple)', border: 'rgba(155,109,255,0.3)', bg: 'rgba(155,109,255,0.08)' },
  MSC:  { color: 'var(--green)',  border: 'rgba(45,216,144,0.3)',  bg: 'rgba(45,216,144,0.08)'  },
};

const TERM_STYLES = {
  CWIT:  { color: '#0077aa', border: 'rgba(0,119,170,0.3)',   bg: 'rgba(0,119,170,0.08)'   },
  SAGT:  { color: '#007a4d', border: 'rgba(0,122,77,0.3)',    bg: 'rgba(0,122,77,0.08)'    },
  CICT:  { color: '#6b3fa0', border: 'rgba(107,63,160,0.3)',  bg: 'rgba(107,63,160,0.08)'  },
  CECT:  { color: '#cc2233', border: 'rgba(204,34,51,0.3)',   bg: 'rgba(204,34,51,0.08)'   },
  LKJCT: { color: '#b36200', border: 'rgba(179,98,0,0.3)',    bg: 'rgba(179,98,0,0.08)'    },
};

export default function VesselRow({ vessel, index }) {
  const { selectedVessel, selectVessel } = useScheduleStore();
  const isSelected = selectedVessel?.imo === vessel.imo && selectedVessel?.voyageNumber === vessel.voyageNumber;

  const eta = vessel.etaEstimated || vessel.etaPlanned;
  const etd = vessel.etdEstimated || vessel.etdPlanned;
  const days = daysUntil(eta);
  const isEstimated = !!vessel.etaEstimated;

  const opStyle = OP_STYLES[vessel.operator];
  const termCode = vessel.facilitySMDGCode;
  const termStyle = TERM_STYLES[termCode] || { color: 'var(--text-mid)', border: 'var(--border)', bg: 'transparent' };
  const termLabel = TERMINAL_SHORT[termCode] || termCode;

  const etaColor = (() => {
    if (!eta) return 'var(--text-mid)';
    const h = (new Date(eta) - new Date()) / 3600000;
    if (h < 12)  return 'var(--amber)';
    if (h < 72)  return 'var(--green)';
    if (h < 168) return 'var(--cyan)';
    return 'var(--text-mid)';
  })();

  const relLabel = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days}d`;

  const tdBase = { height: 38, verticalAlign: 'middle', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap' };

  return (
    <tr
      onClick={() => selectVessel(vessel)}
      style={{
        borderBottom: '1px solid var(--border)',
        background: isSelected ? 'var(--cyan-glow)' : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.08s',
        animation: `fadeIn 0.15s ease ${Math.min(index * 0.012, 0.25)}s both`,
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--panel)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Vessel */}
      <td style={{ ...tdBase, padding: '0 0.75rem 0 1rem', minWidth: 195 }}>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.7rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180, display: 'block', lineHeight: 1.2 }}>
          {vessel.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
          <span style={{ fontSize: '0.52rem', color: 'var(--text-dim)' }}>IMO {vessel.imo || '—'} · {vessel.flag || '??'}</span>
          {opStyle && (
            <span style={{
              fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.07em',
              padding: '1px 4px', borderRadius: 2,
              color: opStyle.color, border: `1px solid ${opStyle.border}`, background: opStyle.bg,
            }}>{vessel.operator}</span>
          )}
        </div>
      </td>

      {/* Service */}
      <td style={{ ...tdBase, padding: '0 0.75rem', minWidth: 175 }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 165, display: 'block' }}>
          {vessel.serviceName || '—'}
        </span>
        <span style={{ fontSize: '0.52rem', color: 'var(--text-dim)', marginTop: 2, display: 'block' }}>
          VOY {vessel.voyageNumber} · {vessel.flag}
        </span>
      </td>

      {/* Terminal */}
      <td style={{ ...tdBase, padding: '0 0.75rem', textAlign: 'center', width: 72 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '2px 6px', borderRadius: 2,
          fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.05em',
          color: termStyle.color, border: `1px solid ${termStyle.border}`, background: termStyle.bg,
        }}>
          {termLabel}
        </span>
      </td>

      {/* ETA */}
      <td style={{ ...tdBase, padding: '0 0.75rem', minWidth: 120 }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 500, color: etaColor, lineHeight: 1.2 }}>
          {formatDateTime(eta)}
        </div>
        <div style={{ fontSize: '0.52rem', color: 'var(--text-dim)', marginTop: 2 }}>
          {isEstimated ? 'EST' : 'PLN'} · {relLabel}
        </div>
      </td>

      {/* ETD */}
      <td style={{ ...tdBase, padding: '0 0.75rem', width: 90 }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-mid)' }}>
          {etd ? new Date(etd).toLocaleString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Colombo' }) : '—'}
        </span>
      </td>

      {/* 5 cutoff columns */}
      <CutoffCell value={vessel.cutoffs?.OBC} />
      <CutoffCell value={vessel.cutoffs?.DCO} />
      <CutoffCell value={vessel.cutoffs?.VCO} />
      <CutoffCell value={vessel.cutoffs?.FCO} />
      <CutoffCell value={vessel.cutoffs?.ECP} />
    </tr>
  );
}
