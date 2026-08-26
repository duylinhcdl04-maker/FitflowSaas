import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users } from '@phosphor-icons/react';
import { listCustomers } from '../../api/customers';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { inputClass } from '../../components/FormField';
import { Skeleton } from '../../components/Skeleton';

const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Đang hoạt động', INACTIVE: 'Ngừng' };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

// OW-12. Read-only — không có nút "+ Thêm khách hàng" (nghiệp vụ tạo Customer
// thuộc về lễ tân/Staff, ngoài phạm vi Owner Portal). Owner theo dõi và có thể
// lọc theo chi nhánh khi đến từ Branch Detail.
export default function CustomersPage() {
  const [searchParams] = useSearchParams();
  const branchId = searchParams.get('branchId') ?? undefined;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['owner-customers', search, branchId, page],
    queryFn: () => listCustomers({ search: search || undefined, branchId, page }),
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Khách hàng</h1>

      <input
        placeholder="Tìm theo tên, số điện thoại..."
        className={`${inputClass} max-w-sm`}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data && data.items.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="Chưa có khách hàng nào" description="Khách hàng do lễ tân tạo khi đăng ký tại chi nhánh." />
        </Card>
      ) : (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs text-zinc-400 dark:border-zinc-800">
                <th className="px-4 py-3 font-medium">Tên</th>
                <th className="px-4 py-3 font-medium">SĐT</th>
                <th className="px-4 py-3 font-medium">Chi nhánh</th>
                <th className="px-4 py-3 font-medium">Gói tập</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((c) => (
                <tr key={c.id} className="border-b border-stone-50 last:border-0 dark:border-zinc-800/60">
                  <td className="px-4 py-3">
                    <Link to={`/owner/customers/${c.id}`} className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                      {c.fullName}
                    </Link>
                    <p className="font-mono text-xs text-zinc-400">{c.customerCode}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{c.homeBranchName ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {c.currentMembership ? (
                      <>
                        {c.currentMembership.packageName}
                        <span className="ml-1 text-xs text-zinc-400">đến {formatDate(c.currentMembership.endDate)}</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            Trang {data.page}/{data.totalPages} · {data.total} khách hàng
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Trước
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
