import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCircle } from '@phosphor-icons/react';
import {
  assignBranchManagerToBranch,
  createBranchManager,
  listBranchManagers,
  resetBranchManagerPassword,
  unassignBranchManager,
  updateBranchManager,
  type BranchManager,
} from '../../api/branch-managers';
import { listBranches } from '../../api/branches';
import { apiErrorMessage } from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Callout from '../../components/Callout';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import { Skeleton } from '../../components/Skeleton';

const STATUS_LABELS: Record<string, string> = { PENDING: 'Chờ kích hoạt', ACTIVE: 'Đang hoạt động', INACTIVE: 'Ngừng', LOCKED: 'Bị khoá' };

// OW-11b. Quản lý chi nhánh — tách riêng khỏi trang Nhân sự (mời qua link):
// Owner tạo tài khoản trực tiếp, hệ thống tự sinh mật khẩu và gửi qua email,
// kích hoạt ngay không cần xác thực. Mỗi Quản lý chỉ phụ trách 1 chi nhánh.
export default function BranchManagersPage() {
  const queryClient = useQueryClient();
  const { data: managers, isLoading } = useQuery({ queryKey: ['owner-branch-managers'], queryFn: listBranchManagers });
  const { data: branches } = useQuery({ queryKey: ['owner-branches'], queryFn: listBranches });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [branchToAssign, setBranchToAssign] = useState('');

  const createMutation = useMutation({
    mutationFn: () => createBranchManager({ fullName: form.fullName, email: form.email, phone: form.phone || undefined }),
    onSuccess: (created) => {
      setShowCreate(false);
      setForm({ fullName: '', email: '', phone: '' });
      setNotice(`Đã tạo tài khoản cho ${created.fullName} — mật khẩu đã được gửi tới ${created.email}.`);
      queryClient.invalidateQueries({ queryKey: ['owner-branch-managers'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể tạo tài khoản')),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (m: BranchManager) => updateBranchManager(m.id, { status: m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-branch-managers'] }),
    onError: (err) => setError(apiErrorMessage(err, 'Không thể cập nhật trạng thái')),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => resetBranchManagerPassword(id),
    onSuccess: (data) => setNotice(`Đã gửi mật khẩu mới tới ${data.email}.`),
    onError: (err) => setError(apiErrorMessage(err, 'Không thể đặt lại mật khẩu')),
  });

  const assignMutation = useMutation({
    mutationFn: () => assignBranchManagerToBranch(assigningId!, branchToAssign),
    onSuccess: () => {
      setAssigningId(null);
      setBranchToAssign('');
      queryClient.invalidateQueries({ queryKey: ['owner-branch-managers'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể gán chi nhánh')),
  });

  const unassignMutation = useMutation({
    mutationFn: (id: string) => unassignBranchManager(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-branch-managers'] }),
    onError: (err) => setError(apiErrorMessage(err, 'Không thể bỏ gán chi nhánh')),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Quản lý chi nhánh</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Tài khoản Quản lý chi nhánh — tạo trực tiếp, kích hoạt ngay.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          + Tạo tài khoản
        </Button>
      </div>

      {notice && <Callout tone="success">{notice}</Callout>}
      {error && <Callout tone="danger">{error}</Callout>}

      {managers && managers.length === 0 ? (
        <Card>
          <EmptyState icon={UserCircle} title="Chưa có tài khoản Quản lý chi nhánh nào" description="Tạo tài khoản để bắt đầu phân quyền vận hành chi nhánh." />
        </Card>
      ) : (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs text-zinc-400 dark:border-zinc-800">
                <th className="px-4 py-3 font-medium">Họ tên</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Chi nhánh</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {managers?.map((m) => (
                <tr key={m.id} className="border-b border-stone-50 last:border-0 dark:border-zinc-800/60">
                  <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">{m.fullName}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{m.email}</td>
                  <td className="px-4 py-3">
                    {m.branch ? (
                      <span className="text-zinc-600 dark:text-zinc-300">{m.branch.name}</span>
                    ) : (
                      <span className="text-xs text-amber-600 dark:text-amber-400">Chưa được giao</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {STATUS_LABELS[m.status] ?? m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {m.branch ? (
                        <Button variant="secondary" size="sm" disabled={unassignMutation.isPending} onClick={() => unassignMutation.mutate(m.id)}>
                          Bỏ gán
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => setAssigningId(m.id)}>
                          Gán chi nhánh
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={resetPasswordMutation.isPending}
                        onClick={() => resetPasswordMutation.mutate(m.id)}
                      >
                        Đặt lại mật khẩu
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={toggleStatusMutation.isPending}
                        onClick={() => toggleStatusMutation.mutate(m)}
                      >
                        {m.status === 'ACTIVE' ? 'Vô hiệu hoá' : 'Kích hoạt lại'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Tạo tài khoản Quản lý chi nhánh">
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setError(null);
            createMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <FormField label="Họ và tên" htmlFor="mgr-name">
            <input
              id="mgr-name"
              required
              className={inputClass}
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </FormField>
          <FormField label="Email (Gmail)" htmlFor="mgr-email" hint="Hệ thống tự sinh mật khẩu và gửi tới email này">
            <input
              id="mgr-email"
              type="email"
              required
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </FormField>
          <FormField label="Số điện thoại" htmlFor="mgr-phone">
            <input
              id="mgr-phone"
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </FormField>
          {error && <Callout tone="danger">{error}</Callout>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={assigningId !== null} onClose={() => setAssigningId(null)} title="Gán chi nhánh">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            assignMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <FormField label="Chi nhánh" htmlFor="assign-branch">
            <select
              id="assign-branch"
              required
              className={inputClass}
              value={branchToAssign}
              onChange={(e) => setBranchToAssign(e.target.value)}
            >
              <option value="">— Chọn chi nhánh —</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAssigningId(null)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={assignMutation.isPending || !branchToAssign}>
              {assignMutation.isPending ? 'Đang gán...' : 'Gán'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
