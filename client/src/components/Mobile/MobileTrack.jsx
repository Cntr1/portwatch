import { useState } from 'react';
import { useTrackStore } from '../../store/trackStore';
import { formatDateTime } from '../../utils/formatters';

const QUERY_TYPES = [
  { value: 'carrierBookingReference', label: 'Booking Ref' },
  { value: 'transportDocumentReference', label: 'Bill of Lading' },
  { value: 'equipmentReference', label: 'Container No.' },
];

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

const EQUIPMENT_CODES = {
  LOAD: 'Loaded onto vessel', DISC: 'Discharged from vessel',
  GTIN: 'Gated in to terminal', GTOT: 'Gated out of terminal',
  STUF: 'Container stuffed', STRP: 'Container stripped',
  PICK: 'Picked up', DROP: 'Dropped off',
};
const TRANSPORT_CODES = { DEPA: 'Vessel departed', ARRI: 'Vessel arrived' };
const SHIPMENT_CODES = {
  RECE: 'Booking received', CONF: 'Booking confirmed',
  REJE: 'Booking rejected', CANC: 'Booking cancelled',
  ISSU: 'Bill of Lading issued', SURR: 'Bill of Lading surrendered',
};

function getDesc(event) {
  if (event.eventType === 'EQUIPMENT') return EQUIPMENT_CODES[event.equipmentEventTypeCode] || event.equipmentEventTypeCode;
  if (event.eventType === 'TRANSPORT') return TRANSPORT_CODES[event.transportEventTypeCode] || event.transportEventTypeCode;
  if (event.eventType === 'SHIPMENT') return SHIPMENT_CODES[event.shipmentEventTypeCode] || event.shipmentEventTypeCode;
  return 'Event';
}

const CLASSIFIER_COLORS = { ACT: 'var(--green)', EST: 'var(--cyan)', PLN: 'var(--text-mid)' };

export default function MobileTrack() {
  const { events, loading, error, searched, saved, removeSaved, search, saveShipment, activeRef, queryType, query, setQuery, setQueryType } = useTrackStore();
  const [showSaved, setShowSaved] = useState(false);
  const isSaved = saved.some(s => s.query === activeRef);
  const showSaveBtn = searched && !error && activeRef && !isSaved && events.length > 0;

  const handleSearch = () => search(queryType, query);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Search area */}
      <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        {/* Type selector */}
        <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
          {QUERY_TYPES.map(t => (
            <button key={t.value} onClick={() => setQueryType(t.value)} style={{
              flex: 1, padding: '0.3rem 0', fontSize: '0.55rem', letterSpacing: '0.08em',
              background: queryType === t.value ? 'var(--cyan-dim)' : 'none',
              border: `1px solid ${queryType === t.value ? 'var(--cyan)' : 'var(--border)'}`,
              color: queryType === t.value ? 'var(--cyan)' : 'var(--text-mid)',
              cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Input + button */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={
              queryType === 'carrierBookingReference' ? 'e.g. VAS000001' :
              queryType === 'transportDocumentReference' ? 'e.g. 260029935' : 'e.g. APZU4812090'
            }
            style={{
              flex: 1, background: 'var(--panel)', border: '1px solid var(--border)',
              color: 'var(--text)', padding: '0.5rem 0.75rem',
              fontSize: '0.8rem', fontFamily: 'IBM Plex Mono, monospace', outline: 'none',
            }}
          />
          <button onClick={handleSearch} disabled={loading || !query.trim()} style={{
            background: 'var(--cyan-dim)', border: '1px solid var(--cyan)',
            color: 'var(--cyan)', padding: '0 1rem', fontSize: '0.7rem',
            cursor: loading ? 'default' : 'pointer',
            fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.1em',
          }}>
            {loading ? '…' : '→'}
          </button>
        </div>
      </div>

      {/* Saved shipments collapsible */}
      {saved.length > 0 && (
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--panel)', flexShrink: 0 }}>
          <button onClick={() => setShowSaved(!showSaved)} style={{
            width: '100%', padding: '0.5rem 0.75rem', background: 'none', border: 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', color: 'var(--text-mid)', fontSize: '0.58rem',
            letterSpacing: '0.12em', fontFamily: 'IBM Plex Mono, monospace',
          }}>
            <span>MY SHIPMENTS ({saved.length})</span>
            <span>{showSaved ? '▲' : '▼'}</span>
          </button>
          {showSaved && (
            <div style={{ maxHeight: 160, overflowY: 'auto' }}>
              {saved.map(s => (
                <div key={`${s.queryType}-${s.query}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem', borderTop: '1px solid var(--border)',
                    background: s.query === activeRef ? 'var(--cyan-dim)' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => { search(s.queryType, s.query); setShowSaved(false); }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.48rem', color: TYPE_COLORS[s.queryType], border: `1px solid ${TYPE_COLORS[s.queryType]}44`, padding: '1px 4px' }}>
                      {TYPE_LABELS[s.queryType]}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace' }}>
                      {s.query}
                    </span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeSaved(s.query, s.queryType); }} style={{
                    background: 'none', border: 'none', color: 'var(--text-dim)',
                    cursor: 'pointer', fontSize: '0.7rem', padding: '0 0.25rem',
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>

        {showSaveBtn && (
          <button onClick={() => saveShipment(queryType, activeRef)} style={{
            width: '100%', marginBottom: '0.75rem',
            background: 'var(--green-dim)', border: '1px solid var(--green)',
            color: 'var(--green)', padding: '0.5rem',
            fontSize: '0.6rem', letterSpacing: '0.12em',
            cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace',
          }}>
            + SAVE TO MY SHIPMENTS
          </button>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '2rem', color: 'var(--text-dim)', fontSize: '0.65rem' }}>
            <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Fetching events…
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--red)', fontSize: '0.7rem', padding: '0.75rem', background: 'var(--red-dim)', border: '1px solid var(--red)' }}>
            {error}
          </div>
        )}

        {!loading && searched && events.length === 0 && !error && (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textAlign: 'center', padding: '2rem 1rem', lineHeight: 1.7 }}>
            No events found. Check the reference or ensure your Maersk account is linked to this shipment.
          </div>
        )}

        {!loading && !searched && (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textAlign: 'center', padding: '2rem 1rem', lineHeight: 1.8 }}>
            Enter a booking reference, Bill of Lading, or container number to track a Maersk shipment.
          </div>
        )}

        {/* Timeline */}
        {!loading && events.length > 0 && (
          <div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
              {events.length} EVENTS
            </div>
            {events.map((event, i) => {
              const isActual = event.eventClassifierCode === 'ACT';
              const color = CLASSIFIER_COLORS[event.eventClassifierCode] || 'var(--text-dim)';
              const tc = event.transportCall;
              const location = tc ? [tc.location?.locationName, tc.UNLocationCode].filter(Boolean).join(' · ') : null;
              const isLast = i === events.length - 1;

              return (
                <div key={event.eventID || i} style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16, flexShrink: 0 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', marginTop: 3,
                      background: isActual ? color : 'transparent',
                      border: `2px solid ${color}`, flexShrink: 0,
                    }} />
                    {!isLast && <div style={{ width: 1, flex: 1, background: 'var(--border)', minHeight: 20 }} />}
                  </div>
                  <div style={{ paddingBottom: isLast ? 0 : '1rem', flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: isActual ? 'var(--text)' : 'var(--text-mid)', fontWeight: isActual ? 600 : 400, marginBottom: 2 }}>
                      {getDesc(event)}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-mid)', marginBottom: location ? 2 : 0 }}>
                      {formatDateTime(event.eventDateTime)}
                      <span style={{ marginLeft: 6, fontSize: '0.5rem', color, border: `1px solid ${color}44`, padding: '1px 4px' }}>
                        {event.eventClassifierCode}
                      </span>
                    </div>
                    {location && <div style={{ fontSize: '0.58rem', color: 'var(--text-dim)' }}>📍 {location}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}