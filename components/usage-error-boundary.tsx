"use client";

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class UsageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Error logging for development/debugging only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Usage tracking error:', error, errorInfo);
    }
    // Silently handle error - fallback UI will be shown
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Usage tracking temporarily unavailable
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Your usage data will be tracked once the service is restored.
              </p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="ml-auto p-1 hover:bg-yellow-100 rounded transition-colors"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4 text-yellow-600" />
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

