import { BeautyConfig, ColorGradeParams } from '../types';

type EventMap = {
  'camera:ready': { deviceId: string };
  'camera:error': { error: Error };
  'gl:contextlost': void;
  'gl:contextrestored': void;
  'ai:result': { params: Partial<ColorGradeParams> };
  'ai:masks': { mask1: OffscreenCanvas | HTMLCanvasElement | null; mask2: OffscreenCanvas | HTMLCanvasElement | null };
  'ai:landmarks': { faceCenter: { x: number; y: number }; mouthCenter: { x: number; y: number } };
  'ai:beauty': { beauty: BeautyConfig };
  'virtualcam:status': { active: boolean };
  'recording:start': void;
  'recording:stop': { blob: Blob };
  'recording:toggle': void;
  'recording:snapshot': void;
  'memory:warning': { usedMB: number };
};

class TypedEventBus {
  private target = new EventTarget();

  emit<K extends keyof EventMap>(type: K, detail: EventMap[K]): void {
    this.target.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on<K extends keyof EventMap>(type: K, handler: (detail: EventMap[K]) => void): () => void {
    const listener = (e: Event) => handler((e as CustomEvent).detail);
    this.target.addEventListener(type, listener);
    return () => this.target.removeEventListener(type, listener);
  }
}

export const eventBus = new TypedEventBus();
