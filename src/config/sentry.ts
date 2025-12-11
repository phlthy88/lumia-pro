import * as Sentry from "@sentry/react";

export function initializeSentry() {
  const isDev = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;

  Sentry.init({
    // Only enable in staging/production
    enabled: !isDev || import.meta.env.VITE_SENTRY_ENABLED === 'true',
    
    dsn: import.meta.env.VITE_SENTRY_DSN,
    
    environment: import.meta.env.VITE_ENV || 'development',
    
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Set traces sample rate lower in production
    tracesSampleRate: isProduction ? 0.1 : 0.5,
    
    // Capture 100% of errors
    attachStacktrace: true,
    
    // Only send errors in production
    beforeSend(event) {
      if (!isProduction && event.level === 'error') {
        // In dev, also log to console
        console.error('[Sentry]', event);
      }
      return event;
    },
  });
}
