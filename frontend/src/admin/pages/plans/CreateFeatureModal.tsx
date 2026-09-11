import { useState } from 'react';
import { X, Sparkle, Plus, CheckCircle, Info } from '@phosphor-icons/react';
import { inputClass } from '../../components/FormField';
import { FEATURE_CATEGORIES, LIMIT_CATEGORIES } from './types';

interface CreateFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    code: string;
    description?: string;
    featureType: 'BOOLEAN' | 'QUOTA';
    module?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
  initialType?: 'BOOLEAN' | 'QUOTA';
}

export default function CreateFeatureModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialType = 'BOOLEAN',
}: CreateFeatureModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [featureType, setFeatureType] = useState<'BOOLEAN' | 'QUOTA'>(initialType);
  const [moduleCategory, setModuleCategory] = useState('CHECKIN');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = featureType === 'QUOTA' ? LIMIT_CATEGORIES : FEATURE_CATEGORIES;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!code) {
      setCode(
        val
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '_')
          .replace(/[^A-Z0-9_]/g, '')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên tính năng / định mức');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Vui lòng nhập mã key (e.g. FACE_RECOGNITION)');
      return;
    }
    if (!/^[A-Z0-9_]{2,50}$/.test(code.toUpperCase())) {
      setErrorMsg('Mã key chỉ gồm chữ in hoa, số và dấu gạch dưới');
      return;
    }

    try {
      setErrorMsg(null);
      await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        featureType,
        module: moduleCategory,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Không thể tạo tính năng mới');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
              {featureType === 'QUOTA' ? 'Thêm Định mức Tài nguyên Mới' : 'Thêm Tính năng Nền tảng Mới'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Định nghĩa module mới vào danh mục Entitlements của FitFlow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-between overflow-y-auto p-6">
          <div className="space-y-4">
            {errorMsg && (
              <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            {/* Type selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Loại dữ liệu quyền hạn (Entitlement Type)
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFeatureType('BOOLEAN');
                    setModuleCategory('CHECKIN');
                  }}
                  className={`rounded-xl border p-3 text-left transition ${
                    featureType === 'BOOLEAN'
                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-300'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-850'
                  }`}
                >
                  <span className="block text-xs font-bold">Boolean (ON / OFF)</span>
                  <span className="mt-0.5 block text-[11px] text-zinc-500 dark:text-zinc-400">
                    Bật/Tắt module tính năng
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFeatureType('QUOTA');
                    setModuleCategory('ACCOUNT');
                  }}
                  className={`rounded-xl border p-3 text-left transition ${
                    featureType === 'QUOTA'
                      ? 'border-purple-500 bg-purple-50/40 text-purple-900 dark:border-purple-500 dark:bg-purple-950/30 dark:text-purple-300'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-850'
                  }`}
                >
                  <span className="block text-xs font-bold">Quota / Limit</span>
                  <span className="mt-0.5 block text-[11px] text-zinc-500 dark:text-zinc-400">
                    Định mức số lượng & dung lượng
                  </span>
                </button>
              </div>
            </div>

            {/* Feature Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Tên hiển thị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Nhận diện khuôn mặt (Face ID)"
                className={`mt-1.5 w-full ${inputClass}`}
              />
            </div>

            {/* Feature Code Key */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Mã Key định danh (Code) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                placeholder="Ví dụ: FACE_RECOGNITION"
                className={`mt-1.5 w-full font-mono uppercase ${inputClass}`}
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Mã key code được lập trình viên sử dụng trong backend để assert quyền hạn.
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Danh mục chức năng
              </label>
              <select
                value={moduleCategory}
                onChange={(e) => setModuleCategory(e.target.value)}
                className={`mt-1.5 w-full ${inputClass}`}
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label} ({c.key})
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Mô tả chi tiết
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giải thích tác dụng của tính năng này đối với trải nghiệm phòng tập..."
                className={`mt-1.5 w-full resize-none ${inputClass}`}
              />
            </div>

            {/* Live Preview Card */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-850/60">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Xem trước hiển thị trên bảng cấu hình:
              </span>
              <div className="mt-2 flex items-center justify-between rounded-lg border border-zinc-200/80 bg-white p-3 shadow-2xs dark:border-zinc-700 dark:bg-zinc-900">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {name || 'Tên tính năng mẫu'}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">
                      {code || 'FEATURE_CODE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 line-clamp-1">
                    {description || 'Mô tả tính năng sẽ xuất hiện ở đây...'}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {featureType}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" weight="bold" />
              <span>{isSubmitting ? 'Đang tạo...' : 'Tạo Feature'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
