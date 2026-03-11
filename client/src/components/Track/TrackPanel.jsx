import { useTrackStore } from '../../store/trackStore';
import TrackSearch from './TrackSearch';
import EventTimeline from './EventTimeline';

const TYPE_LABELS = {
  carrierBookingReference: 'BKG',
  transportDocumentReference: 'B/L',
  equipmentReference: 'CTR',
};

const TYPE_COLORS = {
  carrierBookingReference: 'var(--cyan)',
  transportDocumentReference: 'var(--green)',
  equipmentReference: 'var(--amber)',
};

export default function TrackPanel() {
  const { events, loading, error, searched, saved, removeSaved, search, saveShipment, activeRef, queryType, query } = useTrackStore();

  const isSaved = saved.some(s => s.query === activeRef);
  const showSaveBtn = searched && !error && activeRef && !isSaved;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TrackSearch />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', gap: 0 }}>

        {/* Saved shipments sidebar */}
        <div style={{
          width: 220, flexShrink: 0,
          borderRight: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border)',
            fontSize: '0.52rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--text-dim)',
          }}>
            My Shipments {saved.length > 0 && `(${saved.length})`}
          </div>

          {saved.length === 0 && (
            <div style={{ padding: '1rem', fontSize: '0.6rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
              Track a shipment and save it here for quick access.
            </div>
          )}

          {saved.map(s => {
            const isActive = s.query === activeRef;
            const color = TYPE_COLORS[s.queryType];
            return (
              <div
                key={`${s.queryType}-${s.query}`}
                style={{
                  padding: '0.65rem 1rem',
                  borderBottom: '1px solid var(--border)',
                  borderLeft: isActive ? `2px solid ${color}` : '2px solid transparent',
                  background: isActive ? 'var(--cyan-dim)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 3,
                }}
                onClick={() => search(s.queryType, s.query)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.48rem', letterSpacing: '0.1em',
                    color, border: `1px solid ${color}33`,
                    padding: '1px 4px',
                  }}>
                    {TYPE_LABELS[s.queryType]}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); removeSaved(s.query, s.queryType); }}
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--text-dim)', cursor: 'pointer',
                      fontSize: '0.6rem', padding: 0, lineHeight: 1,
                    }}
                  >✕</button>
                </div>
                <div style={{ fontSize: '0.65rem', color: isActive ? 'var(--cyan)' : 'var(--text)', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.04em' }}>
                  {s.query}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>

          {/* Save button */}
          {showSaveBtn && (
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                onClick={() => saveShipment(queryType, activeRef)}
                style={{
                  background: 'var(--green-dim)', border: '1px solid var(--green)',
                  color: 'var(--green)', padding: '0.3rem 0.85rem',
                  fontSize: '0.58rem', letterSpacing: '0.12em',
                  textTransform: 'uppercase', cursor: 'pointer',
                  fontFamily: 'IBM Plex Mono, monospace',
                }}
              >
                + Save to My Shipments
              </button>
            </div>
          )}

          {isSaved && searched && (
            <div style={{ marginBottom: '1.25rem', fontSize: '0.58rem', color: 'var(--text-dim)' }}>
              ✓ Saved to My Shipments
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '0.12em' }}>
              <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              FETCHING EVENTS…
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--red)', fontSize: '0.7rem', padding: '1rem', border: '1px solid var(--red-dim)', background: 'var(--red-dim)' }}>
              {error}
            </div>
          )}

          {!loading && searched && events.length === 0 && !error && (
            <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '0.1em' }}>
              No events found. Check the reference number or ensure your Maersk account is a party to this shipment.
            </div>
          )}

          {!loading && events.length > 0 && <EventTimeline events={events} />}

          {!searched && !loading && (
            <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '0.08em', lineHeight: 1.8 }}>
              Enter a booking reference, Bill of Lading number, or container number above to track a Maersk shipment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}