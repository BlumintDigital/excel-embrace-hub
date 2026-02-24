import { useState, useEffect } from 'react';
import { useMutationState } from '@tanstack/react-query';
import { useOnlineStatus } from '@/lib/pwa';
import { WifiOff, RefreshCw, Wifi } from 'lucide-react';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  // Count mutations currently paused (pending while offline)
  const pausedMutations = useMutationState({
    filters: { status: 'pending' },
    select: (m) => m.state.status,
  });
  const pendingCount = pausedMutations.length;

  // Track offline→online transition to briefly show "syncing" message
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowReconnected(false);
    } else if (wasOffline) {
      setShowReconnected(true);
      const t = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) return null;

  if (showReconnected) {
    return (
      <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-emerald-500 py-2 text-sm font-medium text-white shadow">
        <Wifi className="h-4 w-4 shrink-0" />
        Back online — syncing changes…
      </div>
    );
  }

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-500 py-2 text-sm font-medium text-white shadow">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>You're offline — data is read-only.</span>
      {pendingCount > 0 && (
        <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
          <RefreshCw className="h-3 w-3" />
          {pendingCount} change{pendingCount !== 1 ? 's' : ''} pending sync
        </span>
      )}
    </div>
  );
}
