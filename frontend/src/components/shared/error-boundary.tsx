"use client";

import React, { ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component to catch React component errors
 * 
 * Usage:
 * <ErrorBoundary componentName="my-component">
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        component: this.props.componentName || "unknown",
        boundary: "component",
      },
    });

    // Call optional error handler
    this.props.onError?.(error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto my-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">
                  Component Error
                </h3>
                <p className="text-red-800 text-sm mb-4">
                  An error occurred while rendering this component. 
                  {this.props.componentName && ` (${this.props.componentName})`}
                </p>
                {this.state.error && (
                  <pre className="text-xs bg-red-100 p-2 rounded mb-4 overflow-auto max-h-32 text-red-700">
                    {this.state.error.message}
                  </pre>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleReset}
                  className="text-red-700 border-red-200 hover:bg-red-100"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
