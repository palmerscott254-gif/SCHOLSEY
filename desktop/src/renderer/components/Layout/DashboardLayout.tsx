import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle,
  Menu as MenuIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Sidebar from './Sidebar';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [notificationCount, setNotificationCount] = React.useState(3);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogin = () => {
    handleMenuClose();
    navigate('/login');
  };

  const handleLogout = () => {
    handleMenuClose();
    // TODO: Dispatch logout action
    // dispatch(logout());
  };

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100vh' }}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top App Bar */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Device Tracker Dashboard
            </Typography>

            {!isAuthenticated && (
              <Chip 
                label="Guest Mode" 
                size="small" 
                color="warning" 
                sx={{ mr: 2 }}
              />
            )}

            <IconButton color="inherit">
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton color="inherit" onClick={handleMenuOpen}>
              <AccountCircle />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {isAuthenticated ? (
                <>
                  <MenuItem disabled>
                    <ListItemText
                      primary={user?.email || 'User'}
                      secondary="Authenticated"
                    />
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                    <ListItemIcon>
                      <AccountCircle fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Account Settings</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </>
              ) : (
                <>
                  <MenuItem disabled>
                    <ListItemText
                      primary="Not signed in"
                      secondary="Login to access all features"
                    />
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogin}>
                    <ListItemIcon>
                      <LoginIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Sign In</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={handleLogin}>
                    <ListItemIcon>
                      <PersonAddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Create Account</ListItemText>
                  </MenuItem>
                </>
              )}
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            overflow: 'auto',
            backgroundColor: 'background.default',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
