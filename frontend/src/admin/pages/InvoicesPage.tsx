import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Money } from '@phosphor-icons/react';
import { listInvoices, type InvoiceStatus } from '../api/invoices';
import StatusBadge from '../components/StatusBadge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import Button from '../components/Button';

const STATUS_OPTIONS: (InvoiceStatus | 'ALL')[] = ['ALL', 'ISSUED', 'PAID', 'OVERDUE', 'VOID'];
const COLUMN_COUNT = 5;

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(Number(amount));
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

// SA-09. SA-11 "Đối soát" không nằm trong phạm vi đợt này: bảng
// payment_transactions hiện có chỉ ghi nhận thanh toán khách hàng của Tenant
// (BR-SA-004), không có luồng đối soát ngân hàng cấp SaaS nào đang chạy để
// đối soát tự động — ghi nhận thanh toán vẫn thực hiện thủ công qua SA-10.
export default function InvoicesPage() {
  const [status, setStatus] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices-all', status, page],
    queryFn: () => listInvoices({ status: status === 'ALL' ? undefined : status, page }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Hoá đơn SaaS</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Hoá đơn thuê bao nền tảng (Tenant trả FitFlow) — tách biệt hoàn toàn với thanh toán khách hàng
          của từng Tenant (BR-SA-004).
        </p>
      </div>

      <div className="flex gap-1">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setStatus(option);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              status === option
                ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            }`}
          >
            {option === 'ALL' ? 'Tất cả' : option}
          </button>
        ))}
      </div>

      <Card padded={false} className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3.5 font-medium">Số hoá đơn</th>
              <th className="px-4 py-3.5 font-medium">Doanh nghiệp</th>
              <th className="px-4 py-3.5 font-medium">Hạn thanh toán</th>
              <th className="px-4 py-3.5 font-medium">Số tiền</th>
              <th className="px-4 py-3.5 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={COLUMN_COUNT} />)}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <EmptyState
                    icon={Money}
                    title="Chưa có hoá đơn nào"
                    description="Hoá đơn phát sinh theo chu kỳ thuê bao sẽ xuất hiện ở đây."
                  />
                </td>
              </tr>
            )}
            {data?.items.map((inv) => (
              <tr key={inv.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                <td className="px-4 py-3.5">
                  <Link
                    to={`/admin/invoices/${inv.id}`}
                    className="font-mono font-medium text-zinc-900 hover:text-emerald-700 dark:text-zinc-50 dark:hover:text-emerald-400"
                  >
                    {inv.invoice_no}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <Link
                    to={`/admin/tenants/${inv.tenants.id}`}
                    className="text-zinc-700 hover:text-emerald-700 dark:text-zinc-300 dark:hover:text-emerald-400"
                  >
                    {inv.tenants.name}
                  </Link>
                </td>
                <td className="px-4 py-3.5 font-mono text-zinc-600 dark:text-zinc-400">
                  {formatDate(inv.due_date)}
                </td>
                <td className="px-4 py-3.5 font-mono text-zinc-900 dark:text-zinc-100">
                  {formatMoney(inv.total_amount, inv.currency)}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>
            Trang {data.page}/{data.totalPages} • {data.total} hoá đơn
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Trước
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
