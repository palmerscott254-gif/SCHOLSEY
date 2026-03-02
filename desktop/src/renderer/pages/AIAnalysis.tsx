import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Image as ImageIcon,
  ExpandMore as ExpandMoreIcon,
  SmartToy as AIIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Camera as CameraIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { api } from '../services/api';

interface AnalysisResult {
  is_ai_generated: boolean;
  ai_probability: number;
  is_edited: boolean;
  edit_probability: number;
  authenticity_score: number;
  confidence_level: string;
  metadata_anomalies: {
    found: boolean;
    anomaly_score: number;
    issues: string[];
    exif_data?: {
      camera_make?: string;
      camera_model?: string;
      software?: string;
      date_time?: string;
      total_tags?: number;
    };
  };
  lighting_inconsistencies: {
    found: boolean;
    score: number;
    details: string;
  };
  compression_artifacts: {
    found: boolean;
    score: number;
    details: string;
  };
  explanation: string;
  detailed_report?: {
    ai_detection?: any;
    edit_detection?: any;
    metadata?: any;
  };
  processing_time_ms: number;
  model_version: string;
}

const AIAnalysis: React.FC = () => {
  const { token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError('');
      setResult(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !token || !isAuthenticated) {
      setError('Please select an image and ensure you are logged in');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const response = await api.ai.analyzeImage(selectedFile, token);
      setResult(response.analysis || response);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze image');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setError('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAuthenticityColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const getAuthenticityLabel = (score: number) => {
    if (score >= 0.8) return 'Authentic';
    if (score >= 0.6) return 'Questionable';
    return 'Not Authentic';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        AI Image Analysis
      </Typography>
      <Typography color="text.secondary" paragraph>
        Upload images for AI-powered authenticity analysis
      </Typography>

      {!isAuthenticated && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please sign in to use AI analysis features
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: preview ? 'primary.main' : 'divider',
              bgcolor: preview ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            onClick={handleUploadClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {preview ? (
              <Box>
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    marginBottom: '16px',
                    borderRadius: '8px',
                  }}
                />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedFile?.name}
                </Typography>
              </Box>
            ) : (
              <Box>
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Click to upload image
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  PNG, JPG, GIF up to 10MB
                </Typography>
              </Box>
            )}
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleAnalyze}
              disabled={!selectedFile || loading || !isAuthenticated}
            >
              {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
              {loading ? 'Analyzing...' : 'Analyze Image'}
            </Button>
            {preview && (
              <Button
                fullWidth
                variant="outlined"
                onClick={handleReset}
                disabled={loading}
              >
                Reset
              </Button>
            )}
          </Box>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} md={6}>
          {result ? (
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  {result.authenticity_score >= 0.8 ? (
                    <CheckCircleIcon sx={{ color: 'success.main', mr: 1, fontSize: 28 }} />
                  ) : (
                    <ErrorIcon sx={{ color: 'error.main', mr: 1, fontSize: 28 }} />
                  )}
                  <Typography variant="h6" fontWeight="bold">
                    Analysis Complete
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Authenticity Score */}
                <Box mb={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Authenticity Score
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <LinearProgress
                      variant="determinate"
                      value={result.authenticity_score * 100}
                      sx={{ 
                        flexGrow: 1,
                        height: 10,
                        borderRadius: 1,
                      }}
                      color={getAuthenticityColor(result.authenticity_score) as any}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      {Math.round(result.authenticity_score * 100)}%
                    </Typography>
                  </Box>
                  <Chip
                    icon={
                      result.authenticity_score >= 0.8 ? (
                        <CheckCircleIcon />
                      ) : (
                        <ErrorIcon />
                      )
                    }
                    label={getAuthenticityLabel(result.authenticity_score)}
                    color={getAuthenticityColor(result.authenticity_score) as any}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                {/* Explanation */}
                {result.explanation && (
                  <Box mb={2}>
                    <Alert 
                      severity={result.authenticity_score >= 0.8 ? 'success' : 'warning'}
                      icon={<InfoIcon />}
                    >
                      {result.explanation}
                    </Alert>
                  </Box>
                )}

                {/* Key Findings */}
                <Box mb={2}>
                  <Typography variant="body1" fontWeight="bold" gutterBottom>
                    Key Findings
                  </Typography>
                  <Grid container spacing={1}>
                    {/* AI Generated Status */}
                    <Grid item xs={12}>
                      <Paper sx={{ p: 1.5, bgcolor: 'background.default' }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={1}>
                            <AIIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="body2">AI Generated</Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={result.is_ai_generated ? 'Yes' : 'No'}
                              color={result.is_ai_generated ? 'error' : 'success'}
                              size="small"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(result.ai_probability * 100)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Edited Status */}
                    <Grid item xs={12}>
                      <Paper sx={{ p: 1.5, bgcolor: 'background.default' }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={1}>
                            <EditIcon sx={{ color: 'warning.main' }} />
                            <Typography variant="body2">Edited/Manipulated</Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={result.is_edited ? 'Yes' : 'No'}
                              color={result.is_edited ? 'warning' : 'success'}
                              size="small"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(result.edit_probability * 100)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Metadata Issues */}
                    {result.metadata_anomalies && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 1.5, bgcolor: 'background.default' }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap={1}>
                              <CameraIcon sx={{ color: 'info.main' }} />
                              <Typography variant="body2">Metadata Anomalies</Typography>
                            </Box>
                            <Chip
                              label={result.metadata_anomalies.found ? 'Found' : 'None'}
                              color={result.metadata_anomalies.found ? 'warning' : 'success'}
                              size="small"
                            />
                          </Box>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                {/* Detailed Analysis - Accordion */}
                <Box>
                  <Typography variant="body1" fontWeight="bold" gutterBottom>
                    Detailed Analysis
                  </Typography>

                  {/* Metadata Details */}
                  {result.metadata_anomalies && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CameraIcon fontSize="small" />
                          <Typography variant="body2">Metadata Analysis</Typography>
                          {result.metadata_anomalies.found && (
                            <Chip label="Issues" color="warning" size="small" />
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {result.metadata_anomalies.issues && result.metadata_anomalies.issues.length > 0 && (
                          <Box mb={2}>
                            <Typography variant="caption" color="error" fontWeight="bold" gutterBottom>
                              Issues Detected:
                            </Typography>
                            <List dense>
                              {result.metadata_anomalies.issues.map((issue, idx) => (
                                <ListItem key={idx}>
                                  <ListItemText 
                                    primary={issue}
                                    primaryTypographyProps={{ variant: 'caption' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                        {result.metadata_anomalies.exif_data && (
                          <Box>
                            <Typography variant="caption" fontWeight="bold" gutterBottom>
                              EXIF Information:
                            </Typography>
                            <List dense>
                              {result.metadata_anomalies.exif_data.camera_make && (
                                <ListItem>
                                  <ListItemText 
                                    primary="Camera Make"
                                    secondary={result.metadata_anomalies.exif_data.camera_make}
                                    primaryTypographyProps={{ variant: 'caption' }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                  />
                                </ListItem>
                              )}
                              {result.metadata_anomalies.exif_data.camera_model && (
                                <ListItem>
                                  <ListItemText 
                                    primary="Camera Model"
                                    secondary={result.metadata_anomalies.exif_data.camera_model}
                                    primaryTypographyProps={{ variant: 'caption' }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                  />
                                </ListItem>
                              )}
                              {result.metadata_anomalies.exif_data.software && (
                                <ListItem>
                                  <ListItemText 
                                    primary="Software"
                                    secondary={result.metadata_anomalies.exif_data.software}
                                    primaryTypographyProps={{ variant: 'caption' }}
                                    secondaryTypographyProps={{ variant: 'caption', color: result.metadata_anomalies.exif_data.software.toLowerCase().includes('photoshop') ? 'error' : 'inherit' }}
                                  />
                                </ListItem>
                              )}
                              {result.metadata_anomalies.exif_data.date_time && (
                                <ListItem>
                                  <ListItemText 
                                    primary="Date Taken"
                                    secondary={result.metadata_anomalies.exif_data.date_time}
                                    primaryTypographyProps={{ variant: 'caption' }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                  />
                                </ListItem>
                              )}
                            </List>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Manipulation Detection */}
                  {result.is_edited && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <EditIcon fontSize="small" />
                          <Typography variant="body2">Manipulation Detection</Typography>
                          <Chip label={`${Math.round(result.edit_probability * 100)}%`} color="warning" size="small" />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {result.lighting_inconsistencies && result.lighting_inconsistencies.found && (
                            <ListItem>
                              <ListItemText 
                                primary="Lighting Inconsistencies"
                                secondary={result.lighting_inconsistencies.details}
                                primaryTypographyProps={{ variant: 'caption', fontWeight: 'bold' }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />
                            </ListItem>
                          )}
                          {result.compression_artifacts && result.compression_artifacts.found && (
                            <ListItem>
                              <ListItemText 
                                primary="Compression Artifacts"
                                secondary={result.compression_artifacts.details}
                                primaryTypographyProps={{ variant: 'caption', fontWeight: 'bold' }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />
                            </ListItem>
                          )}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* AI Generation Details */}
                  {result.is_ai_generated && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AIIcon fontSize="small" />
                          <Typography variant="body2">AI Generation Analysis</Typography>
                          <Chip label={`${Math.round(result.ai_probability * 100)}%`} color="error" size="small" />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="caption" gutterBottom>
                          This image shows signs of being generated by AI tools such as:
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText 
                              primary="• Stable Diffusion, DALL-E, Midjourney, or similar"
                              primaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="• Unusual noise patterns typical of AI generation"
                              primaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="• Frequency domain characteristics of synthetic images"
                              primaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>

                {/* Processing Info */}
                <Box mt={2} pt={2} borderTop={1} borderColor="divider">
                  <Typography variant="caption" color="text.secondary">
                    Processing Time: {result.processing_time_ms}ms | Model: {result.model_version} | Confidence: {result.confidence_level.toUpperCase()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              <ImageIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography>
                {loading ? 'Processing your image...' : 'Upload an image to see analysis results'}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIAnalysis;
