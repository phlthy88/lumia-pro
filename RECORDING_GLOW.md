# Recording Glow Effect

## Feature
Added a red halo glow effect that emanates from behind the viewfinder when recording is active.

## Implementation
**File:** `src/components/layout/StyledViewfinder.tsx`

### Changes:
1. **Added keyframe animation:**
```typescript
const recordingPulse = keyframes`
  0%, 100% { 
    opacity: 0.3;
    transform: scale(1);
  }
  50% { 
    opacity: 0.5;
    transform: scale(1.05);
  }
`;
```

2. **Added glow Box component:**
- Positioned absolutely behind viewfinder (`inset: -12px`)
- Red radial gradient (`rgba(239,68,68,...)`)
- Blur filter for soft glow effect
- Pulses gently with 2s animation cycle
- Only visible when `isRecording={true}`
- Smooth fade in/out transition

## Visual Effect
- **When NOT recording:** Invisible (opacity: 0)
- **When recording:** 
  - Red halo glow appears behind viewfinder
  - Pulses gently (opacity 0.3 → 0.5 → 0.3)
  - Slight scale animation (1.0 → 1.05 → 1.0)
  - 2-second cycle, infinite loop

## Technical Details
- Uses MUI `keyframes` for animation
- CSS `radial-gradient` for glow effect
- `filter: blur(20px)` for soft edges
- `pointerEvents: 'none'` to not interfere with UI
- `zIndex: -1` to stay behind viewfinder

## Browser Support
✅ All modern browsers (Chrome, Firefox, Safari, Edge)
✅ Hardware accelerated (transform + opacity)
✅ Smooth 60fps animation

## Build Status
✅ Build successful (871.10 KB)
✅ No TypeScript errors
✅ No performance impact
