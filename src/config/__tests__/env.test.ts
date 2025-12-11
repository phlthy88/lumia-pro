import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getEnv } from '../env';

describe('getEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns undefined for missing key', () => {
    const result = getEnv('NON_EXISTENT_KEY');
    expect(result).toBeUndefined();
  });

  it('returns value from process.env', () => {
    process.env.TEST_KEY = 'test-value';
    const result = getEnv('TEST_KEY');
    expect(result).toBe('test-value');
  });

  it('returns MODE from process.env', () => {
    process.env.MODE = 'test';
    const result = getEnv('MODE');
    expect(result).toBe('test');
  });

  it('handles empty string value', () => {
    process.env.EMPTY_KEY = '';
    const result = getEnv('EMPTY_KEY');
    expect(result).toBe('');
  });
});
