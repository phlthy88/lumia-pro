#!/bin/bash
# Run tests in batches to avoid OOM errors

echo "Running test batch 1: Hooks..."
npm run test:ci -- src/hooks/__tests__/useRecorder.hook.test.ts --reporter=verbose || exit 1
npm run test:ci -- src/hooks/__tests__/useColorGrading.test.ts --reporter=verbose || exit 1

echo "Running test batch 2: Controllers..."
npm run test:ci -- src/controllers/__tests__/RecordingController.test.tsx --reporter=verbose || exit 1
npm run test:ci -- src/controllers/__tests__/CameraController.test.tsx --reporter=verbose || exit 1

echo "Running test batch 3: Services..."
npm run test:ci -- src/services/__tests__/PermissionManager.test.ts --reporter=verbose || exit 1
npm run test:ci -- src/services/__tests__/VirtualCameraService.test.ts --reporter=verbose || exit 1

echo "All test batches completed successfully!"
