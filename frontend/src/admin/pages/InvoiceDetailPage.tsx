import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getInvoice,
  recordInvoicePayment,
  voidInvoice,
  PAYMENT_METHODS,
  type PaymentMethod,
} from '../api/invoices';
import { apiErrorMessage } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { Skeleton } from '../components/Skeleton';
import FormField, { inputClass } from '../components/FormField';
import Button from '../components/Button';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Chuyển khoản',
  CASH: 'Tiền mặt',
  CARD: 'Thẻ',
  OTHER: 'Khác',
};

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(Number(amount));
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN');
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id!),
    enabled: !!id,
  });

  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'BANK_TRANSFER' as PaymentMethod, providerRef: '', note: '' });
  const [payError, setPayError] = useState<string | null>(null);

  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState<string | null>(null);

  const payMutation = useMutation({
    mutationFn: () =>
      recordInvoicePayment(id!, {
        amount: Number(payForm.amount),
        method: payForm.method,
        providerRef: payForm.providerRef || undefined,
        note: payForm.note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices-all'] });
      setPayOpen(false);
      setPayForm({ amount: '', method: 'BANK_TRANSFER', providerRef: '', note: '' });
    },
    onError: (err) => setPayError(apiErrorMessage(err, 'Không thể ghi nhận thanh toán')),
  });

  const voidMutation = useMutation({
    mutationFn: () => voidInvoice(id!, voidReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices-all'] });
      setVoidOpen(false);
      setVoidReason('');
    },
    onError: (err) => setVoidError(apiErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <Skeleton className="h-40 w-full" />
        </Card>
      </div>
    );
  }
  if (!invoice) return <p className="text-sm text-red-600">Không tìm thấy hoá đơn.</p>;

  const canRecordPayment = invoice.status !== 'PAID' && invoice.status !== 'VOID';
  const canVoid = invoice.status !== 'PAID' && invoice.status !== 'VOID';
  const totalPaid = invoice.saas_payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, Number(invoice.total_amount) - totalPaid);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/admin/invoices" className="text-xs text-zinc-400 hover:text-zinc-600">
            ← Hoá đơn SaaS
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {invoice.invoice_no}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            <Link to={`/admin/tenants/${invoice.tenants.id}`} className="hover:text-emerald-700 dark:hover:text-emerald-400">
              {invoice.tenants.name}
            </Link>{' '}
            · {invoice.subscriptions.saas_plans.name} · Kỳ {formatDate(invoice.period_start)} -{' '}
            {formatDate(invoice.period_end)}
          </p>
        </div>
        <div className="flex gap-2">
          {canRecordPayment && (
            <Button
              onClick={() => {
                setPayOpen(true);
                setPayForm((f) => ({ ...f, amount: remaining ? String(remaining) : f.amount }));
                setPayError(null);
              }}
            >
              Ghi nhận thanh toán
            </Button>
          )}
          {canVoid && (
            <Button
              variant="danger"
              onClick={() => {
                setVoidOpen(true);
                setVoidError(null);
              }}
            >
              Huỷ hoá đơn
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Tổng quan</h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            <li className="flex justify-between">
              <span className="text-zinc-500">Tạm tính</span>
              <span className="font-mono">{formatMoney(invoice.subtotal, invoice.currency)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-zinc-500">Thuế</span>
              <span className="font-mono">{formatMoney(invoice.tax_amount, invoice.currency)}</span>
            </li>
            <li className="flex justify-between border-t border-zinc-100 pt-2 font-semibold dark:border-zinc-800">
              <span>Tổng cộng</span>
              <span className="font-mono">{formatMoney(invoice.total_amount, invoice.currency)}</span>
            </li>
            <li className="flex justify-between text-emerald-700 dark:text-emerald-400">
              <span>Đã thanh toán</span>
              <span className="font-mono">{formatMoney(String(totalPaid), invoice.currency)}</span>
            </li>
            {remaining > 0 && (
              <li className="flex justify-between text-amber-700 dark:text-amber-400">
                <span>Còn lại</span>
                <span className="font-mono">{formatMoney(String(remaining), invoice.currency)}</span>
              </li>
            )}
            <li className="flex justify-between">
              <span className="text-zinc-500">Hạn thanh toán</span>
              <span className="font-mono">{formatDate(invoice.due_date)}</span>
            </li>
          </ul>
        </Card>

        <Card className="lg:col-span-2" padded={false}>
          <div className="p-5 pb-0">
            <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Lịch sử thanh toán
            </h2>
          </div>
          {invoice.saas_payments.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">Chưa có thanh toán nào được ghi nhận.</p>
          ) : (
            <table className="mt-4 w-full text-left text-sm">
              <thead className="border-t border-zinc-100 text-xs text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-2 font-medium">Ngày</th>
                  <th className="px-3 py-2 font-medium">Phương thức</th>
                  <th className="px-3 py-2 font-medium">Mã tham chiếu</th>
                  <th className="px-3 py-2 font-medium">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {invoice.saas_payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-2.5 text-zinc-500">{formatDateTime(p.paid_at ?? p.created_at)}</td>
                    <td className="px-3 py-2.5">{METHOD_LABELS[p.method as PaymentMethod] ?? p.method}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-zinc-500">{p.provider_ref ?? '—'}</td>
                    <td className="px-3 py-2.5 font-mono font-medium text-zinc-900 dark:text-zinc-50">
                      {formatMoney(p.amount, p.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {payOpen && (
        <Modal title="Ghi nhận thanh toán thủ công" onClose={() => setPayOpen(false)}>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              setPayError(null);
              payMutation.mutate();
            }}
            className="flex flex-col gap-4"
          >
            <FormField label="Số tiền" htmlFor="payAmount">
              <input
                id="payAmount"
                type="number"
                min={1}
                required
                className={inputClass}
                value={payForm.amount}
                onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </FormField>
            <FormField label="Phương thức" htmlFor="payMethod">
              <select
                id="payMethod"
                className={inputClass}
                value={payForm.method}
                onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value as PaymentMethod }))}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Mã giao dịch / tham chiếu" htmlFor="payRef">
              <input
                id="payRef"
                className={inputClass}
                value={payForm.providerRef}
                onChange={(e) => setPayForm((f) => ({ ...f, providerRef: e.target.value }))}
              />
            </FormField>
            <FormField label="Ghi chú" htmlFor="payNote">
              <textarea
                id="payNote"
                rows={2}
                className={inputClass}
                value={payForm.note}
                onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))}
              />
            </FormField>
            {payError && <p className="text-sm text-red-600">{payError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setPayOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={payMutation.isPending}>
                {payMutation.isPending ? 'Đang lưu...' : 'Ghi nhận'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {voidOpen && (
        <Modal title="Huỷ hoá đơn" onClose={() => setVoidOpen(false)}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-500">
              Hoá đơn sẽ chuyển sang trạng thái Huỷ và không thể ghi nhận thêm thanh toán.
            </p>
            <FormField label="Lý do (bắt buộc)" htmlFor="voidReason">
              <textarea
                id="voidReason"
                required
                rows={3}
                className={inputClass}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            </FormField>
            {voidError && <p className="text-sm text-red-600">{voidError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setVoidOpen(false)}>
                Đóng
              </Button>
              <Button
                variant="danger"
                disabled={voidMutation.isPending || voidReason.length < 5}
                onClick={() => voidMutation.mutate()}
              >
                Xác nhận huỷ
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
