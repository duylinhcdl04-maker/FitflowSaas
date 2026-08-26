import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTenant } from '../api/tenants';
import { listPlans } from '../api/plans';
import { apiErrorMessage } from '../api/client';
import FormField, { inputClass } from '../components/FormField';
import Card from '../components/Card';
import Button from '../components/Button';

export default function TenantCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: listPlans });

  const [form, setForm] = useState({
    name: '',
    code: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    planCode: '',
    ownerFullName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: '',
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createTenant({
        name: form.name,
        code: form.code,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone || undefined,
        address: form.address || undefined,
        planCode: form.planCode,
        owner: {
          fullName: form.ownerFullName,
          email: form.ownerEmail,
          phone: form.ownerPhone || undefined,
          password: form.ownerPassword,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      navigate('/admin/tenants');
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể tạo Tenant')),
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Tạo Tenant mới
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Khởi tạo doanh nghiệp mới và tài khoản Owner đầu tiên.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <Card>
          <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Thông tin doanh nghiệp
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Tên doanh nghiệp" htmlFor="name">
              <input
                id="name"
                required
                className={inputClass}
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </FormField>
            <FormField label="Mã Tenant (subdomain)" htmlFor="code">
              <input
                id="code"
                required
                placeholder="vd: ironfit"
                pattern="[a-z0-9-]{2,50}"
                className={inputClass}
                value={form.code}
                onChange={(e) => update('code', e.target.value.toLowerCase())}
              />
            </FormField>
            <FormField label="Email liên hệ" htmlFor="contactEmail">
              <input
                id="contactEmail"
                type="email"
                required
                className={inputClass}
                value={form.contactEmail}
                onChange={(e) => update('contactEmail', e.target.value)}
              />
            </FormField>
            <FormField label="Số điện thoại" htmlFor="contactPhone">
              <input
                id="contactPhone"
                className={inputClass}
                value={form.contactPhone}
                onChange={(e) => update('contactPhone', e.target.value)}
              />
            </FormField>
            <FormField label="Địa chỉ" htmlFor="address">
              <input
                id="address"
                className={inputClass}
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
              />
            </FormField>
            <FormField label="SaaS Plan" htmlFor="planCode">
              <select
                id="planCode"
                required
                className={inputClass}
                value={form.planCode}
                onChange={(e) => update('planCode', e.target.value)}
              >
                <option value="">Chọn gói</option>
                {plans?.map((plan) => (
                  <option key={plan.id} value={plan.code}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Tài khoản Owner đầu tiên
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Họ tên" htmlFor="ownerFullName">
              <input
                id="ownerFullName"
                required
                className={inputClass}
                value={form.ownerFullName}
                onChange={(e) => update('ownerFullName', e.target.value)}
              />
            </FormField>
            <FormField label="Email đăng nhập" htmlFor="ownerEmail">
              <input
                id="ownerEmail"
                type="email"
                required
                className={inputClass}
                value={form.ownerEmail}
                onChange={(e) => update('ownerEmail', e.target.value)}
              />
            </FormField>
            <FormField label="Số điện thoại" htmlFor="ownerPhone">
              <input
                id="ownerPhone"
                className={inputClass}
                value={form.ownerPhone}
                onChange={(e) => update('ownerPhone', e.target.value)}
              />
            </FormField>
            <FormField label="Mật khẩu tạm thời" htmlFor="ownerPassword">
              <input
                id="ownerPassword"
                type="password"
                required
                minLength={8}
                className={inputClass}
                value={form.ownerPassword}
                onChange={(e) => update('ownerPassword', e.target.value)}
              />
            </FormField>
          </div>
        </Card>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang tạo...' : 'Tạo Tenant'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/admin/tenants')}>
            Huỷ
          </Button>
        </div>
      </form>
    </div>
  );
}
