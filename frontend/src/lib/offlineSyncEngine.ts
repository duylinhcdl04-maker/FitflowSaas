import {
  cacheActiveMembers,
  getPendingAttendanceQueue,
  removeSyncedAttendances,
  updateAttendanceQueueStatus,
  getOfflineStats,
} from './offlineDb';
import { getOfflineMembersCache, syncOfflineBatchCheckin } from '../manager/api/manager';

type SyncListener = (state: {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt?: number;
  lastError?: string;
}) => void;

class OfflineSyncEngine {
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();
  private pendingCount = 0;
  private lastSyncedAt?: number;
  private lastError?: string;

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto-trigger sync when reconnecting to network
      window.addEventListener('online', () => {
        this.triggerSync();
      });

      // Periodic check every 45 seconds if online and items exist
      setInterval(() => {
        if (navigator.onLine && !this.isSyncing) {
          this.triggerSync();
        }
      }, 45000);

      // Refresh stats on load
      this.refreshStats();
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener({
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({
        isSyncing: this.isSyncing,
        pendingCount: this.pendingCount,
        lastSyncedAt: this.lastSyncedAt,
        lastError: this.lastError,
      });
    }
  }

  public async refreshStats(): Promise<{ pendingCount: number; cachedMemberCount: number }> {
    const stats = await getOfflineStats();
    this.pendingCount = stats.pendingCount;
    this.notify();
    return stats;
  }

  /**
   * Tải và làm mới danh bạ hội viên active từ backend vào IndexedDB
   */
  public async syncMemberCache(branchId?: string): Promise<number> {
    try {
      const data = await getOfflineMembersCache(branchId);
      if (data?.members) {
        await cacheActiveMembers(data.members, data.branchId);
        await this.refreshStats();
        return data.members.length;
      }
      return 0;
    } catch (err) {
      console.warn('[OfflineSyncEngine] Failed to refresh member cache', err);
      return 0;
    }
  }

  /**
   * Kích hoạt tiến trình đồng bộ các lượt check-in pending lên Backend
   */
  public async triggerSync(): Promise<{ syncedCount: number; conflictsCount: number }> {
    if (this.isSyncing) return { syncedCount: 0, conflictsCount: 0 };
    if (!navigator.onLine) {
      await this.refreshStats();
      return { syncedCount: 0, conflictsCount: 0 };
    }

    const pending = await getPendingAttendanceQueue();
    if (!pending.length) {
      this.pendingCount = 0;
      this.notify();
      return { syncedCount: 0, conflictsCount: 0 };
    }

    this.isSyncing = true;
    this.lastError = undefined;
    this.notify();

    // Mark items as SYNCING in queue
    for (const item of pending) {
      await updateAttendanceQueueStatus(item.id, 'SYNCING');
    }

    try {
      const payload = pending.map((item) => ({
        clientAttendanceId: item.id,
        customerId: item.customerId,
        branchId: item.branchId,
        checkInAt: item.checkInAt,
        attendanceType: item.attendanceType,
        method: item.method,
        membershipId: item.membershipId,
        note: item.note,
      }));

      const res = await syncOfflineBatchCheckin(payload);

      // Remove succeeded items from IndexedDB
      if (res.successIds?.length) {
        await removeSyncedAttendances(res.successIds);
      }

      // Handle conflicts / failures
      if (res.conflicts?.length) {
        for (const conflict of res.conflicts) {
          await updateAttendanceQueueStatus(conflict.id, 'CONFLICT', conflict.reason);
        }
      }

      this.lastSyncedAt = Date.now();
      await this.refreshStats();

      return {
        syncedCount: res.syncedCount || 0,
        conflictsCount: res.conflicts?.length || 0,
      };
    } catch (err: any) {
      console.error('[OfflineSyncEngine] Batch sync failed', err);
      this.lastError = err?.message || 'Không thể kết nối đến máy chủ';

      // Revert to FAILED so it can retry later
      for (const item of pending) {
        await updateAttendanceQueueStatus(item.id, 'FAILED', this.lastError);
      }
      await this.refreshStats();

      return { syncedCount: 0, conflictsCount: 0 };
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }
}

export const offlineSyncEngine = new OfflineSyncEngine();
