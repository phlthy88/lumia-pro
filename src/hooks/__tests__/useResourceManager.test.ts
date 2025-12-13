import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useResourceManager, ResourceType } from '../useResourceManager';

describe('useResourceManager', () => {
  let mockRandomUUID: vi.SpiedFunction<typeof crypto.randomUUID>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRandomUUID = vi.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid-1');
  });

  it('registers a resource and returns an id', () => {
    const { result } = renderHook(() => useResourceManager());
    const cleanup = vi.fn();
    const id = result.current.register('stream-track', {}, cleanup);
    expect(id).toBe('mock-uuid-1');
    expect(result.current.getResourceCount()).toBe(1);
  });

  it('unregisters a resource and calls cleanup', () => {
    const { result } = renderHook(() => useResourceManager());
    const cleanup = vi.fn();
    const id = result.current.register('stream-track', {}, cleanup);
    
    act(() => {
      result.current.unregister(id);
    });

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(result.current.getResourceCount()).toBe(0);
  });

  it('cleanup() calls all registered cleanup functions', () => {
    const { result } = renderHook(() => useResourceManager());
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();
    result.current.register('stream-track', {}, cleanup1);
    mockRandomUUID.mockReturnValue('mock-uuid-2');
    result.current.register('blob-url', {}, cleanup2);
    
    act(() => {
      result.current.cleanup();
    });

    expect(cleanup1).toHaveBeenCalledTimes(1);
    expect(cleanup2).toHaveBeenCalledTimes(1);
    expect(result.current.getResourceCount()).toBe(0);
  });

  it('handles cleanup errors without throwing', () => {
    const { result } = renderHook(() => useResourceManager());
    const cleanup = vi.fn(() => { throw new Error('Cleanup failed'); });
    const id = result.current.register('stream-track', {}, cleanup);
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    act(() => {
      result.current.unregister(id);
    });

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[useResourceManager] Cleanup failed'),
      expect.any(Error)
    );
    expect(result.current.getResourceCount()).toBe(0);
    consoleWarnSpy.mockRestore();
  });

  it('getResourceCount returns correct count', () => {
    const { result } = renderHook(() => useResourceManager());
    expect(result.current.getResourceCount()).toBe(0);
    
    result.current.register('stream-track', {}, vi.fn());
    expect(result.current.getResourceCount()).toBe(1);

    mockRandomUUID.mockReturnValue('mock-uuid-2');
    result.current.register('blob-url', {}, vi.fn());
    expect(result.current.getResourceCount()).toBe(2);

    act(() => {
      result.current.cleanup();
    });
    expect(result.current.getResourceCount()).toBe(0);
  });

  it('auto-cleans on unmount', () => {
    const cleanup = vi.fn();
    const { unmount, result } = renderHook(() => useResourceManager());
    result.current.register('stream-track', {}, cleanup);
    
    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(result.current.getResourceCount()).toBe(0); // Should be 0 after unmount
  });

  it('handles multiple resources of same type', () => {
    const { result } = renderHook(() => useResourceManager());
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();
    
    result.current.register('stream-track', {name: 'track1'}, cleanup1);
    mockRandomUUID.mockReturnValue('mock-uuid-2');
    result.current.register('stream-track', {name: 'track2'}, cleanup2);

    expect(result.current.getResourceCount()).toBe(2);
    
    act(() => {
      result.current.cleanup();
    });
    expect(cleanup1).toHaveBeenCalledTimes(1);
    expect(cleanup2).toHaveBeenCalledTimes(1);
  });

  it('generates unique ids for each resource', () => {
    const { result } = renderHook(() => useResourceManager());
    mockRandomUUID.mockReturnValueOnce('unique-id-1').mockReturnValueOnce('unique-id-2');

    const id1 = result.current.register('timer', {}, vi.fn());
    const id2 = result.current.register('timer', {}, vi.fn());

    expect(id1).toBe('unique-id-1');
    expect(id2).toBe('unique-id-2');
    expect(id1).not.toBe(id2);
  });

  it('does not register resource if resource object is null/undefined', () => {
    const { result } = renderHook(() => useResourceManager());
    const cleanup = vi.fn();
    const id = result.current.register('stream-track', null, cleanup);
    expect(id).toBe('mock-uuid-1'); // ID is still generated
    expect(result.current.getResourceCount()).toBe(0); // But resource is not stored
  });
});
