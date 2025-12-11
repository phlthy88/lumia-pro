# Lumia Pro Architecture Simplification

## Current Issues
- MVC Controllers mixed with React patterns
- Over-complex Context hierarchy
- Unnecessary Event Bus for React communication
- Service layer doing what hooks should do
- Deep component nesting

## Simplified Architecture

### Before (Over-engineered)
```
App
├── CameraController (Context Provider)
│   ├── RenderController (Context Provider)
│   │   ├── AIController (Context Provider)
│   │   │   └── RecordingController (Context Provider)
│   │   │       └── Components
│   │   └── EventBus communication
│   └── Service layer
└── Complex prop drilling
```

### After (Simplified)
```
App
├── useCamera() hook
├── useWebGL() hook  
├── useAI() hook
├── useRecording() hook
└── Direct component composition
```

## Migration Steps

### Phase 1: Controllers → Hooks
- `CameraController` → `useCamera()`
- `RenderController` → `useWebGL()` 
- `AIController` → `useAI()`
- `RecordingController` → `useRecording()`

### Phase 2: Remove Event Bus
- Replace with direct hook communication
- Use React's natural data flow

### Phase 3: Flatten Components
- Remove unnecessary wrapper components
- Direct prop passing instead of context drilling

### Phase 4: Service Consolidation
- Merge related services into hooks
- Remove service abstractions

## Benefits
- 50% less code complexity
- Better React patterns
- Easier testing
- Clearer data flow
- Faster development
