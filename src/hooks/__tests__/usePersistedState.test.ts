import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from '../usePersistedState';

describe('usePersistedState', () => {
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  it('returns initial value when localStorage is empty', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => usePersistedState('test-key', 'default'));

    expect(result.current[0]).toBe('default');
  });

  it('returns stored value from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify('stored-value'));

    const { result } = renderHook(() => usePersistedState('test-key', 'default'));

    expect(result.current[0]).toBe('stored-value');
  });

  it('persists value to localStorage on update', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => usePersistedState('test-key', 'default'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'));
    expect(result.current[0]).toBe('new-value');
  });

  it('handles function updater', () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(5));

    const { result } = renderHook(() => usePersistedState<number>('test-key', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(6);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(6));
  });

  it('handles object values', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => usePersistedState('test-key', { count: 0 }));

    act(() => {
      result.current[1]({ count: 5 });
    });

    expect(result.current[0]).toEqual({ count: 5 });
  });

  it('handles array values', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => usePersistedState<string[]>('test-key', []));

    act(() => {
      result.current[1](['a', 'b', 'c']);
    });

    expect(result.current[0]).toEqual(['a', 'b', 'c']);
  });

  it('handles localStorage read error gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => usePersistedState('test-key', 'default'));

    expect(result.current[0]).toBe('default');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles localStorage write error gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => usePersistedState('test-key', 'default'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles invalid JSON in localStorage', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockLocalStorage.getItem.mockReturnValue('invalid-json{');

    const { result } = renderHook(() => usePersistedState('test-key', 'default'));

    expect(result.current[0]).toBe('default');
    consoleSpy.mockRestore();
  });

  it('uses different keys independently', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'key1') return JSON.stringify('value1');
      if (key === 'key2') return JSON.stringify('value2');
      return null;
    });

    const { result: result1 } = renderHook(() => usePersistedState('key1', 'default'));
    const { result: result2 } = renderHook(() => usePersistedState('key2', 'default'));

    expect(result1.current[0]).toBe('value1');
    expect(result2.current[0]).toBe('value2');
  });
});
