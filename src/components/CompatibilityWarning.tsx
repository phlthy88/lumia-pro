import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, Button, Collapse, List, ListItem, ListItemText } from '@mui/material';
import { Warning, ExpandMore, ExpandLess } from '@mui/icons-material';
import { browserCompatibilityService } from '../services/BrowserCompatibilityService';

export const CompatibilityWarning: React.FC = () => {
  const [compatibility, setCompatibility] = useState(browserCompatibilityService.checkCompatibility());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setCompatibility(browserCompatibilityService.checkCompatibility());
  }, []);

  if (compatibility.isSupported && compatibility.warnings.length === 0) {
    return null;
  }

  if (!compatibility.isSupported) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Browser Not Supported</AlertTitle>
        Your browser is missing critical features required for Lumia Pro:
        <List dense>
          {compatibility.missingFeatures.map((feature, index) => (
            <ListItem key={index} sx={{ py: 0 }}>
              <ListItemText primary={`• ${feature}`} />
            </ListItem>
          ))}
        </List>
        Please use Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+.
      </Alert>
    );
  }

  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      <AlertTitle>
        Limited Performance Mode
        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
          sx={{ ml: 1 }}
        >
          Details
        </Button>
      </AlertTitle>
      Some features are unavailable. Performance may be reduced.
      
      <Collapse in={expanded}>
        <List dense sx={{ mt: 1 }}>
          {compatibility.warnings.map((warning, index) => (
            <ListItem key={index} sx={{ py: 0 }}>
              <ListItemText primary={`• ${warning}`} />
            </ListItem>
          ))}
        </List>
      </Collapse>
    </Alert>
  );
};
