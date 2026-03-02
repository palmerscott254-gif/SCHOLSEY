import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PhoneAndroid,
  Battery80,
  LocationOn,
  Warning,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setDevices } from '../store/slices/devicesSlice';
import { setAlerts } from '../store/slices/alertsSlice';
import { api } from '../services/api';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const devices = useSelector((state: RootState) => state.devices.devices);
  const alertsData = useSelector((state: RootState) => state.alerts.alerts);
  const unreadCount = useSelector((state: RootState) => state.alerts.unreadCount);
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Fetch devices and alerts in parallel
        const [devicesData, alertsDataFetched] = await Promise.all([
          api.devices.getAll(token).catch((err) => {
            console.error('Error fetching devices:', err);
            return [];
          }),
          api.alerts.getAll(token).catch((err) => {
            console.error('Error fetching alerts:', err);
            return [];
          }),
        ]);

        dispatch(setDevices(Array.isArray(devicesData) ? devicesData : []));
        dispatch(setAlerts(Array.isArray(alertsDataFetched) ? alertsDataFetched : []));
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, token, dispatch]);

  if (loading && isAuthenticated) {
    return (
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard Overview
        </Typography>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  const avgBattery = devices.length > 0
    ? Math.round(devices.reduce((sum, d) => sum + d.battery, 0) / devices.length)
    : 0;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard Overview
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!isAuthenticated && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are in guest mode. Sign in to see your devices and alerts.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Devices
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {devices.length}
                  </Typography>
                </Box>
                <PhoneAndroid sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Active Tracking
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {devices.filter(d => d.isOnline).length}
                  </Typography>
                </Box>
                <LocationOn sx={{ fontSize: 48, color: 'success.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Unread Alerts
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error">
                    {unreadCount}
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 48, color: 'error.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Avg Battery
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {avgBattery}%
                  </Typography>
                </Box>
                <Battery80 sx={{ fontSize: 48, color: 'warning.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Devices List */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Connected Devices
            </Typography>
            
            {devices.length === 0 ? (
              <Typography color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
                No devices connected yet.
              </Typography>
            ) : (
              devices.map((device) => (
                <Box
                  key={device.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <PhoneAndroid />
                    <Box>
                      <Typography fontWeight="bold">{device.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {device.model} • {device.lastSeen}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={device.isOnline ? 'Online' : 'Offline'}
                      color={device.isOnline ? 'success' : 'default'}
                      size="small"
                    />
                    <Typography variant="body2">{device.battery}%</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={device.battery}
                      sx={{ width: 60, ml: 1 }}
                    />
                  </Box>
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Recent Alerts
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              {alertsData.length === 0 ? (
                <Typography color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
                  No alerts to display.
                </Typography>
              ) : (
                alertsData.slice(0, 5).map((alert) => (
                  <Box
                    key={alert.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 1,
                      bgcolor: alert.severity === 'critical' ? 'error.dark' : 
                               alert.severity === 'high' ? 'error.main' :
                               alert.severity === 'medium' ? 'warning.main' : 'info.main',
                      opacity: alert.isRead ? 0.5 : 0.9,
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {alert.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {alert.message}
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 0.5 }}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
