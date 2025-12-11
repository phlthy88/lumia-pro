# Tech Stack Engineer Handoff: Lumia Pro Simplification

## Current Status ✅
- **Architecture Analysis Complete**: Identified over-engineering issues (MVC controllers in React)
- **Simplified Hooks Created**: `useCamera()`, `useWebGL()` replacing complex controllers
- **Proof of Concept Built**: `AppSimplified.tsx` demonstrates 85% code reduction
- **CI Fixed**: TypeScript errors resolved, builds passing

## Your Mission 🎯
**Complete the migration from over-engineered controllers to clean React hooks**

## Priority Tasks

### 1. Feature Parity (Week 1)
```bash
# Add missing features to simplified hooks:
src/hooks/useRecording.ts    # Replace RecordingController
src/hooks/useAI.ts          # Replace AIController  
src/hooks/useLUT.ts         # LUT loading functionality
```

### 2. Component Migration (Week 2)
```bash
# Update these components to use new hooks:
src/components/ControlPanel.tsx
src/components/MediaLibrary.tsx
src/components/AIPanel.tsx
```

### 3. Remove Legacy Code (Week 3)
```bash
# Delete after migration complete:
src/controllers/           # All controller files
src/providers/EventBus.ts  # Event bus system
# Update imports across codebase
```

## Technical Approach

### Hook Pattern to Follow
```typescript
// Example: useRecording.ts
export const useRecording = (canvasRef: RefObject<HTMLCanvasElement>) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  const startRecording = useCallback(() => {
    // Direct implementation, no service layer
  }, []);
  
  return { isRecording, mediaItems, startRecording, stopRecording };
};
```

### Migration Strategy
1. **One hook at a time** - Don't break existing functionality
2. **Feature flags** - Use `ENABLE_SIMPLIFIED_HOOKS=true` env var
3. **Side-by-side testing** - Keep both versions until parity achieved
4. **Performance monitoring** - Ensure no regressions

## Key Files to Study
- `src/hooks/useCamera.ts` - Clean camera management
- `src/hooks/useWebGL.ts` - WebGL rendering without complexity
- `src/AppSimplified.tsx` - Target architecture pattern
- `COMPLEXITY_COMPARISON.md` - Metrics and benefits

## Success Metrics
- [ ] All features work with new hooks
- [ ] Remove 3,000+ lines of controller code
- [ ] Zero context nesting
- [ ] No event bus usage
- [ ] Performance maintained or improved

## Questions/Blockers
- Reach out for architecture decisions
- GLRenderer interface questions → check `src/engine/GLRenderer.ts`
- Testing strategy → existing tests in `src/test/`

## Timeline: 3 weeks to complete migration
**Week 1**: Feature parity hooks
**Week 2**: Component updates  
**Week 3**: Legacy cleanup

Ready to simplify! 🚀
