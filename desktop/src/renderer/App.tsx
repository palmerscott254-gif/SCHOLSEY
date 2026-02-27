import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from './store';

// Layout
import DashboardLayout from './components/Layout/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DeviceMap from './pages/DeviceMap';
import Alerts from './pages/Alerts';
import Timeline from './pages/Timeline';
import Settings from './pages/Settings';
import AIAnalysis from './pages/AIAnalysis';

const App: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {isAuthenticated ? (
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="map" element={<DeviceMap />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="ai-analysis" element={<AIAnalysis />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Box>
  );
};

export default App;
