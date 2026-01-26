import { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo?: ErrorInfo | null;
  onRetry?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  title?: string;
  message?: string;
}

export function ErrorFallback({
  error,
  errorInfo,
  onRetry,
  onGoHome,
  showDetails = false,
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
}: ErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
    >
      <div className="w-16 h-16 mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>

      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>

      <div className="flex gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
        {onGoHome && (
          <Button onClick={onGoHome} variant="outline">
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        )}
      </div>

      {showDetails && error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 w-full max-w-lg"
        >
          <details className="text-left">
            <summary className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              <Bug className="w-4 h-4" />
              Error Details
            </summary>
            <div className="mt-3 p-4 bg-muted/50 rounded-lg overflow-auto">
              <p className="text-sm font-mono text-red-500 mb-2">
                {error.name}: {error.message}
              </p>
              {errorInfo?.componentStack && (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          </details>
        </motion.div>
      )}
    </motion.div>
  );
}

// Compact error fallback for smaller UI sections
interface CompactErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export function CompactErrorFallback({
  message = 'Failed to load',
  onRetry,
}: CompactErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="w-6 h-6 text-red-500 mb-2" />
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="w-3 h-3" />
          Retry
        </Button>
      )}
    </div>
  );
}

// Specialized error boundary for article content
interface ArticleErrorBoundaryProps {
  children: ReactNode;
}

export function ArticleErrorBoundary({ children }: ArticleErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <CompactErrorFallback
          message="Failed to load article content"
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// Specialized error boundary for feed list
interface FeedErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

export function FeedErrorBoundary({ children, onRetry }: FeedErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <CompactErrorFallback
          message="Failed to load feeds"
          onRetry={onRetry}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}
