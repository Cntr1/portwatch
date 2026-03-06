export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Colombo',
  });
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: '2-digit',
    timeZone: 'Asia/Colombo',
  });
}

export function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Colombo',
  });
}

export function timeAgo(iso) {
  if (!iso) return '—';
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function daysUntil(iso) {
  if (!iso) return null;
  const diff = new Date(iso) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isUrgent(iso) {
  if (!iso) return false;
  const diff = new Date(iso) - new Date();
  return diff > 0 && diff < 1000 * 60 * 60 * 48; // within 48h
}

export function isPast(iso) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

export const TERMINAL_SHORT = {
  'CWIT': 'CWIT',
  'LKJCT': 'JCT',
  'SAGT': 'SAGT',
  'CICT': 'CICT',
  'CECT': 'CECT',
};

export const CUTOFF_LABELS = {
  OBC: 'On-Board',
  DCO: 'Docs',
  VCO: 'VGM',
  FCO: 'FCO',
  ECP: 'Empty',
};