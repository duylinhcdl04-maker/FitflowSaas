import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Plus } from '@phosphor-icons/react';
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
import { apiErrorMessage } from '../api/client';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import FormField, { inputClass } from '../components/FormField';

const COLUMN_COUNT = 6;

const PRICING_LABELS: Record<PricingModel, string> = {
  FIXED: 'Cố định',
  PER_BRANCH: 'Theo chi nhánh',
  PER_USER: 'Theo nhân sự',
  PER_USAGE: 'Theo lượt dùng',
};
const EFFECT_LABELS: Record<AddonEffectType, string> = {
  QUOTA_DELTA: 'Cộng thêm hạn mức',
  ENABLE_FEATURE: 'Mở khoá tính năng',
};

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(Number(amount));
}

interface FormState {
  code: string;
  name: string;
  description: string;
  pricingModel: PricingModel;
  price: string;
  currency: string;
  effectFeatureCode: string;
  effectType: '' | AddonEffectType;
  effectAmount: string;
  compatiblePlanCodes: string;
}

const EMPTY_FORM: FormState = {
  code: '',
  name: '',
  description: '',
  pricingModel: 'FIXED',
  price: '',
  currency: 'VND',
  effectFeatureCode: '',
  effectType: '',
  effectAmount: '',
  compatiblePlanCodes: '',
};

function toForm(addon: Addon): FormState {
  return {
    code: addon.code,
    name: addon.name,
    description: addon.description ?? '',
    pricingModel: addon.pricing_model,
    price: addon.price,
    currency: addon.currency,
    effectFeatureCode: addon.effect_feature_code ?? '',
    effectType: addon.effect_type ?? '',
    effectAmount: addon.effect_amount !== null ? String(addon.effect_amount) : '',
    compatiblePlanCodes: addon.compatible_plan_codes.join(', '),
  };
}

// SA-05/06-style catalog cho Add-on (BE_Superadmin.md §9) — SKU bán rời, gắn
// được vào Subscription của Tenant độc lập với Plan. Xem chi tiết gắn/gỡ add-
// on cho một Tenant cụ thể ở tab "Gói & Thuê bao" trong SA-03.
export default function AddonsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['addons'], queryFn: listAddons });

  const [modalAddon, setModalAddon] = useState<Addon | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        pricingModel: form.pricingModel,
        price: Number(form.price),
        currency: form.currency || undefined,
        effectFeatureCode: form.effectFeatureCode || undefined,
        effectType: form.effectType || undefined,
        effectAmount: form.effectAmount ? Number(form.effectAmount) : undefined,
        compatiblePlanCodes: form.compatiblePlanCodes
          ? form.compatiblePlanCodes.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
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
              <th className="px-4 py-3.5 font-medium">Mô hình giá</th>
              <th className="px-4 py-3.5 font-medium">Giá</th>
              <th className="px-4 py-3.5 font-medium">Đang dùng</th>
              <th className="px-4 py-3.5 font-medium">Trạng thái</th>
              <th className="px-4 py-3.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} columns={COLUMN_COUNT} />)}
            {!isLoading && data?.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <EmptyState icon={Package} title="Chưa có Add-on nào" description="Tạo Add-on đầu tiên để bán rời cho Tenant." />
                </td>
              </tr>
            )}
            {data?.map((addon) => (
              <tr key={addon.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                <td className="px-4 py-3.5">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{addon.name}</p>
                  <p className="font-mono text-xs text-zinc-400">{addon.code}</p>
                </td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                  {PRICING_LABELS[addon.pricing_model]}
                </td>
                <td className="px-4 py-3.5 font-mono text-zinc-900 dark:text-zinc-100">
                  {formatMoney(addon.price, addon.currency)}
                </td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">{addon.activeSubscriptions}</td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={addon.status} />
                </td>
                <td className="px-4 py-3.5">
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
            ))}
          </tbody>
        </table>
      </Card>

      {modalAddon && (
        <Modal title={modalAddon === 'new' ? 'Tạo Add-on' : `Sửa Add-on — ${modalAddon.name}`} onClose={() => setModalAddon(null)}>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              setError(null);
              saveMutation.mutate();
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Mã Add-on" htmlFor="addonCode">
                <input
                  id="addonCode"
                  required
                  disabled={modalAddon !== 'new'}
                  className={inputClass}
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                />
              </FormField>
              <FormField label="Tên hiển thị" htmlFor="addonName">
                <input id="addonName" required className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </FormField>
            </div>
            <FormField label="Mô tả" htmlFor="addonDesc">
              <textarea id="addonDesc" rows={2} className={inputClass} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Mô hình giá" htmlFor="addonPricing">
                <select id="addonPricing" className={inputClass} value={form.pricingModel} onChange={(e) => setForm((f) => ({ ...f, pricingModel: e.target.value as PricingModel }))}>
                  {PRICING_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {PRICING_LABELS[m]}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Giá" htmlFor="addonPrice">
                <input id="addonPrice" type="number" min={0} required className={inputClass} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </FormField>
              <FormField label="Tiền tệ" htmlFor="addonCurrency">
                <input id="addonCurrency" className={inputClass} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))} />
              </FormField>
            </div>

            <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="text-xs font-medium text-zinc-500">
                Ảnh hưởng Entitlement (tuỳ chọn) — để trống nếu đây chỉ là SKU thu tiền thuần tuý.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField label="Mã tính năng" htmlFor="addonEffectFeature">
                  <input
                    id="addonEffectFeature"
                    placeholder="vd: MAX_BRANCHES"
                    className={inputClass}
                    value={form.effectFeatureCode}
                    onChange={(e) => setForm((f) => ({ ...f, effectFeatureCode: e.target.value.toUpperCase() }))}
                  />
                </FormField>
                <FormField label="Loại ảnh hưởng" htmlFor="addonEffectType">
                  <select
                    id="addonEffectType"
                    className={inputClass}
                    value={form.effectType}
                    onChange={(e) => setForm((f) => ({ ...f, effectType: e.target.value as '' | AddonEffectType }))}
                  >
                    <option value="">Không</option>
                    {ADDON_EFFECT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {EFFECT_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Số lượng cộng thêm / đơn vị" htmlFor="addonEffectAmount">
                  <input
                    id="addonEffectAmount"
                    type="number"
                    min={1}
                    disabled={form.effectType !== 'QUOTA_DELTA'}
                    className={inputClass}
                    value={form.effectAmount}
                    onChange={(e) => setForm((f) => ({ ...f, effectAmount: e.target.value }))}
                  />
                </FormField>
              </div>
            </div>

            <FormField label="Gói tương thích (mã gói, phân cách dấu phẩy — để trống = mọi gói)" htmlFor="addonPlans">
              <input id="addonPlans" placeholder="PRO, ENTERPRISE" className={inputClass} value={form.compatiblePlanCodes} onChange={(e) => setForm((f) => ({ ...f, compatiblePlanCodes: e.target.value }))} />
            </FormField>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalAddon(null)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
