# Test Execution Guide

## Current Test Status

### ✅ Passing Tests (when run individually)
- `useRecorder.hook.test.ts` - 5 tests ✅
- `useColorGrading.test.ts` - 4 tests ✅
- `RecordingController.test.tsx` - 1 test ✅
- `useCameraStream.test.ts` - 3 tests ✅
- `GPUCapabilities.test.ts` - 4 tests ✅
- `PermissionManager.test.ts` - 2 tests ✅
- `GLRenderer.dispose.test.ts` - 1 test ✅
- `ErrorBoundary.test.tsx` - 3 tests ✅
- `ErrorBoundary.test.tsx` (src/test) - 4 tests ✅ (when files don't conflict)
- Many other service and unit tests

### ⚠️ Known Issues

#### Memory Leak in CameraController.test.tsx
- **Status**: Causes OOM when run, especially after other tests
- **Symptom**: Heap grows to ~2GB, crashes Node
- **Root Cause**: Likely WebGL contexts or MediaStreams not being cleaned up in CameraController implementation
- **Workaround**: Run tests individually or skip this file

#### Playwright Test Environment Mismatch
- **Status**: Playwright tests (in e2e/) fail when run with vitest
- **Reason**: Playwright uses its own test runner, not vitest
- **Solution**: Run separately: `npm run e2e` or `npm run e2e:run`

## Running Tests

### Option 1: Individual Test Files (Recommended)
```bash
# Run single test file
npm run test:ci -- src/hooks/__tests__/useRecorder.hook.test.ts

# Run multiple specific files
npm run test:ci -- src/hooks/__tests__/useRecorder.hook.test.ts src/hooks/__tests__/useColorGrading.test.ts
```

### Option 2: Batch Runner Script
```bash
# Run tests in batches (skips problematic files)
./run-tests.sh
```

### Option 3: All Tests (may OOM)
```bash
# May crash due to memory leak
npm run test:ci
```

## Test Configuration

### Memory Settings
- **Max Heap**: 8192MB (8GB)
- **Garbage Collection**: Enabled with --expose-gc
- **Max Workers**: 1 (single-threaded)
- **File Parallelism**: false

### Files
- **Setup**: `src/test/setup.ts` - Global mocks and environment setup
- **Cleanup**: `src/test/after-test-cleanup.ts` - Resource cleanup between tests
- **Config**: `vitest.config.ts` - Test runner configuration

## Continuous Integration

For CI/CD pipelines, use individual test execution:

```yaml
# Example GitHub Actions
- name: Run tests individually
  run: |
    npm run test:ci -- src/hooks/__tests__/useRecorder.hook.test.ts
    npm run test:ci -- src/hooks/__tests__/useColorGrading.test.ts
    npm run test:ci -- src/controllers/__tests__/RecordingController.test.tsx
    # ... etc
```

## Debugging Memory Issues

If you encounter OOM errors:

1. **Check which test file is running**: Run with `--reporter=verbose`
2. **Run suspected file individually**: Isolate and fix
3. **Add cleanup**: Ensure proper cleanup in after-test-cleanup.ts
4. **Check for leaks**: Look for unclosed resources (streams, contexts, etc)

## Next Steps

### Priority 1: Fix CameraController Memory Leak
- [ ] Investigate CameraController component for resource cleanup
- [ ] Check WebGL context disposal
- [ ] Verify MediaStream track cleanup
- [ ] Add explicit cleanup in afterEach hooks

### Priority 2: CI/CD Integration
- [ ] Create GitHub Actions workflow
- [ ] Run tests individually in parallel jobs
- [ ] Add test result reporting

### Priority 3: Test Coverage
- [ ] Add more comprehensive tests
- [ ] Increase code coverage
- [ ] Add integration tests

## Current Coverage

- **Statement Coverage**: ~38% (via test:coverage)
- **Branch Coverage**: ~30%
- **Function Coverage**: ~35%
- **Line Coverage**: ~38%

Run `npm run test:coverage` to generate detailed report.
