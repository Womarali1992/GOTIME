import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex flex-col">
            <main className="flex-1 container px-4 py-8">
              <div className="rounded-lg border p-6 bg-red-50 border-red-200">
                <h1 className="text-xl font-semibold text-red-700 mb-2">Admin page failed to render</h1>
                <p className="text-sm text-red-800 break-words">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>
            </main>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


