import {
  PaintBrush,
  EnvelopeSimple,
  Globe,
  Phone,
  FloppyDisk,
  Sparkle,
  Receipt,
} from '@phosphor-icons/react';
import type { BrandingSettings } from '../../api/settings';
import FormField, { inputClass } from '../../components/FormField';
import Button from '../../components/Button';
import ImageUploadField from './ImageUploadField';

interface BrandingTabProps {
  data: BrandingSettings;
  onChange: (data: BrandingSettings) => void;
  onSave: () => void;
  isSaving: boolean;
  error?: string;
  updatedAt?: string | null;
}

export default function BrandingTab({
  data,
  onChange,
  onSave,
  isSaving,
  error,
  updatedAt,
}: BrandingTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Form Fields (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <PaintBrush className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Nhận diện Thương hiệu
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Logo, tên nền tảng và biểu tượng hiển thị trên toàn hệ sinh thái FitFlow.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-6">
            <FormField label="Tên hiển thị nền tảng (Platform Name)" htmlFor="brandName">
              <input
                id="brandName"
                className={inputClass}
                placeholder="FitFlow Gym Management SaaS"
                value={data.name ?? ''}
                onChange={(e) => onChange({ ...data, name: e.target.value })}
              />
            </FormField>

            {/* Cloudinary Logo Uploader */}
            <ImageUploadField
              label="Logo chính của hệ thống (Primary Logo)"
              value={data.logoUrl ?? ''}
              onChange={(url) => onChange({ ...data, logoUrl: url })}
              folder="fitflow/branding"
              helperText="Kích thước tối ưu: 600x160px (dạng ngang), PNG trong suốt hoặc SVG."
              aspectRatio="wide"
            />

            {/* Cloudinary Favicon Uploader */}
            <ImageUploadField
              label="Favicon & Biểu tượng thu nhỏ (App Icon)"
              value={data.faviconUrl ?? ''}
              onChange={(url) => onChange({ ...data, faviconUrl: url })}
              folder="fitflow/branding/icons"
              helperText="Kích thước tối ưu: 128x128px (tỉ lệ 1:1), PNG hoặc ICO."
              aspectRatio="square"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <EnvelopeSimple className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Email & Thông tin Hỗ trợ
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Thông tin gửi email hóa đơn, thông báo hệ thống và liên hệ CSKH.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Tên người gửi hiển thị" htmlFor="senderName">
              <input
                id="senderName"
                className={inputClass}
                placeholder="FitFlow System Notification"
                value={data.senderName ?? ''}
                onChange={(e) => onChange({ ...data, senderName: e.target.value })}
              />
            </FormField>

            <FormField label="Email gửi tự động (Sender Email)" htmlFor="senderEmail">
              <input
                id="senderEmail"
                type="email"
                className={inputClass}
                placeholder="noreply@fitflow.vn"
                value={data.senderEmail ?? ''}
                onChange={(e) => onChange({ ...data, senderEmail: e.target.value })}
              />
            </FormField>

            <FormField label="Cổng hỗ trợ (Support Portal URL)" htmlFor="supportDomain">
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  id="supportDomain"
                  className={`${inputClass} pl-9`}
                  placeholder="https://support.fitflow.vn"
                  value={data.supportDomain ?? ''}
                  onChange={(e) => onChange({ ...data, supportDomain: e.target.value })}
                />
              </div>
            </FormField>

            <FormField label="Email chăm sóc khách hàng" htmlFor="supportEmail">
              <div className="relative">
                <EnvelopeSimple className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  id="supportEmail"
                  type="email"
                  className={`${inputClass} pl-9`}
                  placeholder="hotro@fitflow.vn"
                  value={data.supportEmail ?? ''}
                  onChange={(e) => onChange({ ...data, supportEmail: e.target.value })}
                />
              </div>
            </FormField>

            <FormField label="Hotline hỗ trợ kỹ thuật" htmlFor="hotline">
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  id="hotline"
                  className={`${inputClass} pl-9`}
                  placeholder="1900 6868 (24/7)"
                  value={data.hotline ?? ''}
                  onChange={(e) => onChange({ ...data, hotline: e.target.value })}
                />
              </div>
            </FormField>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {updatedAt ? (
            <span className="text-xs text-zinc-400">
              Cập nhật lần cuối: {new Date(updatedAt).toLocaleString('vi-VN')}
            </span>
          ) : (
            <span />
          )}
          <Button
            variant="primary"
            size="md"
            disabled={isSaving}
            onClick={onSave}
            className="flex items-center gap-2 shadow-md shadow-emerald-600/20"
          >
            <FloppyDisk className="h-4 w-4" />
            {isSaving ? 'Đang lưu...' : 'Lưu cấu hình thương hiệu'}
          </Button>
        </div>
      </div>

      {/* Live Visual Mockup Preview (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="sticky top-6 rounded-2xl border border-zinc-200 bg-linear-to-br from-zinc-50 to-emerald-50/30 p-6 shadow-xs dark:border-zinc-800 dark:from-zinc-900 dark:to-emerald-950/10">
          <div className="flex items-center justify-between border-b border-zinc-200/60 pb-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Sparkle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" weight="fill" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Bản xem trước trực quan
              </h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase dark:bg-emerald-950 dark:text-emerald-300">
              Live Mockup
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {/* Mock Header Platform Preview */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-800/90">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Giao diện Header hệ thống
              </span>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-3 text-white">
                <div className="flex items-center gap-3">
                  {data.logoUrl ? (
                    <img
                      src={data.logoUrl}
                      alt="Logo Preview"
                      className="h-7 w-auto max-w-[130px] object-contain"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 font-bold text-xs text-white">
                      F
                    </div>
                  )}
                  <span className="text-sm font-bold tracking-tight">
                    {data.name || 'FitFlow Platform'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-zinc-400">All systems operational</span>
                </div>
              </div>
            </div>

            {/* Mock System Invoice / Email Card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-800/90">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Mẫu Email & Hóa đơn gửi Tenant
              </span>
              <div className="mt-3 rounded-xl border border-dashed border-zinc-200 p-4 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-900/60">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {data.senderName || 'FitFlow System'}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        &lt;{data.senderEmail || 'noreply@fitflow.vn'}&gt;
                      </p>
                    </div>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    PAID
                  </span>
                </div>
                <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-300">
                  Kính gửi Chủ phòng gym, gói cước Pro của bạn đã được gia hạn thành công.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span>Hotline: {data.hotline || '1900 6868'}</span>
                  <span>{data.supportDomain || 'support.fitflow.vn'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
