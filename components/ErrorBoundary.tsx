
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // You could also log the error to a service like Sentry here
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Oops! Something went wrong.</h1>
          <p className="text-gray-400">We've been notified of the issue. Please try refreshing the page.</p>
          {this.state.error && (
            <details className="mt-4 p-4 bg-gray-800 rounded-lg w-full max-w-2xl">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 text-sm text-red-300 whitespace-pre-wrap">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
