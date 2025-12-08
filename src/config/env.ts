// Environment access helper used by feature flags and other utilities.
// Reads from Vite's import.meta.env when available, falling back to process.env in tests.
export function getEnv(key: string): string | undefined {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  if (metaEnv && key in metaEnv) {
    return metaEnv[key];
  }

  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key];
  }

  return undefined;
}
