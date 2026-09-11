import { useState, useEffect, useCallback } from 'react';
import { offlineSyncEngine } from './offlineSyncEngine';

export interface NetworkStatus {
  isOnline: boolean;
  isSyncing: boolean;
  isSlow: boolean;
  pendingCount: number;
  lastSyncedAt?: number;
  lastError?: string;
  syncNow: () => Promise<{ syncedCount: number; conflictsCount: number }>;
  refreshMemberCache: (branchId?: string) => Promise<number>;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSlow, setIsSlow] = useState(false);
  const [syncState, setSyncState] = useState<{
    isSyncing: boolean;
    pendingCount: number;
    lastSyncedAt?: number;
    lastError?: string;
  }>({
    isSyncing: false,
    pendingCount: 0,
  });

  // 1. Subscribe to offline sync engine updates
  useEffect(() => {
    const unsubscribe = offlineSyncEngine.subscribe((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  // 2. Window online/offline event listeners + Heartbeat Ping
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleOnline() {
      setIsOnline(true);
      offlineSyncEngine.triggerSync();
    }

    function handleOffline() {
      setIsOnline(false);
      offlineSyncEngine.refreshStats();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Heartbeat check every 30s to verify actual internet connectivity
    const interval = setInterval(async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }

      const start = Date.now();
      try {
        // Fast ping to verify connectivity
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const latency = Date.now() - start;
        setIsOnline(true);
        setIsSlow(latency > 2500);
      } catch {
        // If fetch aborted or failed completely
        if (!navigator.onLine) {
          setIsOnline(false);
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const syncNow = useCallback(async () => {
    return offlineSyncEngine.triggerSync();
  }, []);

  const refreshMemberCache = useCallback(async (branchId?: string) => {
    return offlineSyncEngine.syncMemberCache(branchId);
  }, []);

  return {
    isOnline,
    isSyncing: syncState.isSyncing,
    isSlow,
    pendingCount: syncState.pendingCount,
    lastSyncedAt: syncState.lastSyncedAt,
    lastError: syncState.lastError,
    syncNow,
    refreshMemberCache,
  };
}
