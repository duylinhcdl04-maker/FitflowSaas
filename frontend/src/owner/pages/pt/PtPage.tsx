import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Barbell } from '@phosphor-icons/react';
import {
  approvePtPackagePlan,
  listPtBookings,
  listPtPackagePlans,
  listPts,
  rejectPtPackagePlan,
} from '../../api/pt';
import { apiErrorMessage } from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Callout from '../../components/Callout';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import { Skeleton } from '../../components/Skeleton';

const TABS = [
  { key: 'pts', label: 'Huấn luyện viên' },
  { key: 'packages', label: 'Gói PT' },
  { key: 'bookings', label: 'Lịch tập' },
] as const;

const PACKAGE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  ACTIVE: 'Đang bán',
  INACTIVE: 'Ngừng bán',
  REJECTED: 'Đã từ chối',
};

function formatMoney(amount: string | number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

// XIV. "Owner nhìn tổng thể, không nhất thiết trực tiếp thao tác lịch cho
// từng buổi" — mọi thứ đọc, TRỪ duyệt/từ chối Gói PT (BR-PT-APPROVE-01).
export default function PtPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('pts');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">PT & Lịch tập</h1>

      <div className="flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-emerald-700 text-white dark:bg-emerald-400 dark:text-zinc-950'
                : 'bg-white text-zinc-600 hover:bg-stone-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pts' && <PtsTab />}
      {tab === 'packages' && <PackagesTab />}
      {tab === 'bookings' && <BookingsTab />}
    </div>
  );
}

function PtsTab() {
  const { data: pts, isLoading } = useQuery({ queryKey: ['owner-pts'], queryFn: listPts });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (pts && pts.length === 0) {
    return (
      <Card>
        <EmptyState icon={Barbell} title="Chưa có huấn luyện viên nào" description="Mời PT ở trang Nhân sự." />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pts?.map((pt) => (
        <Card key={pt.userId}>
          <p className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">{pt.fullName}</p>
          {pt.specialties.length > 0 && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{pt.specialties.join(', ')}</p>}
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <p className="text-xs text-zinc-400">HỘI VIÊN</p>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">{pt.activeCustomers}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">BUỔI HÔM NAY</p>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">{pt.todaySessions}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function PackagesTab() {
  const queryClient = useQueryClient();
  const { data: packages, isLoading } = useQuery({ queryKey: ['owner-pt-packages'], queryFn: () => listPtPackagePlans() });
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: (id: string) => approvePtPackagePlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-pt-packages'] }),
    onError: (err) => setError(apiErrorMessage(err, 'Không thể duyệt gói PT')),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectPtPackagePlan(rejecting!, reason),
    onSuccess: () => {
      setRejecting(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['owner-pt-packages'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể từ chối gói PT')),
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="flex flex-col gap-4">
      {error && <Callout tone="danger">{error}</Callout>}
      {packages && packages.length === 0 ? (
        <Card>
          <EmptyState icon={Barbell} title="Chưa có gói PT nào" description="PT tạo gói tập, Owner duyệt giá trước khi bán." />
        </Card>
      ) : (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs text-zinc-400 dark:border-zinc-800">
                <th className="px-4 py-3 font-medium">Gói</th>
                <th className="px-4 py-3 font-medium">PT</th>
                <th className="px-4 py-3 font-medium">Số buổi</th>
                <th className="px-4 py-3 font-medium">Giá</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {packages?.map((p) => (
                <tr key={p.id} className="border-b border-stone-50 last:border-0 dark:border-zinc-800/60">
                  <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">{p.name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{p.ptName}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{p.sessionCount}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{formatMoney(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {PACKAGE_STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'PENDING_APPROVAL' && (
                      <div className="flex gap-2">
                        <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate(p.id)}>
                          Duyệt
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setRejecting(p.id)}>
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={rejecting !== null} onClose={() => setRejecting(null)} title="Từ chối gói PT">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            rejectMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <FormField label="Lý do từ chối" htmlFor="reject-reason">
            <textarea
              id="reject-reason"
              required
              rows={3}
              className={inputClass}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setRejecting(null)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? 'Đang gửi...' : 'Từ chối'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function BookingsTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['owner-pt-bookings', page], queryFn: () => listPtBookings({ page }) });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-4">
      <Card padded={false} className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-left text-xs text-zinc-400 dark:border-zinc-800">
              <th className="px-4 py-3 font-medium">Thời gian</th>
              <th className="px-4 py-3 font-medium">Khách hàng</th>
              <th className="px-4 py-3 font-medium">PT</th>
              <th className="px-4 py-3 font-medium">Chi nhánh</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((b) => (
              <tr key={b.id} className="border-b border-stone-50 last:border-0 dark:border-zinc-800/60">
                <td className="px-4 py-3 text-xs text-zinc-500">{formatTime(b.scheduledStart)}</td>
                <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">{b.customerName}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{b.ptName}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{b.branchName}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            Trang {data.page}/{data.totalPages} · {data.total} lịch hẹn
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
