import { useState } from 'react';
import {
  WifiHigh,
  WifiSlash,
  ArrowsClockwise,
  Warning,
  CheckCircle,
  Database,
  CloudArrowUp,
} from '@phosphor-icons/react';
import { useNetworkStatus } from '../lib/useNetworkStatus';
import Modal from '../owner/components/Modal';

interface NetworkStatusBadgeProps {
  className?: string;
  variant?: 'full' | 'compact';
}

export default function NetworkStatusBadge({
  className = '',
  variant = 'full',
}: NetworkStatusBadgeProps) {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncedAt,
    lastError,
    syncNow,
  } = useNetworkStatus();

  const [modalOpen, setModalOpen] = useState(false);
  const [syncingManual, setSyncingManual] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  async function handleManualSync() {
    setSyncingManual(true);
    setSyncResult(null);
    try {
      const res = await syncNow();
      if (res.syncedCount > 0) {
        setSyncResult(`Đã đồng bộ thành công ${res.syncedCount} lượt quẹt thẻ.`);
      } else if (res.conflictsCount > 0) {
        setSyncResult(`Đã xử lý: Có ${res.conflictsCount} lượt trùng/xung đột.`);
      } else {
        setSyncResult('Hàng đợi ngoại tuyến trống.');
      }
    } catch {
      setSyncResult('Không thể kết nối đến máy chủ.');
    } finally {
      setSyncingManual(false);
    }
  }

  // Visual Pill States
  if (!isOnline) {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 shadow-xs transition-all hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-300 animate-pulse ${className}`}
          title="Chế độ Ngoại tuyến (Offline Mode) - Click để xem chi tiết"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
          </span>
          <WifiSlash size={14} weight="bold" />
          <span>Offline</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-rose-200 px-1.5 py-0.2 text-[10px] font-bold text-rose-900 dark:bg-rose-800 dark:text-rose-100">
              {pendingCount}
            </span>
          )}
        </button>

        {modalOpen && renderModal()}
      </>
    );
  }

  if (isSyncing || syncingManual) {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 shadow-xs transition-all hover:bg-sky-100 dark:border-sky-500/40 dark:bg-sky-950/40 dark:text-sky-300 ${className}`}
          title="Đang đồng bộ dữ liệu ngoại tuyến..."
        >
          <ArrowsClockwise size={14} weight="bold" className="animate-spin text-sky-600 dark:text-sky-400" />
          <span>Đang đồng bộ...</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-sky-200 px-1.5 py-0.2 text-[10px] font-bold text-sky-900 dark:bg-sky-800 dark:text-sky-100">
              {pendingCount}
            </span>
          )}
        </button>

        {modalOpen && renderModal()}
      </>
    );
  }

  if (pendingCount > 0) {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-xs transition-all hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300 ${className}`}
          title="Có lượt check-in chờ đồng bộ"
        >
          <Warning size={14} weight="fill" className="text-amber-600 dark:text-amber-400" />
          <span>Chờ đồng bộ ({pendingCount})</span>
        </button>

        {modalOpen && renderModal()}
      </>
    );
  }

  // Default Online State
  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50/70 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-all hover:bg-emerald-100/80 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300 ${className}`}
        title="Hệ thống trực tuyến ổn định"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
        <WifiHigh size={13} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
        {variant === 'full' && <span>Trực tuyến</span>}
      </button>

      {modalOpen && renderModal()}
    </>
  );

  function renderModal() {
    return (
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Trạng thái Kết nối & Dữ liệu Ngoại tuyến"
      >
        <div className="space-y-4 text-xs text-slate-600 dark:text-zinc-300">
          {/* Main Status Banner */}
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 ${
              !isOnline
                ? 'border-rose-200 bg-rose-50/80 dark:border-rose-900/50 dark:bg-rose-950/30'
                : pendingCount > 0
                ? 'border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30'
                : 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/30'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                !isOnline
                  ? 'bg-rose-500 text-white'
                  : pendingCount > 0
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {!isOnline ? (
                <WifiSlash size={22} weight="bold" />
              ) : pendingCount > 0 ? (
                <CloudArrowUp size={22} weight="bold" />
              ) : (
                <CheckCircle size={22} weight="bold" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-zinc-50">
                {!isOnline
                  ? 'Mất kết nối Internet (Offline Mode)'
                  : pendingCount > 0
                  ? `Có ${pendingCount} lượt quẹt thẻ chờ đồng bộ`
                  : 'Kết nối Máy chủ Trực tuyến'}
              </h4>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                {!isOnline
                  ? 'Hệ thống tự động lưu lượt quẹt thẻ vào trình duyệt (IndexedDB) và tra cứu thẻ hội viên offline.'
                  : pendingCount > 0
                  ? 'Các lượt quẹt thẻ đã lưu ngoại tuyến đang sẵn sàng để đồng bộ lên máy chủ đám mây.'
                  : 'Đường truyền ổn định. Mọi thao tác check-in và thanh toán được xử lý theo thời gian thực.'}
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                <Database size={15} />
                <span>Hàng đợi chờ đồng bộ</span>
              </div>
              <div className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-zinc-50">
                {pendingCount} <span className="text-xs font-normal text-slate-400">lượt</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                <ArrowsClockwise size={15} />
                <span>Đồng bộ gần nhất</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-900 dark:text-zinc-50 truncate">
                {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString('vi-VN') : 'Chưa đồng bộ'}
              </div>
            </div>
          </div>

          {lastError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
              <span className="font-semibold">Lỗi đồng bộ: </span>
              <span>{lastError}</span>
            </div>
          )}

          {syncResult && (
            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300">
              {syncResult}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={!isOnline || isSyncing || syncingManual || pendingCount === 0}
              onClick={handleManualSync}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ArrowsClockwise
                size={14}
                weight="bold"
                className={syncingManual || isSyncing ? 'animate-spin' : ''}
              />
              <span>{syncingManual || isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
            </button>
          </div>
        </div>
      </Modal>
    );
  }
}
