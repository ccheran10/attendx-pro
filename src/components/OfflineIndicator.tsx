import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-500 text-white px-3.5 py-2 text-xs font-semibold shadow-xl border border-amber-600 animate-in fade-in slide-in-from-bottom-2">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Offline Mode — Attendance will sync once connection returns.</span>
      <button
        onClick={() => window.location.reload()}
        className="ml-2 hover:opacity-80 p-0.5 rounded"
        title="Check connection"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
