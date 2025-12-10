import { FilesetResolver, FaceLandmarker, type FaceLandmarkerResult } from '@mediapipe/tasks-vision';

let landmarker: FaceLandmarker | null = null;

self.onmessage = async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'init':
      try {
        const vision = await FilesetResolver.forVisionTasks(data.wasmPath);
        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: data.modelPath, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numFaces: 2,
          ...data.options
        });
        self.postMessage({ type: 'ready' });
      } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
      }
      break;

    case 'detect':
      if (landmarker && data.imageData) {
        try {
          const result = landmarker.detectForVideo(data.imageData, data.timestamp);
          self.postMessage({ type: 'result', result });
        } catch (error) {
          self.postMessage({ type: 'error', error: error.message });
        }
      }
      break;

    case 'dispose':
      landmarker?.close();
      landmarker = null;
      break;
  }
};
