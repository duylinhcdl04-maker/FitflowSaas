import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IdentificationBadge, Plus } from '@phosphor-icons/react';
import {
  listStaff,
  createStaff,
  changeStaffStatus,
  resetStaffPassword,
  type StaffMember,
  type StaffStatus,
} from '../api/staff';
import { apiErrorMessage } from '../api/client';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Callout from '../components/Callout';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import FormField, { inputClass } from '../components/FormField';

const COLUMN_COUNT = 5;

function formatDateTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleString('vi-VN') : '—';
}

export default function StaffPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => listStaff({}),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', phone: '' });
  const [createResult, setCreateResult] = useState<{ email: string; temporaryPassword: string } | null>(
    null,
  );
  const [createError, setCreateError] = useState<string | null>(null);

  const [statusTarget, setStatusTarget] = useState<{ user: StaffMember; next: StaffStatus } | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [resetReason, setResetReason] = useState('');
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => createStaff(createForm),
    onSuccess: (data) => {
      setCreateResult({ email: data.user.email ?? createForm.email, temporaryPassword: data.temporaryPassword });
      setCreateForm({ fullName: '', email: '', phone: '' });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err) => setCreateError(apiErrorMessage(err, 'Không thể tạo tài khoản')),
  });

  const statusMutation = useMutation({
    mutationFn: () => changeStaffStatus(statusTarget!.user.id, statusTarget!.next, statusReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setStatusTarget(null);
      setStatusReason('');
    },
    onError: (err) => setStatusError(apiErrorMessage(err)),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetStaffPassword(resetTarget!.id, resetReason),
    onSuccess: (data) => setResetResult(data.temporaryPassword),
    onError: (err) => setResetError(apiErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Tài khoản nhân sự nền tảng
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Tài khoản nội bộ FitFlow (SUPER_ADMIN) — không liên quan tới nhân sự của bất kỳ Tenant nào.
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateOpen(true);
            setCreateResult(null);
            setCreateError(null);
          }}
        >
          <Plus size={18} weight="bold" />
          Tạo tài khoản
        </Button>
      </div>

      <Card padded={false} className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3.5 font-medium">Họ tên</th>
              <th className="px-4 py-3.5 font-medium">Email</th>
              <th className="px-4 py-3.5 font-medium">Trạng thái</th>
              <th className="px-4 py-3.5 font-medium">Đăng nhập gần nhất</th>
              <th className="px-4 py-3.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} columns={COLUMN_COUNT} />)}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <EmptyState
                    icon={IdentificationBadge}
                    title="Chưa có tài khoản nhân sự nào"
                    description="Tạo tài khoản đầu tiên để cấp quyền quản trị nền tảng."
                  />
                </td>
              </tr>
            )}
            {data?.items.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                <td className="px-4 py-3.5 font-medium text-zinc-900 dark:text-zinc-50">{u.fullName}</td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">{u.email}</td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={u.status} />
                </td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                  {formatDateTime(u.lastLoginAt)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setResetTarget(u);
                        setResetReason('');
                        setResetResult(null);
                        setResetError(null);
                      }}
                    >
                      Đặt lại mật khẩu
                    </Button>
                    <Button
                      variant={u.status === 'ACTIVE' ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={() => {
                        setStatusTarget({ user: u, next: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
                        setStatusReason('');
                        setStatusError(null);
                      }}
                    >
                      {u.status === 'ACTIVE' ? 'Vô hiệu hoá' : 'Kích hoạt lại'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {createOpen && (
        <Modal
          title="Tạo tài khoản nhân sự"
          onClose={() => setCreateOpen(false)}
          footer={
            createResult ? (
              <div className="flex justify-end">
                <Button onClick={() => setCreateOpen(false)}>Đóng</Button>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                  Huỷ
                </Button>
                <Button type="submit" form="create-staff-form" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
                </Button>
              </div>
            )
          }
        >
          {createResult ? (
            <Callout tone="warning" title="Mật khẩu tạm thời">
              <p>
                Đã tạo tài khoản <strong>{createResult.email}</strong>. Hệ thống chưa gửi email tự động, hãy
                chuyển mật khẩu dưới đây cho người dùng qua kênh nội bộ.
              </p>
              <p className="font-mono mt-2 select-all rounded-md bg-white/70 px-2.5 py-1.5 text-sm font-semibold text-amber-900 dark:bg-black/20 dark:text-amber-200">
                {createResult.temporaryPassword}
              </p>
            </Callout>
          ) : (
            <form
              id="create-staff-form"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setCreateError(null);
                createMutation.mutate();
              }}
              className="flex flex-col gap-4"
            >
              <FormField label="Họ tên" htmlFor="staffFullName">
                <input
                  id="staffFullName"
                  required
                  className={inputClass}
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
                />
              </FormField>
              <FormField label="Email đăng nhập" htmlFor="staffEmail">
                <input
                  id="staffEmail"
                  type="email"
                  required
                  className={inputClass}
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                />
              </FormField>
              <FormField label="Số điện thoại" htmlFor="staffPhone">
                <input
                  id="staffPhone"
                  className={inputClass}
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </FormField>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
            </form>
          )}
        </Modal>
      )}

      {statusTarget && (
        <Modal
          title={`${statusTarget.next === 'INACTIVE' ? 'Vô hiệu hoá' : 'Kích hoạt lại'} ${statusTarget.user.fullName}`}
          onClose={() => setStatusTarget(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStatusTarget(null)}>
                Huỷ
              </Button>
              <Button
                variant={statusTarget.next === 'INACTIVE' ? 'danger' : 'primary'}
                disabled={statusMutation.isPending || statusReason.length < 5}
                onClick={() => statusMutation.mutate()}
              >
                {statusMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <FormField label="Lý do (bắt buộc)" htmlFor="staffStatusReason">
              <textarea
                id="staffStatusReason"
                required
                rows={3}
                className={inputClass}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </FormField>
            {statusError && <p className="text-sm text-red-600">{statusError}</p>}
          </div>
        </Modal>
      )}

      {resetTarget && (
        <Modal
          title={`Đặt lại mật khẩu — ${resetTarget.fullName}`}
          onClose={() => setResetTarget(null)}
          footer={
            resetResult ? (
              <div className="flex justify-end">
                <Button onClick={() => setResetTarget(null)}>Đóng</Button>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setResetTarget(null)}>
                  Huỷ
                </Button>
                <Button disabled={resetMutation.isPending || resetReason.length < 5} onClick={() => resetMutation.mutate()}>
                  {resetMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
                </Button>
              </div>
            )
          }
        >
          {resetResult ? (
            <Callout tone="warning" title="Mật khẩu tạm thời">
              <p className="font-mono mt-1 select-all rounded-md bg-white/70 px-2.5 py-1.5 text-sm font-semibold text-amber-900 dark:bg-black/20 dark:text-amber-200">
                {resetResult}
              </p>
            </Callout>
          ) : (
            <div className="flex flex-col gap-4">
              <FormField label="Lý do (bắt buộc)" htmlFor="resetReason">
                <textarea
                  id="resetReason"
                  required
                  rows={3}
                  className={inputClass}
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                />
              </FormField>
              {resetError && <p className="text-sm text-red-600">{resetError}</p>}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
