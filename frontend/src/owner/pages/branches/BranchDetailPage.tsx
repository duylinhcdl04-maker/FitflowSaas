import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil } from '@phosphor-icons/react';
import { getBranch, updateBranch } from '../../api/branches';
import { apiErrorMessage } from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Callout from '../../components/Callout';
import { Skeleton } from '../../components/Skeleton';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';

const SUGGESTIONS = ['Thứ 2 - Chủ nhật', 'Thứ 2 - Thứ 7', 'Hàng ngày', 'Thứ 2 - Thứ 6'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

// OW-11. Branch Detail — tổng quan + danh sách nhân viên phụ trách. Khách
// hàng/Check-in của chi nhánh này xem trực tiếp ở trang Khách hàng/Check-in
// chung với bộ lọc theo chi nhánh (tránh lặp UI theo từng tab riêng).
export default function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: branch, isLoading } = useQuery({ queryKey: ['owner-branch', id], queryFn: () => getBranch(id!) });
  
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    openingDays: '',
    openingHour: '08',
    openingMin: '00',
    closingHour: '22',
    closingMin: '00',
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'INACTIVE') => updateBranch(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-branch', id] });
      queryClient.invalidateQueries({ queryKey: ['owner-branches'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể cập nhật trạng thái chi nhánh')),
  });

  const updateBranchMutation = useMutation({
    mutationFn: (input: any) => updateBranch(id!, input),
    onSuccess: () => {
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['owner-branch', id] });
      queryClient.invalidateQueries({ queryKey: ['owner-branches'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể cập nhật thông tin chi nhánh')),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!branch) return null;

  function handleOpenEdit() {
    if (!branch) return;
    const opTime = branch.openingTime?.slice(11, 16) || '08:00';
    const clTime = branch.closingTime?.slice(11, 16) || '22:00';
    const [opH, opM] = opTime.split(':');
    const [clH, clM] = clTime.split(':');
    setForm({
      name: branch.name || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      openingDays: branch.openingDays || 'Thứ 2 - Chủ nhật',
      openingHour: opH || '08',
      openingMin: opM || '00',
      closingHour: clH || '22',
      closingMin: clM || '00',
    });
    setError(null);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    updateBranchMutation.mutate({
      name: form.name,
      address: form.address || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      openingDays: form.openingDays,
      openingTime: `${form.openingHour}:${form.openingMin}`,
      closingTime: `${form.closingHour}:${form.closingMin}`,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate('/owner/branches')}
        className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft size={16} />
        Chi nhánh
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">{branch.name}</h1>
          <p className="mt-1 font-mono text-xs text-zinc-400">{branch.code}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={toggleStatusMutation.isPending}
          onClick={() => toggleStatusMutation.mutate(branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
        >
          {branch.status === 'ACTIVE' ? 'Ngừng hoạt động' : 'Kích hoạt lại'}
        </Button>
      </div>

      {error && <Callout tone="danger">{error}</Callout>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-zinc-400">HỘI VIÊN</p>
          <p className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">{branch.memberCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-400">NHÂN SỰ</p>
          <p className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">{branch.staffCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-400">CHECK-IN HÔM NAY</p>
          <p className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">{branch.checkinToday}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Thông tin chi tiết chi nhánh</h2>
          <button
            type="button"
            onClick={handleOpenEdit}
            className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
          >
            <Pencil size={14} /> Chỉnh sửa cấu hình
          </button>
        </div>
        
        <div className="mt-3 flex flex-col gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
          <p>Địa chỉ: {branch.address ?? '—'}</p>
          <p>Điện thoại: {branch.phone ?? '—'}</p>
          <p>Email: {branch.email ?? '—'}</p>
          <p>
            Ngày mở cửa: <span className="font-medium text-zinc-900 dark:text-zinc-100">{branch.openingDays}</span>
          </p>
          <p>
            Giờ hoạt động: <span className="font-mono text-zinc-900 dark:text-zinc-100">{branch.openingTime?.slice(11, 16) ?? '—'} - {branch.closingTime?.slice(11, 16) ?? '—'}</span>
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Nhân sự phụ trách</h2>
          <Link to="/owner/staff" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            Quản lý nhân sự
          </Link>
        </div>
        {branch.staff.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {branch.staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm dark:bg-zinc-800/60">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{s.fullName}</span>
                <span className="text-xs text-zinc-400">{s.roles.join(', ')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-zinc-400">Chưa có nhân sự nào được gán vào chi nhánh này.</p>
        )}
      </Card>

      <div className="flex gap-3">
        <Link
          to={`/owner/customers?branchId=${branch.id}`}
          className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Xem khách hàng chi nhánh này
        </Link>
        <Link
          to={`/owner/checkin?branchId=${branch.id}`}
          className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Xem check-in chi nhánh này
        </Link>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Cấu hình chi tiết chi nhánh">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Tên chi nhánh *" htmlFor="branch-form-name">
            <input
              id="branch-form-name"
              required
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormField>

          <FormField label="Địa chỉ" htmlFor="branch-form-address">
            <input
              id="branch-form-address"
              className={inputClass}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Điện thoại" htmlFor="branch-form-phone">
              <input
                id="branch-form-phone"
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </FormField>

            <FormField label="Email" htmlFor="branch-form-email">
              <input
                id="branch-form-email"
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Ngày mở cửa / Ngày hoạt động *" htmlFor="branch-form-days">
            <div>
              <input
                id="branch-form-days"
                required
                placeholder="Ví dụ: Thứ 2 - Chủ nhật"
                className={inputClass}
                value={form.openingDays}
                onChange={(e) => setForm((f) => ({ ...f, openingDays: e.target.value }))}
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, openingDays: s }))}
                    className="text-xs px-2.5 py-1 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:text-zinc-400 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Giờ mở cửa *" htmlFor="branch-form-opening">
              <div className="flex gap-2 items-center">
                <select
                  value={form.openingHour}
                  onChange={(e) => setForm((f) => ({ ...f, openingHour: e.target.value }))}
                  className={`${inputClass} text-center`}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h} giờ</option>
                  ))}
                </select>
                <span className="font-semibold text-zinc-400 dark:text-zinc-600">:</span>
                <select
                  value={form.openingMin}
                  onChange={(e) => setForm((f) => ({ ...f, openingMin: e.target.value }))}
                  className={`${inputClass} text-center`}
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>{m} phút</option>
                  ))}
                </select>
              </div>
            </FormField>

            <FormField label="Giờ đóng cửa *" htmlFor="branch-form-closing">
              <div className="flex gap-2 items-center">
                <select
                  value={form.closingHour}
                  onChange={(e) => setForm((f) => ({ ...f, closingHour: e.target.value }))}
                  className={`${inputClass} text-center`}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h} giờ</option>
                  ))}
                </select>
                <span className="font-semibold text-zinc-400 dark:text-zinc-600">:</span>
                <select
                  value={form.closingMin}
                  onChange={(e) => setForm((f) => ({ ...f, closingMin: e.target.value }))}
                  className={`${inputClass} text-center`}
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>{m} phút</option>
                  ))}
                </select>
              </div>
            </FormField>
          </div>

          {updateBranchMutation.isError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {apiErrorMessage(updateBranchMutation.error, 'Không thể cập nhật cấu hình chi nhánh')}
            </p>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Huỷ</Button>
            <Button type="submit" disabled={updateBranchMutation.isPending}>
              {updateBranchMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
