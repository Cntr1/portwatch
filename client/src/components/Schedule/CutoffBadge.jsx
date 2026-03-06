import { isPast } from '../../utils/formatters';

function hoursUntil(iso) {
  if (!iso) return Infinity;
  return (new Date(iso) - new Date()) / 3600000;
}

function fmtShort(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Colombo' });
}

function fmtTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Colombo' });
}

export default function CutoffCell({ value }) {
  if (!value) {
    return (
      <td style={{
        padding: '0 0.75rem', height: 38,
        textAlign: 'center', verticalAlign: 'middle',
        borderRight: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.12)',
        color: 'var(--border-hi)', fontSize: '0.7rem',
      }}>—</td>
    );
  }

  const h = hoursUntil(value);
  const past = h < 0;
  const critical = !past && h < 12;
  const urgent = !past && !critical && h < 48;

  const dateColor = past ? 'var(--text-dim)'
    : critical ? 'var(--red)'
    : urgent   ? 'var(--amber)'
    : 'var(--text-mid)';

  const bg = critical ? 'rgba(232,76,106,0.06)'
    : urgent ? 'rgba(240,165,0,0.04)'
    : 'rgba(0,0,0,0.12)';

  return (
    <td style={{
      padding: '0 0.75rem', height: 38,
      textAlign: 'center', verticalAlign: 'middle',
      borderRight: '1px solid var(--border)',
      background: bg,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <span style={{
          fontSize: '0.59rem', fontWeight: 500, lineHeight: 1.2,
          color: dateColor,
          textDecoration: past ? 'line-through' : 'none',
          opacity: past ? 0.5 : 1,
          animation: critical ? 'critpulse 1.4s ease-in-out infinite' : 'none',
        }}>
          {fmtShort(value)}
        </span>
        <span style={{
          fontSize: '0.5rem', color: past ? 'var(--text-dim)' : 'var(--text-dim)',
          opacity: past ? 0.4 : 1,
        }}>
          {fmtTime(value)}
        </span>
      </div>
    </td>
  );
}
