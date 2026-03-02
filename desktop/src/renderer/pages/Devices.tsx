import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add,
  PhoneAndroid,
  Tablet,
  Delete,
  Refresh,
  ContentCopy,
  CheckCircle,
  Timer,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setDevices } from '../store/slices/devicesSlice';
import { api } from '../services/api';

interface PairingDialogData {
  deviceId: string;
  pairingCode: string;
  expiresAt: string;
  message: string;
}

const Devices: React.FC = () => {
  const dispatch = useDispatch();
  const devices = useSelector((state: RootState) => state.devices.devices);
  const { token } = useSelector((state: RootState) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // New device dialog
  const [openNewDevice, setOpenNewDevice] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState<'android' | 'ios'>('android');
  const [deviceModel, setDeviceModel] = useState('');
  const [osVersion, setOsVersion] = useState('');
  
  // Pairing dialog
  const [pairingDialog, setPairingDialog] = useState<PairingDialogData | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

  useEffect(() => {
    fetchDevices();
  }, []);

  // Timer for pairing code expiration
  useEffect(() => {
    if (!pairingDialog) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiryTime = new Date(pairingDialog.expiresAt).getTime();
      const secondsLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));
      
      setTimeRemaining(secondsLeft);
      
      if (secondsLeft === 0) {
        setPairingDialog(null);
        setError('Pairing code expired. Please try again.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pairingDialog]);

  const fetchDevices = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const data = await api.devices.getAll(token);
      dispatch(setDevices(Array.isArray(data) ? data : []));
    } catch (err: any) {
      console.error('Error fetching devices:', err);
      setError(err.message || 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePairing = async () => {
    if (!token || !deviceName.trim()) {
      setError('Please enter a device name');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const deviceData = {
        deviceName: deviceName.trim(),
        deviceType,
        deviceModel: deviceModel.trim() || 'Unknown',
        osVersion: osVersion.trim() || '1.0',
        appVersion: '1.0.0',
        deviceUuid: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        publicKey: 'temp-public-key-' + Math.random().toString(36).substr(2, 100),
      };

      const response: any = await api.devices.initiatePairing(deviceData, token);
      
      setPairingDialog({
        deviceId: response.deviceId,
        pairingCode: response.pairingCode,
        expiresAt: response.expiresAt,
        message: response.message,
      });
      
      setOpenNewDevice(false);
      setDeviceName('');
      setDeviceModel('');
      setOsVersion('');
      setCodeCopied(false);
      setTimeRemaining(300);
      
    } catch (err: any) {
      console.error('Error initiating pairing:', err);
      setError(err.message || 'Failed to initiate device pairing');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpairDevice = async (deviceId: string) => {
    if (!token) return;
    
    if (!window.confirm('Are you sure you want to unpair this device?')) return;

    try {
      setLoading(true);
      setError('');
      
      await api.devices.unpairDevice(deviceId, token);
      setSuccess('Device unpaired successfully');
      
      await fetchDevices();
    } catch (err: any) {
      console.error('Error unpairing device:', err);
      setError(err.message || 'Failed to unpair device');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (pairingDialog?.pairingCode) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pairingDialog.pairingCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Device Management
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchDevices}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenNewDevice(true)}
          >
            Pair New Device
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={3}>
        {devices.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <PhoneAndroid sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No devices paired yet
              </Typography>
              <Typography color="textSecondary" sx={{ mb: 3 }}>
                Click "Pair New Device" to connect your first device
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenNewDevice(true)}
              >
                Pair New Device
              </Button>
            </Paper>
          </Grid>
        ) : (
          devices.map((device: any) => (
            <Grid item xs={12} md={6} lg={4} key={device.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {device.deviceType === 'tablet' ? <Tablet /> : <PhoneAndroid />}
                      <Typography variant="h6" fontWeight="bold">
                        {device.name || 'Unknown Device'}
                      </Typography>
                    </Box>
                    <Chip
                      label={device.isOnline ? 'Online' : 'Offline'}
                      color={device.isOnline ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {device.model || 'Unknown Model'}
                  </Typography>

                  {device.osVersion && (
                    <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                      OS: {device.osVersion}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" color="textSecondary">
                      Battery
                    </Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {device.battery || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={device.battery || 0}
                    sx={{ mb: 2 }}
                  />

                  <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                    Last seen: {device.lastSeen || 'Never'}
                  </Typography>

                  {device.pairedAt && (
                    <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                      Paired: {new Date(device.pairedAt).toLocaleDateString()}
                    </Typography>
                  )}

                  <Box display="flex" gap={1} mt={2}>
                    <Tooltip title="Unpair Device">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleUnpairDevice(device.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* New Device Dialog */}
      <Dialog open={openNewDevice} onClose={() => setOpenNewDevice(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pair New Device</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Device Name"
              fullWidth
              value={deviceName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeviceName(e.target.value)}
              placeholder="e.g., John's iPhone"
              sx={{ mb: 2 }}
              required
            />
            
            <TextField
              label="Device Type"
              fullWidth
              select
              value={deviceType}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeviceType(e.target.value as 'android' | 'ios')}
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              <option value="android">Android</option>
              <option value="ios">iOS</option>
            </TextField>

            <TextField
              label="Device Model (Optional)"
              fullWidth
              value={deviceModel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeviceModel(e.target.value)}
              placeholder="e.g., iPhone 14 Pro"
              sx={{ mb: 2 }}
            />

            <TextField
              label="OS Version (Optional)"
              fullWidth
              value={osVersion}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOsVersion(e.target.value)}
              placeholder="e.g., iOS 17.2"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewDevice(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleInitiatePairing}
            disabled={loading || !deviceName.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate Pairing Code'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pairing Code Dialog */}
      <Dialog open={!!pairingDialog} onClose={() => setPairingDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            <span>Device Pairing Code</span>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            {pairingDialog?.message}
          </Alert>

          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'primary.dark', mb: 3 }}>
            <Typography variant="caption" color="textSecondary" gutterBottom display="block">
              Enter this code on your device
            </Typography>
            <Typography
              variant="h2"
              fontWeight="bold"
              letterSpacing={4}
              sx={{ fontFamily: 'monospace', my: 2 }}
            >
              {pairingDialog?.pairingCode}
            </Typography>
            <Button
              startIcon={codeCopied ? <CheckCircle /> : <ContentCopy />}
              onClick={handleCopyCode}
              variant="outlined"
              color={codeCopied ? 'success' : 'inherit'}
            >
              {codeCopied ? 'Copied!' : 'Copy Code'}
            </Button>
          </Paper>

          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <Timer color="warning" />
            <Typography variant="body2" color="warning.main">
              Code expires in: {formatTime(timeRemaining)}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="textSecondary">
            <strong>Instructions:</strong>
          </Typography>
          <ol style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>
              <Typography variant="body2" color="textSecondary">
                Open the Scholsey app on your device
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="textSecondary">
                Tap "Pair Device" or "Enter Pairing Code"
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="textSecondary">
                Enter the 6-character code shown above
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="textSecondary">
                Your device will be connected automatically
              </Typography>
            </li>
          </ol>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPairingDialog(null)}>Done</Button>
          <Button variant="contained" onClick={fetchDevices}>
            Check Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Devices;
