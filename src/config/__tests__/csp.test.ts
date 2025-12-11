import { describe, it, expect } from 'vitest';
import { generateCSP, CSP_DIRECTIVES } from '../csp';

describe('CSP Configuration', () => {
  it('should generate valid CSP string', () => {
    const csp = generateCSP();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'");
    expect(csp).toContain("object-src 'none'");
  });

  it('should include all required directives', () => {
    const csp = generateCSP();
    expect(csp).toContain('default-src');
    expect(csp).toContain('script-src');
    expect(csp).toContain('style-src');
    expect(csp).toContain('img-src');
    expect(csp).toContain('connect-src');
  });

  it('should handle empty directive arrays', () => {
    expect(CSP_DIRECTIVES['upgrade-insecure-requests']).toEqual([]);
    const csp = generateCSP();
    expect(csp).toContain('upgrade-insecure-requests');
  });
});
