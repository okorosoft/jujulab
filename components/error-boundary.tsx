"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { handleError, AppError, ErrorType } from "@/lib/error-handler";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Error logging for development/debugging only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error("React Error Boundary caught an error:", error, errorInfo);
    }
    
    // Use our centralized error handling
    handleError(new AppError(ErrorType.UNKNOWN_ERROR, error));
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400">
                An unexpected error occurred while loading the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-mono">
                  {this.state.error?.message || "Unknown error"}
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.reload();
                  }}
                  className="flex-1 flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className="flex-1 flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  If this problem persists, please contact support
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 