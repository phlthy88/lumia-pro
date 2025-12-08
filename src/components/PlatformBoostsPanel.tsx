// ============================================================================
// Platform Boosts Panel - UI for Platform Optimizations & Virtual Camera
// ============================================================================

import React, { useState, useId } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  IconButton,
  Tooltip,
  Alert,
  Collapse,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  LinearProgress,
  Snackbar
} from '@mui/material';
import {
  Bolt,
  Memory,
  Monitor,
  Videocam,
  ContentCopy,
  Download,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Warning,
  Info,
  OpenInNew,
  Refresh,
  Settings,
  Speed,
  BatteryChargingFull,
  HighQuality
} from '@mui/icons-material';
import { usePlatformBoosts } from '../hooks/usePlatformBoosts';
import { useVirtualCamera } from '../hooks/useVirtualCamera';
import { BoostProfile } from '../services/PlatformBoostsService';
import { VirtualCameraService } from '../services/VirtualCameraService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div 
      hidden={value !== index} 
      style={{ 
        height: value === index ? 'auto' : 0,
        overflow: value === index ? 'visible' : 'hidden'
      }}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export const PlatformBoostsPanel: React.FC = () => {
  const {
    capabilities,
    currentProfile,
    isDetecting,
    error,
    detectCapabilities,
    setProfile,
    applyRecommended,
    getRecommendedFlags,
    generateLaunchScript,
    copyFlagsToClipboard,
    isHighEnd,
    isLowEnd,
    isCrostini,
    supportsHDR,
    supportsWebGPU
  } = usePlatformBoosts();

  const virtualCamera = useVirtualCamera();

  const [tabValue, setTabValue] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>('capabilities');
  const [instructionsDialog, setInstructionsDialog] = useState<{
    open: boolean;
    app: 'zoom' | 'meet' | 'teams' | 'obs' | 'discord';
  }>({ open: false, app: 'zoom' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const resolutionId = useId();
  const frameRateId = useId();

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleCopyFlags = async () => {
    await copyFlagsToClipboard();
    setSnackbar({ open: true, message: 'Chrome flags copied to clipboard!' });
  };

  const handleDownloadScript = () => {
    const script = generateLaunchScript();
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lumina-chrome-optimized.sh';
    a.click();
    URL.revokeObjectURL(url);
    setSnackbar({ open: true, message: 'Launch script downloaded!' });
  };

  const presetProfiles: { name: string; profile: BoostProfile }[] = [
    {
      name: 'Power Saver',
      profile: {
        name: 'Power Saver',
        renderingTier: 'performance',
        targetFPS: 30,
        useWebGPU: false,
        useWebGL2: true,
        enableHDR: false,
        enableHardwareAccel: true,
        aiProcessingMode: 'off',
        videoEncoderPreset: 'ultrafast'
      }
    },
    {
      name: 'Balanced',
      profile: {
        name: 'Balanced',
        renderingTier: 'balanced',
        targetFPS: 60,
        useWebGPU: false,
        useWebGL2: true,
        enableHDR: false,
        enableHardwareAccel: true,
        aiProcessingMode: 'throttled',
        videoEncoderPreset: 'fast'
      }
    },
    {
      name: 'High Quality',
      profile: {
        name: 'High Quality',
        renderingTier: 'quality',
        targetFPS: 60,
        useWebGPU: supportsWebGPU,
        useWebGL2: true,
        enableHDR: supportsHDR,
        enableHardwareAccel: true,
        aiProcessingMode: 'full',
        videoEncoderPreset: 'medium'
      }
    }
  ];

  const flags = capabilities ? getRecommendedFlags() : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 5, bgcolor: 'background.default', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, v) => setTabValue(v)} 
          variant="scrollable"
          scrollButtons={false}
          sx={{ 
            '& .MuiTabs-scroller': {
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            },
            '& .MuiTab-root': {
              minWidth: 'auto',
              px: 1.5,
              fontSize: '0.75rem',
            }
          }}
        >
          <Tab label="Capabilities" />
          <Tab label="Performance" />
          <Tab label="Virtual Camera" />
          <Tab label="Chrome Flags" />
        </Tabs>
        {/* Scroll indicator gradient */}
        <Box 
          sx={{ 
            position: 'absolute', 
            right: 0, 
            top: 0, 
            bottom: 0, 
            width: 40,
            background: (theme) => `linear-gradient(to left, ${theme.palette.background.paper}, transparent)`,
            pointerEvents: 'none',
            opacity: tabValue < 3 ? 1 : 0,
            transition: 'opacity 0.2s',
          }} 
        />
      </Box>

      {/* Tab 0: Capabilities */}
      <TabPanel value={tabValue} index={0}>
        {isDetecting && <LinearProgress sx={{ mb: 2 }} />}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {capabilities && (
          <>
            {/* Platform Detection */}
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Detected Platform
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {isCrostini && <Chip label="Crostini (Linux)" color="primary" size="small" />}
                  {capabilities.isChromeOS && <Chip label="ChromeOS" color="secondary" size="small" />}
                  {capabilities.isLinux && !isCrostini && <Chip label="Linux" size="small" />}
                  {capabilities.isMac && <Chip label="macOS" size="small" />}
                  {capabilities.isWindows && <Chip label="Windows" size="small" />}
                  {isHighEnd && <Chip label="High-End" color="success" size="small" icon={<Speed />} />}
                  {isLowEnd && <Chip label="Low-End" color="warning" size="small" icon={<BatteryChargingFull />} />}
                </Box>
              </CardContent>
            </Card>

            {/* GPU Info */}
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Graphics
                </Typography>
                <Typography variant="body2">
                  <strong>GPU:</strong> {capabilities.gpuRenderer}
                </Typography>
                <Typography variant="body2">
                  <strong>Vendor:</strong> {capabilities.gpuVendor}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  <Chip 
                    label="WebGL2" 
                    color={capabilities.webgl2.supported ? 'success' : 'error'}
                    size="small"
                    icon={capabilities.webgl2.supported ? <CheckCircle /> : <Warning />}
                  />
                  <Chip 
                    label="WebGPU" 
                    color={capabilities.webgpu.supported ? 'success' : 'default'}
                    size="small"
                    icon={capabilities.webgpu.supported ? <CheckCircle /> : <Info />}
                  />
                  <Chip 
                    label="HDR" 
                    color={capabilities.hdr.supported ? 'success' : 'default'}
                    size="small"
                    icon={capabilities.hdr.supported ? <CheckCircle /> : <Info />}
                  />
                  <Chip 
                    label={`${capabilities.colorGamut.toUpperCase()}`} 
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Hardware Info */}
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Hardware
                </Typography>
                <Typography variant="body2">
                  <strong>CPU Cores:</strong> {capabilities.hardwareConcurrency}
                </Typography>
                <Typography variant="body2">
                  <strong>Memory:</strong> {capabilities.deviceMemory}GB
                </Typography>
                <Typography variant="body2">
                  <strong>Refresh Rate:</strong> {capabilities.refreshRate}Hz
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  <Chip 
                    label="HW Encode" 
                    color={capabilities.hardwareVideoEncode ? 'success' : 'default'}
                    size="small"
                  />
                  <Chip 
                    label="HW Decode" 
                    color={capabilities.hardwareVideoDecode ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>

            <Button 
              startIcon={<Refresh />} 
              onClick={detectCapabilities}
              disabled={isDetecting}
              fullWidth
              variant="outlined"
            >
              Re-detect Capabilities
            </Button>
          </>
        )}
      </TabPanel>

      {/* Tab 1: Performance Profiles */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="subtitle2" gutterBottom>
          Performance Profile
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {presetProfiles.map(({ name, profile }) => (
            <Button
              key={name}
              variant={currentProfile?.name === name ? 'contained' : 'outlined'}
              onClick={() => setProfile(profile)}
              startIcon={
                name === 'Power Saver' ? <BatteryChargingFull /> :
                name === 'Balanced' ? <Settings /> :
                <HighQuality />
              }
            >
              {name}
            </Button>
          ))}
        </Box>

        {currentProfile && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Current: {currentProfile.name}
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Target FPS" secondary={`${currentProfile.targetFPS} fps`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Rendering Tier" secondary={currentProfile.renderingTier} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="AI Processing" secondary={currentProfile.aiProcessingMode} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Video Encoder" secondary={currentProfile.videoEncoderPreset} />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="WebGPU" />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={currentProfile.useWebGPU ? 'ON' : 'OFF'} 
                      color={currentProfile.useWebGPU ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="HDR" />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={currentProfile.enableHDR ? 'ON' : 'OFF'} 
                      color={currentProfile.enableHDR ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Hardware Acceleration" />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={currentProfile.enableHardwareAccel ? 'ON' : 'OFF'} 
                      color={currentProfile.enableHardwareAccel ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        )}

        {capabilities && (
          <Button 
            onClick={applyRecommended}
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
          >
            Apply Recommended for Your System
          </Button>
        )}
      </TabPanel>

      {/* Tab 2: Virtual Camera */}
      <TabPanel value={tabValue} index={2}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Virtual Camera lets you use Lumina effects in Zoom, Meet, Teams, and other video call apps!
        </Alert>

        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Virtual Camera Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip 
                label={virtualCamera.isActive ? 'Active' : 'Inactive'}
                color={virtualCamera.isActive ? 'success' : 'default'}
                icon={<Videocam />}
              />
              {virtualCamera.isWindowOpen && (
                <Chip label="Pop-out Open" color="primary" size="small" />
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<OpenInNew />}
                onClick={() => virtualCamera.openPopOut()}
                disabled={virtualCamera.isWindowOpen}
              >
                Open Pop-out Window
              </Button>
              {virtualCamera.isWindowOpen && (
                <Button
                  variant="outlined"
                  onClick={() => virtualCamera.closePopOut()}
                >
                  Close Pop-out
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Typography variant="subtitle2" gutterBottom>
          Setup Instructions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {(['zoom', 'meet', 'teams', 'discord', 'obs'] as const).map(app => (
            <Button
              key={app}
              variant="outlined"
              size="small"
              onClick={() => setInstructionsDialog({ open: true, app })}
            >
              {app.charAt(0).toUpperCase() + app.slice(1)}
            </Button>
          ))}
        </Box>

        {/* Resolution Settings */}
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Output Settings
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel id={`${resolutionId}-label`}>Resolution</InputLabel>
              <Select
                id={resolutionId}
                labelId={`${resolutionId}-label`}
                value={`${virtualCamera.config.width}x${virtualCamera.config.height}`}
                label="Resolution"
                onChange={(e) => {
                  const [w, h] = e.target.value.split('x').map(Number);
                  virtualCamera.updateConfig({ width: w, height: h });
                }}
              >
                <MenuItem value="1920x1080">1080p (1920×1080)</MenuItem>
                <MenuItem value="1280x720">720p (1280×720)</MenuItem>
                <MenuItem value="640x480">480p (640×480)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id={`${frameRateId}-label`}>Frame Rate</InputLabel>
              <Select
                id={frameRateId}
                labelId={`${frameRateId}-label`}
                value={virtualCamera.config.frameRate}
                label="Frame Rate"
                onChange={(e) => virtualCamera.updateConfig({ frameRate: Number(e.target.value) })}
              >
                <MenuItem value={60}>60 fps</MenuItem>
                <MenuItem value={30}>30 fps</MenuItem>
                <MenuItem value={24}>24 fps</MenuItem>
                <MenuItem value={15}>15 fps (Low bandwidth)</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 3: Chrome Flags */}
      <TabPanel value={tabValue} index={3}>
        {!flags ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography color="text.secondary">Detecting capabilities...</Typography>
          </Box>
        ) : (
        <>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Chrome flags are experimental. Only safe flags are shown. Apply at your own discretion.
        </Alert>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<ContentCopy />}
            onClick={handleCopyFlags}
          >
            Copy All Safe Flags
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownloadScript}
          >
            Download Script
          </Button>
        </Box>

        {/* Crostini Safe */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Box 
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => toggleSection('crostini')}
            >
              <Typography variant="subtitle2">Crostini Safe Boosts</Typography>
              {expandedSection === 'crostini' ? <ExpandLess /> : <ExpandMore />}
            </Box>
            <Collapse in={expandedSection === 'crostini'}>
              <List dense>
                {flags.crostiniSafe.map(flag => (
                  <ListItem key={flag.flag}>
                    <ListItemText 
                      primary={`--${flag.flag}`}
                      secondary={flag.description}
                    />
                    <Chip 
                      label={flag.impact} 
                      size="small"
                      color={flag.impact === 'high' ? 'success' : flag.impact === 'medium' ? 'primary' : 'default'}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </CardContent>
        </Card>

        {/* WebGL2 Boosts */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Box 
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => toggleSection('webgl2')}
            >
              <Typography variant="subtitle2">WebGL2 Boosts</Typography>
              {expandedSection === 'webgl2' ? <ExpandLess /> : <ExpandMore />}
            </Box>
            <Collapse in={expandedSection === 'webgl2'}>
              <List dense>
                {flags.webgl2Boosts.map(flag => (
                  <ListItem key={flag.flag}>
                    <ListItemText 
                      primary={`--${flag.flag}`}
                      secondary={flag.description}
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {!flag.safe && <Chip label="Unsafe" size="small" color="warning" />}
                      <Chip 
                        label={flag.impact} 
                        size="small"
                        color={flag.impact === 'high' ? 'success' : flag.impact === 'medium' ? 'primary' : 'default'}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </CardContent>
        </Card>

        {/* WebGPU Boosts */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Box 
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => toggleSection('webgpu')}
            >
              <Typography variant="subtitle2">WebGPU Boosts</Typography>
              {expandedSection === 'webgpu' ? <ExpandLess /> : <ExpandMore />}
            </Box>
            <Collapse in={expandedSection === 'webgpu'}>
              <List dense>
                {flags.webgpuBoosts.map(flag => (
                  <ListItem key={flag.flag}>
                    <ListItemText 
                      primary={`--${flag.flag}`}
                      secondary={flag.description}
                    />
                    <Chip 
                      label={flag.impact} 
                      size="small"
                      color={flag.impact === 'high' ? 'success' : flag.impact === 'medium' ? 'primary' : 'default'}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </CardContent>
        </Card>

        {/* HDR Boosts */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Box 
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => toggleSection('hdr')}
            >
              <Typography variant="subtitle2">HDR 10 Boosts</Typography>
              {expandedSection === 'hdr' ? <ExpandLess /> : <ExpandMore />}
            </Box>
            <Collapse in={expandedSection === 'hdr'}>
              <List dense>
                {flags.hdr10Boosts.map(flag => (
                  <ListItem key={flag.flag}>
                    <ListItemText 
                      primary={`--${flag.flag}`}
                      secondary={flag.description}
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {!flag.safe && <Chip label="Unsafe" size="small" color="warning" />}
                      <Chip 
                        label={flag.impact} 
                        size="small"
                        color={flag.impact === 'high' ? 'success' : flag.impact === 'medium' ? 'primary' : 'default'}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </CardContent>
        </Card>

        <Typography variant="caption" color="text.secondary">
          To apply these flags, go to <code>chrome://flags</code> or launch Chrome with these command-line arguments.
        </Typography>
        </>
        )}
      </TabPanel>

      {/* Instructions Dialog */}
      <Dialog 
        open={instructionsDialog.open} 
        onClose={() => setInstructionsDialog({ ...instructionsDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {instructionsDialog.app.charAt(0).toUpperCase() + instructionsDialog.app.slice(1)} Setup
        </DialogTitle>
        <DialogContent>
          <Typography 
            component="pre" 
            sx={{ 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'system-ui',
              fontSize: '0.875rem',
              lineHeight: 1.6
            }}
          >
            {VirtualCameraService.getSetupInstructions(instructionsDialog.app)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstructionsDialog({ ...instructionsDialog, open: false })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default PlatformBoostsPanel;
