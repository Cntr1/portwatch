import { useScheduleStore } from '../../store/scheduleStore';
import { formatDateTime } from '../../utils/formatters';
import CutoffBadge from './CutoffBadge';

function Field({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '0.75rem 1rem', borderRight: '1px solid var(--border)' }}>
      <div style={{ fontSize: '0.5rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>{label}</div>
      <div style={{ fontSize: '0.75rem', color: color || 'var(--text)', fontWeight: 700 }}>{value || '—'}</div>
    </div>
  );
}

export default function VesselDetail() {
  const { selectedVessel, selectVessel } = useScheduleStore();
  if (!selectedVessel) return null;
  const v = selectedVessel;

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 3, height: 28, background: 'var(--cyan)' }} />
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{v.name}</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)', marginTop: 2 }}>
              {v.imo && `IMO ${v.imo} · `}{v.callSign && `${v.callSign} · `}{v.serviceName}
            </div>
          </div>
        </div>
        <button onClick={() => selectVessel(null)} style={{
          background: 'none', border: '1px solid var(--border)',
          color: 'var(--text-dim)', width: 26, height: 26,
          cursor: 'pointer', fontSize: '0.65rem',
        }}>✕</button>
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <Field label="Terminal"    value={v.terminal} />
        <Field label="Voyage"      value={v.voyageNumber} />
        <Field label="Service"     value={v.serviceCode} />
        <Field label="Operator"    value={v.operator} color="var(--cyan)" />
        <Field label="Flag"        value={v.flag} />
        <Field label="ETA (Est)"   value={formatDateTime(v.etaEstimated)} color="var(--cyan)" />
        <Field label="ETA (Plan)"  value={formatDateTime(v.etaPlanned)} />
        <Field label="ETD (Est)"   value={formatDateTime(v.etdEstimated)} />
        <Field label="ETD (Plan)"  value={formatDateTime(v.etdPlanned)} />
      </div>

      {/* Cutoffs */}
      {Object.values(v.cutoffs || {}).some(Boolean) && (
        <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.52rem', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', alignSelf: 'center' }}>Deadlines</div>
          {['OBC', 'DCO', 'VCO', 'FCO', 'ECP'].map(code => (
            <CutoffBadge key={code} code={code} value={v.cutoffs?.[code]} />
          ))}
        </div>
      )}
    </div>
  );
}