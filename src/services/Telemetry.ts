/**
 * Telemetry service for error tracking and performance monitoring.
 * Logs to console; Sentry integration can be added when configured.
 */
export const Telemetry = {
  contextLost(): void {
    console.warn('[Telemetry] WebGL context lost');
  },

  contextRestored(): void {
    console.info('[Telemetry] WebGL context restored');
  },

  permissionDenied(type: 'camera' | 'microphone'): void {
    console.warn(`[Telemetry] ${type} permission denied`);
  },

  disposalFailure(service: string, error: Error): void {
    console.error(`[Telemetry] ${service} disposal failed`, error);
  },

  memoryWarning(usedMB: number): void {
    console.warn(`[Telemetry] High memory usage: ${usedMB}MB`);
  },

  analysisError(error: Error): void {
    console.error('[Telemetry] AI analysis failed', error);
  },

  recordingError(error: Error): void {
    console.error('[Telemetry] Recording failed', error);
  },
};
