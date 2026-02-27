import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

const AIAnalysis: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Image Analysis
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary" paragraph>
          Upload images for AI-powered authenticity analysis.
        </Typography>
        <Button variant="contained">
          Upload Image
        </Button>
      </Paper>
    </Box>
  );
};

export default AIAnalysis;
