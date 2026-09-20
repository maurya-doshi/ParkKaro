import React from 'react';
import { AlertCircle, RefreshCw, Database } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: unknown;
  onRetry?: () => void;
  isDbUnavailable?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  isDbUnavailable
}) => {
  // Check if error contains INTERNAL_ERROR or DynamoDB / credentials indicators
  const errMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : '');
  const errCode = (error as any)?.code || '';
  const isInternal = errCode === 'INTERNAL_ERROR' || errMessage.includes('500') || errMessage.includes('credentials') || isDbUnavailable;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto my-8 shadow-xl backdrop-blur-sm">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
        {isInternal ? <Database className="w-7 h-7" /> : <AlertCircle className="w-7 h-7 text-rose-400" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-4 leading-relaxed">
        {message || (isInternal 
          ? 'The backend service is active, but the DynamoDB data store is currently connecting. Once AWS credentials are active, retry to load live records.'
          : errMessage || 'An unexpected error occurred while fetching data from the backend.')}
      </p>
      
      {errCode && (
        <div className="inline-block bg-slate-950 px-3 py-1 rounded-md text-xs font-mono text-slate-400 border border-slate-800 mb-5">
          Backend Code: <span className="text-amber-300 font-semibold">{errCode}</span>
        </div>
      )}

      {onRetry && (
        <div>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/25"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
        </div>
      )}
    </div>
  );
};
