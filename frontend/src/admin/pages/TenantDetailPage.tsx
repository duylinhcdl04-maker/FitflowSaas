import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Info,
  Warning,
  Storefront,
  Users,
  Barbell,
  UserCheck,
  Buildings,
  EnvelopeSimple,
  Phone,
  MapPin,
  CalendarBlank,
  ArrowSquareOut,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle,
  ClockCounterClockwise,
  ArrowLeft,
  Sparkle,
  Receipt,
  SquaresFour,
  ArrowsClockwise,
  UserSwitch,
  Lock,
  Globe,
  Tag,
  Package,
} from '@phosphor-icons/react';
import {
  getTenant,
  changeTenantStatus,
  startImpersonation,
  listTenantUsers,
  listTenantBranches,
  type TenantStatus,
} from '../api/tenants';
import { getSubscription, listInvoices, updateSubscription } from '../api/subscriptions';
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
  { key: 'overview', label: 'Tổng quan', icon: SquaresFour },
  { key: 'plan', label: 'Gói & Thuê bao', icon: Package },
  { key: 'quota', label: 'Hạn mức', icon: Sparkle },
  { key: 'users', label: 'Người dùng', icon: Users },
  { key: 'branches', label: 'Chi nhánh', icon: Storefront },
  { key: 'billing', label: 'Thanh toán', icon: Receipt },
  { key: 'support', label: 'Phiên hỗ trợ', icon: UserSwitch },
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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

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

  const tenant = tenantQuery.data;
  const subscription = subscriptionQuery.data;

  if (tenantQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }
  if (!tenant) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
        <p className="font-semibold text-red-600 dark:text-red-400">Không tìm thấy Tenant</p>
        <p className="mt-1 text-sm text-zinc-500">Mã định danh không tồn tại hoặc đã bị gỡ bỏ.</p>
        <Link
          to="/admin/tenants"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  const overLimitQuotas = tenant.quotas.filter((q) => q.limit !== null && q.used >= q.limit);
  const overdueInvoices = (invoicesQuery.data ?? []).filter((inv) => inv.status === 'OVERDUE');
  const owner = usersQuery.data?.find((u) => u.roles.includes('OWNER'));

  const tenantDomain = `${tenant.code}.fitfloww.store`;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/admin/tenants"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>Danh sách Tenant</span>
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/50 to-emerald-50/20 p-6 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Avatar + Title + Badges */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-2xl font-black text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/10">
              {tenant.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {tenant.name}
                </h1>
                <StatusBadge status={tenant.status} />
                {tenant.legal_name && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    <Buildings size={12} />
                    {tenant.legal_name}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-1 font-mono">
                  <Globe size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <a
                    href={`https://${tenantDomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-emerald-600 hover:underline dark:hover:text-emerald-400 flex items-center gap-1"
                  >
                    <span>{tenantDomain}</span>
                    <ArrowSquareOut size={12} />
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`https://${tenantDomain}`, 'domain')}
                    className="ml-1 p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    title="Sao chép tên miền"
                  >
                    {copiedField === 'domain' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                </div>

                <span className="text-zinc-300 dark:text-zinc-700">•</span>

                <div className="flex items-center gap-1 font-mono">
                  <Tag size={13} />
                  <span>Mã: {tenant.code}</span>
                </div>

                <span className="text-zinc-300 dark:text-zinc-700">•</span>

                <div className="flex items-center gap-1">
                  <CalendarBlank size={13} />
                  <span>Tạo ngày {formatDate(tenant.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {subscription && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 shadow-sm"
                onClick={() => setPlanWizardOpen(true)}
              >
                <Package size={15} weight="bold" />
                <span>Đổi gói dịch vụ</span>
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 shadow-sm hover:border-emerald-500/50"
              onClick={() => {
                setImpersonateOpen(true);
                setImpersonateResult(null);
                setImpersonateError(null);
                setImpersonateWrite(false);
                setImpersonateScope([]);
                setImpersonateDuration(30);
              }}
            >
              <UserSwitch size={15} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
              <span>Hỗ trợ (Impersonate)</span>
            </Button>

            {NEXT_STATUSES[tenant.status].map((next) => (
              <Button
                key={next}
                size="sm"
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

        {/* Suspended Alert Banner */}
        {tenant.status === 'SUSPENDED' && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            <Warning size={20} weight="fill" className="shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Tenant đang trong trạng thái Tạm ngưng hoạt động</p>
              <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
                Lý do: {tenant.suspended_reason || 'Không ghi rõ lý do.'}
                {tenant.suspended_at && ` (Ghi nhận lúc ${formatDateTime(tenant.suspended_at)})`}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0 bg-white text-red-700 border-red-200 hover:bg-red-50 dark:bg-zinc-900 dark:text-red-300 dark:border-red-900"
              onClick={() => {
                setStatusModal('ACTIVE');
                setStatusError(null);
              }}
            >
              Kích hoạt lại
            </Button>
          </div>
        )}
      </div>

      {/* Modern Tabs Navigation (Internal Tenant Logs Removed) */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-zinc-100/80 p-1.5 backdrop-blur-sm dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-white text-emerald-800 shadow-sm shadow-zinc-950/[0.04] ring-1 ring-zinc-950/[0.05] dark:bg-zinc-800 dark:text-emerald-400 dark:ring-white/[0.05]'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Icon size={16} weight={isActive ? 'bold' : 'regular'} />
              <span>{t.label}</span>
              {t.key === 'quota' && overLimitQuotas.length > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-900" />
              )}
              {t.key === 'billing' && overdueInvoices.length > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-900" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: Overview */}
      {tab === 'overview' && (
        <div className="flex flex-col gap-6">
          {/* 4 Scale KPI Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Storefront size={24} weight="duotone" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Chi nhánh</p>
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                  {tenant._count?.branches ?? 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                <Users size={24} weight="duotone" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Nhân sự</p>
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                  {tenant._count?.users ?? 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                <Barbell size={24} weight="duotone" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Huấn luyện viên (PT)</p>
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                  {tenant.quotas.find((q) => q.code === 'MAX_PT')?.used ?? 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                <UserCheck size={24} weight="duotone" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Hội viên</p>
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                  {tenant._count?.customers ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Main 2-Column Overview Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Read-Only Enterprise Information */}
            <div className="lg:col-span-2">
              <Card>
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Buildings size={20} className="text-emerald-700 dark:text-emerald-400" />
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      Thông tin doanh nghiệp
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    <Lock size={12} />
                    Chỉ đọc · Quản lý bởi Tenant
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tên doanh nghiệp */}
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/30">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <Buildings size={14} />
                      <span>Tên doanh nghiệp</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {tenant.name}
                    </p>
                  </div>

                  {/* Tên pháp lý */}
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/30">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <Tag size={14} />
                      <span>Tên pháp lý</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {tenant.legal_name || <span className="text-zinc-400 italic">Chưa thiết lập</span>}
                    </p>
                  </div>

                  {/* Mã số thuế */}
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/30">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <Receipt size={14} />
                      <span>Mã số thuế</span>
                    </div>
                    <p className="mt-1 text-sm font-mono font-medium text-zinc-900 dark:text-zinc-50">
                      {tenant.tax_code || <span className="text-zinc-400 italic font-sans">Chưa thiết lập</span>}
                    </p>
                  </div>

                  {/* Tên miền truy cập */}
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/30">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Globe size={14} />
                        <span>Tên miền Tenant</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(tenantDomain, 'subdomain')}
                        className="text-xs text-emerald-700 hover:underline dark:text-emerald-400 inline-flex items-center gap-1"
                      >
                        {copiedField === 'subdomain' ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedField === 'subdomain' ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                    <p className="mt-1 text-sm font-mono font-medium text-zinc-900 dark:text-zinc-50 truncate">
                      {tenantDomain}
                    </p>
                  </div>

                  {/* Email liên hệ */}
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/30">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <EnvelopeSimple size={14} />
                        <span>Email liên hệ</span>
                      </div>
                      {tenant.contact_email && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(tenant.contact_email!, 'email')}
                          className="text-xs text-emerald-700 hover:underline dark:text-emerald-400 inline-flex items-center gap-1"
                        >
                          {copiedField === 'email' ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedField === 'email' ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50 break-all">
                      {tenant.contact_email || <span className="text-zinc-400 italic">Chưa thiết lập</span>}
                    </p>
                  </div>

                  {/* Số điện thoại */}
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/30">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} />
                        <span>Số điện thoại</span>
                      </div>
                      {tenant.contact_phone && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(tenant.contact_phone!, 'phone')}
                          className="text-xs text-emerald-700 hover:underline dark:text-emerald-400 inline-flex items-center gap-1"
                        >
                          {copiedField === 'phone' ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedField === 'phone' ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-mono font-medium text-zinc-900 dark:text-zinc-50">
                      {tenant.contact_phone || <span className="text-zinc-400 italic font-sans">Chưa thiết lập</span>}
                    </p>
                  </div>

                  {/* Địa chỉ */}
                  <div className="sm:col-span-2 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/30">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <MapPin size={14} />
                      <span>Địa chỉ</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {tenant.address || <span className="text-zinc-400 italic">Chưa cập nhật</span>}
                    </p>
                  </div>

                  {/* Lưu trữ dữ liệu */}
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/30">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <ShieldCheck size={14} />
                      <span>Lưu trữ dữ liệu</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {tenant.data_retention_days ? `${tenant.data_retention_days} ngày` : 'Không giới hạn'}
                    </p>
                  </div>

                  {/* Cập nhật gần nhất */}
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/30">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <ClockCounterClockwise size={14} />
                      <span>Cập nhật lần cuối</span>
                    </div>
                    <p className="mt-1 text-sm font-mono text-zinc-900 dark:text-zinc-50">
                      {formatDateTime(tenant.updated_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-100/70 p-3 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
                  <Info size={16} className="shrink-0 text-zinc-400" />
                  <span>
                    Hồ sơ doanh nghiệp được quản lý trực tiếp bởi Tenant Owner. Super Admin chỉ theo dõi trạng thái và điều phối hạ tầng nền tảng.
                  </span>
                </div>
              </Card>
            </div>

            {/* Right Column: Subscription & Alerts */}
            <div className="flex flex-col gap-6">
              {/* Subscription Card */}
              <Card>
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <Package size={18} className="text-emerald-700 dark:text-emerald-400" />
                    Thuê bao hiện tại
                  </h2>
                  {subscription && (
                    <button
                      type="button"
                      onClick={() => setTab('plan')}
                      className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      Chi tiết →
                    </button>
                  )}
                </div>

                {subscription ? (
                  <div className="mt-4 flex flex-col gap-3.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400 text-xs">Gói cước</span>
                      <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                        {subscription.saas_plans.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400 text-xs">Giá thuê bao</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-50">
                        {formatMoney(subscription.price, subscription.currency)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400 text-xs">Hiệu lực đến</span>
                      <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                        {formatDate(subscription.end_date)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400 text-xs">Tự động gia hạn</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          subscription.auto_renew
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${subscription.auto_renew ? 'bg-emerald-500' : 'bg-zinc-400'}`}
                        />
                        {subscription.auto_renew ? 'Đang bật' : 'Đã tắt'}
                      </span>
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full justify-center"
                        onClick={() => setPlanWizardOpen(true)}
                      >
                        Nâng cấp / Đổi gói
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-center dark:bg-zinc-800/30">
                    <p className="text-xs text-zinc-500">Tenant chưa kích hoạt Subscription.</p>
                  </div>
                )}
              </Card>

              {/* Operational Alerts Card */}
              <Card>
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <Warning size={18} className="text-amber-500" />
                    Cảnh báo vận hành
                  </h2>
                  <span className="text-xs text-zinc-400">
                    {overLimitQuotas.length + overdueInvoices.length} cảnh báo
                  </span>
                </div>

                {overLimitQuotas.length === 0 && overdueInvoices.length === 0 ? (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 text-xs text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
                    <CheckCircle size={20} weight="fill" className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-semibold">Mọi chỉ số đều bình thường</p>
                      <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                        Không phát hiện giới hạn bị chạm trần hoặc hoá đơn quá hạn.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-2.5">
                    {overLimitQuotas.map((q) => (
                      <div
                        key={q.code}
                        className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
                      >
                        <Warning size={16} weight="fill" className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-semibold">Hạn mức {QUOTA_LABELS[q.code] ?? q.code} đã chạm trần</p>
                          <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                            Đang dùng <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{q.used}</span> / {q.limit}
                          </p>
                        </div>
                      </div>
                    ))}
                    {overdueInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
                      >
                        <Warning size={16} weight="fill" className="shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                        <div>
                          <p className="font-semibold">Hoá đơn {inv.invoice_no} quá hạn thanh toán</p>
                          <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                            Số tiền: {formatMoney(inv.total_amount, inv.currency)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Plan & Subscription */}
      {tab === 'plan' && (
        <div className="flex flex-col gap-6">
          {/* Quick Renewal Card */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <ArrowsClockwise size={20} className="text-emerald-700 dark:text-emerald-400" />
                  Gia hạn thuê bao
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Cộng thêm số ngày sử dụng trực tiếp vào chu kỳ hiện tại của Tenant.
                </p>
              </div>

              {subscription ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                    {[
                      { days: '30', label: '+30 ngày' },
                      { days: '90', label: '+3 tháng' },
                      { days: '365', label: '+1 năm' },
                    ].map((opt) => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => setRenewDays(opt.days)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                          renewDays === opt.days
                            ? 'bg-white text-emerald-800 shadow-sm dark:bg-zinc-700 dark:text-emerald-300'
                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="renewDays"
                      type="number"
                      min={1}
                      className={`${inputClass} w-24 text-center font-mono`}
                      value={renewDays}
                      onChange={(e) => setRenewDays(e.target.value)}
                    />
                    <Button
                      variant="primary"
                      disabled={renewMutation.isPending || Number(renewDays) <= 0}
                      onClick={() => renewMutation.mutate()}
                    >
                      {renewMutation.isPending ? 'Đang gia hạn...' : 'Xác nhận gia hạn'}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Tenant chưa kích hoạt Subscription.</p>
              )}
            </div>
            {subError && <p className="mt-2 text-sm text-red-600">{subError}</p>}
          </Card>

          {/* Feature Matrix Table */}
          <Card padded={false}>
            <div className="p-5 pb-3">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Sparkle size={20} className="text-emerald-700 dark:text-emerald-400" />
                Tính năng đang áp dụng (Feature Entitlements)
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                So sánh 3 tầng: Định nghĩa Gói gốc · Snapshot thời điểm ký hợp đồng · Ghi đè riêng lẻ · Quyền hạn thực tế.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-t border-b border-zinc-200/80 bg-zinc-50/70 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Tính năng nền tảng</th>
                    <th className="px-3 py-3 font-semibold">Gói hiện tại</th>
                    <th className="px-3 py-3 font-semibold">Snapshot lúc ký</th>
                    <th className="px-3 py-3 font-semibold">Điều chỉnh riêng</th>
                    <th className="px-5 py-3 font-semibold text-right">Hiệu lực thực tế</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {tenant.featureMatrix.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-sm text-zinc-400">
                        Chưa có dữ liệu tính năng cho gói này.
                      </td>
                    </tr>
                  )}
                  {tenant.featureMatrix.map((row) => (
                    <tr key={row.code} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</span>
                          {row.outOfSyncWithPlan && (
                            <span
                              className="inline-flex cursor-help items-center text-amber-500"
                              title="Gói hiện tại đã đổi tính năng này nhưng snapshot giữ nguyên điều kiện lúc ký."
                            >
                              <Info size={15} />
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-xs text-zinc-400">{row.code}</span>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-zinc-500">
                        {row.plan ? (row.plan.isEnabled ? row.plan.quota ?? 'Có' : 'Không') : '—'}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-zinc-500">
                        {row.snapshot ? (row.snapshot.isEnabled ? row.snapshot.quota ?? 'Có' : 'Không') : '—'}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-zinc-500">
                        {row.override ? (row.override.isEnabled ? row.override.quota ?? 'Có' : 'Không') : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            row.effective?.isEnabled
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400'
                              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {row.effective?.isEnabled ? (
                            <>
                              <Check size={13} weight="bold" />
                              {row.effective.quota !== null ? `${row.effective.quota}` : 'Kích hoạt'}
                            </>
                          ) : (
                            'Chưa mở'
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Timeline & Addons Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Lifecycle Timeline */}
            <Card>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <ClockCounterClockwise size={20} className="text-emerald-700 dark:text-emerald-400" />
                Vòng đời & Lịch sử thuê bao
              </h2>
              <ul className="mt-5 flex flex-col gap-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-800">
                {tenant.timeline.map((entry, i) => (
                  <li key={i} className="relative text-sm">
                    <span className="absolute top-1 -left-[21px] h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-white dark:bg-emerald-400 dark:ring-zinc-900" />
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{entry.label}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(entry.at)}
                      {entry.actorRole && ` · Người thực hiện: ${entry.actorRole}`}
                      {entry.reason && ` · Lý do: ${entry.reason}`}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Add-on Management */}
            <Card>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <Package size={20} className="text-emerald-700 dark:text-emerald-400" />
                  Gói mở rộng (Add-on)
                </h2>
                <Button variant="secondary" size="sm" to="/admin/addons">
                  Quản lý danh mục
                </Button>
              </div>

              {subscription ? (
                <>
                  <div className="mt-4 flex flex-wrap items-end gap-2.5">
                    <FormField label="Mã Add-on" htmlFor="attachAddonCode">
                      <input
                        id="attachAddonCode"
                        placeholder="vd: EXTRA_BRANCH"
                        className={`${inputClass} w-44 uppercase font-mono text-xs`}
                        value={attachAddonCode}
                        onChange={(e) => setAttachAddonCode(e.target.value.toUpperCase())}
                      />
                    </FormField>
                    <FormField label="Số lượng" htmlFor="attachAddonQty">
                      <input
                        id="attachAddonQty"
                        type="number"
                        min={1}
                        className={`${inputClass} w-20 font-mono text-xs text-center`}
                        value={attachAddonQty}
                        onChange={(e) => setAttachAddonQty(e.target.value)}
                      />
                    </FormField>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={attachAddonMutation.isPending || !attachAddonCode}
                      onClick={() => {
                        setAddonError(null);
                        attachAddonMutation.mutate();
                      }}
                    >
                      {attachAddonMutation.isPending ? 'Đang gắn...' : 'Gắn Add-on'}
                    </Button>
                  </div>
                  {addonError && <p className="mt-2 text-xs text-red-600">{addonError}</p>}

                  {tenantAddonsQuery.data && tenantAddonsQuery.data.length > 0 ? (
                    <div className="mt-4 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                      {tenantAddonsQuery.data.map((sa) => (
                        <div key={sa.addon_id} className="flex items-center justify-between gap-3 py-3 text-sm">
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                              {sa.addons.name}{' '}
                              <span className="font-mono text-xs font-normal text-zinc-400">× {sa.quantity}</span>
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-400">
                              {formatMoney(sa.price_snapshot, sa.addons.currency)} · Gắn ngày {formatDate(sa.added_at)}
                              {sa.status === 'CANCELLED' && sa.cancel_reason && ` · Lý do gỡ: ${sa.cancel_reason}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={sa.status === 'CANCELLED' ? 'INACTIVE' : 'ACTIVE'} />
                            {sa.status === 'ACTIVE' && (
                              <Button
                                variant="danger"
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-center dark:bg-zinc-800/30">
                      <p className="text-xs text-zinc-500">Tenant chưa gắn Add-on nào.</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">Tenant chưa kích hoạt Subscription.</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Quotas */}
      {tab === 'quota' && (
        <Card>
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Sparkle size={20} className="text-emerald-700 dark:text-emerald-400" />
                Hạn mức sử dụng tài nguyên (Quotas)
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Theo dõi mức tiêu thụ tài nguyên thực tế của Tenant so với giới hạn gói đã đăng ký.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenant.quotas.map((q) => {
              const pct = q.limit ? Math.min(100, Math.round((q.used / q.limit) * 100)) : 0;
              const atCeiling = q.limit !== null && q.used >= q.limit;
              const isWarning = q.limit !== null && pct >= 80 && !atCeiling;

              return (
                <div
                  key={q.code}
                  className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-800/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {QUOTA_LABELS[q.code] ?? q.code}
                    </span>
                    <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {q.used} <span className="text-zinc-400 font-normal">/ {q.limit ?? 'Không giới hạn'}</span>
                    </span>
                  </div>

                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-700/60">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        atCeiling
                          ? 'bg-red-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-600 dark:bg-emerald-400'
                      }`}
                      style={{ width: q.limit ? `${pct}%` : '100%' }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {q.limit ? `${pct}% đã sử dụng` : 'Không áp đặt hạn mức'}
                    </span>
                    {atCeiling && (
                      <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Warning size={12} weight="fill" /> Chạm trần tối đa
                      </span>
                    )}
                    {isWarning && (
                      <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Warning size={12} weight="fill" /> Sắp chạm hạn mức
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl bg-zinc-100/70 p-3.5 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400 flex items-center gap-2">
            <Info size={16} className="shrink-0 text-zinc-400" />
            <span>
              Chạm trần chỉ hiển thị cảnh báo tại đây — hành vi chặn tạo mới tài nguyên xảy ra trực tiếp ở Tenant Portal khi người dùng thao tác.
            </span>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: Users / Staff */}
      {tab === 'users' && (
        <Card padded={false}>
          <div className="flex items-center justify-between p-5 pb-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Users size={20} className="text-emerald-700 dark:text-emerald-400" />
                Danh sách Nhân sự Tenant ({usersQuery.data?.length ?? 0})
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Tài khoản nhân sự và quản trị viên thuộc quyền quản lý của Tenant.
              </p>
            </div>
            {owner && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => setResetOwnerOpen(true)}
              >
                <Lock size={14} />
                <span>Đặt lại mật khẩu Owner</span>
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-t border-b border-zinc-200/80 bg-zinc-50/70 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40">
                <tr>
                  <th className="px-5 py-3 font-semibold">Nhân sự</th>
                  <th className="px-3 py-3 font-semibold">Email & SĐT</th>
                  <th className="px-3 py-3 font-semibold">Vai trò</th>
                  <th className="px-3 py-3 font-semibold">Trạng thái</th>
                  <th className="px-5 py-3 font-semibold text-right">Đăng nhập gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {usersQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-zinc-400">
                      Chưa có nhân sự nào trong hệ thống.
                    </td>
                  </tr>
                )}
                {usersQuery.data?.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 font-mono">{u.email}</p>
                      {u.phone && <p className="text-xs text-zinc-400 font-mono">{u.phone}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((role) => (
                          <span
                            key={role}
                            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                              role === 'OWNER'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300'
                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-zinc-500">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Chưa đăng nhập'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: Branches */}
      {tab === 'branches' && (
        <Card padded={false}>
          <div className="p-5 pb-3">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Storefront size={20} className="text-emerald-700 dark:text-emerald-400" />
              Chi nhánh cơ sở ({branchesQuery.data?.length ?? 0})
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Danh sách chi nhánh hiển thị chỉ đọc theo thông tin quản lý nội bộ của Tenant.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-t border-b border-zinc-200/80 bg-zinc-50/70 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40">
                <tr>
                  <th className="px-5 py-3 font-semibold">Tên chi nhánh</th>
                  <th className="px-3 py-3 font-semibold">Địa chỉ cơ sở</th>
                  <th className="px-3 py-3 font-semibold">Trạng thái</th>
                  <th className="px-5 py-3 font-semibold text-right">Hội viên hoạt động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {branchesQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-zinc-400">
                      Tenant chưa thiết lập chi nhánh nào.
                    </td>
                  </tr>
                )}
                {branchesQuery.data?.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{b.name}</span>
                      <p className="font-mono text-xs text-zinc-400">Mã: {b.code}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">
                      {b.address || <span className="text-zinc-400 italic">Chưa cập nhật địa chỉ</span>}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-50">
                      {b.activeCustomers}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: Billing */}
      {tab === 'billing' && (
        <Card>
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Receipt size={20} className="text-emerald-700 dark:text-emerald-400" />
                Hoá đơn nền tảng SaaS
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Lịch sử thanh toán phí thuê bao định kỳ của Tenant.
              </p>
            </div>
            <Button variant="secondary" size="sm" to="/admin/invoices">
              Xem tất cả hoá đơn
            </Button>
          </div>

          {invoicesQuery.data && invoicesQuery.data.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200/80 bg-zinc-50/70 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Số hoá đơn</th>
                    <th className="px-3 py-3 font-semibold">Kỳ dịch vụ</th>
                    <th className="px-3 py-3 font-semibold">Tổng tiền</th>
                    <th className="px-4 py-3 font-semibold text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {invoicesQuery.data.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/invoices/${inv.id}`}
                          className="font-mono font-semibold text-zinc-900 hover:text-emerald-700 dark:text-zinc-50 dark:hover:text-emerald-400"
                        >
                          {inv.invoice_no}
                        </Link>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-zinc-500">
                        {formatDate(inv.period_start)} - {formatDate(inv.period_end)}
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-zinc-900 dark:text-zinc-50">
                        {formatMoney(inv.total_amount, inv.currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-zinc-50 p-6 text-center dark:bg-zinc-800/30">
              <p className="text-xs text-zinc-500">Chưa có hoá đơn nào phát sinh cho Tenant này.</p>
            </div>
          )}
        </Card>
      )}

      {/* TAB CONTENT: Support Sessions */}
      {tab === 'support' && (
        <Card padded={false}>
          <div className="p-5 pb-3">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <UserSwitch size={20} className="text-emerald-700 dark:text-emerald-400" />
              Lịch sử phiên hỗ trợ (Impersonation Sessions)
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Toàn bộ lịch sử truy cập dữ liệu hỗ trợ — có thời hạn, phạm vi, lý do và tuân thủ bảo mật tuyệt đối.
            </p>
          </div>

          {supportSessionsQuery.data && supportSessionsQuery.data.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-t border-b border-zinc-200/80 bg-zinc-50/70 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Trạng thái & Quyền</th>
                    <th className="px-3 py-3 font-semibold">Phạm vi & Lý do</th>
                    <th className="px-3 py-3 font-semibold">Thời gian</th>
                    <th className="px-5 py-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {supportSessionsQuery.data.items.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={s.status} />
                          <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                            {s.access_level === 'READ_ONLY' ? 'Chỉ đọc' : 'Có thao tác'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{s.reason}</p>
                        {s.scope.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {s.scope.map((sc) => (
                              <span
                                key={sc}
                                className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                              >
                                {SCOPE_LABELS[sc]}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-zinc-500">
                        <p>Bắt đầu: {formatDateTime(s.started_at)}</p>
                        <p>Hết hạn: {formatDateTime(s.expires_at)}</p>
                      </td>
                      <td className="px-5 py-3 text-right">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-zinc-500">
              Chưa từng có phiên hỗ trợ impersonation nào được mở cho Tenant này.
            </div>
          )}
        </Card>
      )}

      {/* MODAL: Status Transition */}
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
                Khi tạm ngưng: {tenant._count?.users ?? 0} nhân sự sẽ bị khoá đăng nhập, {tenant._count?.customers ?? 0} hội viên
                không thể check-in. Dữ liệu phòng tập vẫn giữ nguyên và có thể mở lại bất kỳ lúc nào.
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
                  placeholder="Nhập lý do tạm khoá dịch vụ..."
                />
              </FormField>
            )}
            {statusError && <p className="text-sm text-red-600">{statusError}</p>}
          </div>
        </Modal>
      )}

      {/* MODAL: Impersonation */}
      {impersonateOpen && (
        <Modal
          title="Mở phiên hỗ trợ kỹ thuật (Impersonate)"
          description={'Cấp quyền truy cập tạm thời có kiểm soát — lưu lại đầy đủ trong Nhật ký bảo mật.'}
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
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Mức độ truy cập</p>
              <div className="mt-2 flex gap-1.5">
                {(
                  [
                    { value: false, label: 'Chỉ đọc (An toàn)' },
                    { value: true, label: 'Có thao tác (Ghi đè)' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setImpersonateWrite(opt.value)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                      impersonateWrite === opt.value
                        ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Phạm vi dữ liệu hỗ trợ</p>
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
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950'
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
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Thời hạn phiên</p>
              <div className="mt-2 flex gap-1.5">
                {SUPPORT_SESSION_DURATIONS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setImpersonateDuration(minutes)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                      impersonateDuration === minutes
                        ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950'
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
                placeholder="Nhập lý do hỗ trợ kỹ thuật..."
                value={impersonateReason}
                onChange={(e) => setImpersonateReason(e.target.value)}
              />
            </FormField>

            {impersonateError && <p className="text-sm text-red-600">{impersonateError}</p>}
            {impersonateResult && <Callout tone="success">{impersonateResult}</Callout>}
          </div>
        </Modal>
      )}

      {/* Plan Change Wizard */}
      {planWizardOpen && subscription && (
        <PlanChangeWizard
          tenantId={id!}
          currentSubscription={subscription}
          onClose={() => setPlanWizardOpen(false)}
        />
      )}

      {/* Reset Owner Password Modal */}
      {resetOwnerOpen && <ResetOwnerPasswordModal tenantId={id!} onClose={() => setResetOwnerOpen(false)} />}

      {/* MODAL: Cancel Add-on */}
      {cancelAddonTarget && (
        <Modal
          title="Gỡ Add-on khỏi Tenant"
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
              Gỡ Add-on có thể làm giảm hạn mức hoặc tước quyền các tính năng mở rộng mà Tenant đang sử dụng.
            </Callout>
            <FormField label="Lý do gỡ (bắt buộc)" htmlFor="cancelAddonReason">
              <textarea
                id="cancelAddonReason"
                required
                rows={3}
                className={inputClass}
                placeholder="Nhập lý do gỡ gói mở rộng..."
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
