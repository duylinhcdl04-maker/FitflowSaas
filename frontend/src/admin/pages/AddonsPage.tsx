import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Check,
  Sparkle,
  Sliders,
  Lightning,
  CheckSquare,
  Square,
  Tag,
} from '@phosphor-icons/react';
import {
  listAddons,
  createAddon,
  updateAddon,
  PRICING_MODELS,
  ADDON_EFFECT_TYPES,
  type Addon,
  type PricingModel,
  type AddonEffectType,
} from '../api/addons';
import { getPlatformCatalog, listPlans } from '../api/plans';
import { apiErrorMessage } from '../api/client';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import FormField, { inputClass } from '../components/FormField';

const COLUMN_COUNT = 8;

const PRICING_LABELS: Record<PricingModel, string> = {
  FIXED: 'Cố định',
  PER_BRANCH: 'Theo chi nhánh',
  PER_USER: 'Theo nhân sự',
  PER_USAGE: 'Theo lượt dùng',
};

const EFFECT_LABELS: Record<AddonEffectType, string> = {
  QUOTA_DELTA: 'Cộng thêm hạn mức tài nguyên',
  ENABLE_FEATURE: 'Mở khoá tính năng',
};

// 10 Platform Quotas chuẩn FitFlow
const DEFAULT_QUOTAS = [
  { code: 'MAX_MEMBERS', name: 'Số hội viên tối đa', unit: 'hội viên', defaultAmount: 500 },
  { code: 'MAX_ACTIVE_MEMBERS', name: 'Hội viên đang hoạt động tối đa', unit: 'hội viên active', defaultAmount: 300 },
  { code: 'MAX_BRANCHES', name: 'Số chi nhánh tối đa', unit: 'chi nhánh', defaultAmount: 1 },
  { code: 'MAX_STAFF', name: 'Số nhân viên tối đa', unit: 'nhân viên', defaultAmount: 5 },
  { code: 'MAX_PT', name: 'Số HLV / PT tối đa', unit: 'HLV/PT', defaultAmount: 2 },
  { code: 'MAX_PT_BOOKINGS', name: 'Lượt đặt PT / tháng', unit: 'lượt/tháng', defaultAmount: 200 },
  { code: 'MAX_CHECKINS_MONTH', name: 'Lượt check-in / tháng', unit: 'lượt/tháng', defaultAmount: 5000 },
  { code: 'MAX_STORAGE', name: 'Dung lượng lưu trữ đám mây', unit: 'GB', defaultAmount: 10 },
  { code: 'MAX_EMAILS_MONTH', name: 'Email gửi / tháng', unit: 'emails/tháng', defaultAmount: 5000 },
  { code: 'MAX_SMS_MONTH', name: 'SMS Brandname / tháng', unit: 'SMS/tháng', defaultAmount: 500 },
];

// 15 Platform Features chuẩn FitFlow
const DEFAULT_FEATURES = [
  { code: 'FACE_RECOGNITION', name: 'Nhận diện khuôn mặt AI Face ID', module: 'Check-in', suggestCode: 'ADDON_FACE_AI' },
  { code: 'QR_CHECKIN', name: 'Check-in bằng mã QR', module: 'Check-in', suggestCode: 'ADDON_QR_CHECKIN' },
  { code: 'ATTENDANCE_ANALYTICS', name: 'Báo cáo & Phân tích điểm danh', module: 'Check-in', suggestCode: 'ADDON_ATTENDANCE_ANALYTICS' },
  { code: 'MEMBERSHIP_MANAGEMENT', name: 'Quản lý Hội viên toàn diện', module: 'Membership', suggestCode: 'ADDON_MEMBERSHIP' },
  { code: 'AUTO_RENEWAL', name: 'Tự động gia hạn thẻ hội viên', module: 'Membership', suggestCode: 'ADDON_AUTO_RENEWAL' },
  { code: 'MEMBERSHIP_EXPIRATION_ALERT', name: 'Cảnh báo sắp hết hạn thẻ tập', module: 'Membership', suggestCode: 'ADDON_EXPIRY_ALERT' },
  { code: 'PT_MANAGEMENT', name: 'Quản lý Huấn luyện viên (PT)', module: 'PT', suggestCode: 'ADDON_PT_MANAGEMENT' },
  { code: 'PT_BOOKING', name: 'Đặt lịch tập với HLV cá nhân', module: 'PT', suggestCode: 'ADDON_PT_BOOKING' },
  { code: 'WORKOUT_PLANS', name: 'Thiết kế giáo án tập luyện', module: 'PT', suggestCode: 'ADDON_WORKOUT_PLANS' },
  { code: 'BASIC_ANALYTICS', name: 'Báo cáo doanh thu cơ bản', module: 'Analytics', suggestCode: 'ADDON_BASIC_ANALYTICS' },
  { code: 'ADVANCED_ANALYTICS', name: 'Phân tích chuyên sâu & Dự báo', module: 'Analytics', suggestCode: 'ADDON_ADVANCED_ANALYTICS' },
  { code: 'EMAIL_NOTIFICATION', name: 'Thông báo Email tự động', module: 'Communication', suggestCode: 'ADDON_EMAIL' },
  { code: 'SMS_NOTIFICATION', name: 'Tin nhắn SMS Brandname', module: 'Communication', suggestCode: 'ADDON_SMS_BRANDNAME' },
  { code: 'TWO_FACTOR_AUTH', name: 'Xác thực 2 lớp bảo mật (2FA)', module: 'Security', suggestCode: 'ADDON_2FA' },
  { code: 'AUDIT_LOGS', name: 'Nhật ký kiểm toán hệ thống (Audit)', module: 'Security', suggestCode: 'ADDON_AUDIT_LOGS' },
];

function formatMoney(amount: string | number, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(Number(amount));
}

interface FormState {
  code: string;
  name: string;
  description: string;
  pricingModel: PricingModel;
  price: string;
  currency: string;
  effectType: '' | AddonEffectType;
  effectFeatureCode: string;
  effectAmount: string;
  allPlansApplicable: boolean;
  selectedPlanCodes: string[];
}

const EMPTY_FORM: FormState = {
  code: '',
  name: '',
  description: '',
  pricingModel: 'FIXED',
  price: '',
  currency: 'VND',
  effectType: '',
  effectFeatureCode: '',
  effectAmount: '',
  allPlansApplicable: true,
  selectedPlanCodes: [],
};

function toForm(addon: Addon): FormState {
  const hasSpecificPlans = Array.isArray(addon.compatible_plan_codes) && addon.compatible_plan_codes.length > 0;
  return {
    code: addon.code,
    name: addon.name,
    description: addon.description ?? '',
    pricingModel: addon.pricing_model,
    price: addon.price,
    currency: addon.currency,
    effectType: addon.effect_type ?? '',
    effectFeatureCode: addon.effect_feature_code ?? '',
    effectAmount: addon.effect_amount !== null ? String(addon.effect_amount) : '',
    allPlansApplicable: !hasSpecificPlans,
    selectedPlanCodes: hasSpecificPlans ? [...addon.compatible_plan_codes] : [],
  };
}

export default function AddonsPage() {
  const queryClient = useQueryClient();
  const { data: addons, isLoading } = useQuery({ queryKey: ['addons'], queryFn: listAddons });
  const { data: catalog } = useQuery({ queryKey: ['platform-catalog'], queryFn: getPlatformCatalog });
  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: listPlans });

  const [modalAddon, setModalAddon] = useState<Addon | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  // Danh sách quotas và features hợp nhất
  const quotaOptions = useMemo(() => {
    if (catalog?.quotas && catalog.quotas.length > 0) {
      return catalog.quotas.map((q) => {
        const fallback = DEFAULT_QUOTAS.find((d) => d.code === q.code);
        return {
          code: q.code,
          name: q.name,
          unit: q.unit || fallback?.unit || 'đơn vị',
          defaultAmount: fallback?.defaultAmount ?? 100,
        };
      });
    }
    return DEFAULT_QUOTAS;
  }, [catalog]);

  const featureOptions = useMemo(() => {
    if (catalog?.features && catalog.features.length > 0) {
      return catalog.features.map((f) => {
        const fallback = DEFAULT_FEATURES.find((d) => d.code === f.code);
        return {
          code: f.code,
          name: f.name,
          module: f.module || fallback?.module || 'Platform',
          suggestCode: fallback?.suggestCode || `ADDON_${f.code}`,
        };
      });
    }
    return DEFAULT_FEATURES;
  }, [catalog]);

  // Thông tin unit của quota đang chọn
  const selectedQuotaMeta = useMemo(() => {
    return quotaOptions.find((q) => q.code === form.effectFeatureCode);
  }, [quotaOptions, form.effectFeatureCode]);

  // Gợi ý tự động tên và mã
  const suggestion = useMemo(() => {
    if (form.effectType === 'QUOTA_DELTA') {
      const q = selectedQuotaMeta;
      const amt = form.effectAmount || '1';
      if (!q) return null;
      let shortCode = q.code.replace('MAX_', '');
      if (q.code === 'MAX_STORAGE') shortCode = 'STORAGE';
      return {
        code: `ADDON_${shortCode}_${amt}`.toUpperCase(),
        name: `Gói bổ sung +${Number(amt).toLocaleString('vi-VN')} ${q.name.replace('Số ', '').replace(' tối đa', '')}`,
      };
    }
    if (form.effectType === 'ENABLE_FEATURE') {
      const f = featureOptions.find((item) => item.code === form.effectFeatureCode);
      if (!f) return null;
      return {
        code: f.suggestCode.toUpperCase(),
        name: `Tính năng ${f.name}`,
      };
    }
    return null;
  }, [form.effectType, form.effectFeatureCode, form.effectAmount, selectedQuotaMeta, featureOptions]);

  const applySuggestion = () => {
    if (!suggestion) return;
    setForm((f) => ({
      ...f,
      code: modalAddon === 'new' ? suggestion.code : f.code,
      name: suggestion.name,
    }));
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description || undefined,
        pricingModel: form.pricingModel,
        price: Number(form.price),
        currency: form.currency || undefined,
        effectFeatureCode: form.effectType ? form.effectFeatureCode : undefined,
        effectType: form.effectType || undefined,
        effectAmount:
          form.effectType === 'QUOTA_DELTA' && form.effectAmount ? Number(form.effectAmount) : undefined,
        compatiblePlanCodes: form.allPlansApplicable ? [] : form.selectedPlanCodes,
      };
      return modalAddon === 'new' || !modalAddon
        ? createAddon(payload)
        : updateAddon(modalAddon.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addons'] });
      setModalAddon(null);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể lưu Add-on')),
  });

  const statusMutation = useMutation({
    mutationFn: (addon: Addon) =>
      updateAddon(addon.id, { status: addon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addons'] }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Add-on</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Sản phẩm mở rộng bán rời, gắn thêm được vào Subscription của Tenant — độc lập với Gói SaaS.
          </p>
        </div>
        <Button
          onClick={() => {
            setModalAddon('new');
            setForm(EMPTY_FORM);
            setError(null);
          }}
        >
          <Plus size={18} weight="bold" />
          Tạo Add-on
        </Button>
      </div>

      <Card padded={false} className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3.5 font-medium">Add-on</th>
              <th className="px-4 py-3.5 font-medium">Tác động Entitlement</th>
              <th className="px-4 py-3.5 font-medium">Gói tương thích</th>
              <th className="px-4 py-3.5 font-medium">Mô hình giá</th>
              <th className="px-4 py-3.5 font-medium">Giá</th>
              <th className="px-4 py-3.5 font-medium">Đang dùng</th>
              <th className="px-4 py-3.5 font-medium">Trạng thái</th>
              <th className="px-4 py-3.5 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} columns={COLUMN_COUNT} />)}
            {!isLoading && addons?.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <EmptyState
                    icon={Package}
                    title="Chưa có Add-on nào"
                    description="Tạo Add-on đầu tiên để bán rời mở rộng hạn mức hoặc tính năng cho Tenant."
                  />
                </td>
              </tr>
            )}
            {addons?.map((addon) => {
              const quotaMeta = DEFAULT_QUOTAS.find((q) => q.code === addon.effect_feature_code);
              const featureMeta = DEFAULT_FEATURES.find((f) => f.code === addon.effect_feature_code);

              return (
                <tr key={addon.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{addon.name}</p>
                    <p className="font-mono text-xs text-zinc-400">{addon.code}</p>
                    {addon.description && (
                      <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1 dark:text-zinc-400">
                        {addon.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {addon.effect_type === 'QUOTA_DELTA' ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
                        <Sliders size={13} weight="bold" />+
                        {addon.effect_amount !== null
                          ? addon.effect_amount.toLocaleString('vi-VN')
                          : '1'}{' '}
                        {quotaMeta?.unit || addon.effect_feature_code}
                      </span>
                    ) : addon.effect_type === 'ENABLE_FEATURE' ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40">
                        <Sparkle size={13} weight="fill" />
                        {featureMeta?.name || addon.effect_feature_code}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        SKU Độc lập
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {!addon.compatible_plan_codes || addon.compatible_plan_codes.length === 0 ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        Tất cả các gói
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {addon.compatible_plan_codes.map((c) => (
                          <span
                            key={c}
                            className="rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                    {PRICING_LABELS[addon.pricing_model]}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatMoney(addon.price, addon.currency)}
                  </td>
                  <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                    {addon.activeSubscriptions} tenant
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={addon.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setModalAddon(addon);
                          setForm(toForm(addon));
                          setError(null);
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate(addon)}
                      >
                        {addon.status === 'ACTIVE' ? 'Ngừng bán' : 'Bán lại'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* MODAL TẠO / SỬA ADD-ON ĐƯỢC TỐI ƯU UX */}
      {modalAddon && (
        <Modal
          size="lg"
          title={modalAddon === 'new' ? 'Tạo Add-on Mới' : `Sửa Add-on — ${modalAddon.name}`}
          description="Cấu hình sản phẩm bán thêm, hạn ngạch tài nguyên hoặc mở rộng tính năng cho các Tenant."
          onClose={() => setModalAddon(null)}
        >
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              setError(null);
              saveMutation.mutate();
            }}
            className="flex flex-col gap-5 p-1"
          >
            {/* 1. TÁC ĐỘNG ENTITLEMENT TRƯỚC (QUAN TRỌNG NHẤT VÌ ĐỊNH NGHĨA LOẠI ADD-ON) */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-850/50">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                1. Loại Add-on & Tác động Entitlement
              </label>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Hệ thống tự động cộng hạn mức hoặc kích hoạt tính năng vào gói thuê bao khi Tenant mua Add-on này.
              </p>

              {/* Selector 3 loại */}
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      effectType: 'QUOTA_DELTA',
                      effectFeatureCode: f.effectFeatureCode || 'MAX_MEMBERS',
                      effectAmount: f.effectAmount || '500',
                    }));
                  }}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                    form.effectType === 'QUOTA_DELTA'
                      ? 'border-amber-500 bg-amber-50/80 text-amber-950 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-100 ring-1 ring-amber-500'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Sliders size={15} weight="bold" className="text-amber-600 dark:text-amber-400" />
                    <span>Cộng Hạn ngạch (Quota)</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    Tăng số lượng hội viên, chi nhánh, dung lượng...
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      effectType: 'ENABLE_FEATURE',
                      effectFeatureCode: f.effectFeatureCode || 'FACE_RECOGNITION',
                      effectAmount: '',
                    }));
                  }}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                    form.effectType === 'ENABLE_FEATURE'
                      ? 'border-purple-500 bg-purple-50/80 text-purple-950 dark:border-purple-500 dark:bg-purple-950/40 dark:text-purple-100 ring-1 ring-purple-500'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Sparkle size={15} weight="fill" className="text-purple-600 dark:text-purple-400" />
                    <span>Mở khóa Tính năng</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    Kích hoạt AI Face ID, Audit Logs, SMS Brandname...
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      effectType: '',
                      effectFeatureCode: '',
                      effectAmount: '',
                    }));
                  }}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                    form.effectType === ''
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100 ring-1 ring-emerald-500'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Package size={15} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                    <span>SKU Độc lập</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    Chỉ thu tiền dịch vụ / thiết bị, không đổi quyền
                  </span>
                </button>
              </div>

              {/* Chi tiết theo từng loại */}
              {form.effectType === 'QUOTA_DELTA' && (
                <div className="mt-4 space-y-3 rounded-lg border border-amber-200/80 bg-white p-3.5 dark:border-amber-800/40 dark:bg-zinc-900">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Chọn tài nguyên cần cộng thêm
                      </label>
                      <select
                        value={form.effectFeatureCode}
                        onChange={(e) => {
                          const code = e.target.value;
                          const q = quotaOptions.find((item) => item.code === code);
                          setForm((f) => ({
                            ...f,
                            effectFeatureCode: code,
                            effectAmount: f.effectAmount || String(q?.defaultAmount || 100),
                          }));
                        }}
                        className={`mt-1.5 w-full ${inputClass}`}
                      >
                        {quotaOptions.map((q) => (
                          <option key={q.code} value={q.code}>
                            {q.name} ({q.unit}) — {q.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Số lượng cộng thêm (+)
                      </label>
                      <div className="mt-1.5 flex items-center rounded-lg border border-zinc-200 bg-white shadow-xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900">
                        <input
                          type="number"
                          min={1}
                          required
                          value={form.effectAmount}
                          onChange={(e) => setForm((f) => ({ ...f, effectAmount: e.target.value }))}
                          placeholder="Nhập số lượng"
                          className="h-10 w-full bg-transparent px-3 text-right font-mono text-sm font-bold text-zinc-900 focus:outline-none dark:text-zinc-100"
                        />
                        <span className="shrink-0 rounded-r-lg border-l border-zinc-100 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-500 select-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                          {selectedQuotaMeta?.unit || 'đơn vị'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nút gợi ý nhanh */}
                  {suggestion && (
                    <div className="flex items-center justify-between rounded-lg bg-amber-50/70 p-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                      <div className="flex items-center gap-1.5">
                        <Lightning size={14} weight="fill" className="text-amber-600" />
                        <span>
                          Gợi ý: <strong>{suggestion.name}</strong> ({suggestion.code})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={applySuggestion}
                        className="rounded px-2 py-0.5 font-bold text-amber-700 hover:bg-amber-200/60 dark:text-amber-300 dark:hover:bg-amber-900/60"
                      >
                        Áp dụng ngay
                      </button>
                    </div>
                  )}
                </div>
              )}

              {form.effectType === 'ENABLE_FEATURE' && (
                <div className="mt-4 space-y-3 rounded-lg border border-purple-200/80 bg-white p-3.5 dark:border-purple-800/40 dark:bg-zinc-900">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Chọn tính năng nền tảng cần mở khóa
                    </label>
                    <select
                      value={form.effectFeatureCode}
                      onChange={(e) => setForm((f) => ({ ...f, effectFeatureCode: e.target.value }))}
                      className={`mt-1.5 w-full ${inputClass}`}
                    >
                      {featureOptions.map((feat) => (
                        <option key={feat.code} value={feat.code}>
                          [{feat.module}] {feat.name} — {feat.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  {suggestion && (
                    <div className="flex items-center justify-between rounded-lg bg-purple-50/70 p-2 text-xs text-purple-800 dark:bg-purple-950/30 dark:text-purple-200">
                      <div className="flex items-center gap-1.5">
                        <Lightning size={14} weight="fill" className="text-purple-600" />
                        <span>
                          Gợi ý: <strong>{suggestion.name}</strong> ({suggestion.code})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={applySuggestion}
                        className="rounded px-2 py-0.5 font-bold text-purple-700 hover:bg-purple-200/60 dark:text-purple-300 dark:hover:bg-purple-900/60"
                      >
                        Áp dụng ngay
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. THÔNG TIN CƠ BẢN */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                2. Thông tin hiển thị & Định danh
              </label>

              <div className="mt-2.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Tên hiển thị Add-on" htmlFor="addonName">
                  <input
                    id="addonName"
                    required
                    placeholder="vd: Gói bổ sung +500 Hội viên"
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </FormField>

                <FormField label="Mã Add-on (SKU Code)" htmlFor="addonCode">
                  <input
                    id="addonCode"
                    required
                    disabled={modalAddon !== 'new'}
                    placeholder="vd: ADDON_MEMBERS_500"
                    className={`${inputClass} font-mono uppercase`}
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  />
                </FormField>
              </div>

              <div className="mt-3">
                <FormField label="Mô tả công dụng cho khách hàng" htmlFor="addonDesc">
                  <textarea
                    id="addonDesc"
                    rows={2}
                    placeholder="Mô tả giá trị khách hàng nhận được khi mua thêm add-on này..."
                    className={inputClass}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </FormField>
              </div>
            </div>

            {/* 3. BẢNG GIÁ & MÔ HÌNH THU TIỀN */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                3. Bảng giá & Mô hình thu phí
              </label>

              <div className="mt-2.5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField label="Mô hình giá" htmlFor="addonPricing">
                  <select
                    id="addonPricing"
                    className={inputClass}
                    value={form.pricingModel}
                    onChange={(e) => setForm((f) => ({ ...f, pricingModel: e.target.value as PricingModel }))}
                  >
                    {PRICING_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {PRICING_LABELS[m]}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Giá bán (VND)" htmlFor="addonPrice">
                  <input
                    id="addonPrice"
                    type="number"
                    min={0}
                    step={10000}
                    required
                    placeholder="0"
                    className={`${inputClass} font-mono font-bold`}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </FormField>

                <FormField label="Đơn vị tiền tệ" htmlFor="addonCurrency">
                  <input
                    id="addonCurrency"
                    className={`${inputClass} font-mono uppercase`}
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
                  />
                </FormField>
              </div>
            </div>

            {/* 4. GÓI SAAS TƯƠNG THÍCH (KHÔNG PHẢI GÕ CODE NỮA) */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-850/50">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  4. Gói SaaS Tương Thích
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, allPlansApplicable: true, selectedPlanCodes: [] }));
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      form.allPlansApplicable
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    Tất cả các gói
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        allPlansApplicable: false,
                        selectedPlanCodes:
                          f.selectedPlanCodes.length > 0
                            ? f.selectedPlanCodes
                            : (plans?.map((p) => p.code) || ['STARTER', 'GROWTH']),
                      }));
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      !form.allPlansApplicable
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    Chỉ định gói cụ thể
                  </button>
                </div>
              </div>

              {form.allPlansApplicable ? (
                <p className="mt-2.5 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <Check size={16} weight="bold" />
                  Mọi Tenant ở bất kỳ gói SaaS nào đều có thể đăng ký mua thêm Add-on này.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Chọn các gói cho phép mua Add-on:</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const allCodes = plans?.map((p) => p.code) || [];
                          setForm((f) => ({ ...f, selectedPlanCodes: allCodes }));
                        }}
                        className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        Chọn tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, selectedPlanCodes: [] }))}
                        className="text-zinc-400 hover:underline"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  {/* Danh sách plans dạng thẻ pills */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {plans && plans.length > 0 ? (
                      plans.map((p) => {
                        const isSelected = form.selectedPlanCodes.includes(p.code);
                        return (
                          <div
                            key={p.code}
                            onClick={() => {
                              setForm((f) => ({
                                ...f,
                                selectedPlanCodes: isSelected
                                  ? f.selectedPlanCodes.filter((c) => c !== p.code)
                                  : [...f.selectedPlanCodes, p.code],
                              }));
                            }}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all select-none ${
                              isSelected
                                ? 'border-emerald-500 bg-white shadow-xs ring-1 ring-emerald-500 dark:bg-zinc-900'
                                : 'border-zinc-200 bg-white/70 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-5 w-5 items-center justify-center rounded border ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                    : 'border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800'
                                }`}
                              >
                                {isSelected && <Check size={13} weight="bold" />}
                              </div>
                              <div>
                                <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                                  {p.name}
                                </span>
                                <span className="ml-1.5 font-mono text-[10px] text-zinc-400">
                                  ({p.code})
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-xs text-zinc-500">
                              {Number(p.price).toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      // Fallback mẫu các gói nếu đang tải
                      ['STARTER', 'GROWTH', 'ENTERPRISE'].map((code) => {
                        const isSelected = form.selectedPlanCodes.includes(code);
                        return (
                          <div
                            key={code}
                            onClick={() => {
                              setForm((f) => ({
                                ...f,
                                selectedPlanCodes: isSelected
                                  ? f.selectedPlanCodes.filter((c) => c !== code)
                                  : [...f.selectedPlanCodes, code],
                              }));
                            }}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 select-none ${
                              isSelected
                                ? 'border-emerald-500 bg-white ring-1 ring-emerald-500 dark:bg-zinc-900'
                                : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'
                            }`}
                          >
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded border ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-zinc-300 bg-white dark:border-zinc-600'
                              }`}
                            >
                              {isSelected && <Check size={13} weight="bold" />}
                            </div>
                            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                              {code}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {!form.allPlansApplicable && form.selectedPlanCodes.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      * Chưa chọn gói nào. Hãy chọn ít nhất 1 gói hoặc nhấn "Tất cả các gói".
                    </p>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="mt-2 flex justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <Button type="button" variant="secondary" onClick={() => setModalAddon(null)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Đang lưu...' : 'Lưu Add-on'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
