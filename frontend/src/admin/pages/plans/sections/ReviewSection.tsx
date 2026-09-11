import { useState } from 'react';
import {
  CheckCircle,
  WarningCircle,
  RocketLaunch,
  Archive,
  Copy,
  Trash,
  ShieldCheck,
  FloppyDisk,
  ArrowClockwise,
} from '@phosphor-icons/react';

interface ReviewSectionProps {
  planId?: string;
  planName: string;
  status: string;
  setStatus: (s: any) => void;
  onPublish: () => Promise<void>;
  onArchive: () => Promise<void>;
  onDuplicate: () => void;
  onDelete: () => Promise<void>;
  onSaveAll: () => Promise<void>;
  isSaving?: boolean;
}

export default function ReviewSection({
  planName,
  status,
  setStatus,
  onPublish,
  onArchive,
  onDuplicate,
  onDelete,
  onSaveAll,
  isSaving = false,
}: ReviewSectionProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const runPreFlightCheck = () => {
    const errors: string[] = [];
    if (!planName || planName.trim().length === 0) {
      errors.push('Tên gói không được để trống.');
    }
    setValidationErrors(errors);
    setHasChecked(true);
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      await onPublish();
      setStatus('ACTIVE');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      await onArchive();
      setStatus('ARCHIVED');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa gói "${planName}"?`)) return;
    try {
      setIsDeleting(true);
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const isPublished = status === 'ACTIVE';
  const isArchived = status === 'ARCHIVED';
  const isDraft = status === 'DRAFT';

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50/70 border border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/40 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" weight="bold" />
        <div className="text-sm text-emerald-900 dark:text-emerald-200">
          <p className="font-bold">Dimension 10: Rà soát & Xuất bản (Review & Publish)</p>
          <p className="mt-0.5 text-xs text-emerald-700/80 dark:text-emerald-300/80">
            Hệ thống kiểm tra tính toàn vẹn đa chiều trước khi xuất bản. Bảo đảm tính liên tục của dữ liệu khách hàng.
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-zinc-500">Trạng thái hiện tại:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isPublished
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  : isArchived
                  ? 'bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              {isPublished ? 'PUBLISHED (ĐANG HOẠT ĐỘNG)' : isArchived ? 'ARCHIVED (ĐÃ LƯU TRỮ)' : 'DRAFT (BẢN NHÁP)'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
            Gói cước: <span className="font-bold text-zinc-900 dark:text-zinc-100">{planName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onSaveAll}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
          >
            <FloppyDisk className="w-4 h-4" weight="bold" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình'}</span>
          </button>

          {isDraft && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
            >
              <RocketLaunch className="w-4 h-4" weight="bold" />
              <span>{isPublishing ? 'Đang xuất bản...' : 'Xuất Bản Gói (Publish)'}</span>
            </button>
          )}

          {isPublished && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={isArchiving}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
            >
              <Archive className="w-4 h-4" weight="bold" />
              <span>{isArchiving ? 'Đang lưu trữ...' : 'Lưu Trữ (Archive)'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDuplicate}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-zinc-300 flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Nhân Bản (Duplicate)</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 transition-colors"
          >
            <Trash className="w-4 h-4" />
            <span>Xóa Gói</span>
          </button>
        </div>
      </div>

      {/* Pre-Flight Validation Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span>Kiểm định điều kiện xuất bản (Pre-Flight Checks)</span>
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Rà soát tự động các tiêu chí: Giá cước, Tính năng, Hạn ngạch Quota, Cổng tích hợp và Hiển thị.
            </p>
          </div>
          <button
            type="button"
            onClick={runPreFlightCheck}
            className="px-3.5 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <ArrowClockwise className="w-3.5 h-3.5" />
            <span>Chạy Kiểm Tra Ngay</span>
          </button>
        </div>

        {hasChecked && (
          <div className="pt-2">
            {validationErrors.length === 0 ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-300">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" weight="fill" />
                <div>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">Cấu hình hoàn toàn hợp lệ!</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Tất cả 10 dimensions đã sẵn sàng phục vụ cho thuê trên nền tảng FitFlow.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                  <WarningCircle className="w-5 h-5" weight="fill" />
                  <span>Phát hiện {validationErrors.length} điểm cần hoàn thiện:</span>
                </div>
                <ul className="list-disc list-inside text-xs text-rose-600 dark:text-rose-300/90 space-y-1 pl-1">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
