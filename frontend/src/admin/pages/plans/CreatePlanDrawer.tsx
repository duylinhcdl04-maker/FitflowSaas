import { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle,
  CurrencyDollar,
  Sparkle,
  Gauge,
  SlidersHorizontal,
  ShieldCheck,
  Infinity as InfinityIcon,
} from '@phosphor-icons/react';
import type { PlatformFeature, CreatePlanPayload } from '../../api/plans';
import { inputClass } from '../../components/FormField';
import Toggle from '../../components/Toggle';
import { FEATURE_CATEGORIES, LIMIT_CATEGORIES, LIMIT_UNITS } from './types';
import { BILLING_CYCLE_MONTH_OPTIONS, monthsLabel } from '../../lib/billing';

interface CreatePlanDrawerProps {
  allFeatures: PlatformFeature[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    plan: CreatePlanPayload;
    features: { featureCode: string; isEnabled: boolean; quotaValue?: number | null }[];
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export default function CreatePlanDrawer({
  allFeatures,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreatePlanDrawerProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Basic
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isPublic, setIsPublic] = useState(true);

  // Step 2: Pricing
  const [price, setPrice] = useState(490000);
  const [currency, setCurrency] = useState('VND');
  const [billingCycleMonths, setBillingCycleMonths] = useState(1);
  const [trialDays, setTrialDays] = useState(0);

  // Step 3 & 4: Features and limits toggles
  const [featureValues, setFeatureValues] = useState<
    Record<string, { isEnabled: boolean; quotaValue?: number | null }>
  >(() => {
    const map: Record<string, { isEnabled: boolean; quotaValue?: number | null }> = {};
    for (const f of allFeatures) {
      if (f.feature_type === 'QUOTA') {
        const def = LIMIT_UNITS[f.code]?.defaultVal ?? 500;
        map[f.code] = { isEnabled: true, quotaValue: def };
      } else {
        map[f.code] = { isEnabled: f.module === 'CHECKIN' || f.module === 'MEMBERSHIP', quotaValue: null };
      }
    }
    return map;
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Validation
  const validateStep = (s: number): boolean => {
    setErrorMsg(null);
    if (s === 1) {
      if (!name.trim()) {
        setErrorMsg('Vui lòng nhập tên gói cước');
        return false;
      }
      if (!code.trim()) {
        setErrorMsg('Vui lòng nhập mã định danh (Code)');
        return false;
      }
      if (!/^[A-Z0-9_]{2,30}$/.test(code.toUpperCase())) {
        setErrorMsg('Mã gói chỉ gồm chữ cái in hoa, số và gạch dưới (VD: PRO_YEARLY)');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(5, prev + 1) as any);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(1, prev - 1) as any);
  };

  const handleFinish = async () => {
    try {
      setErrorMsg(null);
      const featuresPayload = Object.entries(featureValues).map(([featureCode, val]) => ({
        featureCode,
        isEnabled: val.isEnabled,
        quotaValue: val.quotaValue,
      }));

      await onSubmit({
        plan: {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim() || undefined,
          price,
          currency,
          billingCycleMonths,
          trialDays,
          displayOrder,
          isPublic,
        },
        features: featuresPayload,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Không thể tạo gói cước');
    }
  };

  const booleanFeatures = allFeatures.filter((f) => f.feature_type !== 'QUOTA');
  const quotaFeatures = allFeatures.filter((f) => f.feature_type === 'QUOTA');

  const enabledCount = Object.values(featureValues).filter((v) => v.isEnabled).length;
  const configuredLimitsCount = quotaFeatures.filter((q) => featureValues[q.code]?.quotaValue !== undefined).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
              Tạo Gói SaaS Mới
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Bước {step} / 5: {step === 1 ? 'Thông tin cơ bản' : step === 2 ? 'Bảng giá & Chu kỳ' : step === 3 ? 'Bật tính năng' : step === 4 ? 'Giới hạn định mức' : 'Xem lại & Xác nhận'}
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

        {/* Step Indicator Bar */}
        <div className="flex border-b border-zinc-100 bg-zinc-50/50 px-6 py-2.5 dark:border-zinc-800 dark:bg-zinc-850/50">
          {[
            { s: 1, label: 'Cơ bản' },
            { s: 2, label: 'Bảng giá' },
            { s: 3, label: 'Tính năng' },
            { s: 4, label: 'Giới hạn' },
            { s: 5, label: 'Xác nhận' },
          ].map((item) => (
            <div
              key={item.s}
              className={`flex flex-1 items-center gap-1.5 text-xs font-semibold ${
                step === item.s
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : step > item.s
                  ? 'text-zinc-700 dark:text-zinc-300'
                  : 'text-zinc-400'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  step === item.s
                    ? 'bg-emerald-600 text-white'
                    : step > item.s
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {step > item.s ? <Check className="h-3 w-3" /> : item.s}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Body Content by Step */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: BASIC INFO */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Tên gói cước <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!code) {
                      setCode(e.target.value.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, ''));
                    }
                  }}
                  placeholder="Ví dụ: Gói Doanh Nghiệp"
                  className={`mt-1.5 w-full ${inputClass}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Mã gói (Code) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                  placeholder="Ví dụ: ENTERPRISE"
                  className={`mt-1.5 w-full font-mono uppercase ${inputClass}`}
                />
                <p className="mt-1 text-[11px] text-zinc-400">Mã duy nhất, không thể thay đổi sau khi tạo.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Mô tả gói cước
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả đối tượng phòng gym mục tiêu và giá trị của gói..."
                  className={`mt-1.5 w-full resize-none ${inputClass}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Chế độ hiển thị
                  </label>
                  <select
                    value={isPublic ? 'PUBLIC' : 'PRIVATE'}
                    onChange={(e) => setIsPublic(e.target.value === 'PUBLIC')}
                    className={`mt-1.5 w-full ${inputClass}`}
                  >
                    <option value="PUBLIC">Công khai (Bảng giá Website)</option>
                    <option value="PRIVATE">Nội bộ (Chỉ cấp riêng)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
                    className={`mt-1.5 w-full ${inputClass}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PRICING */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Giá cước ({currency}) <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                    className={`w-full pr-14 font-bold text-base ${inputClass}`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    {currency}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  {price === 0 ? 'Gói miễn phí hoặc gói dùng thử' : `${price.toLocaleString('vi-VN')} ₫ / chu kỳ`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Chu kỳ thanh toán
                  </label>
                  <select
                    value={billingCycleMonths}
                    onChange={(e) => setBillingCycleMonths(Number(e.target.value) || 1)}
                    className={`mt-1.5 w-full ${inputClass}`}
                  >
                    {BILLING_CYCLE_MONTH_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Số ngày dùng thử (Trial days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={trialDays}
                    onChange={(e) => setTrialDays(Math.max(0, Number(e.target.value) || 0))}
                    className={`mt-1.5 w-full ${inputClass}`}
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">0 = thanh toán ngay, 14 = 14 ngày miễn phí.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FEATURES */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Chọn các tính năng được mở khóa
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {enabledCount} / {booleanFeatures.length} bật
                </span>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {booleanFeatures.map((f) => {
                  const isEnabled = featureValues[f.code]?.isEnabled ?? false;
                  return (
                    <div key={f.code} className="flex items-center justify-between py-2.5">
                      <div>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{f.name}</span>
                        <span className="ml-2 font-mono text-[10px] text-zinc-400">{f.code}</span>
                        {f.description && <p className="text-[11px] text-zinc-500 line-clamp-1">{f.description}</p>}
                      </div>
                      <Toggle
                        checked={isEnabled}
                        onChange={(checked) =>
                          setFeatureValues((v) => ({ ...v, [f.code]: { ...v[f.code], isEnabled: checked } }))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: LIMITS */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="border-b border-zinc-100 pb-2 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Cấu hình hạn mức tài nguyên tối đa
                </span>
              </div>

              <div className="space-y-3">
                {quotaFeatures.map((q) => {
                  const unitMeta = LIMIT_UNITS[q.code] || { unit: 'đơn vị' };
                  const currentVal = featureValues[q.code]?.quotaValue;
                  const isUnlimited = currentVal === null || currentVal === undefined;

                  return (
                    <div key={q.code} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                      <div>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{q.name}</span>
                        <span className="ml-2 font-mono text-[10px] text-zinc-400">{q.code}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {isUnlimited ? (
                          <span className="flex h-8 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-600 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <InfinityIcon className="mr-1.5 h-3.5 w-3.5" /> Không giới hạn
                          </span>
                        ) : (
                          <div className="flex items-center rounded-lg border border-zinc-200 bg-white shadow-xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900">
                            <input
                              type="number"
                              min={0}
                              value={currentVal ?? 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setFeatureValues((v) => ({
                                  ...v,
                                  [q.code]: { isEnabled: true, quotaValue: isNaN(val) ? 0 : Math.max(0, val) },
                                }));
                              }}
                              className="h-8 w-20 bg-transparent px-2 text-right font-mono text-xs font-bold text-zinc-900 focus:outline-none dark:text-zinc-100"
                            />
                            <span className="shrink-0 rounded-r-lg border-l border-zinc-100 bg-zinc-50 px-2 py-1.5 text-[11px] font-medium text-zinc-500 select-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                              {unitMeta.unit}
                            </span>
                          </div>
                        )}

                        <label className="flex cursor-pointer items-center gap-1 text-[11px] text-zinc-500">
                          <input
                            type="checkbox"
                            checked={isUnlimited}
                            onChange={(e) => {
                              setFeatureValues((v) => ({
                                ...v,
                                [q.code]: {
                                  isEnabled: true,
                                  quotaValue: e.target.checked ? null : unitMeta.defaultVal ?? 100,
                                },
                              }));
                            }}
                            className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Vô hạn</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" weight="bold" />
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Sẵn sàng khởi tạo gói SaaS
                  </h3>
                </div>
                <p className="mt-1 text-xs text-emerald-800/90 dark:text-emerald-300/80">
                  Kiểm tra lại thông số trước khi hoàn tất phát hành gói lên hệ thống.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-4 text-xs space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                  <span className="text-zinc-500">Tên gói & Mã:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {name} ({code})
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                  <span className="text-zinc-500">Mức giá & Chu kỳ:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {price === 0 ? 'Miễn phí' : `${price.toLocaleString('vi-VN')} ₫`} / {monthsLabel(billingCycleMonths)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                  <span className="text-zinc-500">Tính năng mở khóa:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {enabledCount} features
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Giới hạn định mức:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {configuredLimitsCount} quotas
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-850">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Quay lại</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
            >
              Hủy bỏ
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
            >
              <Check className="h-4 w-4" weight="bold" />
              <span>{isSubmitting ? 'Đang tạo gói...' : 'Tạo gói SaaS'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
