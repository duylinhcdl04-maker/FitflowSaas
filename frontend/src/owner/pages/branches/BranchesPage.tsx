import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Buildings } from '@phosphor-icons/react';
import { createBranch, listBranches } from '../../api/branches';
import { listUnassignedBranchManagers } from '../../api/branch-managers';
import { apiErrorMessage } from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Callout from '../../components/Callout';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import { Skeleton } from '../../components/Skeleton';
import OperatingHoursPicker from '../../components/OperatingHoursPicker';

// OW-11. Owner quản lý toàn bộ Chi nhánh thuộc Tenant, có kiểm tra MAX_BRANCHES
// (server tự chặn — xem owner-branches.service.ts#assertQuotaNotExceeded).
export default function BranchesPage() {
  const queryClient = useQueryClient();
  const { data: branches, isLoading } = useQuery({ queryKey: ['owner-branches'], queryFn: listBranches });
  const { data: unassignedManagers } = useQuery({
    queryKey: ['owner-branch-managers-unassigned'],
    queryFn: listUnassignedBranchManagers,
  });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    openingDays: 'Thứ 2 - Chủ nhật',
    openingTime: '05:00',
    closingTime: '22:00',
  });
  const [managerIds, setManagerIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createBranch({
        name: form.name,
        address: form.address || undefined,
        phone: form.phone || undefined,
        openingDays: form.openingDays,
        openingTime: form.openingTime,
        closingTime: form.closingTime,
        managerIds: managerIds.length > 0 ? managerIds : undefined,
      }),
    onSuccess: () => {
      setShowCreate(false);
      setForm({
        name: '',
        address: '',
        phone: '',
        openingDays: 'Thứ 2 - Chủ nhật',
        openingTime: '05:00',
        closingTime: '22:00',
      });
      setManagerIds([]);
      queryClient.invalidateQueries({ queryKey: ['owner-branches'] });
      queryClient.invalidateQueries({ queryKey: ['owner-branch-managers-unassigned'] });
      queryClient.invalidateQueries({ queryKey: ['owner-branch-managers'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể tạo chi nhánh')),
  });

  function toggleManager(id: string) {
    setManagerIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Chi nhánh</h1>
        <div className="flex gap-2">
          <Button to="/owner/branch-managers" variant="secondary" size="sm">
            Quản lý chi nhánh
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            + Thêm chi nhánh
          </Button>
        </div>
      </div>

      {branches && branches.length === 0 ? (
        <Card>
          <EmptyState icon={Buildings} title="Chưa có chi nhánh nào" description="Tạo chi nhánh đầu tiên để bắt đầu vận hành." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches?.map((b) => (
            <Link key={b.id} to={`/owner/branches/${b.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <p className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">{b.name}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      b.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-stone-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {b.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng'}
                  </span>
                </div>
                {b.address && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{b.address}</p>}
                <div className="mt-4 flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
                  <span>{b.memberCount} hội viên</span>
                  <span>{b.staffCount} nhân sự</span>
                  <span>{b.checkinToday} check-in hôm nay</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Thêm chi nhánh">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Tên chi nhánh" htmlFor="new-branch-name">
            <input
              id="new-branch-name"
              required
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormField>
          <FormField label="Địa chỉ" htmlFor="new-branch-address">
            <input
              id="new-branch-address"
              className={inputClass}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </FormField>
          <FormField label="Số điện thoại" htmlFor="new-branch-phone">
            <input
              id="new-branch-phone"
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </FormField>

          <OperatingHoursPicker
            openingTime={form.openingTime}
            closingTime={form.closingTime}
            onChange={(open, close) => setForm((f) => ({ ...f, openingTime: open, closingTime: close }))}
          />

          {unassignedManagers && unassignedManagers.length > 0 && (
            <FormField label="Gán Quản lý chi nhánh" htmlFor="new-branch-managers" hint="Chỉ hiện các quản lý chưa được giao chi nhánh">
              <div className="flex flex-col gap-1.5 rounded-2xl border border-stone-200 p-3 dark:border-zinc-800">
                {unassignedManagers.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={managerIds.includes(m.id)}
                      onChange={() => toggleManager(m.id)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    {m.fullName}
                    <span className="text-xs text-zinc-400">{m.email}</span>
                  </label>
                ))}
              </div>
            </FormField>
          )}

          {error && <Callout tone="danger">{error}</Callout>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang tạo...' : 'Tạo chi nhánh'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
