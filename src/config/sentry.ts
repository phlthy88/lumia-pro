export const initSentry = async () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('[Sentry] DSN not configured, running in local mode');
    return;
  }

  const Sentry = await import("@sentry/react");

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_ENV || 'development',
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    beforeSend(event) {
      if (event.exception?.values?.[0]?.value?.includes('ResizeObserver loop limit exceeded')) {
        return null;
      }
      return event;
    }
  });
};

export const captureError = async (error: Error, context?: Record<string, any>) => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  
  const Sentry = await import("@sentry/react");
  Sentry.captureException(error, { extra: context });
};
