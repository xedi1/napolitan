'use client';

import { Component, ReactNode } from 'react';

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
          <div className="max-w-md w-full mx-4 p-8 panel text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              خطا در برنامه
            </h1>
            <p className="text-[var(--color-text-secondary)] mb-6">
              متأسفانه مشکلی در برنامه رخ داده است. لطفاً صفحه را رفرش کنید.
            </p>
            
            {this.state.error && (
              <details className="text-right mb-6 p-4 bg-[var(--color-surface-light)] rounded-lg">
                <summary className="text-sm text-[var(--color-text-muted)] cursor-pointer">
                  جزئیات خطا
                </summary>
                <pre className="mt-2 text-xs text-red-400 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3 justify-center">
              <button 
                onClick={this.handleReset}
                className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-primary-dark)] font-medium rounded-xl transition-all"
              >
                🔄 رفرش صفحه
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple error message component for non-boundary contexts
 */
export function ErrorMessage({ 
  message, 
  onRetry 
}: { 
  message?: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-red-400 font-medium">خطا</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              {message || 'مشکلی رخ داده است'}
            </p>
          </div>
        </div>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
          >
            تلاش مجدد
          </button>
        )}
      </div>
    </div>
  );
}
