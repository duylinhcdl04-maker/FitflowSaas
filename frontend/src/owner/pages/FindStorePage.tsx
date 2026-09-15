import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { resolveTenant } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import { useTenant, getRootDomain } from '../../tenant/tenant-context';
import AuthLayout from '../components/AuthLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import { inputClass } from '../components/FormField';

// Màn hình Tenant Discovery (FLOW 1): http://localhost:5173/owner/login
// Người dùng nhập tên phòng tập, hệ thống tra cứu và chuyển hướng sang subdomain của tenant
export default function FindStorePage() {
  const { redirectToTenant } = useTenant();
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => resolveTenant(slug.trim().toLowerCase()),
    onSuccess: (tenant) => {
      setSuccessMessage(`Đã mở cửa hàng "${tenant.name}" trong tab mới.`);
      redirectToTenant(
        tenant.slug,
        '/owner/login',
        {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          status: tenant.status,
        },
        true // Mở tab mới với subdomain của cửa hàng
      );
    },
    onError: (err) => {
      setSuccessMessage(null);
      setError(apiErrorMessage(err, 'Không tìm thấy cửa hàng với địa chỉ này'));
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    mutation.mutate();
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-['Be_Vietnam_Pro',sans-serif] text-2xl font-black text-white">Đăng nhập FitFlow</h1>
          <p className="font-['Plus_Jakarta_Sans',sans-serif] text-sm text-[#A7A1AD]">Nhập địa chỉ cửa hàng hoặc chuỗi phòng gym của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div className="flex overflow-hidden rounded-xl border border-white/10 bg-[#151119] focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
            <input
              autoFocus
              required
              placeholder="ten-cua-hang"
              className={`${inputClass} rounded-none border-0 shadow-none focus:ring-0`}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <span className="flex shrink-0 items-center bg-[#1B1521] px-3.5 text-xs font-['JetBrains_Mono'] text-purple-300/80 border-l border-white/8">
              .{window.location.hostname.endsWith('.localhost') ? 'localhost' : (getRootDomain(window.location.hostname) || 'fitfloww.store')}
            </span>
          </div>
          {error && <p className="text-sm text-rose-400 font-medium">{error}</p>}
          {successMessage && <p className="text-sm text-emerald-400 font-medium">{successMessage}</p>}
          <Button type="submit" size="lg" className="w-full justify-center" disabled={mutation.isPending || !slug.trim()}>
            {mutation.isPending ? 'Đang tìm...' : 'Vào cửa hàng'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm font-['Plus_Jakarta_Sans',sans-serif] text-[#A7A1AD]">
          Bạn chưa có tài khoản FitFlow?{' '}
          <Link to="/owner/register" className="font-bold text-purple-400 hover:text-purple-300 transition-colors">
            Dùng thử miễn phí
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
