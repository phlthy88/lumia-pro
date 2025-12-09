import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from '../EventBus';

describe('EventBus', () => {
  it('delivers events to subscribers', () => {
    const handler = vi.fn();
    const unsub = eventBus.on('camera:ready', handler);

    eventBus.emit('camera:ready', { deviceId: 'test-123' });

    expect(handler).toHaveBeenCalledWith({ deviceId: 'test-123' });
    unsub();
  });

  it('unsubscribe stops delivery', () => {
    const handler = vi.fn();
    const unsub = eventBus.on('camera:ready', handler);

    unsub();
    eventBus.emit('camera:ready', { deviceId: 'test-456' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('handles multiple subscribers', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const unsub1 = eventBus.on('gl:contextlost', handler1);
    const unsub2 = eventBus.on('gl:contextlost', handler2);

    eventBus.emit('gl:contextlost', undefined as any);

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
    unsub1();
    unsub2();
  });

  it('handles void events', () => {
    const handler = vi.fn();
    const unsub = eventBus.on('recording:start', handler);

    eventBus.emit('recording:start', undefined as any);

    expect(handler).toHaveBeenCalled();
    unsub();
  });

  it('passes complex payloads correctly', () => {
    const handler = vi.fn();
    const unsub = eventBus.on('ai:result', handler);
    const params = { exposure: 0.5, contrast: 1.2 };

    eventBus.emit('ai:result', { params });

    expect(handler).toHaveBeenCalledWith({ params });
    unsub();
  });
});
