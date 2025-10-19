
// In a real application, this service would send logs to a remote server like Sentry, Datadog, etc.
// For this project, we'll just log to the console to simulate the behavior.

interface LogPayload {
  error: unknown;
  context?: string;
  [key: string]: any;
}

class LoggingService {
  public log(payload: LogPayload) {
    console.group(`[Logging Service] Error Report`);
    console.error("Error:", payload.error);
    console.log("Context:", payload.context || 'N/A');
    
    // Log additional payload properties
    Object.keys(payload).forEach(key => {
      if (key !== 'error' && key !== 'context') {
        console.log(`${key}:`, payload[key]);
      }
    });
    
    console.groupEnd();

    // Example of sending to a remote service:
    // Sentry.captureException(payload.error, { extra: { context: payload.context, ... } });
  }
}

export const loggingService = new LoggingService();
