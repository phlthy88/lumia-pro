# Ringlight/Torch Feature Fix

## Issue
The torch/ringlight toggle was not working due to two bugs:

### Bug 1: Hardcoded State in UI
**File:** `src/App.tsx` line 368

**Problem:**
```tsx
<MuiSwitch 
  label="Torch / Light" 
  checked={false}           // ❌ Always false
  onChange={() => toggleTorch(!false)}  // ❌ Always passes true
/>
```

The switch was hardcoded to always show as unchecked and always toggle to `true`, making it impossible to turn off.

**Fix:**
```tsx
<MuiSwitch 
  label="Torch / Light" 
  checked={hardware.torch}              // ✅ Uses actual state
  onChange={() => toggleTorch(!hardware.torch)}  // ✅ Toggles correctly
/>
```

### Bug 2: Incorrect Constraint Format
**File:** `src/services/CameraControlService.ts` line 75

**Problem:**
```typescript
public async setTorch(on: boolean) {
    await this.safeApply({ torch: on } as any);  // ❌ Wrong format
}
```

The MediaStream API requires `torch` to be in the `advanced` constraints array, not at the top level.

**Fix:**
```typescript
public async setTorch(on: boolean) {
    await this.safeApply({ 
        advanced: [{ torch: on } as any]  // ✅ Correct format
    });
}
```

## Testing
1. Open the app in a browser that supports torch (Chrome on Android/iOS)
2. Navigate to Hardware controls
3. Toggle "Torch / Light" switch
4. The device flashlight should turn on/off
5. The switch should reflect the current state

## Browser Support
- ✅ Chrome/Edge on Android (most devices)
- ✅ Safari on iOS (iPhone with flash)
- ❌ Desktop browsers (no torch capability)
- ❌ Browsers without MediaStream torch support

## Related Files
- `src/App.tsx` - UI toggle
- `src/hooks/useHardwareControls.ts` - State management
- `src/services/CameraControlService.ts` - Hardware API
- `src/types.ts` - Type definitions

## Build Status
✅ Build successful (870.96 KB)
✅ No TypeScript errors
✅ No breaking changes
