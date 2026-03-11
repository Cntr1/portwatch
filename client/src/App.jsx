import { useEffect, useState } from 'react';
import { useScheduleStore } from './store/scheduleStore';
import { useIsMobile } from './hooks/useIsMobile';
import Header from './components/Header/Header';
import Filters from './components/Filters/Filters';
import ScheduleTable from './components/Schedule/ScheduleTable';
import VesselDetail from './components/Schedule/VesselDetail';
import TrackPanel from './components/Track/TrackPanel';
import MobileLayout from './components/Mobile/MobileLayout';
import './styles/globals.css';

export default function App() {
  const { fetch } = useScheduleStore();
  const [activeTab, setActiveTab] = useState('schedules');
  const isMobile = useIsMobile();

  useEffect(() => { fetch(); }, []);

  if (isMobile) {
    return <MobileLayout />;
  }

  const tabStyle = (tab) => ({
    background: 'none',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--cyan)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--cyan)' : 'var(--text-dim)',
    padding: '0 1.25rem',
    height: '100%',
    fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace',
    transition: 'all 0.1s',
  });

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />
      <div style={{
        display: 'flex', height: 38, flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        paddingLeft: '0.5rem',
      }}>
        <button style={tabStyle('schedules')} onClick={() => setActiveTab('schedules')}>
          ⚓ Vessel Schedules
        </button>
        <button style={tabStyle('track')} onClick={() => setActiveTab('track')}>
          📦 Track Shipment
        </button>
      </div>
      {activeTab === 'schedules' && (
        <>
          <Filters />
          <ScheduleTable />
          <VesselDetail />
        </>
      )}
      {activeTab === 'track' && <TrackPanel />}
    </div>
  );
}