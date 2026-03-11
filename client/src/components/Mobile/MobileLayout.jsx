import { useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobileHeader from './MobileHeader';
import MobileSchedules from './MobileSchedules';
import MobileTrack from './MobileTrack';

export default function MobileLayout() {
  const [activeTab, setActiveTab] = useState('track');

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      <MobileHeader />

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'schedules' && <MobileSchedules />}
        {activeTab === 'track' && <MobileTrack />}
      </div>

      {/* Bottom tab bar */}
      <div style={{
      display: 'flex',
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      flexShrink: 0,
      height: 56,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
        {[
          { key: 'track', icon: '📦', label: 'Track' },
          { key: 'schedules', icon: '⚓', label: 'Schedules' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              background: 'none', border: 'none',
              borderTop: activeTab === tab.key ? '2px solid var(--cyan)' : '2px solid transparent',
              color: activeTab === tab.key ? 'var(--cyan)' : 'var(--text-dim)',
              cursor: 'pointer', fontSize: '0.55rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}