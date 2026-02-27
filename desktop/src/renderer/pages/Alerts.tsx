import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Paper, Chip } from '@mui/material';

const Alerts: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Security Alerts
      </Typography>
      <Paper sx={{ p: 2 }}>
        <List>
          <ListItem>
            <ListItemText
              primary="No active alerts"
              secondary="All devices are secure"
            />
            <Chip label="All Clear" color="success" size="small" />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default Alerts;
