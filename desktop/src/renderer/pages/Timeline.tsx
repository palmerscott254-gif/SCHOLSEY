import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Timeline: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Activity Timeline
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Device activity timeline will be displayed here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Timeline;
