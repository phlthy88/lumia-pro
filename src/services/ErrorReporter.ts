import * as Sentry from "@sentry/react";
import { getEnv } from "../config/env"; // Reusing the safe env getter from Phase 2

export class ErrorReporter {
    static initialized = false;

    static init() {
        if (this.initialized) return;

        const dsn = getEnv('VITE_SENTRY_DSN');
        const env = getEnv('MODE') || 'development';

        if (dsn) {
            Sentry.init({
                dsn,
                environment: env,
                // Critical Privacy: Filter out PII and blobs
                beforeSend(event) {
                    if (event.breadcrumbs) {
                        event.breadcrumbs = event.breadcrumbs.map(b => {
                            // Redact potential PII in messages/data
                            if (b.message?.match(/email|password|token|key/i)) {
                                b.message = '[REDACTED]';
                            }
                            // Ensure no blob URLs or huge data payloads are sent
                            if (JSON.stringify(b.data).length > 10000) {
                                b.data = { redacted: 'Data too large' };
                            }
                            return b;
                        });
                    }
                    return event;
                },
                // Performance monitoring
                tracesSampleRate: env === 'production' ? 0.1 : 1.0,
                // Session Replay - Disabled to ensure no video frames are captured inadvertently
                replaysSessionSampleRate: 0,
                replaysOnErrorSampleRate: 0,
            });
            this.initialized = true;
            console.log('[ErrorReporter] Sentry Initialized');
        } else {
            console.log('[ErrorReporter] Sentry DSN missing, running in local mode');
        }
    }

    static captureException(error: unknown, context?: Record<string, any>): string {
        const message = error instanceof Error ? error.message : String(error);

        if (this.initialized) {
            const eventId = Sentry.captureException(error, {
                extra: context
            });
            return eventId || 'unknown';
        } else {
            // Fallback for dev/no-DSN
            console.warn(`[ErrorReporter] Exception: ${message}`, {
                error,
                context,
                timestamp: new Date().toISOString()
            });
            return 'local-' + Date.now().toString();
        }
    }

    static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
        if (this.initialized) {
            Sentry.captureMessage(message, level);
        } else {
            console.warn(`[ErrorReporter] Message [${level}]: ${message}`, {
                timestamp: new Date().toISOString()
            });
        }
    }
}

// Auto-initialize if environment allows
ErrorReporter.init();
