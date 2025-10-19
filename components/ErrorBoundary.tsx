import React, { Component, ErrorInfo, ReactNode } from 'react';
import { loggingService } from '../services/loggingService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(_error: Error): Partial<State> {
    // This lifecycle method is called after an error has been thrown by a descendant component.
    // It should return a value to update state, triggering a re-render with the fallback UI.
    return { hasError: true };
  }

  // FIX: Converted `componentDidCatch` to an arrow function to correctly bind `this`. This resolves the error on line 31 where `this.setState` was not found.
  public componentDidCatch = (error: Error, errorInfo: ErrorInfo) => {
    // This lifecycle method is also called after an error has been thrown.
    // It's a good place for side effects like logging and setting detailed error info in state.
    this.setState({ error, errorInfo });
    loggingService.log({ error, errorInfo, context: 'ErrorBoundary' });
  }
  
  private handleCopyError = () => {
      if (this.state.error && this.state.errorInfo) {
          const errorDetails = `Error: ${this.state.error.toString()}\n\nStack: ${this.state.errorInfo.componentStack}`;
          navigator.clipboard.writeText(errorDetails).then(() => {
              alert("Error details copied to clipboard.");
          }).catch(err => {
              console.error("Failed to copy error details: ", err);
          });
      }
  }

  // FIX: Converted `render` to an arrow function to correctly bind `this`. This resolves the error on line 76 where `this.props` was not found.
  public render = () => {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-screen h-screen bg-gray-900 text-gray-200 p-8">
            <div className="text-6xl mb-6">
                <i className="fas fa-bug text-purple-400"></i>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Oops! Something went wrong.</h1>
            <p className="text-lg text-gray-400 mb-8 text-center max-w-2xl">
                A critical error occurred and the application cannot continue. We've logged the issue for our team to investigate.
            </p>
            <div className="flex space-x-4">
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition-colors"
                >
                    Reload the App
                </button>
                <button
                    onClick={this.handleCopyError}
                    className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-colors"
                >
                    Copy Error Details
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;