import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Circle } from '@phosphor-icons/react';
import {
  createBranch,
  createPackage,
  createService,
  DURATION_UNITS,
  getCheckinConfig,
  getOnboardingProgress,
  inviteStaff,
  INVITABLE_ROLES,
  listBranches,
  listPackages,
  listServices,
  listStaff,
  updateCheckinConfig,
} from '../api/onboarding';
import { apiErrorMessage } from '../api/client';
import Card from '../components/Card';
import Button from '../components/Button';
import Callout from '../components/Callout';
import FormField, { inputClass } from '../components/FormField';

type StepKey = 'branch' | 'staff' | 'catalog' | 'checkin';

// OW-04. Checklist thiết lập ban đầu — mỗi bước đều có lối thoát "Bỏ qua",
// không bắt buộc hoàn thành mới được vào Dashboard. Tiến độ tính trực tiếp
// từ dữ liệu thật (xem owner-settings.service.ts#getOnboardingProgress).
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { data: progress } = useQuery({ queryKey: ['owner-onboarding-progress'], queryFn: getOnboardingProgress });

  const steps: { key: StepKey; title: string; description: string; done: boolean }[] = [
    { key: 'branch', title: 'Tạo chi nhánh', description: 'Nơi khách hàng của bạn sẽ tập luyện', done: !!progress?.branchCreated },
    { key: 'staff', title: 'Mời nhân sự', description: 'Quản lý chi nhánh, lễ tân, huấn luyện viên', done: !!progress?.staffInvited },
    { key: 'catalog', title: 'Tạo gói tập', description: 'Gói hội viên để bán cho khách hàng', done: !!progress?.packageCreated },
    { key: 'checkin', title: 'Cấu hình Check-in', description: 'Chọn phương thức check-in cho phòng tập', done: !!progress?.checkinConfigured },
  ];

  const [openStep, setOpenStep] = useState<StepKey | null>(steps.find((s) => !s.done)?.key ?? null);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Thiết lập phòng tập</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Hoàn thành {doneCount}/{steps.length} bước — bạn có thể bỏ qua và quay lại sau bất kỳ lúc nào.
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all dark:bg-emerald-400"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {steps.map((step) => (
          <Card key={step.key} padded={false} className="overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenStep(openStep === step.key ? null : step.key)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left"
            >
              {step.done ? (
                <CheckCircle size={22} weight="fill" className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle size={22} className="shrink-0 text-stone-300 dark:text-zinc-700" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{step.title}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{step.description}</p>
              </div>
            </button>
            {openStep === step.key && (
              <div className="border-t border-stone-100 px-5 py-5 dark:border-zinc-800">
                {step.key === 'branch' && <BranchStep />}
                {step.key === 'staff' && <StaffStep />}
                {step.key === 'catalog' && <CatalogStep />}
                {step.key === 'checkin' && <CheckinStep />}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate('/owner')}>
          {doneCount === steps.length ? 'Vào Dashboard' : 'Bỏ qua, vào Dashboard'}
        </Button>
      </div>
    </div>
  );
}

function StepFooter({ children }: { children: ReactNode }) {
  return <div className="mt-4 flex items-center gap-3">{children}</div>;
}

function BranchStep() {
  const queryClient = useQueryClient();
  const { data: branches } = useQuery({ queryKey: ['owner-branches'], queryFn: listBranches });
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createBranch({ name: form.name, address: form.address || undefined, phone: form.phone || undefined }),
    onSuccess: () => {
      setForm({ name: '', address: '', phone: '' });
      queryClient.invalidateQueries({ queryKey: ['owner-branches'] });
      queryClient.invalidateQueries({ queryKey: ['owner-onboarding-progress'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể tạo chi nhánh')),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <div className="flex flex-col gap-4">
      {branches && branches.length > 0 && (
        <ul className="flex flex-col gap-2">
          {branches.map((b) => (
            <li key={b.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm dark:bg-zinc-800/60">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{b.name}</span>
              <span className="font-mono text-xs text-zinc-400">{b.code}</span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormField label="Tên chi nhánh" htmlFor="branch-name">
          <input
            id="branch-name"
            required
            className={inputClass}
            placeholder="Chi nhánh Cầu Giấy"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </FormField>
        <FormField label="Địa chỉ" htmlFor="branch-address">
          <input
            id="branch-address"
            className={inputClass}
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </FormField>
        <FormField label="Số điện thoại" htmlFor="branch-phone">
          <input
            id="branch-phone"
            className={inputClass}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </FormField>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <StepFooter>
          <Button type="submit" size="sm" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang tạo...' : 'Thêm chi nhánh'}
          </Button>
        </StepFooter>
      </form>
    </div>
  );
}

function StaffStep() {
  const queryClient = useQueryClient();
  const { data: branches } = useQuery({ queryKey: ['owner-branches'], queryFn: listBranches });
  const { data: staffData } = useQuery({ queryKey: ['owner-staff'], queryFn: listStaff });
  const [form, setForm] = useState({ fullName: '', email: '', roleCode: INVITABLE_ROLES[0].code, branchId: '' });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      inviteStaff({
        fullName: form.fullName,
        email: form.email,
        roleCode: form.roleCode,
        branchId: form.branchId || undefined,
      }),
    onSuccess: () => {
      setForm({ fullName: '', email: '', roleCode: INVITABLE_ROLES[0].code, branchId: '' });
      queryClient.invalidateQueries({ queryKey: ['owner-staff'] });
      queryClient.invalidateQueries({ queryKey: ['owner-onboarding-progress'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể gửi lời mời')),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <div className="flex flex-col gap-4">
      {staffData && (staffData.staff.length > 0 || staffData.pendingInvitations.length > 0) && (
        <ul className="flex flex-col gap-2">
          {staffData.staff.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm dark:bg-zinc-800/60">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{s.fullName}</span>
              <span className="text-xs text-zinc-400">{s.roles.join(', ')}</span>
            </li>
          ))}
          {staffData.pendingInvitations.map((i) => (
            <li key={i.id} className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-sm dark:bg-amber-500/10">
              <span className="text-zinc-700 dark:text-zinc-300">Đang chờ xác nhận</span>
              <span className="text-xs text-amber-600 dark:text-amber-400">{i.roleCode}</span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormField label="Họ và tên" htmlFor="staff-name">
          <input
            id="staff-name"
            required
            className={inputClass}
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          />
        </FormField>
        <FormField label="Email" htmlFor="staff-email">
          <input
            id="staff-email"
            type="email"
            required
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </FormField>
        <FormField label="Vai trò" htmlFor="staff-role">
          <select
            id="staff-role"
            className={inputClass}
            value={form.roleCode}
            onChange={(e) => setForm((f) => ({ ...f, roleCode: e.target.value as typeof f.roleCode }))}
          >
            {INVITABLE_ROLES.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Chi nhánh" htmlFor="staff-branch" hint="Bỏ trống nếu chưa xác định">
          <select
            id="staff-branch"
            className={inputClass}
            value={form.branchId}
            onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
          >
            <option value="">— Chưa chọn —</option>
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </FormField>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <StepFooter>
          <Button type="submit" size="sm" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang gửi...' : 'Gửi lời mời'}
          </Button>
        </StepFooter>
      </form>
    </div>
  );
}

function CatalogStep() {
  const queryClient = useQueryClient();
  const { data: services } = useQuery({ queryKey: ['owner-services'], queryFn: listServices });
  const { data: packages } = useQuery({ queryKey: ['owner-packages'], queryFn: listPackages });

  const [serviceForm, setServiceForm] = useState({ name: '' });
  const [serviceError, setServiceError] = useState<string | null>(null);
  const serviceMutation = useMutation({
    mutationFn: () => createService({ name: serviceForm.name }),
    onSuccess: () => {
      setServiceForm({ name: '' });
      queryClient.invalidateQueries({ queryKey: ['owner-services'] });
    },
    onError: (err) => setServiceError(apiErrorMessage(err, 'Không thể tạo dịch vụ')),
  });

  const [pkgForm, setPkgForm] = useState({ name: '', durationValue: '1', durationUnit: DURATION_UNITS[2].code, basePrice: '' });
  const [pkgError, setPkgError] = useState<string | null>(null);
  const pkgMutation = useMutation({
    mutationFn: () =>
      createPackage({
        name: pkgForm.name,
        durationValue: Number(pkgForm.durationValue),
        durationUnit: pkgForm.durationUnit,
        basePrice: Number(pkgForm.basePrice),
      }),
    onSuccess: () => {
      setPkgForm({ name: '', durationValue: '1', durationUnit: DURATION_UNITS[2].code, basePrice: '' });
      queryClient.invalidateQueries({ queryKey: ['owner-packages'] });
      queryClient.invalidateQueries({ queryKey: ['owner-onboarding-progress'] });
    },
    onError: (err) => setPkgError(apiErrorMessage(err, 'Không thể tạo gói tập')),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Gói tập</p>
        {packages && packages.length > 0 && (
          <ul className="mb-3 flex flex-col gap-2">
            {packages.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm dark:bg-zinc-800/60">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{p.name}</span>
                <span className="text-xs text-zinc-400">
                  {p.duration_value} {DURATION_UNITS.find((u) => u.code === p.duration_unit)?.label} · {Number(p.base_price).toLocaleString('vi-VN')}đ
                </span>
              </li>
            ))}
          </ul>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPkgError(null);
            pkgMutation.mutate();
          }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="col-span-2">
            <FormField label="Tên gói tập" htmlFor="pkg-name">
              <input
                id="pkg-name"
                required
                placeholder="Gói tập 1 tháng"
                className={inputClass}
                value={pkgForm.name}
                onChange={(e) => setPkgForm((f) => ({ ...f, name: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Thời hạn" htmlFor="pkg-duration">
            <input
              id="pkg-duration"
              type="number"
              min={1}
              required
              className={inputClass}
              value={pkgForm.durationValue}
              onChange={(e) => setPkgForm((f) => ({ ...f, durationValue: e.target.value }))}
            />
          </FormField>
          <FormField label="Đơn vị" htmlFor="pkg-unit">
            <select
              id="pkg-unit"
              className={inputClass}
              value={pkgForm.durationUnit}
              onChange={(e) => setPkgForm((f) => ({ ...f, durationUnit: e.target.value as typeof f.durationUnit }))}
            >
              {DURATION_UNITS.map((u) => (
                <option key={u.code} value={u.code}>
                  {u.label}
                </option>
              ))}
            </select>
          </FormField>
          <div className="col-span-2">
            <FormField label="Giá bán (VNĐ)" htmlFor="pkg-price">
              <input
                id="pkg-price"
                type="number"
                min={0}
                required
                className={inputClass}
                value={pkgForm.basePrice}
                onChange={(e) => setPkgForm((f) => ({ ...f, basePrice: e.target.value }))}
              />
            </FormField>
          </div>
          {pkgError && <p className="col-span-2 text-sm text-red-600 dark:text-red-400">{pkgError}</p>}
          <div className="col-span-2">
            <Button type="submit" size="sm" disabled={pkgMutation.isPending}>
              {pkgMutation.isPending ? 'Đang tạo...' : 'Thêm gói tập'}
            </Button>
          </div>
        </form>
      </div>

      <div className="border-t border-stone-100 pt-5 dark:border-zinc-800">
        <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Dịch vụ (tuỳ chọn)</p>
        {services && services.length > 0 && (
          <ul className="mb-3 flex flex-col gap-2">
            {services.map((s) => (
              <li key={s.id} className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200">
                {s.name}
              </li>
            ))}
          </ul>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setServiceError(null);
            serviceMutation.mutate();
          }}
          className="flex gap-2"
        >
          <input
            required
            placeholder="Yoga, Boxing, PT 1-1..."
            className={inputClass}
            value={serviceForm.name}
            onChange={(e) => setServiceForm({ name: e.target.value })}
          />
          <Button type="submit" variant="secondary" size="sm" disabled={serviceMutation.isPending}>
            Thêm
          </Button>
        </form>
        {serviceError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{serviceError}</p>}
      </div>
    </div>
  );
}

function CheckinStep() {
  const queryClient = useQueryClient();
  const { data: config } = useQuery({ queryKey: ['owner-checkin-config'], queryFn: getCheckinConfig });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (next: { qr: boolean; manual: boolean; face: boolean }) => updateCheckinConfig(next),
    onSuccess: (data) => {
      queryClient.setQueryData(['owner-checkin-config'], data);
      queryClient.invalidateQueries({ queryKey: ['owner-onboarding-progress'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể cập nhật cấu hình')),
  });

  if (!config) return null;

  function toggle(key: 'qr' | 'face') {
    setError(null);
    mutation.mutate({ ...config!, [key]: !config![key] });
  }

  return (
    <div className="flex flex-col gap-3">
      <Callout tone="info">Check-in thủ công (lễ tân thao tác) luôn được bật sẵn ở mọi gói.</Callout>
      <label className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 dark:border-zinc-800">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Check-in bằng QR</span>
        <input type="checkbox" checked={config.qr} onChange={() => toggle('qr')} className="h-5 w-5 accent-emerald-600" />
      </label>
      <label className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 dark:border-zinc-800">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Nhận diện khuôn mặt</span>
        <input type="checkbox" checked={config.face} onChange={() => toggle('face')} className="h-5 w-5 accent-emerald-600" />
      </label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
