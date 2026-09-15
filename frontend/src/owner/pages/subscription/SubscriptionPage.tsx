import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  Warning,
  WarningCircle,
  ArrowUpRight,
  QrCode,
  Copy,
  Check,
  Lightning,
} from '@phosphor-icons/react';
import {
  getCurrentSubscription,
  getTenantUsageOverview,
  listPublicPlans,
  listSubscriptionInvoices,
  markInvoiceTransferred,
  requestPlanInvoice,
  getPendingInvoice,
  simulatePaymentSuccess,
  type SubscriptionInvoice,
} from '../../api/subscription';
import { apiErrorMessage } from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Callout from '../../components/Callout';
import { Skeleton } from '../../components/Skeleton';

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
  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['owner-subscription-plans'],
    queryFn: listPublicPlans,
  });
  const { data: invoices } = useQuery({
    queryKey: ['owner-subscription-invoices'],
    queryFn: listSubscriptionInvoices,
  });
  const { data: serverPendingInvoice } = useQuery({
    queryKey: ['owner-subscription-pending-invoice'],
    queryFn: getPendingInvoice,
  });

  const [pendingInvoice, setPendingInvoice] = useState<SubscriptionInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeInvoice = pendingInvoice || serverPendingInvoice;

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    });
  }

  const selectPlanMutation = useMutation({
    mutationFn: (planCode: string) => requestPlanInvoice(planCode),
    onSuccess: (invoice) => {
      setError(null);
      setSuccessMsg(null);
      setPendingInvoice(invoice as unknown as SubscriptionInvoice);
      queryClient.invalidateQueries({ queryKey: ['owner-subscription-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['owner-subscription-pending-invoice'] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể tạo yêu cầu đổi gói')),
  });

  const confirmTransferMutation = useMutation({
    mutationFn: (invoiceId: string) => markInvoiceTransferred(invoiceId),
    onSuccess: () => {
      setError(null);
      setSuccessMsg('Đã ghi nhận thông tin chuyển khoản — Hệ thống đang xác nhận thanh toán.');
      queryClient.invalidateQueries({ queryKey: ['owner-subscription-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['owner-subscription-pending-invoice'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể ghi nhận thanh toán')),
  });

  const simulatePaymentMutation = useMutation({
    mutationFn: (invoiceId: string) => simulatePaymentSuccess(invoiceId),
    onSuccess: () => {
      setError(null);
      setSuccessMsg('Thanh toán thành công! Gói dịch vụ đã được kích hoạt thành công.');
      setPendingInvoice(null);
      queryClient.invalidateQueries({ queryKey: ['owner-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['owner-tenant-usage'] });
      queryClient.invalidateQueries({ queryKey: ['owner-subscription-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['owner-subscription-pending-invoice'] });
      queryClient.invalidateQueries({ queryKey: ['owner-dashboard-shell'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể kích hoạt thanh toán')),
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
          {current.daysRemaining !== null && current.status === 'TRIAL' && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {current.daysRemaining > 0
                ? `Còn ${current.daysRemaining} ngày dùng thử`
                : 'Thời gian dùng thử đã hết hạn. Vui lòng nâng cấp gói để tiếp tục sử dụng đầy đủ tính năng.'}
            </p>
          )}
          {current.daysUntilRenewal !== null && current.status === 'ACTIVE' && (
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
      {successMsg && <Callout tone="success">{successMsg}</Callout>}

      {/* Thẻ thanh toán VietQR dành cho hoá đơn đang chờ */}
      {activeInvoice && activeInvoice.status === 'ISSUED' && (
        <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/[0.03] via-transparent to-transparent shadow-lg dark:border-emerald-500/30">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <QrCode size={24} weight="bold" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Thanh toán hoá đơn dịch vụ FitFlow
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Quét mã VietQR bằng ứng dụng Ngân hàng để chuyển khoản kích hoạt gói
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeInvoice.saas_payments?.some((p) => p.status === 'PENDING') ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  Đã báo chuyển khoản — Chờ xác nhận
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  Chờ thanh toán
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Cột trái: Mã VietQR */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200/80 bg-white p-5 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-5">
              <div className="relative rounded-xl border border-stone-200 bg-white p-2 shadow-inner dark:border-zinc-700">
                <img
                  src={
                    activeInvoice.paymentInfo?.qrUrl ||
                    `https://img.vietqr.io/image/TCB-9961708655-compact2.png?amount=${activeInvoice.total_amount}&addInfo=${encodeURIComponent(activeInvoice.invoice_no)}&accountName=FITFLOW%20SAAS`
                  }
                  alt="VietQR Chuyển khoản"
                  className="h-56 w-56 object-contain"
                />
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <QrCode size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>Hỗ trợ tất cả ứng dụng Ngân hàng & Ví Napas 24/7</span>
              </div>
            </div>

            {/* Cột phải: Chi tiết chuyển khoản & Nút sao chép */}
            <div className="flex flex-col justify-between lg:col-span-7">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3 text-sm dark:bg-zinc-800/60">
                  <div>
                    <p className="text-xs text-zinc-400">Ngân hàng thụ hưởng</p>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {activeInvoice.paymentInfo?.bankName || 'Techcombank'} ({activeInvoice.paymentInfo?.bankCode || 'TCB'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3 text-sm dark:bg-zinc-800/60">
                  <div>
                    <p className="text-xs text-zinc-400">Số tài khoản</p>
                    <p className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-50">
                      {activeInvoice.paymentInfo?.accountNumber || '9961708655'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeInvoice.paymentInfo?.accountNumber || '9961708655', 'acc')}
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    {copiedKey === 'acc' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copiedKey === 'acc' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3 text-sm dark:bg-zinc-800/60">
                  <div>
                    <p className="text-xs text-zinc-400">Chủ tài khoản</p>
                    <p className="font-medium uppercase text-zinc-900 dark:text-zinc-100">
                      {activeInvoice.paymentInfo?.accountName || 'FITFLOW SAAS - NGUYEN DUY LINH'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-emerald-50/50 p-3 text-sm dark:bg-emerald-950/20">
                  <div>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Số tiền cần thanh toán</p>
                    <p className="font-display text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      {formatMoney(activeInvoice.total_amount, activeInvoice.currency)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(Math.round(Number(activeInvoice.total_amount))), 'amount')}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-800 dark:text-emerald-300 dark:hover:bg-zinc-700"
                  >
                    {copiedKey === 'amount' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copiedKey === 'amount' ? 'Đã chép' : 'Sao chép số tiền'}
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm dark:border-amber-900/60 dark:bg-amber-950/20">
                  <div>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                      Nội dung chuyển khoản (bắt buộc chính xác)
                    </p>
                    <p className="font-mono text-base font-bold text-amber-900 dark:text-amber-200">
                      {activeInvoice.invoice_no}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeInvoice.invoice_no, 'des')}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-900 shadow-sm transition hover:bg-amber-50 dark:border-amber-800 dark:bg-zinc-800 dark:text-amber-200 dark:hover:bg-zinc-700"
                  >
                    {copiedKey === 'des' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copiedKey === 'des' ? 'Đã chép' : 'Sao chép nội dung'}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 border-t border-stone-100 pt-4 dark:border-zinc-800">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPendingInvoice(null)}
                >
                  Đóng
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={confirmTransferMutation.isPending}
                    onClick={() => confirmTransferMutation.mutate(activeInvoice.id)}
                  >
                    {confirmTransferMutation.isPending ? 'Đang gửi...' : 'Tôi đã chuyển khoản'}
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={simulatePaymentMutation.isPending}
                    onClick={() => simulatePaymentMutation.mutate(activeInvoice.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <Lightning size={16} weight="fill" />
                    <span>{simulatePaymentMutation.isPending ? 'Đang kích hoạt...' : 'Xác nhận thanh toán ngay'}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div id="upgrade-plans">
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
                  <th className="px-4 py-3 font-medium text-right">Hành động</th>
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
                        {inv.saas_payments?.some((p) => p.status === 'PENDING') && inv.status === 'ISSUED'
                          ? 'Chờ xác nhận'
                          : (INVOICE_STATUS_LABELS[inv.status] ?? inv.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.status === 'ISSUED' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setPendingInvoice(inv);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Thanh toán / Mã QR
                        </Button>
                      )}
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
