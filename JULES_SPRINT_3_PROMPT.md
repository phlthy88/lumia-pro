# Lumia Pro Refactor: Sprint 3 - Virtual Cam & AI Depth

## Prerequisites

Sprint 2 complete:
- Performance baseline documented
- Lazy loading implemented
- Adaptive quality working
- No performance regressions

## Goal

Harden virtual camera feature and clarify AI capabilities (either integrate real AI or clearly label heuristics).

## Tasks

### 1. Virtual camera capability detection

Modify `src/services/VirtualCameraService.ts`:

```typescript
export interface VirtualCamCapabilities {
  supported: boolean;
  captureStream: boolean;
  displayMedia: boolean;
  popoutWindow: boolean;
  reason?: string;
}

export function detectCapabilities(): VirtualCamCapabilities {
  const canvas = document.createElement('canvas');
  const captureStream = 'captureStream' in canvas;
  
  const displayMedia = 'getDisplayMedia' in navigator.mediaDevices;
  
  // Popout requires window.open and cross-origin isolation for SharedArrayBuffer
  const popoutWindow = typeof window.open === 'function';
  
  const supported = captureStream; // Minimum requirement
  
  return {
    supported,
    captureStream,
    displayMedia,
    popoutWindow,
    reason: !supported ? 'Canvas captureStream not supported in this browser' : undefined
  };
}
```

### 2. Virtual camera setup wizard

Create `src/components/VirtualCamWizard.tsx`:

```typescript
interface Props {
  capabilities: VirtualCamCapabilities;
  onStart: () => void;
  onCancel: () => void;
}

export function VirtualCamWizard({ capabilities, onStart, onCancel }: Props) {
  if (!capabilities.supported) {
    return (
      <Dialog open>
        <DialogTitle>Virtual Camera Not Supported</DialogTitle>
        <DialogContent>
          <Typography>
            Your browser doesn't support virtual camera output.
            {capabilities.reason}
          </Typography>
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
    <Dialog open>
      <DialogTitle>Start Virtual Camera</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          This will open a new window with your processed video feed.
        </Typography>
        
        <Typography variant="subtitle2" sx={{ mt: 2 }}>To use with Zoom/Meet/OBS:</Typography>
        <ol>
          <li>Click "Start" to open the virtual camera window</li>
          <li>In your video app, choose "Share Screen" or "Window"</li>
          <li>Select the "Lumia Pro Virtual Cam" window</li>
        </ol>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          Note: This uses screen/window sharing, not a system-level virtual camera.
          For OBS, you can also use Window Capture directly.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={onStart}>Start</Button>
      </DialogActions>
    </Dialog>
  );
}
```

### 3. Popout lifecycle hardening

Modify `src/services/VirtualCameraService.ts`:

```typescript
export class VirtualCameraService {
  private popout: Window | null = null;
  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private channel: BroadcastChannel | null = null;
  private unloadHandler: (() => void) | null = null;

  async startPopout(canvas: HTMLCanvasElement): Promise<void> {
    const caps = detectCapabilities();
    if (!caps.supported) {
      throw new Error(caps.reason || 'Virtual camera not supported');
    }

    // Capture stream from canvas
    this.stream = canvas.captureStream(30);

    // Open popout window
    this.popout = window.open(
      '/virtual-camera.html',
      'lumia-virtual-cam',
      'width=1280,height=720,menubar=no,toolbar=no'
    );

    if (!this.popout) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    // Setup communication channel
    this.channel = new BroadcastChannel('lumia-virtual-cam');
    
    // Handle popout close
    const checkClosed = () => {
      if (this.popout?.closed) {
        this.stop();
      } else {
        this.rafId = requestAnimationFrame(checkClosed);
      }
    };
    this.rafId = requestAnimationFrame(checkClosed);

    // Handle main window unload
    this.unloadHandler = () => this.stop();
    window.addEventListener('beforeunload', this.unloadHandler);

    // Send stream to popout via channel
    this.channel.postMessage({ type: 'stream-ready' });
  }

  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    if (this.popout && !this.popout.closed) {
      this.popout.close();
    }
    this.popout = null;

    if (this.unloadHandler) {
      window.removeEventListener('beforeunload', this.unloadHandler);
      this.unloadHandler = null;
    }
  }

  dispose(): void {
    this.stop();
  }

  isActive(): boolean {
    return this.popout !== null && !this.popout.closed;
  }
}
```

### 4. WebRTC option (behind flag)

Create `src/services/WebRTCVirtualCam.ts` (feature-flagged):

```typescript
// This is an OPTIONAL advanced feature for local WebRTC loopback
// Allows some apps to capture as a "camera" instead of screen share
// Requires additional setup and may not work in all browsers

import { Features } from '../config/features';

export class WebRTCVirtualCam {
  private pc: RTCPeerConnection | null = null;

  async start(stream: MediaStream): Promise<MediaStream> {
    if (!Features.WEBRTC_VIRTUAL_CAM) {
      throw new Error('WebRTC virtual cam is disabled');
    }

    // Create loopback connection
    this.pc = new RTCPeerConnection();
    
    stream.getTracks().forEach(track => {
      this.pc!.addTrack(track, stream);
    });

    // This is a simplified example - real implementation needs signaling
    // For local loopback, we'd need a second RTCPeerConnection
    
    throw new Error('WebRTC virtual cam not yet implemented');
  }

  stop(): void {
    this.pc?.close();
    this.pc = null;
  }
}
```

Add to `src/config/features.ts`:

```typescript
export const Features = {
  // ... existing flags
  WEBRTC_VIRTUAL_CAM: false, // Experimental
};
```

### 5. AI honesty: Label heuristics clearly

Modify `src/services/AIAnalysisService.ts`:

```typescript
export interface AnalysisResult {
  type: 'heuristic'; // Make it clear this isn't ML
  confidence: number;
  suggestions: {
    exposure?: number;
    temperature?: number;
    contrast?: number;
  };
  reasoning: string[]; // Human-readable explanation
}

export class AIAnalysisService {
  /**
   * Analyzes frame using rule-based heuristics (not machine learning).
   * Examines pixel statistics to suggest color corrections.
   */
  analyzeFrame(imageData: ImageData): AnalysisResult {
    const reasoning: string[] = [];
    const suggestions: AnalysisResult['suggestions'] = {};

    // Luminance analysis
    const avgLuminance = this.calculateAverageLuminance(imageData);
    
    if (avgLuminance < 0.3) {
      suggestions.exposure = 0.5;
      reasoning.push(`Image appears underexposed (avg luminance: ${(avgLuminance * 100).toFixed(0)}%)`);
    } else if (avgLuminance > 0.7) {
      suggestions.exposure = -0.3;
      reasoning.push(`Image appears overexposed (avg luminance: ${(avgLuminance * 100).toFixed(0)}%)`);
    }

    // Color cast analysis
    const { r, g, b } = this.calculateAverageRGB(imageData);
    const colorTemp = this.estimateColorTemperature(r, g, b);
    
    if (colorTemp < 5000) {
      suggestions.temperature = 10;
      reasoning.push('Image has warm/orange cast, suggesting cooler adjustment');
    } else if (colorTemp > 7000) {
      suggestions.temperature = -10;
      reasoning.push('Image has cool/blue cast, suggesting warmer adjustment');
    }

    return {
      type: 'heuristic',
      confidence: reasoning.length > 0 ? 0.7 : 0.5,
      suggestions,
      reasoning: reasoning.length > 0 ? reasoning : ['Image looks well-balanced']
    };
  }

  // ... helper methods
}
```

### 6. AI UI clarity

Modify `src/components/AIWidget.tsx` or `AISettings.tsx`:

```typescript
<Card>
  <CardHeader 
    title="Smart Assist" 
    subheader="Rule-based analysis (not AI/ML)"
  />
  <CardContent>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      Analyzes your image using color science heuristics to suggest improvements.
    </Typography>
    
    <Button onClick={analyze} disabled={analyzing}>
      {analyzing ? 'Analyzing...' : 'Analyze Frame'}
    </Button>

    {result && (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2">Suggestions:</Typography>
        {result.reasoning.map((r, i) => (
          <Typography key={i} variant="body2">• {r}</Typography>
        ))}
        
        <Button 
          sx={{ mt: 1 }} 
          variant="outlined" 
          onClick={() => applyParams(result.suggestions)}
        >
          Apply Suggestions
        </Button>
      </Box>
    )}
  </CardContent>
</Card>
```

### 7. Optional: Real AI integration stub

Create `src/services/GeminiService.ts` (disabled by default):

```typescript
import { Features } from '../config/features';

export interface GeminiAnalysisResult {
  type: 'ml';
  description: string;
  suggestions: Record<string, number>;
}

export class GeminiService {
  private apiKey: string | null = null;

  configure(apiKey: string): void {
    this.apiKey = apiKey;
  }

  async analyzeImage(imageDataUrl: string): Promise<GeminiAnalysisResult> {
    if (!Features.GEMINI_AI) {
      throw new Error('Gemini AI is disabled');
    }

    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    // TODO: Implement actual Gemini Vision API call
    // This is a stub for future implementation
    
    throw new Error('Gemini integration not yet implemented');
  }

  isConfigured(): boolean {
    return Features.GEMINI_AI && this.apiKey !== null;
  }
}
```

Add to features:

```typescript
export const Features = {
  // ... existing
  GEMINI_AI: false, // Enable when API integration is complete
};
```

## Files to create

- `src/components/VirtualCamWizard.tsx`
- `src/services/WebRTCVirtualCam.ts`
- `src/services/GeminiService.ts`

## Files to modify

- `src/services/VirtualCameraService.ts` (capability detection, lifecycle)
- `src/services/AIAnalysisService.ts` (clear heuristic labeling)
- `src/components/AIWidget.tsx` or `AISettings.tsx` (honest UI copy)
- `src/config/features.ts` (new flags)
- `README.md` (update virtual cam docs)

## Success criteria

1. Virtual cam shows wizard with clear instructions
2. Unsupported browsers get helpful error message
3. Popout cleanup is bulletproof (no orphaned streams)
4. AI UI clearly states "rule-based" not "AI/ML"
5. Gemini stub exists but is disabled
6. WebRTC option exists behind flag
7. README accurately describes virtual cam as "window sharing"
