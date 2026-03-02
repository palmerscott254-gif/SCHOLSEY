import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  CreditCard,
  PrivacyTip,
  Palette,
  Delete,
  Save,
  Lock,
  Email,
  Phone,
  Verified,
  Warning,
  Laptop,
  CheckCircle,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { api } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const devices = useSelector((state: RootState) => state.devices.devices);
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [alertTypes, setAlertTypes] = useState({
    deviceOffline: true,
    lowBattery: true,
    locationChange: true,
    securityAlert: true,
    aiDetection: true,
  });

  // Privacy settings
  const [locationHistory, setLocationHistory] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  // Theme
  const [darkMode, setDarkMode] = useState(true);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    if (!token) return;
    
    try {
      const profile = await api.users.getProfile(token);
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setEmail(profile.email || '');
      setPhoneNumber(profile.phoneNumber || '');
      setTwoFactorEnabled(profile.twoFactorEnabled || false);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleUpdateProfile = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      
      await api.users.updateProfile(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
        },
        token
      );
      
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await api.users.changePassword(currentPassword, newPassword, token);
      
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;

    try {
      setLoading(true);
      await api.users.deleteAccount(token);
      
      // Logout and redirect
      window.location.href = '/login';
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  const getSubscriptionInfo = () => {
    const tier = user?.subscriptionTier || 'free';
    const limits: any = {
      free: { devices: 2, features: 'Basic tracking, 7-day history' },
      basic: { devices: 5, features: 'Advanced tracking, 30-day history, Email alerts' },
      premium: { devices: 15, features: 'All features, 1-year history, Priority support' },
      enterprise: { devices: 100, features: 'Unlimited features, Custom integrations' },
    };
    return limits[tier] || limits.free;
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Settings
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Person />} label="Profile" />
          <Tab icon={<Security />} label="Security" />
          <Tab icon={<Notifications />} label="Notifications" />
          <Tab icon={<CreditCard />} label="Subscription" />
          <Tab icon={<PrivacyTip />} label="Privacy" />
          <Tab icon={<Palette />} label="Appearance" />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="First Name"
                    fullWidth
                    value={firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last Name"
                    fullWidth
                    value={lastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email Address"
                    fullWidth
                    value={email}
                    disabled
                    helperText="Contact support to change email address"
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Phone Number"
                    fullWidth
                    value={phoneNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                    placeholder="+1234567890"
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleUpdateProfile}
                  disabled={loading}
                >
                  Save Changes
                </Button>
                <Button variant="outlined" onClick={fetchUserProfile}>
                  Cancel
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Status
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email Verified"
                        secondary={email}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Laptop />
                      </ListItemIcon>
                      <ListItemText
                        primary="Connected Devices"
                        secondary={`${devices.length} device(s)`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {twoFactorEnabled ? <Verified color="success" /> : <Warning color="warning" />}
                      </ListItemIcon>
                      <ListItemText
                        primary="Two-Factor Auth"
                        secondary={twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Current Password"
                    type="password"
                    fullWidth
                    value={currentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="New Password"
                    type="password"
                    fullWidth
                    value={newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                    helperText="Must be at least 8 characters with uppercase, lowercase, and numbers"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Confirm New Password"
                    type="password"
                    fullWidth
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<Lock />}
                  onClick={handleChangePassword}
                  disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                >
                  Change Password
                </Button>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" gutterBottom>
                Two-Factor Authentication
              </Typography>
              
              <Card sx={{ mt: 2, bgcolor: twoFactorEnabled ? 'success.dark' : 'warning.dark' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        {twoFactorEnabled ? '2FA is Enabled' : '2FA is Disabled'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {twoFactorEnabled
                          ? 'Your account is protected with two-factor authentication'
                          : 'Enable 2FA for enhanced security'}
                      </Typography>
                    </Box>
                    <Switch
                      checked={twoFactorEnabled}
                      onChange={(e) => {
                        // This would need backend implementation
                        setError('Two-factor authentication setup requires backend implementation');
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="warning.main">
                    Security Tips
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Use a strong password"
                        secondary="Mix letters, numbers, and symbols"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Enable 2FA"
                        secondary="Add an extra layer of security"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Regular updates"
                        secondary="Change password every 90 days"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Notification Channels
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 4, mb: 2 }}>
                    Receive alerts via email at {email}
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={pushNotifications}
                        onChange={(e) => setPushNotifications(e.target.checked)}
                      />
                    }
                    label="Push Notifications"
                  />
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 4, mb: 2 }}>
                    Real-time alerts on this device
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                        disabled={!phoneNumber}
                      />
                    }
                    label="SMS Notifications"
                  />
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 4 }}>
                    {phoneNumber ? `Text alerts to ${phoneNumber}` : 'Add phone number to enable'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Alert Types
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={alertTypes.deviceOffline}
                        onChange={(e) => setAlertTypes({ ...alertTypes, deviceOffline: e.target.checked })}
                      />
                    }
                    label="Device Offline Alerts"
                  />
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 4, mb: 2 }}>
                    When a device goes offline
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={alertTypes.lowBattery}
                        onChange={(e) => setAlertTypes({ ...alertTypes, lowBattery: e.target.checked })}
                      />
                    }
                    label="Low Battery Alerts"
                  />
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 4, mb: 2 }}>
                    When battery drops below 20%
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={alertTypes.locationChange}
                        onChange={(e) => setAlertTypes({ ...alertTypes, locationChange: e.target.checked })}
                      />
                    }
                    label="Location Change Alerts"
                  />
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 4, mb: 2 }}>
                    Significant location changes
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={alertTypes.securityAlert}
                        onChange={(e) => setAlertTypes({ ...alertTypes, securityAlert: e.target.checked })}
                      />
                    }
                    label="Security Alerts"
                  />
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 4, mb: 2 }}>
                    Suspicious activities detected
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={alertTypes.aiDetection}
                        onChange={(e) => setAlertTypes({ ...alertTypes, aiDetection: e.target.checked })}
                      />
                    }
                    label="AI Detection Alerts"
                  />
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 4 }}>
                    AI-powered anomaly detection
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" startIcon={<Save />}>
              Save Notification Preferences
            </Button>
          </Box>
        </TabPanel>

        {/* Subscription Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Subscription & Billing
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5">
                      Current Plan: <Chip label={(user?.subscriptionTier || 'free').toUpperCase()} color="primary" />
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {getSubscriptionInfo().features}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                      Device Usage
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <LinearProgress
                        variant="determinate"
                        value={(devices.length / getSubscriptionInfo().devices) * 100}
                        sx={{ flex: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2">
                        {devices.length} / {getSubscriptionInfo().devices}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {(user?.subscriptionTier === 'free' || !user?.subscriptionTier) && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Upgrade to unlock more features:</strong>
                  </Typography>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    <li>Track more devices</li>
                    <li>Extended location history</li>
                    <li>Priority support</li>
                    <li>Advanced AI detection</li>
                  </ul>
                </Alert>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Upgrade Options
                  </Typography>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mb: 2 }}
                    disabled={user?.subscriptionTier === 'basic'}
                  >
                    Basic - $9.99/mo
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    sx={{ mb: 2 }}
                    disabled={user?.subscriptionTier === 'premium'}
                  >
                    Premium - $19.99/mo
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled={user?.subscriptionTier === 'enterprise'}
                  >
                    Enterprise - Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Privacy Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Privacy & Data
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Data Collection
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={locationHistory}
                        onChange={(e) => setLocationHistory(e.target.checked)}
                      />
                    }
                    label="Save Location History"
                  />
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 4, mb: 2 }}>
                    Store device location history for tracking and analysis
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={dataSharing}
                        onChange={(e) => setDataSharing(e.target.checked)}
                      />
                    }
                    label="Data Sharing for Improvements"
                  />
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 4, mb: 2 }}>
                    Share anonymized data to help improve our services
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={analyticsEnabled}
                        onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      />
                    }
                    label="Usage Analytics"
                  />
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 4, mb: 2 }}>
                    Help us understand how you use the app
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Data Management
                  </Typography>
                  
                  <Box display="flex" gap={2}>
                    <Button variant="outlined">
                      Export My Data
                    </Button>
                    <Button variant="outlined">
                      View Privacy Policy
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ mt: 3, bgcolor: 'error.dark' }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom color="error.light">
                    Danger Zone
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setDeleteDialogOpen(true)}
                    sx={{ mt: 2 }}
                  >
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Your Privacy Matters
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    We take your privacy seriously. All data is encrypted and stored securely. 
                    You have full control over your information.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" startIcon={<Save />}>
              Save Privacy Settings
            </Button>
          </Box>
        </TabPanel>

        {/* Appearance Tab */}
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>
            Appearance & Personalization
          </Typography>
          
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Theme
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                  />
                }
                label={darkMode ? 'Dark Mode' : 'Light Mode'}
              />
              <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 4 }}>
                {darkMode ? 'Using dark theme' : 'Using light theme'}
              </Typography>
            </CardContent>
          </Card>

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" startIcon={<Save />}>
              Save Appearance Settings
            </Button>
          </Box>
        </TabPanel>
      </Paper>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="error" />
            <span>Delete Account</span>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you absolutely sure you want to delete your account?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            This will permanently delete:
          </Typography>
          <ul>
            <li>Your profile and settings</li>
            <li>All connected devices ({devices.length} device(s))</li>
            <li>Location history and tracking data</li>
            <li>Alerts and notifications</li>
            <li>AI analysis history</li>
          </ul>
          <Typography variant="body2" color="error">
            <strong>This action cannot be undone!</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteAccount}
            disabled={loading}
          >
            Delete My Account
          </Button>
        </DialogActions>
      </Dialog>

      {loading && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0 }} />}
    </Box>
  );
};

export default Settings;
