
export class ErrorReporter {
    static captureException(error: unknown, context?: Record<string, any>) {
        // In a real implementation, this would send to Sentry/LogRocket
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;

        console.warn(`[MockSentry] Exception Captured: ${message}`, {
            stack,
            context,
            timestamp: new Date().toISOString()
        });
    }

    static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
        console.warn(`[MockSentry] Message Captured [${level}]: ${message}`, {
            timestamp: new Date().toISOString()
        });
    }
}
