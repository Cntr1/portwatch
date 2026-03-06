import { useEffect } from 'react';
import { useScheduleStore } from './store/scheduleStore';
import Header from './components/Header/Header';
import Filters from './components/Filters/Filters';
import ScheduleTable from './components/Schedule/ScheduleTable';
import VesselDetail from './components/Schedule/VesselDetail';
import './styles/globals.css';

export default function App() {
  const { fetch } = useScheduleStore();

  useEffect(() => {
    fetch();
  }, []);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <Header />
      <Filters />
      <ScheduleTable />
      <VesselDetail />
    </div>
  );
}
