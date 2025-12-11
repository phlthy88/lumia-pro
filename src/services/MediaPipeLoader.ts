// Dynamic MediaPipe loader to reduce main bundle size
let mediaPipePromise: Promise<any> | null = null;

export const loadMediaPipe = async () => {
  if (mediaPipePromise) {
    return mediaPipePromise;
  }

  mediaPipePromise = import('@mediapipe/tasks-vision').then(module => ({
    FilesetResolver: module.FilesetResolver,
    FaceLandmarker: module.FaceLandmarker
  }));

  return mediaPipePromise;
};

export const isMediaPipeLoaded = () => mediaPipePromise !== null;
