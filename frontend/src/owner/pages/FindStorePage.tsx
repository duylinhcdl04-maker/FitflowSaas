import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { lookupTenant } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import AuthLayout from '../components/AuthLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import { inputClass } from '../components/FormField';

// Bước 1 của đăng nhập — nhập tên cửa hàng trước, giống mô hình
// "cửahàng.kiotviet.vn" của KiotViet. Chưa có subdomain thật nên mô phỏng
// bằng route nội bộ `/owner/login/:slug` (xem UI_Owner.md).
export default function FindStorePage() {
  const navigate = useNavigate();
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => lookupTenant(slug.trim().toLowerCase()),
    onSuccess: (tenant) => {
      const code = tenant.code;
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : '';

      if (hostname.includes('fitflow.io.vn')) {
        window.location.href = `${protocol}//${code}.fitflow.io.vn/owner/login/${code}`;
      } else if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        window.location.href = `${protocol}//${code}.localhost${port}/owner/login/${code}`;
      } else {
        navigate(`/owner/login/${code}`);
      }
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không tìm thấy cửa hàng với địa chỉ này')),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-50">Đăng nhập FitFlow</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Nhập địa chỉ cửa hàng của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex overflow-hidden rounded-2xl border border-stone-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 dark:border-zinc-700">
            <input
              autoFocus
              required
              placeholder="ten-cua-hang"
              className={`${inputClass} rounded-none border-0 shadow-none focus:ring-0`}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <span className="flex shrink-0 items-center bg-stone-100 px-3 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              .fitflow.io.vn
            </span>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <Button type="submit" size="lg" className="w-full justify-center" disabled={mutation.isPending || !slug.trim()}>
            {mutation.isPending ? 'Đang tìm...' : 'Vào cửa hàng'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Bạn chưa có cửa hàng?{' '}
          <Link to="/owner/register" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            Dùng thử miễn phí
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
