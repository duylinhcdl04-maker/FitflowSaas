import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from '@phosphor-icons/react';
import { getCustomer } from '../../api/customers';
import Card from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN');
}
function formatMoney(amount: string | number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useQuery({ queryKey: ['owner-customer', id], queryFn: () => getCustomer(id!) });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!customer) return null;

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate('/owner/customers')}
        className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft size={16} />
        Khách hàng
      </button>

      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">{customer.fullName}</h1>
        <p className="mt-1 font-mono text-xs text-zinc-400">{customer.customerCode}</p>
      </div>

      <Card>
        <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Thông tin cá nhân</h2>
        <div className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-zinc-600 sm:grid-cols-2 dark:text-zinc-300">
          <p>SĐT: {customer.phone ?? '—'}</p>
          <p>Email: {customer.email ?? '—'}</p>
          <p>Ngày sinh: {customer.dateOfBirth ? formatDate(customer.dateOfBirth) : '—'}</p>
          <p>Giới tính: {customer.gender ?? '—'}</p>
          <p>Địa chỉ: {customer.address ?? '—'}</p>
          <p>Chi nhánh: {customer.homeBranchName ?? '—'}</p>
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Membership</h2>
        {customer.memberships.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {customer.memberships.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5 text-sm dark:bg-zinc-800/60">
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{m.packageName}</p>
                  <p className="text-xs text-zinc-400">
                    {formatDate(m.startDate)} → {formatDate(m.endDate)}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  {m.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-zinc-400">Chưa có Membership nào.</p>
        )}
      </Card>

      {customer.ptPackages.length > 0 && (
        <Card>
          <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Gói PT</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {customer.ptPackages.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5 text-sm dark:bg-zinc-800/60">
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{p.planName}</p>
                  <p className="text-xs text-zinc-400">HLV: {p.ptName}</p>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Còn {p.totalSessions - p.usedSessions}/{p.totalSessions} buổi
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Lịch sử Check-in</h2>
          {customer.recentCheckins.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {customer.recentCheckins.map((c) => (
                <li key={c.id} className="flex justify-between border-b border-stone-50 pb-2 last:border-0 dark:border-zinc-800/60">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {c.branchName} · {c.method}
                  </span>
                  <span className="text-xs text-zinc-400">{formatDateTime(c.checkInAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">Chưa có lượt check-in nào.</p>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Lịch sử thanh toán</h2>
          {customer.recentPayments.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {customer.recentPayments.map((p) => (
                <li key={p.id} className="flex justify-between border-b border-stone-50 pb-2 last:border-0 dark:border-zinc-800/60">
                  <span className="text-zinc-700 dark:text-zinc-300">{formatMoney(p.totalAmount)}</span>
                  <span className="text-xs text-zinc-400">{p.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">Chưa có giao dịch nào.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
