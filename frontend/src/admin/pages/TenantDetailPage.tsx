import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Warning } from '@phosphor-icons/react';
import {
  getTenant,
  changeTenantStatus,
  startImpersonation,
  updateTenant,
  listTenantUsers,
  listTenantBranches,
  type TenantStatus,
} from '../api/tenants';
import { getSubscription, listInvoices, updateSubscription } from '../api/subscriptions';
import { listAuditLogs } from '../api/auditLogs';
import {
  listSupportSessions,
  endSupportSession,
  SUPPORT_SESSION_SCOPES,
  SUPPORT_SESSION_DURATIONS,
  type SupportSessionScope,
} from '../api/supportSessions';
import { listTenantAddons, attachAddon, cancelAddon } from '../api/addons';
import { apiErrorMessage } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Callout from '../components/Callout';
import Card from '../components/Card';
import { Skeleton } from '../components/Skeleton';
import FormField, { inputClass } from '../components/FormField';
import Button from '../components/Button';
import PlanChangeWizard from './tenant-detail/PlanChangeWizard';
import ResetOwnerPasswordModal from './tenant-detail/ResetOwnerPasswordModal';

const NEXT_STATUSES: Record<TenantStatus, TenantStatus[]> = {
  TRIAL: ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
  ACTIVE: ['SUSPENDED', 'INACTIVE'],
  SUSPENDED: ['ACTIVE', 'INACTIVE'],
  INACTIVE: [],
};

const STATUS_BUTTON_VARIANT: Record<TenantStatus, 'primary' | 'secondary' | 'danger'> = {
  TRIAL: 'secondary',
  ACTIVE: 'primary',
  SUSPENDED: 'danger',
  INACTIVE: 'secondary',
};

const QUOTA_LABELS: Record<string, string> = {
  MAX_BRANCHES: 'Chi nhánh',
  MAX_STAFF: 'Nhân sự',
  MAX_PT: 'Huấn luyện viên',
  MAX_CUSTOMERS: 'Hội viên',
};

const SCOPE_LABELS: Record<SupportSessionScope, string> = {
  CONFIG: 'Cấu hình',
  CUSTOMERS: 'Hội viên',
  BILLING: 'Thanh toán',
  ATTENDANCE: 'Chấm công',
};

const TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'plan', label: 'Gói & Thuê bao' },
  { key: 'quota', label: 'Hạn mức' },
  { key: 'users', label: 'Người dùng' },
  { key: 'branches', label: 'Chi nhánh' },
  { key: 'billing', label: 'Thanh toán' },
  { key: 'audit', label: 'Nhật ký' },
  { key: 'support', label: 'Phiên hỗ trợ' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

function formatMoney(amount: string | number, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(Number(amount));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN');
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>('overview');

  const tenantQuery = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => getTenant(id!),
    enabled: !!id,
  });
  const subscriptionQuery = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => getSubscription(id!),
    enabled: !!id,
  });
  const invoicesQuery = useQuery({
    queryKey: ['invoices', id],
    queryFn: () => listInvoices(id!),
    enabled: !!id,
  });
  const auditQuery = useQuery({
    queryKey: ['audit-logs', id],
    queryFn: () => listAuditLogs({ tenantId: id, pageSize: 50 }),
    enabled: !!id,
  });
  const usersQuery = useQuery({
    queryKey: ['tenant-users', id],
    queryFn: () => listTenantUsers(id!),
    enabled: !!id,
  });
  const branchesQuery = useQuery({
    queryKey: ['tenant-branches', id],
    queryFn: () => listTenantBranches(id!),
    enabled: !!id,
  });
  const supportSessionsQuery = useQuery({
    queryKey: ['support-sessions', id],
    queryFn: () => listSupportSessions({ tenantId: id, pageSize: 50 }),
    enabled: !!id,
  });
  const tenantAddonsQuery = useQuery({
    queryKey: ['tenant-addons', id],
    queryFn: () => listTenantAddons(id!),
    enabled: !!id,
  });

  const [statusModal, setStatusModal] = useState<TenantStatus | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);

  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [impersonateReason, setImpersonateReason] = useState('');
  const [impersonateWrite, setImpersonateWrite] = useState(false);
  const [impersonateScope, setImpersonateScope] = useState<SupportSessionScope[]>([]);
  const [impersonateDuration, setImpersonateDuration] = useState<number>(30);
  const [impersonateResult, setImpersonateResult] = useState<string | null>(null);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);

  const [planWizardOpen, setPlanWizardOpen] = useState(false);
  const [resetOwnerOpen, setResetOwnerOpen] = useState(false);
  const [renewDays, setRenewDays] = useState('30');
  const [subError, setSubError] = useState<string | null>(null);

  const [attachAddonCode, setAttachAddonCode] = useState('');
  const [attachAddonQty, setAttachAddonQty] = useState('1');
  const [addonError, setAddonError] = useState<string | null>(null);
  const [cancelAddonTarget, setCancelAddonTarget] = useState<string | null>(null);
  const [cancelAddonReason, setCancelAddonReason] = useState('');

  const statusMutation = useMutation({
    mutationFn: () => changeTenantStatus(id!, statusModal!, statusReason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs', id] });
      setStatusModal(null);
      setStatusReason('');
    },
    onError: (err) => setStatusError(apiErrorMessage(err)),
  });

  const impersonateMutation = useMutation({
    mutationFn: () =>
      startImpersonation(id!, impersonateReason, {
        readOnly: !impersonateWrite,
        scope: impersonateScope,
        durationMinutes: impersonateDuration,
      }),
    onSuccess: (data) => {
      setImpersonateResult(
        `Đã cấp phiên hỗ trợ ${data.readOnly ? 'chỉ đọc' : 'có thao tác'} cho ${data.target.fullName} (${data.target.email}), hết hạn sau ${data.expiresInMinutes} phút.`,
      );
      queryClient.invalidateQueries({ queryKey: ['audit-logs', id] });
      queryClient.invalidateQueries({ queryKey: ['support-sessions', id] });
    },
    onError: (err) => setImpersonateError(apiErrorMessage(err)),
  });

  const endSessionMutation = useMutation({
    mutationFn: (sessionId: string) => endSupportSession(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support-sessions', id] }),
  });

  const attachAddonMutation = useMutation({
    mutationFn: () => attachAddon(id!, attachAddonCode, Number(attachAddonQty) || 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-addons', id] });
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      setAttachAddonCode('');
      setAttachAddonQty('1');
    },
    onError: (err) => setAddonError(apiErrorMessage(err, 'Không thể gắn Add-on')),
  });

  const cancelAddonMutation = useMutation({
    mutationFn: () => cancelAddon(id!, cancelAddonTarget!, cancelAddonReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-addons', id] });
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      setCancelAddonTarget(null);
      setCancelAddonReason('');
    },
  });

  const renewMutation = useMutation({
    mutationFn: () => updateSubscription(id!, { renewDays: Number(renewDays), status: 'ACTIVE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription', id] }),
    onError: (err) => setSubError(apiErrorMessage(err)),
  });

  const infoMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateTenant>[1]) => updateTenant(id!, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant', id] }),
  });

  const [infoForm, setInfoForm] = useState<{
    name: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
  } | null>(null);

  const tenant = tenantQuery.data;
  const subscription = subscriptionQuery.data;

  if (tenantQuery.isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Card>
          <Skeleton className="h-40 w-full" />
        </Card>
      </div>
    );
  }
  if (!tenant) return <p className="text-sm text-red-600">Không tìm thấy Tenant.</p>;

  const form = infoForm ?? {
    name: tenant.name,
    contactEmail: tenant.contact_email ?? '',
    contactPhone: tenant.contact_phone ?? '',
    address: tenant.address ?? '',
  };

  function handleInfoSubmit(e: FormEvent) {
    e.preventDefault();
    infoMutation.mutate({
      name: form.name,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      address: form.address || undefined,
    });
  }

  const overLimitQuotas = tenant.quotas.filter((q) => q.limit !== null && q.used >= q.limit);
  const overdueInvoices = (invoicesQuery.data ?? []).filter((inv) => inv.status === 'OVERDUE');
  const owner = usersQuery.data?.find((u) => u.roles.includes('OWNER'));
  // Phiên impersonation giờ có bảng support_sessions riêng (xem tab "Phiên hỗ
  // trợ"); ở đây chỉ còn giữ các sự kiện không có bản ghi phiên riêng, như đặt
  // lại mật khẩu Owner.
  const passwordResetEvents = (auditQuery.data?.items ?? []).filter(
    (e) => e.action === 'OWNER_PASSWORD_RESET',
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {tenant.name}
            </h1>
            <StatusBadge status={tenant.status} />
          </div>
          <p className="font-mono mt-1 text-sm text-zinc-500">{tenant.code}.fitflow.io.vn</p>
          {tenant.status === 'SUSPENDED' && tenant.suspended_reason && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Lý do tạm ngưng: {tenant.suspended_reason}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {subscription && (
            <Button variant="secondary" onClick={() => setPlanWizardOpen(true)}>
              Đổi gói
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              setImpersonateOpen(true);
              setImpersonateResult(null);
              setImpersonateError(null);
              setImpersonateWrite(false);
              setImpersonateScope([]);
              setImpersonateDuration(30);
            }}
          >
            Hỗ trợ (Impersonate)
          </Button>
          {NEXT_STATUSES[tenant.status].map((next) => (
            <Button
              key={next}
              variant={STATUS_BUTTON_VARIANT[next]}
              onClick={() => {
                setStatusModal(next);
                setStatusError(null);
              }}
            >
              Chuyển sang {next}
            </Button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Quy mô</h2>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              <li className="flex justify-between">
                <span className="text-zinc-500">Chi nhánh</span>
                <span className="font-mono font-semibold">{tenant._count?.branches ?? 0}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-zinc-500">Nhân sự</span>
                <span className="font-mono font-semibold">{tenant._count?.users ?? 0}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-zinc-500">Huấn luyện viên</span>
                <span className="font-mono font-semibold">
                  {tenant.quotas.find((q) => q.code === 'MAX_PT')?.used ?? 0}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-zinc-500">Hội viên</span>
                <span className="font-mono font-semibold">{tenant._count?.customers ?? 0}</span>
              </li>
            </ul>

            <h2 className="font-display mt-6 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Thông tin doanh nghiệp
            </h2>
            <form onSubmit={handleInfoSubmit} className="mt-4 grid grid-cols-1 gap-4">
              <FormField label="Tên doanh nghiệp" htmlFor="name">
                <input
                  id="name"
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setInfoForm({ ...form, name: e.target.value })}
                />
              </FormField>
              <FormField label="Email liên hệ" htmlFor="contactEmail">
                <input
                  id="contactEmail"
                  className={inputClass}
                  value={form.contactEmail}
                  onChange={(e) => setInfoForm({ ...form, contactEmail: e.target.value })}
                />
              </FormField>
              <FormField label="Số điện thoại" htmlFor="contactPhone">
                <input
                  id="contactPhone"
                  className={inputClass}
                  value={form.contactPhone}
                  onChange={(e) => setInfoForm({ ...form, contactPhone: e.target.value })}
                />
              </FormField>
              <FormField label="Địa chỉ" htmlFor="address">
                <input
                  id="address"
                  className={inputClass}
                  value={form.address}
                  onChange={(e) => setInfoForm({ ...form, address: e.target.value })}
                />
              </FormField>
              <Button type="submit" variant="secondary" disabled={infoMutation.isPending} className="w-fit">
                {infoMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </form>
          </Card>

          <div className="flex flex-col gap-6">
            <Card>
              <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Thuê bao</h2>
              {subscription ? (
                <ul className="mt-4 flex flex-col gap-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-zinc-500">Gói</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{subscription.saas_plans.name}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-zinc-500">Giá</span>
                    <span className="font-mono">{formatMoney(subscription.price, subscription.currency)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-zinc-500">Hiệu lực đến</span>
                    <span className="font-mono">{formatDate(subscription.end_date)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-zinc-500">Tự động gia hạn</span>
                    <span>{subscription.auto_renew ? 'Bật' : 'Tắt'}</span>
                  </li>
                </ul>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">Chưa có Subscription.</p>
              )}
            </Card>

            <Card>
              <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Cảnh báo</h2>
              {overLimitQuotas.length === 0 && overdueInvoices.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-400">Không có cảnh báo.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2 text-sm">
                  {overLimitQuotas.map((q) => (
                    <li key={q.code} className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <Warning size={16} weight="fill" />
                      Đã dùng {q.used}/{q.limit} {QUOTA_LABELS[q.code] ?? q.code} — chạm trần
                    </li>
                  ))}
                  {overdueInvoices.map((inv) => (
                    <li key={inv.id} className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <Warning size={16} weight="fill" />
                      Hoá đơn {inv.invoice_no} quá hạn thanh toán
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === 'plan' && (
        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Gia hạn thuê bao
              </h2>
            </div>
            {subscription ? (
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <FormField label="Gia hạn (số ngày)" htmlFor="renewDays">
                  <input
                    id="renewDays"
                    type="number"
                    min={1}
                    className={`${inputClass} w-28`}
                    value={renewDays}
                    onChange={(e) => setRenewDays(e.target.value)}
                  />
                </FormField>
                <Button variant="secondary" disabled={renewMutation.isPending} onClick={() => renewMutation.mutate()}>
                  Gia hạn
                </Button>
                {subError && <p className="text-sm text-red-600">{subError}</p>}
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Tenant chưa có Subscription.</p>
            )}
          </Card>

          <Card padded={false}>
            <div className="p-5 pb-0">
              <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Tính năng đang áp dụng
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Gói hiện tại · Snapshot khi ký · Điều chỉnh riêng · Hiệu lực thực tế.
              </p>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-t border-zinc-100 text-xs text-zinc-500 dark:border-zinc-800">
                  <tr>
                    <th className="px-5 py-2 font-medium">Tính năng</th>
                    <th className="px-3 py-2 font-medium">Gói hiện tại</th>
                    <th className="px-3 py-2 font-medium">Snapshot khi ký</th>
                    <th className="px-3 py-2 font-medium">Điều chỉnh riêng</th>
                    <th className="px-3 py-2 font-medium">Hiệu lực</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {tenant.featureMatrix.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-sm text-zinc-400">
                        Chưa có dữ liệu tính năng cho gói này.
                      </td>
                    </tr>
                  )}
                  {tenant.featureMatrix.map((row) => (
                    <tr key={row.code}>
                      <td className="px-5 py-2.5">
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">{row.name}</span>
                        {row.outOfSyncWithPlan && (
                          <span className="ml-1.5 inline-flex" title="Gói hiện tại đã đổi tính năng này nhưng snapshot đã ký giữ nguyên điều kiện lúc ký.">
                            <Info size={14} className="text-amber-500" />
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500">
                        {row.plan ? (row.plan.isEnabled ? row.plan.quota ?? '✓' : '✗') : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500">
                        {row.snapshot ? (row.snapshot.isEnabled ? row.snapshot.quota ?? '✓' : '✗') : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500">
                        {row.override ? (row.override.isEnabled ? row.override.quota ?? '✓' : '✗') : '—'}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-zinc-900 dark:text-zinc-50">
                        {row.effective ? (row.effective.isEnabled ? row.effective.quota ?? '✓' : '✗') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Vòng đời</h2>
            <ul className="mt-4 flex flex-col gap-3 border-l border-zinc-200 pl-4 dark:border-zinc-800">
              {tenant.timeline.map((entry, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute top-1.5 -left-5.25 h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{entry.label}</p>
                  <p className="text-xs text-zinc-400">
                    {formatDateTime(entry.at)}
                    {entry.actorRole && ` · ${entry.actorRole}`}
                    {entry.reason && ` · ${entry.reason}`}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Add-on</h2>
              <Button variant="secondary" size="sm" to="/admin/addons">
                Quản lý danh mục Add-on
              </Button>
            </div>
            {subscription ? (
              <>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <FormField label="Mã Add-on" htmlFor="attachAddonCode">
                    <input
                      id="attachAddonCode"
                      placeholder="vd: EXTRA_BRANCH"
                      className={`${inputClass} w-48`}
                      value={attachAddonCode}
                      onChange={(e) => setAttachAddonCode(e.target.value.toUpperCase())}
                    />
                  </FormField>
                  <FormField label="Số lượng" htmlFor="attachAddonQty">
                    <input
                      id="attachAddonQty"
                      type="number"
                      min={1}
                      className={`${inputClass} w-24`}
                      value={attachAddonQty}
                      onChange={(e) => setAttachAddonQty(e.target.value)}
                    />
                  </FormField>
                  <Button
                    variant="secondary"
                    disabled={attachAddonMutation.isPending || !attachAddonCode}
                    onClick={() => {
                      setAddonError(null);
                      attachAddonMutation.mutate();
                    }}
                  >
                    Gắn Add-on
                  </Button>
                </div>
                {addonError && <p className="mt-2 text-sm text-red-600">{addonError}</p>}

                {tenantAddonsQuery.data && tenantAddonsQuery.data.length > 0 ? (
                  <ul className="mt-4 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                    {tenantAddonsQuery.data.map((sa) => (
                      <li key={sa.addon_id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-50">
                            {sa.addons.name} <span className="font-mono text-xs text-zinc-400">× {sa.quantity}</span>
                          </p>
                          <p className="text-xs text-zinc-400">
                            {formatMoney(sa.price_snapshot, sa.addons.currency)} · gắn {formatDate(sa.added_at)}
                            {sa.status === 'CANCELLED' && sa.cancel_reason && ` · Đã gỡ: ${sa.cancel_reason}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={sa.status === 'CANCELLED' ? 'INACTIVE' : 'ACTIVE'} />
                          {sa.status === 'ACTIVE' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setCancelAddonTarget(sa.addon_id);
                                setCancelAddonReason('');
                              }}
                            >
                              Gỡ
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">Tenant chưa gắn Add-on nào.</p>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Tenant chưa có Subscription.</p>
            )}
          </Card>
        </div>
      )}

      {tab === 'quota' && (
        <Card>
          <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Hạn mức sử dụng</h2>
          <div className="mt-5 flex flex-col gap-4">
            {tenant.quotas.map((q) => {
              const pct = q.limit ? Math.min(100, Math.round((q.used / q.limit) * 100)) : 0;
              const atCeiling = q.limit !== null && q.used >= q.limit;
              return (
                <div key={q.code}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">{QUOTA_LABELS[q.code] ?? q.code}</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-50">
                      {q.used} / {q.limit ?? '∞'}
                      {atCeiling && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">⚠ Đã chạm trần</span>}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${atCeiling ? 'bg-amber-500' : 'bg-emerald-600 dark:bg-emerald-400'}`}
                      style={{ width: q.limit ? `${pct}%` : '100%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-xs text-zinc-400">
            Chạm trần chỉ hiển thị cảnh báo ở đây — việc chặn tạo mới xảy ra phía Tenant, nơi người dùng hiểu ngữ cảnh.
          </p>
        </Card>
      )}

      {tab === 'users' && (
        <Card padded={false}>
          <div className="flex items-center justify-between p-5 pb-0">
            <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Nhân sự Tenant
            </h2>
            {owner && (
              <Button variant="secondary" size="sm" onClick={() => setResetOwnerOpen(true)}>
                Đặt lại mật khẩu Owner
              </Button>
            )}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-t border-zinc-100 text-xs text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-2 font-medium">Họ tên</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Vai trò</th>
                  <th className="px-3 py-2 font-medium">Trạng thái</th>
                  <th className="px-3 py-2 font-medium">Đăng nhập gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {usersQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-sm text-zinc-400">
                      Chưa có nhân sự nào.
                    </td>
                  </tr>
                )}
                {usersQuery.data?.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-2.5 font-medium text-zinc-900 dark:text-zinc-50">{u.fullName}</td>
                    <td className="px-3 py-2.5 text-zinc-500">{u.email}</td>
                    <td className="px-3 py-2.5 text-zinc-500">{u.roles.join(', ')}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-3 py-2.5 text-zinc-500">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'branches' && (
        <Card padded={false}>
          <div className="p-5 pb-0">
            <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Chi nhánh</h2>
            <p className="mt-1 text-xs text-zinc-400">Danh sách chỉ đọc — không có hành động ở đây.</p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-t border-zinc-100 text-xs text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-2 font-medium">Chi nhánh</th>
                  <th className="px-3 py-2 font-medium">Địa chỉ</th>
                  <th className="px-3 py-2 font-medium">Trạng thái</th>
                  <th className="px-3 py-2 font-medium">Hội viên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {branchesQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-sm text-zinc-400">
                      Chưa có chi nhánh nào.
                    </td>
                  </tr>
                )}
                {branchesQuery.data?.map((b) => (
                  <tr key={b.id}>
                    <td className="px-5 py-2.5">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">{b.name}</span>
                      <p className="font-mono text-xs text-zinc-400">{b.code}</p>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-500">{b.address ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-zinc-900 dark:text-zinc-50">{b.activeCustomers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'billing' && (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Hoá đơn SaaS</h2>
            <Button variant="secondary" size="sm" to="/admin/invoices">
              Xem tất cả hoá đơn
            </Button>
          </div>
          {invoicesQuery.data && invoicesQuery.data.length > 0 ? (
            <table className="mt-4 w-full text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2 font-medium">Số hoá đơn</th>
                  <th className="py-2 font-medium">Kỳ</th>
                  <th className="py-2 font-medium">Số tiền</th>
                  <th className="py-2 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {invoicesQuery.data.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2">
                      <Link
                        to={`/admin/invoices/${inv.id}`}
                        className="font-mono text-zinc-900 hover:text-emerald-700 dark:text-zinc-50 dark:hover:text-emerald-400"
                      >
                        {inv.invoice_no}
                      </Link>
                    </td>
                    <td className="py-2">
                      {formatDate(inv.period_start)} - {formatDate(inv.period_end)}
                    </td>
                    <td className="py-2 font-mono">{formatMoney(inv.total_amount, inv.currency)}</td>
                    <td className="py-2">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">Chưa có hoá đơn nào cho Tenant này.</p>
          )}
        </Card>
      )}

      {tab === 'audit' && (
        <Card>
          <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Lịch sử thay đổi (Audit Log)
          </h2>
          {auditQuery.data && auditQuery.data.items.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              {auditQuery.data.items.map((entry) => (
                <li key={entry.id} className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{entry.action}</p>
                    {entry.reason && <p className="text-xs text-zinc-500">{entry.reason}</p>}
                  </div>
                  <span className="text-xs text-zinc-400">{formatDateTime(entry.occurred_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">Chưa có thay đổi nào được ghi nhận.</p>
          )}
        </Card>
      )}

      {tab === 'support' && (
        <div className="flex flex-col gap-6">
          <Card padded={false}>
            <div className="p-5 pb-0">
              <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Lịch sử phiên hỗ trợ
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Mọi lần Super Admin truy cập dữ liệu Tenant này qua "Hỗ trợ (Impersonate)" — có thời hạn, có
                lý do, có ghi nhận (BR-SA-003/004/005).
              </p>
            </div>
            {supportSessionsQuery.data && supportSessionsQuery.data.items.length > 0 ? (
              <ul className="mt-4 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                {supportSessionsQuery.data.items.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={s.status} />
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">
                          {s.access_level === 'READ_ONLY' ? 'Chỉ đọc' : 'Có thao tác'}
                        </span>
                        {s.scope.length > 0 && (
                          <span className="text-xs text-zinc-400">
                            · {s.scope.map((sc) => SCOPE_LABELS[sc]).join(', ')}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{s.reason}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        Bắt đầu {formatDateTime(s.started_at)} · Hết hạn {formatDateTime(s.expires_at)}
                        {s.ended_at && ` · Đã kết thúc ${formatDateTime(s.ended_at)}`}
                      </p>
                    </div>
                    {s.status === 'ACTIVE' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={endSessionMutation.isPending}
                        onClick={() => endSessionMutation.mutate(s.id)}
                      >
                        Kết thúc phiên
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-5 text-sm text-zinc-500">Chưa có phiên hỗ trợ nào.</p>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Đặt lại mật khẩu Owner
            </h2>
            {passwordResetEvents.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                {passwordResetEvents.map((entry) => (
                  <li key={entry.id} className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{entry.action}</p>
                      {entry.reason && <p className="text-xs text-zinc-500">{entry.reason}</p>}
                    </div>
                    <span className="text-xs text-zinc-400">{formatDateTime(entry.occurred_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Chưa từng đặt lại mật khẩu Owner.</p>
            )}
          </Card>
        </div>
      )}

      {statusModal && (
        <Modal
          title={`Chuyển Tenant sang ${statusModal}`}
          onClose={() => setStatusModal(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStatusModal(null)}>
                Huỷ
              </Button>
              <Button
                variant={STATUS_BUTTON_VARIANT[statusModal]}
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate()}
              >
                {statusMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            {statusModal === 'SUSPENDED' && (
              <Callout tone="danger">
                Khi tạm khoá: {tenant._count?.users ?? 0} nhân sự không đăng nhập được, {tenant._count?.customers ?? 0} hội viên
                không check-in được. Dữ liệu được giữ nguyên, mở lại bất cứ lúc nào.
              </Callout>
            )}
            {statusModal === 'SUSPENDED' && (
              <FormField label="Lý do tạm ngưng (bắt buộc)" htmlFor="reason">
                <textarea
                  id="reason"
                  required
                  rows={3}
                  className={inputClass}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
              </FormField>
            )}
            {statusError && <p className="text-sm text-red-600">{statusError}</p>}
          </div>
        </Modal>
      )}

      {impersonateOpen && (
        <Modal
          title="Mở phiên hỗ trợ"
          description={'Có thời hạn, có lý do, có ghi nhận (BR-SA-003/004/005) — lưu lại trong tab "Phiên hỗ trợ".'}
          onClose={() => setImpersonateOpen(false)}
          footer={
            impersonateResult ? (
              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setImpersonateOpen(false)}>
                  Đóng
                </Button>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setImpersonateOpen(false)}>
                  Huỷ
                </Button>
                <Button
                  variant="primary"
                  disabled={impersonateMutation.isPending || impersonateReason.length < 5}
                  onClick={() => impersonateMutation.mutate()}
                >
                  {impersonateMutation.isPending ? 'Đang mở phiên...' : 'Bắt đầu phiên hỗ trợ'}
                </Button>
              </div>
            )
          }
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Mức truy cập</p>
              <div className="mt-2 flex gap-1.5">
                {(
                  [
                    { value: false, label: 'Chỉ đọc' },
                    { value: true, label: 'Có thao tác' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setImpersonateWrite(opt.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      impersonateWrite === opt.value
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Phạm vi</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SUPPORT_SESSION_SCOPES.map((scope) => {
                  const active = impersonateScope.includes(scope);
                  return (
                    <button
                      key={scope}
                      type="button"
                      onClick={() =>
                        setImpersonateScope((prev) =>
                          active ? prev.filter((s) => s !== scope) : [...prev, scope],
                        )
                      }
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {SCOPE_LABELS[scope]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Thời hạn</p>
              <div className="mt-2 flex gap-1.5">
                {SUPPORT_SESSION_DURATIONS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setImpersonateDuration(minutes)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      impersonateDuration === minutes
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {minutes < 60 ? `${minutes} phút` : `${minutes / 60} giờ`}
                  </button>
                ))}
              </div>
            </div>
            <FormField label="Lý do truy cập (bắt buộc)" htmlFor="impersonateReason">
              <textarea
                id="impersonateReason"
                required
                rows={3}
                className={inputClass}
                value={impersonateReason}
                onChange={(e) => setImpersonateReason(e.target.value)}
              />
            </FormField>
            {impersonateError && <p className="text-sm text-red-600">{impersonateError}</p>}
            {impersonateResult && <Callout tone="success">{impersonateResult}</Callout>}
          </div>
        </Modal>
      )}

      {planWizardOpen && subscription && (
        <PlanChangeWizard
          tenantId={id!}
          currentSubscription={subscription}
          onClose={() => setPlanWizardOpen(false)}
        />
      )}

      {resetOwnerOpen && <ResetOwnerPasswordModal tenantId={id!} onClose={() => setResetOwnerOpen(false)} />}

      {cancelAddonTarget && (
        <Modal
          title="Gỡ Add-on"
          onClose={() => setCancelAddonTarget(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCancelAddonTarget(null)}>
                Huỷ
              </Button>
              <Button
                variant="danger"
                disabled={cancelAddonMutation.isPending || cancelAddonReason.length < 5}
                onClick={() => cancelAddonMutation.mutate()}
              >
                {cancelAddonMutation.isPending ? 'Đang xử lý...' : 'Xác nhận gỡ'}
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <Callout tone="warning">
              Gỡ Add-on có thể lấy đi hạn mức hoặc tính năng Tenant đang dùng nếu Entitlement được tính từ
              Add-on này.
            </Callout>
            <FormField label="Lý do (bắt buộc)" htmlFor="cancelAddonReason">
              <textarea
                id="cancelAddonReason"
                required
                rows={3}
                className={inputClass}
                value={cancelAddonReason}
                onChange={(e) => setCancelAddonReason(e.target.value)}
              />
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  );
}
