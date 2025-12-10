/// <reference lib="webworker" />

type CaptureRequest = {
  type: 'capture';
  id: number;
  quality: number;
  image: ImageBitmap;
};

type CaptureResult = {
  type: 'capture-result';
  id: number;
  dataUrl: string;
};

type CaptureError = {
  type: 'capture-error';
  id: number;
  message: string;
};

type IncomingMessage = CaptureRequest;
type OutgoingMessage = CaptureResult | CaptureError;

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

self.onmessage = async (event: MessageEvent<IncomingMessage>) => {
  const data = event.data;
  if (data.type !== 'capture') return;

  const { image, id, quality } = data;

  try {
    const width = image.width;
    const height = image.height;

    if (!canvas) {
      canvas = new OffscreenCanvas(width, height);
    }
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    if (!ctx) {
      ctx = canvas.getContext('2d', { desynchronized: true })!;
    }

    ctx.drawImage(image, 0, 0, width, height);
    image.close();

    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Build base64 string in chunks to avoid stack/alloc issues
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }

    const base64 = btoa(binary);
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    self.postMessage({ type: 'capture-result', id, dataUrl } satisfies CaptureResult);
  } catch (err) {
    image.close();
    const message = err instanceof Error ? err.message : 'Frame capture failed';
    self.postMessage({ type: 'capture-error', id, message } satisfies CaptureError);
  }
};
