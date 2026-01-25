"use client";

import React, { Component, type ReactNode } from "react";
import { captureException } from "@/lib/errorTracking";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-4">
          <div className="bg-[var(--card)] rounded-xl p-6 max-w-md w-full text-center">
            <div className="text-red-500 text-3xl mb-3">!</div>
            <h2 className="text-base font-semibold text-[var(--foreground)] mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-[var(--muted)] cursor-pointer">
                  Error Details
                </summary>
                <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${WrappedComponent.displayName ?? WrappedComponent.name ?? "Component"})`;

  return WithErrorBoundary;
}
