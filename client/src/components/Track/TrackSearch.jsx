import { useTrackStore } from '../../store/trackStore';

const QUERY_TYPES = [
  { value: 'carrierBookingReference', label: 'Booking Ref' },
  { value: 'transportDocumentReference', label: 'Bill of Lading' },
  { value: 'equipmentReference', label: 'Container No.' },
];

export default function TrackSearch() {
  const { query, queryType, setQuery, setQueryType, search, loading } = useTrackStore();

  const handleSubmit = () => search(queryType, query);
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  const btnBase = {
    background: 'none', border: '1px solid var(--border)',
    color: 'var(--text-mid)', padding: '0.3rem 0.75rem',
    fontSize: '0.6rem', letterSpacing: '0.1em',
    textTransform: 'uppercase', cursor: 'pointer',
    fontFamily: 'IBM Plex Mono, monospace',
  };
  const btnActive = { ...btnBase, borderColor: 'var(--cyan)', color: 'var(--cyan)', background: 'var(--cyan-dim)' };

  return (
    <div style={{
      padding: '1rem 1.5rem',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {QUERY_TYPES.map(t => (
          <button key={t.value} onClick={() => setQueryType(t.value)}
            style={queryType === t.value ? btnActive : btnBase}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            queryType === 'carrierBookingReference' ? 'e.g. VAS000001' :
            queryType === 'transportDocumentReference' ? 'e.g. 260029935' :
            'e.g. APZU4812090'
          }
          style={{
            flex: 1, background: 'var(--panel)', border: '1px solid var(--border)',
            color: 'var(--text)', padding: '0.45rem 0.85rem',
            fontSize: '0.75rem', fontFamily: 'IBM Plex Mono, monospace', outline: 'none',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !query.trim()}
          style={{
            background: loading ? 'none' : 'var(--cyan-dim)',
            border: '1px solid var(--cyan)',
            color: loading ? 'var(--text-dim)' : 'var(--cyan)',
            padding: '0 1.25rem', fontSize: '0.6rem',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            cursor: loading ? 'default' : 'pointer',
            fontFamily: 'IBM Plex Mono, monospace',
          }}
        >
          {loading ? 'Searching…' : 'Track →'}
        </button>
      </div>
    </div>
  );
}