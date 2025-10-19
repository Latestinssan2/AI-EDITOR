
import { loggingService } from './loggingService';

class ErrorHandler {
  public handle(error: unknown, context: string = 'General'): string {
    loggingService.log({ error, context });
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Gemini specific errors
      if (errorMessage.includes('api key not valid')) {
        return 'Invalid API Key. Please check your key and try again.';
      }
      if (errorMessage.includes('billing')) {
        return 'There might be an issue with your billing account. Please check your Google Cloud project.';
      }
      if (errorMessage.includes('permission denied')) {
        return 'Permission denied. Ensure your API key has the correct permissions for the Gemini API.';
      }
      if (errorMessage.includes('quota')) {
        return 'You have exceeded your API quota. Please check your usage limits.';
      }
      if (errorMessage.includes('safety policy')) {
        return 'The request was blocked due to safety policies. Please adjust your prompt.';
      }

      // Generic network error
      if (errorMessage.includes('failed to fetch')) {
        return 'Network error. Please check your internet connection.';
      }

      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'An unknown error occurred. Please try again.';
  }
}

export const errorHandler = new ErrorHandler();
