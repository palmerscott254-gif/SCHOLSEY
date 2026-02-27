import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const DeviceMap: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Device Map
      </Typography>
      <Paper sx={{ p: 3, height: 'calc(100vh - 200px)' }}>
        <Typography color="text.secondary">
          Interactive map showing device locations will be displayed here.
        </Typography>
        {/* TODO: Integrate Mapbox GL */}
      </Paper>
    </Box>
  );
};

export default DeviceMap;
