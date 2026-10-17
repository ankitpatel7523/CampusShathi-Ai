import React from 'react';
import { AlertTriangle, X, RefreshCw, KeyRound, Clock, ServerOff } from 'lucide-react';

interface ErrorBannerProps {
  message?: string;
  errorKind?: string;
  fixHint?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  errorKind,
  fixHint,
  onRetry,
  onDismiss
}) => {
  if (!message) return null;

  const getIcon = () => {
    switch (errorKind) {
      case 'NO_KEY':
        return <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'TIMEOUT':
        return <Clock className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />;
      case 'MODEL_NOT_FOUND':
      case 'QUOTA_EXCEEDED':
        return <ServerOff className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />;
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50/90 dark:border-red-900/50 dark:bg-red-950/40 p-4 text-sm text-red-900 dark:text-red-200 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {getIcon()}
          <div>
            <div className="font-semibold text-red-950 dark:text-red-100 mb-0.5">
              {message}
            </div>
            {fixHint && (
              <p className="text-xs text-red-800/90 dark:text-red-300/90 mt-1 leading-relaxed">
                💡 <span className="font-medium">Hint:</span> {fixHint}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-red-200/80 hover:bg-red-200 text-red-900 dark:bg-red-900/60 dark:hover:bg-red-900 dark:text-red-100 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-md text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100 transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
