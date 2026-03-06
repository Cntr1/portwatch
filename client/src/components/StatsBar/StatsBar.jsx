import { useScheduleStore } from '../../store/scheduleStore';

function Stat({ label, value, color, sub }) {
  return (
    <div style={{
      padding: '0.85rem 1.5rem',
      borderRight: '1px solid var(--border)',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', gap: '0.2rem',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: color }} />
      <div style={{ fontSize: '0.52rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>{label}</div>
      <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.8rem', color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.55rem', color: 'var(--text-mid)' }}>{sub}</div>}
    </div>
  );
}

export default function StatsBar() {
  const { getFiltered, vessels } = useScheduleStore();
  const filtered = getFiltered();
  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const arriving7d = vessels.filter(v => {
    if (v.isDummy) return false;
    const eta = new Date(v.etaEstimated || v.etaPlanned);
    return eta >= now && eta <= in7days;
  }).length;

  const terminals = [...new Set(filtered.map(v => v.facilitySMDGCode).filter(Boolean))];
  const withCutoffs = filtered.filter(v => v.cutoffs?.OBC || v.cutoffs?.DCO).length;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, auto) 1fr',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      flexShrink: 0,
    }}>
      <Stat label="Showing"      value={filtered.length}  color="var(--cyan)"   sub="vessels in view" />
      <Stat label="Next 7 Days"  value={arriving7d}       color="var(--green)"  sub="arriving Colombo" />
      <Stat label="Terminals"    value={terminals.length} color="var(--amber)"  sub={terminals.join(' · ') || '—'} />
      <Stat label="Cut-offs Set" value={withCutoffs}      color="var(--purple)" sub="have deadline data" />
      <div style={{ borderRight: '1px solid var(--border)' }} />
    </div>
  );
}