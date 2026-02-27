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
} from '@mui/material';
import {
  PhoneAndroid,
  Battery80,
  LocationOn,
  Warning,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';

const Dashboard: React.FC = () => {
  const devices = useSelector((state: RootState) => state.devices.devices);
  const alerts = useSelector((state: RootState) => state.alerts.unreadCount);

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard Overview
      </Typography>

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
                    {alerts}
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
                    75%
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
            
            {devices.map((device) => (
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
            ))}
          </Paper>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Recent Alerts
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              {[1, 2, 3].map((alert) => (
                <Box
                  key={alert}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 1,
                    bgcolor: 'error.dark',
                    opacity: 0.8,
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    Failed Login Attempt
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    My iPhone • 2 hours ago
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
