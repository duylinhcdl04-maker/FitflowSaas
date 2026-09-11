import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from '@phosphor-icons/react';
import {
  getCurrentSubscription,
  getTenantUsageOverview,
  listPublicPlans,
  listSubscriptionInvoices,
  markInvoiceTransferred,
  requestPlanInvoice,
  type SubscriptionInvoice,
} from '../../api/subscription';
import { apiErrorMessage } from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Callout from '../../components/Callout';
import { Skeleton } from '../../components/Skeleton';
import { Warning, WarningCircle, ArrowUpRight } from '@phosphor-icons/react';

const STATUS_LABELS: Record<string, string> = {
  TRIAL: 'Dùng thử',
  ACTIVE: 'Đang hoạt động',
  PAST_DUE: 'Quá hạn thanh toán',
  SUSPENDED: 'Tạm ngưng',
  EXPIRED: 'Đã hết hạn',
  CANCELLED: 'Đã huỷ',
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  ISSUED: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  OVERDUE: 'Quá hạn',
  VOID: 'Đã huỷ',
};

function formatMoney(amount: string | number, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(Number(amount));
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const { data: current, isLoading: loadingCurrent } = useQuery({
    queryKey: ['owner-subscription'],
    queryFn: getCurrentSubscription,
  });
  const { data: usageOverview } = useQuery({
    queryKey: ['owner-tenant-usage'],
    queryFn: getTenantUsageOverview,
  });
  const { data: plans, isLoading: loadingPlans } = useQuery({ queryKey: ['owner-subscription-plans'], queryFn: listPublicPlans });
  const { data: invoices } = useQuery({ queryKey: ['owner-subscription-invoices'], queryFn: listSubscriptionInvoices });

  const [pendingInvoice, setPendingInvoice] = useState<SubscriptionInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectPlanMutation = useMutation({
    mutationFn: (planCode: string) => requestPlanInvoice(planCode),
    onSuccess: (invoice) => {
      setError(null);
      setPendingInvoice(invoice as unknown as SubscriptionInvoice);
      queryClient.invalidateQueries({ queryKey: ['owner-subscription-invoices'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể tạo yêu cầu đổi gói')),
  });

  const confirmTransferMutation = useMutation({
    mutationFn: (invoiceId: string) => markInvoiceTransferred(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-subscription-invoices'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể ghi nhận thanh toán')),
  });

  if (loadingCurrent || loadingPlans) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Gói sử dụng</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Theo dõi hạn mức hiện tại và chọn gói phù hợp.</p>
      </div>

      {current && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-zinc-400">GÓI HIỆN TẠI</p>
              <p className="font-display text-lg font-bold text-emerald-700 dark:text-emerald-400">{current.planName}</p>
            </div>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {STATUS_LABELS[current.status] ?? current.status}
            </span>
          </div>
          {current.daysRemaining !== null && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Còn {current.daysRemaining} ngày dùng thử</p>
          )}
          {current.daysUntilRenewal !== null && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Gia hạn sau {current.daysUntilRenewal} ngày</p>
          )}
          {/* Quota Usage Metrics */}
          <div className="mt-5 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Hạn mức tài nguyên sử dụng</h3>
                <p className="text-xs text-zinc-500">Giới hạn hiệu dụng = Gói cơ sở + Tiện ích Add-on</p>
              </div>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                10 Quotas Engine
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(usageOverview?.usages || []).map((u) => {
                const isUnlimited = u.mode === 'UNLIMITED';
                const isDisabled = u.mode === 'DISABLED';
                const isLimitReached = u.status === 'LIMIT_REACHED';
                const isCritical = u.status === 'CRITICAL_90';
                const isWarning = u.status === 'WARNING_80';

                return (
                  <div
                    key={u.code}
                    className={`p-3 rounded-xl border transition-all ${
                      isLimitReached
                        ? 'bg-rose-50/50 border-rose-300 dark:bg-rose-950/20 dark:border-rose-900/60'
                        : isCritical
                        ? 'bg-orange-50/50 border-orange-300 dark:bg-orange-950/20 dark:border-orange-900/60'
                        : isWarning
                        ? 'bg-amber-50/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-900/60'
                        : 'bg-zinc-50/60 border-zinc-200/80 dark:bg-zinc-800/40 dark:border-zinc-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                        {u.name}
                      </span>
                      <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {isUnlimited ? (
                          <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Không giới hạn</span>
                        ) : isDisabled ? (
                          <span className="text-zinc-400">Vô hiệu hóa</span>
                        ) : (
                          `${u.currentValue} / ${u.effectiveLimit} ${u.unit}`
                        )}
                      </span>
                    </div>

                    {!isUnlimited && !isDisabled && (
                      <div className="space-y-1.5">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isLimitReached
                                ? 'bg-rose-600 dark:bg-rose-500'
                                : isCritical
                                ? 'bg-orange-500'
                                : isWarning
                                ? 'bg-amber-500'
                                : 'bg-emerald-600 dark:bg-emerald-400'
                            }`}
                            style={{ width: `${u.percentage}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-zinc-500">{u.percentage}% đã dùng</span>

                          {isLimitReached ? (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                              <Warning className="w-3 h-3" />
                              100% Đạt giới hạn
                            </span>
                          ) : isCritical ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                              <WarningCircle className="w-3 h-3" />
                              90% Nguy cấp
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                              <WarningCircle className="w-3 h-3" />
                              80% Cảnh báo
                            </span>
                          ) : (
                            <span className="text-zinc-400">Bình thường</span>
                          )}
                        </div>
                      </div>
                    )}

                    {isLimitReached && (
                      <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                          Đã chặn tạo thêm. Không xóa dữ liệu.
                        </span>
                        <a
                          href="#upgrade-plans"
                          className="text-[11px] font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 flex items-center gap-0.5"
                        >
                          <span>Nâng cấp ngay</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {error && <Callout tone="danger">{error}</Callout>}

      {pendingInvoice && (
        <Card className="border-emerald-200 dark:border-emerald-900">
          <p className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">Hoàn tất thanh toán</p>
          <div className="mt-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Số tiền</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {formatMoney(pendingInvoice.total_amount, pendingInvoice.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Nội dung chuyển khoản</span>
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">{pendingInvoice.invoice_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Hạn thanh toán</span>
              <span>{formatDate(pendingInvoice.due_date)}</span>
            </div>
          </div>
          <Callout tone="info" className="mt-4">
            Chuyển khoản theo số tiền và nội dung ở trên. Đội ngũ FitFlow sẽ xác nhận trong ít phút sau khi bạn báo đã chuyển khoản.
          </Callout>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPendingInvoice(null)}>
              Đóng
            </Button>
            <Button
              size="sm"
              disabled={confirmTransferMutation.isPending}
              onClick={() => confirmTransferMutation.mutate(pendingInvoice.id)}
            >
              {confirmTransferMutation.isPending ? 'Đang gửi...' : 'Tôi đã chuyển khoản'}
            </Button>
          </div>
          {confirmTransferMutation.isSuccess && (
            <Callout tone="success" className="mt-3">
              Đã ghi nhận — đang chờ FitFlow xác nhận thanh toán.
            </Callout>
          )}
        </Card>
      )}

      <div>
        <h2 className="font-display mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">Chọn gói</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => (
            <Card key={plan.code} className={plan.isCurrent ? 'border-emerald-300 dark:border-emerald-800' : ''}>
              <div className="flex items-center justify-between">
                <p className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">{plan.name}</p>
                {plan.isCurrent && <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400" />}
              </div>
              <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatMoney(plan.price, plan.currency)}
                <span className="text-xs font-normal text-zinc-400"> /{plan.billingCycleMonths ?? 1} tháng</span>
              </p>
              {plan.description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{plan.description}</p>}
              <ul className="mt-3 flex flex-col gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                {plan.features.slice(0, 5).map((f) => (
                  <li key={f.code} className="flex items-center gap-2">
                    <CheckCircle size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    {f.name}
                    {f.quota !== null && ` (${f.quota})`}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full justify-center"
                variant={plan.isCurrent ? 'secondary' : 'primary'}
                size="sm"
                disabled={plan.isCurrent || selectPlanMutation.isPending}
                onClick={() => {
                  setError(null);
                  selectPlanMutation.mutate(plan.code);
                }}
              >
                {plan.isCurrent ? 'Gói hiện tại' : 'Chọn gói'}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {invoices && invoices.length > 0 && (
        <div>
          <h2 className="font-display mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">Lịch sử hoá đơn</h2>
          <Card padded={false} className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left text-xs text-zinc-400 dark:border-zinc-800">
                  <th className="px-4 py-3 font-medium">Hoá đơn</th>
                  <th className="px-4 py-3 font-medium">Kỳ</th>
                  <th className="px-4 py-3 font-medium">Số tiền</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-stone-50 last:border-0 dark:border-zinc-800/60">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{inv.invoice_no}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {formatDate(inv.period_start)} — {formatDate(inv.period_end)}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{formatMoney(inv.total_amount, inv.currency)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {inv.saas_payments.some((p) => p.status === 'PENDING') && inv.status === 'ISSUED'
                          ? 'Chờ xác nhận'
                          : (INVOICE_STATUS_LABELS[inv.status] ?? inv.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
