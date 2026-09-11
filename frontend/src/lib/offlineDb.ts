/**
 * IndexedDB storage manager for FitFlow Offline Mode.
 * Database: fitflow_offline_store (v1)
 * Stores:
 *  - active_members: cached branch active members for offline search and checkin
 *  - attendance_queue: offline checkin requests waiting to be synced to backend
 *  - sync_metadata: last sync timestamps, stats
 */

export interface OfflineMember {
  id: string;
  customerCode: string;
  fullName: string;
  phone: string;
  avatarUrl?: string | null;
  membershipId?: string | null;
  membershipStatus: string;
  activePackageName: string;
  validUntil: string | null;
  branchAccess: string;
  branchId: string;
  lastCachedAt?: number;
}

export interface OfflineAttendanceItem {
  id: string; // Client-generated UUID v4
  customerId: string;
  customerName: string;
  customerCode: string;
  branchId?: string;
  attendanceType: 'MEMBER' | 'GUEST';
  method: 'QR' | 'MANUAL' | 'FACE' | 'CARD';
  checkInAt: string; // ISO string
  membershipId?: string;
  note?: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
  retryCount: number;
  errorReason?: string;
  createdAt: number;
}

const DB_NAME = 'fitflow_offline_store';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function initOfflineDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this browser/environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. active_members store
      if (!db.objectStoreNames.contains('active_members')) {
        const memberStore = db.createObjectStore('active_members', { keyPath: 'id' });
        memberStore.createIndex('by_code', 'customerCode', { unique: false });
        memberStore.createIndex('by_phone', 'phone', { unique: false });
        memberStore.createIndex('by_name', 'fullName', { unique: false });
      }

      // 2. attendance_queue store
      if (!db.objectStoreNames.contains('attendance_queue')) {
        const queueStore = db.createObjectStore('attendance_queue', { keyPath: 'id' });
        queueStore.createIndex('by_status', 'status', { unique: false });
        queueStore.createIndex('by_createdAt', 'createdAt', { unique: false });
      }

      // 3. sync_metadata store
      if (!db.objectStoreNames.contains('sync_metadata')) {
        db.createObjectStore('sync_metadata', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] Failed to open database', event);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

// Generate client UUID v4
export function generateClientUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Lưu/ghi đè danh bạ hội viên active vào IndexedDB
 */
export async function cacheActiveMembers(members: OfflineMember[], branchId: string): Promise<void> {
  const db = await initOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['active_members', 'sync_metadata'], 'readwrite');
    const memberStore = tx.objectStore('active_members');
    const metaStore = tx.objectStore('sync_metadata');

    // Clear old members cache and repopulate
    memberStore.clear();

    const now = Date.now();
    for (const member of members) {
      memberStore.put({ ...member, lastCachedAt: now });
    }

    metaStore.put({
      key: 'members_cache',
      branchId,
      totalCount: members.length,
      lastCachedAt: new Date().toISOString(),
      updatedAt: now,
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Tra cứu danh bạ hội viên offline theo từ khóa (tên, mã khách, SĐT)
 */
export async function searchOfflineMembers(search = ''): Promise<OfflineMember[]> {
  const db = await initOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('active_members', 'readonly');
    const store = tx.objectStore('active_members');
    const request = store.getAll();

    request.onsuccess = () => {
      const all = request.result as OfflineMember[];
      if (!search.trim()) {
        resolve(all.slice(0, 30));
        return;
      }

      const q = search.trim().toLowerCase();
      const filtered = all.filter((m) => {
        return (
          m.fullName?.toLowerCase().includes(q) ||
          m.customerCode?.toLowerCase().includes(q) ||
          m.phone?.includes(q)
        );
      });

      resolve(filtered.slice(0, 50));
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Tìm 1 hội viên offline theo ID
 */
export async function getOfflineMemberById(id: string): Promise<OfflineMember | null> {
  const db = await initOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('active_members', 'readonly');
    const store = tx.objectStore('active_members');
    const request = store.get(id);

    request.onsuccess = () => resolve((request.result as OfflineMember) || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Xếp hàng 1 lượt check-in offline vào attendance_queue
 */
export async function enqueueOfflineAttendance(
  item: Omit<OfflineAttendanceItem, 'id' | 'status' | 'retryCount' | 'createdAt'>,
): Promise<OfflineAttendanceItem> {
  const db = await initOfflineDb();
  const queueItem: OfflineAttendanceItem = {
    ...item,
    id: generateClientUuid(),
    status: 'PENDING',
    retryCount: 0,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('attendance_queue', 'readwrite');
    const store = tx.objectStore('attendance_queue');
    const request = store.put(queueItem);

    request.onsuccess = () => resolve(queueItem);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Lấy danh sách lượt check-in đang chờ sync
 */
export async function getPendingAttendanceQueue(): Promise<OfflineAttendanceItem[]> {
  const db = await initOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attendance_queue', 'readonly');
    const store = tx.objectStore('attendance_queue');
    const request = store.getAll();

    request.onsuccess = () => {
      const all = (request.result as OfflineAttendanceItem[]) || [];
      const pending = all.filter(
        (item) => item.status === 'PENDING' || item.status === 'FAILED',
      );
      resolve(pending);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Lấy toàn bộ hàng đợi (cả PENDING, SYNCING, CONFLICT)
 */
export async function getAllAttendanceQueue(): Promise<OfflineAttendanceItem[]> {
  const db = await initOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attendance_queue', 'readonly');
    const store = tx.objectStore('attendance_queue');
    const request = store.getAll();

    request.onsuccess = () => resolve((request.result as OfflineAttendanceItem[]) || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cập nhật trạng thái của 1 lượt check-in trong queue
 */
export async function updateAttendanceQueueStatus(
  id: string,
  status: OfflineAttendanceItem['status'],
  errorReason?: string,
): Promise<void> {
  const db = await initOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attendance_queue', 'readwrite');
    const store = tx.objectStore('attendance_queue');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result as OfflineAttendanceItem;
      if (!item) {
        resolve();
        return;
      }
      item.status = status;
      if (errorReason) item.errorReason = errorReason;
      if (status === 'FAILED') item.retryCount = (item.retryCount || 0) + 1;

      store.put(item);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Xóa các lượt đã sync thành công khỏi queue
 */
export async function removeSyncedAttendances(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const db = await initOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attendance_queue', 'readwrite');
    const store = tx.objectStore('attendance_queue');
    for (const id of ids) {
      store.delete(id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Lấy thống kê Offline Storage
 */
export async function getOfflineStats(): Promise<{
  pendingCount: number;
  cachedMemberCount: number;
  lastCachedAt?: string;
}> {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve) => {
      const tx = db.transaction(['active_members', 'attendance_queue', 'sync_metadata'], 'readonly');
      const memberStore = tx.objectStore('active_members');
      const queueStore = tx.objectStore('attendance_queue');
      const metaStore = tx.objectStore('sync_metadata');

      const countMemberReq = memberStore.count();
      const queueReq = queueStore.getAll();
      const metaReq = metaStore.get('members_cache');

      tx.oncomplete = () => {
        const queue = (queueReq.result as OfflineAttendanceItem[]) || [];
        const pending = queue.filter((i) => i.status === 'PENDING' || i.status === 'FAILED');
        const meta = metaReq.result as { lastCachedAt?: string } | undefined;

        resolve({
          pendingCount: pending.length,
          cachedMemberCount: countMemberReq.result || 0,
          lastCachedAt: meta?.lastCachedAt,
        });
      };

      tx.onerror = () => {
        resolve({ pendingCount: 0, cachedMemberCount: 0 });
      };
    });
  } catch {
    return { pendingCount: 0, cachedMemberCount: 0 };
  }
}
