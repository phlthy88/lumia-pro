import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import type { VirtualCamCapabilities } from '../services/VirtualCameraService';

interface Props {
  open: boolean;
  capabilities: VirtualCamCapabilities;
  onStart: () => void;
  onCancel: () => void;
}

export const VirtualCamWizard: React.FC<Props> = ({ open, capabilities, onStart, onCancel }) => {
  if (!capabilities.supported) {
    return (
      <Dialog open={open} onClose={onCancel}>
        <DialogTitle>Virtual Camera Not Supported</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Your browser doesn't support virtual camera output.
          </Typography>
          {capabilities.reason && (
            <Typography variant="body2" color="error" gutterBottom>
              {capabilities.reason}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 2 }}>
            For best results, use Chrome or Edge on desktop.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Start Virtual Camera</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          This will open a new window with your processed video feed.
        </Typography>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          To use with Zoom/Meet/OBS:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="1. Click 'Start' to open the virtual camera window" />
          </ListItem>
          <ListItem>
            <ListItemText primary="2. In your video app, choose 'Share Screen' or 'Window'" />
          </ListItem>
          <ListItem>
            <ListItemText primary="3. Select the 'Lumia Pro Virtual Cam' window" />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ mt: 2 }}>
          Note: This uses window sharing, not a system-level virtual camera.
          For OBS, you can also use Window Capture directly.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={onStart}>Start</Button>
      </DialogActions>
    </Dialog>
  );
};
