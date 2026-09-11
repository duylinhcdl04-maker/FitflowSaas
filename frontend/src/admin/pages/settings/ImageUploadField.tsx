import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import {
  CloudArrowUp,
  Trash,
  ArrowsClockwise,
  CheckCircle,
  LinkSimple,
  Eye,
  X,
} from '@phosphor-icons/react';
import { uploadPlatformAsset } from '../../api/settings';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  helperText?: string;
  aspectRatio?: 'wide' | 'square';
  placeholder?: string;
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  folder = 'fitflow/platform-branding',
  helperText = 'Định dạng PNG, JPG, SVG hoặc WEBP. Tối đa 5MB.',
  aspectRatio = 'wide',
  placeholder = 'Chọn hoặc kéo thả tệp ảnh logo vào đây',
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn tệp hình ảnh hợp lệ');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Kích thước ảnh vượt quá giới hạn 5MB');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // Convert to base64 dataUri
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        try {
          const res = await uploadPlatformAsset(dataUri, folder);
          if (res?.url) {
            onChange(res.url);
          }
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Tải ảnh lên Cloudinary thất bại';
          setUploadError(message);
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Không thể đọc tệp ảnh từ máy tính');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadError('Xử lý tải ảnh thất bại');
      setIsUploading(false);
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          <LinkSimple className="h-3.5 w-3.5" />
          {showManualUrl ? 'Ẩn nhập URL' : 'Nhập URL trực tiếp'}
        </button>
      </div>

      {showManualUrl && (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://res.cloudinary.com/.../image.png"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      )}

      {value ? (
        <div className="relative flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div
            className={`relative flex items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white p-2 shadow-xs dark:border-zinc-700 dark:bg-zinc-800 ${
              aspectRatio === 'square' ? 'h-24 w-24 shrink-0' : 'h-24 w-44 shrink-0'
            }`}
          >
            {/* Transparent checkerboard background pattern */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: `radial-gradient(#888 1px, transparent 1px)`,
                backgroundSize: '8px 8px',
              }}
            />
            <img
              src={value}
              alt={label}
              className="relative max-h-full max-w-full object-contain"
            />
          </div>

          <div className="flex flex-1 flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0" weight="fill" />
              <span>Ảnh đã lưu trên Cloudinary</span>
            </div>
            <p className="truncate text-xs text-zinc-500 font-mono dark:text-zinc-400 max-w-md">
              {value}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <ArrowsClockwise
                  className={`h-3.5 w-3.5 ${isUploading ? 'animate-spin' : ''}`}
                />
                {isUploading ? 'Đang tải lên...' : 'Thay ảnh khác'}
              </button>

              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <Eye className="h-3.5 w-3.5" />
                Xem kích thước gốc
              </button>

              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50/60 px-2.5 py-1.5 text-xs font-medium text-red-600 shadow-xs hover:bg-red-100/80 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50"
              >
                <Trash className="h-3.5 w-3.5" />
                Xóa
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-50/50 dark:border-emerald-400 dark:bg-emerald-950/20'
              : 'border-zinc-300 bg-zinc-50/50 hover:border-emerald-500 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-emerald-500 dark:hover:bg-zinc-900'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={onInputChange}
            className="hidden"
          />

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-110 dark:bg-emerald-950/60 dark:text-emerald-400">
            {isUploading ? (
              <ArrowsClockwise className="h-6 w-6 animate-spin" />
            ) : (
              <CloudArrowUp className="h-6 w-6" />
            )}
          </div>

          <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {isUploading ? 'Đang đẩy ảnh lên Cloudinary...' : placeholder}
          </p>

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {helperText}
          </p>
        </div>
      )}

      {uploadError && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {uploadError}
        </p>
      )}

      {/* Modal Preview ảnh gốc */}
      {showPreviewModal && value && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 right-4 rounded-full bg-zinc-100 p-1.5 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-4 text-base font-bold text-zinc-900 dark:text-zinc-100">
              {label} (Kích thước gốc)
            </h3>
            <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <img
                src={value}
                alt={label}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
