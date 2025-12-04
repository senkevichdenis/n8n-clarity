import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[hsl(var(--bg-main))] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[hsl(var(--bg-panel))] border border-[hsl(var(--border-subtle))] rounded-lg p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-[hsl(var(--text-main))] mb-2">
                  Something went wrong
                </h2>
                <p className="text-[hsl(var(--text-muted))] mb-4">
                  An unexpected error occurred. Don't worry, your data is safe. Try refreshing the page.
                </p>

                {this.state.error && (
                  <div className="mb-4 p-4 bg-[hsl(var(--bg-input))] border border-[hsl(var(--border-subtle))] rounded">
                    <p className="text-sm font-mono text-red-400 mb-2">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="text-xs text-[hsl(var(--text-muted))] cursor-pointer hover:text-[hsl(var(--text-main))]">
                          Show stack trace
                        </summary>
                        <pre className="mt-2 text-xs text-[hsl(var(--text-muted))] overflow-auto max-h-64">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={this.handleReset}
                    className="flex items-center gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Refresh Page
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                  >
                    Go Home
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
