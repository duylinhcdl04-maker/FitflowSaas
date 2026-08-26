import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Stack } from '@phosphor-icons/react';
import {
  applyPlanToSubscriptions,
  createFeature,
  createPlan,
  listFeatures,
  listPlanSubscribers,
  listPlans,
  updatePlan,
  upsertPlanFeatures,
  type Plan,
  type PlatformFeature,
} from '../api/plans';
import { apiErrorMessage } from '../api/client';
import { monthsLabel, BILLING_CYCLE_MONTH_OPTIONS } from '../lib/billing';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Card from '../components/Card';
import Callout from '../components/Callout';
import Toggle from '../components/Toggle';
import EmptyState from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import FormField, { inputClass } from '../components/FormField';
import Button from '../components/Button';

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(Number(amount));
}

/** SA-06 "Áp dụng cho doanh nghiệp hiện tại" — explicit opt-in list, never "all". */
function ApplyToSubscribersModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['plan-subscribers', plan.id],
    queryFn: () => listPlanSubscribers(plan.id),
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const mutation = useMutation({
    mutationFn: () => applyPlanToSubscriptions(plan.id, Array.from(selected)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      onClose();
    },
  });

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Modal
      title={`Áp dụng gói ${plan.name} cho doanh nghiệp hiện tại`}
      description="Chọn từng doanh nghiệp để đồng bộ tính năng theo đúng cấu hình hiện tại của gói. Không chọn nghĩa là giữ nguyên snapshot lúc ký — mặc định an toàn."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button variant="primary" disabled={selected.size === 0 || mutation.isPending} onClick={() => mutation.mutate()}>
            Áp dụng cho {selected.size || ''} doanh nghiệp
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        {isLoading && <p className="text-sm text-zinc-400">Đang tải...</p>}
        {!isLoading && subscribers?.length === 0 && (
          <p className="text-sm text-zinc-400">Chưa có doanh nghiệp nào dùng gói này.</p>
        )}
        {subscribers?.map((sub) => {
          const isSelected = selected.has(sub.id);
          return (
            <label
              key={sub.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                isSelected
                  ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-500/10'
                  : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(sub.id)}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{sub.tenants.name}</span>
              <span className="font-mono text-xs text-zinc-400">{sub.tenants.code}</span>
            </label>
          );
        })}
      </div>
    </Modal>
  );
}

/**
 * Right-hand panel of the master-detail layout. Mounted fresh (via `key={plan.id}`
 * in the parent) every time the selected plan changes, so `values` below always
 * initialises from the newly selected plan instead of carrying over stale state.
 */
function PlanFeatureDetail({
  plan,
  allFeatures,
  onToggleStatus,
  togglingStatus,
}: {
  plan: Plan;
  allFeatures: PlatformFeature[];
  onToggleStatus: () => void;
  togglingStatus: boolean;
}) {
  const queryClient = useQueryClient();
  const [showApply, setShowApply] = useState(false);

  const settingByCode = new Map(plan.saas_plan_features.map((f) => [f.platform_features.code, f]));
  const [values, setValues] = useState<Record<string, { enabled: boolean; quota: string }>>(() => {
    const initial: Record<string, { enabled: boolean; quota: string }> = {};
    for (const feature of allFeatures) {
      const existing = settingByCode.get(feature.code);
      initial[feature.code] = {
        enabled: existing?.is_enabled ?? false,
        quota: existing?.quota_value != null ? String(existing.quota_value) : '',
      };
    }
    return initial;
  });

  const mutation = useMutation({
    mutationFn: () =>
      upsertPlanFeatures(
        plan.id,
        Object.entries(values).map(([featureCode, v]) => ({
          featureCode,
          isEnabled: v.enabled,
          quotaValue: v.quota ? Number(v.quota) : undefined,
        })),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });

  const enabledCount = Object.values(values).filter((v) => v.enabled).length;

  return (
    <Card padded={false} className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-50">{plan.name}</h2>
            <StatusBadge status={plan.status} />
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {Number(plan.price) === 0 ? 'Liên hệ' : formatMoney(plan.price, plan.currency)}
            {' · '}
            {plan.trial_days > 0 ? `${plan.trial_days} ngày dùng thử` : monthsLabel(plan.billing_cycle_months)}
            {' · '}
            {enabledCount} tính năng bật · {plan._count.subscriptions} Tenant đang dùng
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onToggleStatus} disabled={togglingStatus}>
          {plan.status === 'ACTIVE' ? 'Ngừng bán' : 'Mở bán'}
        </Button>
      </div>

      <div className="flex-1 divide-y divide-zinc-100 overflow-y-auto px-5 dark:divide-zinc-800">
        {allFeatures.length === 0 && (
          <p className="py-6 text-center text-sm text-zinc-400">Chưa có Platform Feature nào được định nghĩa.</p>
        )}
        {allFeatures.map((feature) => {
          const current = values[feature.code] ?? { enabled: false, quota: '' };
          return (
            <div key={feature.code} className="flex items-center justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{feature.name}</p>
                <p className="font-mono text-xs text-zinc-400">{feature.code}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {feature.feature_type === 'QUOTA' && current.enabled && (
                  <input
                    type="number"
                    min={0}
                    placeholder="Không giới hạn"
                    className={`${inputClass} w-32 text-right`}
                    value={current.quota}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [feature.code]: { ...current, quota: e.target.value } }))
                    }
                  />
                )}
                <Toggle
                  checked={current.enabled}
                  onChange={(enabled) => setValues((v) => ({ ...v, [feature.code]: { ...current, enabled } }))}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-zinc-100 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
        {plan._count.subscriptions > 0 && (
          <Callout tone="warning">
            Thay đổi ở đây chỉ áp dụng cho thuê bao ký mới. {plan._count.subscriptions} doanh nghiệp hiện tại
            giữ nguyên điều kiện lúc ký.{' '}
            <button type="button" className="font-semibold underline underline-offset-2" onClick={() => setShowApply(true)}>
              Áp dụng cho doanh nghiệp hiện tại…
            </button>
          </Callout>
        )}
        <div className="flex items-center justify-between gap-3">
          {mutation.isSuccess && !mutation.isPending && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Check size={14} weight="bold" />
              Đã lưu
            </span>
          )}
          <Button className="ml-auto" variant="primary" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Đang lưu...' : 'Lưu tính năng'}
          </Button>
        </div>
      </div>

      {showApply && <ApplyToSubscribersModal plan={plan} onClose={() => setShowApply(false)} />}
    </Card>
  );
}

function CreatePlanModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    code: '',
    name: '',
    billingCycleMonths: 1,
    price: '',
    trialDays: '0',
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createPlan({
        code: form.code,
        name: form.name,
        billingCycleMonths: form.billingCycleMonths,
        price: Number(form.price),
        trialDays: Number(form.trialDays),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <Modal
      title="Tạo SaaS Plan mới"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" form="create-plan-form" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang tạo...' : 'Tạo gói'}
          </Button>
        </div>
      }
    >
      <form id="create-plan-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Mã gói" htmlFor="code">
          <input
            id="code"
            required
            placeholder="vd: GROWTH"
            className={inputClass}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />
        </FormField>
        <FormField label="Tên gói" htmlFor="name">
          <input
            id="name"
            required
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </FormField>
        <FormField label="Giá / kỳ (VND)" htmlFor="price">
          <input
            id="price"
            type="number"
            min={0}
            required
            className={inputClass}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </FormField>
        <FormField label="Chu kỳ thanh toán" htmlFor="billingCycleMonths">
          <select
            id="billingCycleMonths"
            className={inputClass}
            value={form.billingCycleMonths}
            onChange={(e) => setForm({ ...form, billingCycleMonths: Number(e.target.value) })}
          >
            {BILLING_CYCLE_MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {monthsLabel(m)} ({m} tháng/lần)
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Số ngày dùng thử" htmlFor="trialDays">
          <input
            id="trialDays"
            type="number"
            min={0}
            className={inputClass}
            value={form.trialDays}
            onChange={(e) => setForm({ ...form, trialDays: e.target.value })}
          />
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

function CreateFeatureModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{
    code: string;
    name: string;
    featureType: 'BOOLEAN' | 'QUOTA';
    module: string;
  }>({ code: '', name: '', featureType: 'BOOLEAN', module: '' });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createFeature({
        code: form.code,
        name: form.name,
        featureType: form.featureType,
        module: form.module || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <Modal
      title="Tạo Platform Feature mới"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" form="create-feature-form" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang tạo...' : 'Tạo feature'}
          </Button>
        </div>
      }
    >
      <form
        id="create-feature-form"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="flex flex-col gap-4"
      >
        <FormField label="Mã feature" htmlFor="fcode">
          <input
            id="fcode"
            required
            placeholder="vd: BULK_EXPORT"
            className={inputClass}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />
        </FormField>
        <FormField label="Tên hiển thị" htmlFor="fname">
          <input
            id="fname"
            required
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </FormField>
        <FormField label="Loại" htmlFor="ftype">
          <select
            id="ftype"
            className={inputClass}
            value={form.featureType}
            onChange={(e) => setForm({ ...form, featureType: e.target.value as 'BOOLEAN' | 'QUOTA' })}
          >
            <option value="BOOLEAN">Bật/tắt (BOOLEAN)</option>
            <option value="QUOTA">Hạn mức (QUOTA)</option>
          </select>
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

export default function PlansPage() {
  const queryClient = useQueryClient();
  const { data: plans, isLoading } = useQuery({ queryKey: ['plans'], queryFn: listPlans });
  const { data: allFeatures } = useQuery({ queryKey: ['features'], queryFn: listFeatures });

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showCreateFeature, setShowCreateFeature] = useState(false);

  const toggleStatusMutation = useMutation({
    mutationFn: (plan: Plan) =>
      updatePlan(plan.id, { status: plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });

  // Default to the first plan until the user explicitly picks one — computed
  // inline (no effect needed) so it stays correct as `plans` loads/refetches.
  const effectiveSelectedId = selectedPlanId ?? plans?.[0]?.id ?? null;
  const selectedPlan = plans?.find((p) => p.id === effectiveSelectedId) ?? null;

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[36rem] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Gói & Tính năng
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Định nghĩa gói thương mại và bật/tắt tính năng theo gói.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowCreateFeature(true)}>
            <Plus size={16} weight="bold" />
            Feature mới
          </Button>
          <Button variant="primary" onClick={() => setShowCreatePlan(true)}>
            <Plus size={16} weight="bold" />
            Gói mới
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-6 w-28" />
              <Skeleton className="mt-2 h-3 w-20" />
            </Card>
          ))}
        </div>
      )}

      {!isLoading && plans?.length === 0 && (
        <Card>
          <EmptyState icon={Stack} title="Chưa có SaaS Plan nào" description="Tạo gói thương mại đầu tiên để bắt đầu." />
        </Card>
      )}

      {!isLoading && plans && plans.length > 0 && (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <Card padded={false} className="flex flex-col overflow-hidden">
            <div className="flex flex-col divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
              {plans.map((plan) => {
                const isSelected = plan.id === effectiveSelectedId;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative flex flex-col items-start gap-1 px-4 py-3.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-500/10'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-emerald-600 dark:bg-emerald-400" />
                    )}
                    <div className="flex w-full items-center justify-between gap-2">
                      <span
                        className={`text-sm font-medium ${isSelected ? 'text-emerald-800 dark:text-emerald-300' : 'text-zinc-900 dark:text-zinc-50'}`}
                      >
                        {plan.name}
                      </span>
                      <StatusBadge status={plan.status} />
                    </div>
                    <span className="font-mono text-xs text-zinc-400">
                      {Number(plan.price) === 0 ? 'Liên hệ' : formatMoney(plan.price, plan.currency)}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {selectedPlan && (
            <PlanFeatureDetail
              key={selectedPlan.id}
              plan={selectedPlan}
              allFeatures={allFeatures ?? []}
              onToggleStatus={() => toggleStatusMutation.mutate(selectedPlan)}
              togglingStatus={toggleStatusMutation.isPending}
            />
          )}
        </div>
      )}

      {showCreatePlan && <CreatePlanModal onClose={() => setShowCreatePlan(false)} />}
      {showCreateFeature && <CreateFeatureModal onClose={() => setShowCreateFeature(false)} />}
    </div>
  );
}
