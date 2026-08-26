import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ticket } from '@phosphor-icons/react';
import {
  createPackage,
  DURATION_UNITS,
  listPackages,
  updatePackage,
  type CreatePackageInput,
  type PackageSummary,
  type UpdatePackageInput,
} from '../../api/catalog';
import { listBranches } from '../../api/branches';
import { listMemberships } from '../../api/memberships';
import { apiErrorMessage } from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Callout from '../../components/Callout';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import { Skeleton } from '../../components/Skeleton';

const TABS = [
  { key: 'packages', label: 'Gói tập' },
  { key: 'active', label: 'Đang sử dụng' },
] as const;

const MEMBERSHIP_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Sắp bắt đầu',
  ACTIVE: 'Đang hoạt động',
  FROZEN: 'Tạm đóng băng',
  EXPIRED: 'Hết hạn',
  CANCELLED: 'Đã huỷ',
};

function formatMoney(amount: string | number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

// XIII. Tách rõ "Membership Packages" (Template Owner quản lý) và "Customer
// Memberships" (giao dịch — Staff bán, Owner chỉ theo dõi) — không gộp,
// đúng khuyến nghị BE_Owner.md.
export default function MembershipsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('packages');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Membership</h1>

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

      {tab === 'packages' ? <PackagesTab /> : <ActiveMembershipsTab />}
    </div>
  );
}

type PackageFormState = {
  name: string;
  durationValue: string;
  durationUnit: (typeof DURATION_UNITS)[number]['code'];
  basePrice: string;
  scope: 'ALL' | 'SPECIFIC';
  branchIds: string[];
};

const EMPTY_PACKAGE_FORM: PackageFormState = {
  name: '',
  durationValue: '1',
  durationUnit: DURATION_UNITS[2].code,
  basePrice: '',
  scope: 'ALL',
  branchIds: [],
};

function PackagesTab() {
  const queryClient = useQueryClient();
  const { data: packages, isLoading } = useQuery({ queryKey: ['owner-packages'], queryFn: listPackages });
  const { data: branches } = useQuery({ queryKey: ['owner-branches'], queryFn: listBranches });

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<PackageSummary | null>(null);
  const [form, setForm] = useState<PackageFormState>(EMPTY_PACKAGE_FORM);
  const [error, setError] = useState<string | null>(null);

  const isLocked = !!editing && (editing._count?.memberships ?? 0) > 0;

  function openEdit(p: PackageSummary) {
    setError(null);
    setEditing(p);
    setForm({
      name: p.name,
      durationValue: String(p.duration_value),
      durationUnit: p.duration_unit as PackageFormState['durationUnit'],
      basePrice: String(p.base_price),
      scope: p.appliesToAllBranches ? 'ALL' : 'SPECIFIC',
      branchIds: p.branches.map((b) => b.id),
    });
  }

  function closeModal() {
    setShowCreate(false);
    setEditing(null);
    setForm(EMPTY_PACKAGE_FORM);
  }

  function toggleBranch(id: string) {
    setForm((f) => ({ ...f, branchIds: f.branchIds.includes(id) ? f.branchIds.filter((i) => i !== id) : [...f.branchIds, id] }));
  }

  const branchIdsPayload = form.scope === 'ALL' ? [] : form.branchIds;

  const createMutation = useMutation({
    mutationFn: () => {
      const input: CreatePackageInput = {
        name: form.name.trim(),
        durationValue: Number(form.durationValue),
        durationUnit: form.durationUnit,
        basePrice: Number(form.basePrice),
        branchIds: branchIdsPayload,
      };
      return createPackage(input);
    },
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['owner-packages'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể tạo gói tập')),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const input: UpdatePackageInput = isLocked
        ? { branchIds: branchIdsPayload }
        : {
            name: form.name.trim(),
            durationValue: Number(form.durationValue),
            durationUnit: form.durationUnit,
            basePrice: Number(form.basePrice),
            branchIds: branchIdsPayload,
          };
      return updatePackage(editing!.id, input);
    },
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['owner-packages'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể cập nhật gói tập')),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (pkg: PackageSummary) => updatePackage(pkg.id, { status: pkg.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-packages'] }),
    onError: (err) => setError(apiErrorMessage(err, 'Không thể cập nhật gói tập')),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Tên gói tập phải có ít nhất 2 ký tự');
      return;
    }
    if (!form.durationValue || Number(form.durationValue) < 1) {
      setError('Thời hạn gói tập phải ít nhất là 1');
      return;
    }
    if (form.basePrice === '' || Number(form.basePrice) < 0) {
      setError('Giá bán gói tập không được nhỏ hơn 0');
      return;
    }
    if (form.scope === 'SPECIFIC' && form.branchIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 chi nhánh áp dụng gói tập này');
      return;
    }

    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  }

  const isModalOpen = showCreate || editing !== null;
  const submitPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Quản lý các gói tập phòng gym và phân bổ áp dụng cho từng cơ sở chi nhánh.
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1">
          + Tạo gói tập mới
        </Button>
      </div>

      {error && !isModalOpen && <Callout tone="danger">{error}</Callout>}

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : packages && packages.length === 0 ? (
        <Card>
          <EmptyState icon={Ticket} title="Chưa có gói tập nào" description="Tạo gói tập đầu tiên để bắt đầu bán cho khách hàng tại các chi nhánh." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages?.map((p) => (
            <Card key={p.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">{p.name}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      p.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-stone-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-stone-200 dark:border-zinc-700'
                    }`}
                  >
                    {p.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(p.base_price)}</span>
                  <span className="text-xs text-zinc-500">
                    / {p.duration_value} {DURATION_UNITS.find((u) => u.code === p.duration_unit)?.label ?? p.duration_unit}
                  </span>
                </div>

                {/* Scope Badge Chi nhánh áp dụng */}
                <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-zinc-800/80">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Cơ sở áp dụng:
                  </span>
                  {p.appliesToAllBranches ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      🏢 Tất cả chi nhánh ({branches?.length || 0} cơ sở)
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {p.branches.map((b) => (
                        <span key={b.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          📍 {b.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {p._count && p._count.memberships > 0 && (
                  <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                    👥 {p._count.memberships} hội viên đang sử dụng
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-zinc-800 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1 justify-center" onClick={() => openEdit(p)}>
                  Sửa gói & Cơ sở
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 justify-center"
                  disabled={toggleStatusMutation.isPending}
                  onClick={() => toggleStatusMutation.mutate(p)}
                >
                  {p.status === 'ACTIVE' ? 'Ngừng bán' : 'Mở bán lại'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Tạo & Sửa Gói tập */}
      <Modal open={isModalOpen} onClose={closeModal} title={editing ? `Chỉnh sửa gói tập: ${editing.name}` : 'Tạo gói tập mới'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isLocked && (
            <Callout tone="warning">
              Gói này đang có {editing?._count?.memberships} hội viên sử dụng — chỉ có thể đổi danh sách chi nhánh áp dụng, không sửa được tên, giá bán và thời hạn.
            </Callout>
          )}

          <FormField label="Tên gói tập *" htmlFor="pkg-name">
            <input
              id="pkg-name"
              required
              disabled={isLocked}
              className={inputClass}
              placeholder="VD: Gói tập 3 Tháng Vàng"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Thời hạn *" htmlFor="pkg-duration">
              <input
                id="pkg-duration"
                type="number"
                min={1}
                required
                disabled={isLocked}
                className={inputClass}
                value={form.durationValue}
                onChange={(e) => setForm((f) => ({ ...f, durationValue: e.target.value }))}
              />
            </FormField>

            <FormField label="Đơn vị thời gian *" htmlFor="pkg-unit">
              <select
                id="pkg-unit"
                disabled={isLocked}
                className={inputClass}
                value={form.durationUnit}
                onChange={(e) => setForm((f) => ({ ...f, durationUnit: e.target.value as typeof f.durationUnit }))}
              >
                {DURATION_UNITS.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Giá bán chính thức (VNĐ) *" htmlFor="pkg-price">
            <input
              id="pkg-price"
              type="number"
              min={0}
              required
              disabled={isLocked}
              className={inputClass}
              placeholder="VD: 1500000"
              value={form.basePrice}
              onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
            />
          </FormField>

          {/* Phân bổ Gán gói cho Chi nhánh */}
          <FormField label="Gán gói bán cho chi nhánh *" htmlFor="pkg-scope">
            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer">
                <input
                  type="radio"
                  name="pkg-scope"
                  checked={form.scope === 'ALL'}
                  onChange={() => setForm((f) => ({ ...f, scope: 'ALL' }))}
                  className="h-4 w-4 accent-emerald-600"
                />
                🏢 Áp dụng kinh doanh tại tất cả chi nhánh
              </label>

              <label className="flex items-center gap-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer">
                <input
                  type="radio"
                  name="pkg-scope"
                  checked={form.scope === 'SPECIFIC'}
                  onChange={() => setForm((f) => ({ ...f, scope: 'SPECIFIC' }))}
                  className="h-4 w-4 accent-emerald-600"
                />
                📍 Chỉ áp dụng tại các chi nhánh được chọn
              </label>

              {form.scope === 'SPECIFIC' && (
                <div className="ml-6 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Chọn cơ sở áp dụng gói:
                  </span>
                  {branches && branches.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {branches.map((b) => (
                        <label key={b.id} className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:text-emerald-600">
                          <input
                            type="checkbox"
                            checked={form.branchIds.includes(b.id)}
                            onChange={() => toggleBranch(b.id)}
                            className="h-4 w-4 rounded accent-emerald-600"
                          />
                          <span>{b.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400">Chưa có chi nhánh nào trong hệ thống.</p>
                  )}

                  {form.branchIds.length === 0 && (
                    <p className="text-xs font-bold text-rose-600 mt-1">
                      ⚠️ Vui lòng tích chọn ít nhất 1 chi nhánh bên trên.
                    </p>
                  )}
                </div>
              )}
            </div>
          </FormField>

          {error && <Callout tone="danger">{error}</Callout>}

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitPending}
            >
              {submitPending ? 'Đang lưu gói tập...' : editing ? 'Lưu thay đổi' : 'Xác nhận tạo gói'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ActiveMembershipsTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['owner-memberships', page], queryFn: () => listMemberships({ page }) });

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs text-zinc-400 dark:border-zinc-800">
                <th className="px-4 py-3 font-medium">Khách hàng</th>
                <th className="px-4 py-3 font-medium">Gói</th>
                <th className="px-4 py-3 font-medium">Chi nhánh</th>
                <th className="px-4 py-3 font-medium">Bắt đầu</th>
                <th className="px-4 py-3 font-medium">Kết thúc</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((m) => (
                <tr key={m.id} className="border-b border-stone-50 last:border-0 dark:border-zinc-800/60">
                  <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">{m.customerName}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{m.packageName}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{m.branchName}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{formatDate(m.startDate)}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{formatDate(m.endDate)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {MEMBERSHIP_STATUS_LABELS[m.status] ?? m.status}
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
            Trang {data.page}/{data.totalPages} · {data.total} Membership
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
