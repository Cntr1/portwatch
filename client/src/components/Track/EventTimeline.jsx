import { formatDateTime } from '../../utils/formatters';

const EVENT_ICONS = {
  SHIPMENT: '📋',
  EQUIPMENT: '📦',
  TRANSPORT: '🚢',
};

const CLASSIFIER_COLORS = {
  ACT: 'var(--green)',
  EST: 'var(--cyan)',
  PLN: 'var(--text-mid)',
};

const CLASSIFIER_LABELS = {
  ACT: 'Actual',
  EST: 'Estimated',
  PLN: 'Planned',
};

const EQUIPMENT_CODES = {
  LOAD: 'Loaded onto vessel',
  DISC: 'Discharged from vessel',
  GTIN: 'Gated in to terminal',
  GTOT: 'Gated out of terminal',
  STUF: 'Container stuffed',
  STRP: 'Container stripped',
  PICK: 'Picked up',
  DROP: 'Dropped off',
  INSP: 'Inspected',
  RSEA: 'Resealed',
  RMVD: 'Removed',
};

const TRANSPORT_CODES = {
  DEPA: 'Vessel departed',
  ARRI: 'Vessel arrived',
};

const SHIPMENT_CODES = {
  RECE: 'Booking received',
  DRFT: 'Booking in draft',
  PENA: 'Pending approval',
  CONF: 'Booking confirmed',
  REJE: 'Booking rejected',
  CANC: 'Booking cancelled',
  ISSU: 'Bill of Lading issued',
  SURR: 'Bill of Lading surrendered',
  VOID: 'Bill of Lading voided',
};

function getEventDescription(event) {
  if (event.eventType === 'EQUIPMENT') return EQUIPMENT_CODES[event.equipmentEventTypeCode] || event.equipmentEventTypeCode;
  if (event.eventType === 'TRANSPORT') return TRANSPORT_CODES[event.transportEventTypeCode] || event.transportEventTypeCode;
  if (event.eventType === 'SHIPMENT') return SHIPMENT_CODES[event.shipmentEventTypeCode] || event.shipmentEventTypeCode;
  return 'Unknown event';
}

function getLocation(event) {
  const tc = event.transportCall;
  if (!tc) return null;
  const parts = [tc.location?.locationName, tc.UNLocationCode, tc.facilitySMDGCode].filter(Boolean);
  return parts.join(' · ') || null;
}

export default function EventTimeline({ events }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Summary */}
      <div style={{ marginBottom: '1.5rem', fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.12em' }}>
        {events.length} EVENTS · {events[0]?.equipmentReference && `Container: ${events[0].equipmentReference}`}
      </div>

      {events.map((event, i) => {
        const isLast = i === events.length - 1;
        const color = CLASSIFIER_COLORS[event.eventClassifierCode] || 'var(--text-dim)';
        const isActual = event.eventClassifierCode === 'ACT';
        const location = getLocation(event);

        return (
          <div key={event.eventID || i} style={{ display: 'flex', gap: '1rem' }}>
            {/* Timeline spine */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: isActual ? color : 'transparent',
                border: `2px solid ${color}`,
                flexShrink: 0, marginTop: 4,
              }} />
              {!isLast && <div style={{ width: 1, flex: 1, background: 'var(--border)', minHeight: 24 }} />}
            </div>

            {/* Event content */}
            <div style={{ paddingBottom: isLast ? 0 : '1.25rem', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: 3 }}>
                <span style={{ fontSize: '0.75rem', color: isActual ? '#fff' : 'var(--text)', fontWeight: isActual ? 700 : 400 }}>
                  {EVENT_ICONS[event.eventType]} {getEventDescription(event)}
                </span>
                <span style={{
                  fontSize: '0.48rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                  color, border: `1px solid ${color}33`, padding: '1px 5px',
                }}>
                  {CLASSIFIER_LABELS[event.eventClassifierCode]}
                </span>
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-mid)', marginBottom: location ? 2 : 0 }}>
                {formatDateTime(event.eventDateTime)}
              </div>
              {location && (
                <div style={{ fontSize: '0.58rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                  📍 {location}
                </div>
              )}
              {event.description && (
                <div style={{ fontSize: '0.58rem', color: 'var(--text-dim)', marginTop: 2 }}>
                  {event.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}