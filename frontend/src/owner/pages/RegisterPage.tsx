import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register, resendOtpByEmail } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import AuthLayout from '../components/AuthLayout';
import Callout from '../components/Callout';
import Card from '../components/Card';
import Button from '../components/Button';
import FormField, { inputClass } from '../components/FormField';
import PasswordInput from '../components/PasswordInput';

const BUSINESS_TYPES = ['Gym / Fitness', 'Yoga', 'Boxing', 'Bơi lội', 'Khác'];

// Bỏ dấu tiếng Việt + chuẩn hoá thành slug, giống ô "Địa chỉ truy cập" tự
// điền theo Tên cửa hàng của KiotViet.
function slugify(text: string) {
  const withoutDiacritics = Array.from(text.normalize('NFD'))
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code < 0x0300 || code > 0x036f; // strip Unicode combining marks
    })
    .join('');

  return withoutDiacritics
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// OW-00 + OW-02 hiển thị thành 2 bước cho người dùng, nhưng chỉ gọi API một
// lần ở bước cuối — không có Account nào được tạo giữa chừng (xem comment ở
// api/auth.ts vì sao không thể tách làm hai lần gọi).
export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [account, setAccount] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [business, setBusiness] = useState({
    businessName: '',
    brandSlug: '',
    businessType: BUSINESS_TYPES[0],
    contactEmail: '',
    contactPhone: '',
    address: '',
    seedSampleData: true,
  });
  // Mặc định liên hệ doanh nghiệp = liên hệ tài khoản (bước 1) — chỉ hiện
  // riêng 2 ô này khi Owner chủ động bấm "Dùng liên hệ khác".
  const [contactOverride, setContactOverride] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // OW-01b. Email đã dùng ở một lượt đăng ký trước đó nhưng chưa xác thực OTP
  // (đóng tab giữa chừng) — cho khôi phục thẳng thay vì bị kẹt (không đăng ký
  // lại được vì email trùng, không đăng nhập được vì chưa kích hoạt).
  const [emailTaken, setEmailTaken] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      register({
        fullName: account.fullName,
        email: account.email,
        phone: account.phone || undefined,
        password: account.password,
        businessName: business.businessName,
        brandSlug: business.brandSlug,
        businessType: business.businessType || undefined,
        contactEmail: contactOverride && business.contactEmail ? business.contactEmail : account.email,
        contactPhone: (contactOverride ? business.contactPhone : account.phone) || undefined,
        address: business.address || undefined,
        seedSampleData: business.seedSampleData,
      }),
    onSuccess: (data) => {
      // Chuyển tiếp qua state của router (không gửi lại server) để màn Welcome
      // (OW-03) hiển thị "cửa hàng đã sẵn sàng" kèm thông tin đăng nhập, giống
      // mô hình KiotViet — chỉ tồn tại trong bộ nhớ trình duyệt của phiên này.
      navigate('/owner/verify-otp', {
        state: {
          userId: data.userId,
          email: data.email,
          password: account.password,
          businessName: business.businessName,
          brandSlug: business.brandSlug,
          seedSampleData: business.seedSampleData,
        },
      });
    },
    onError: (err) => {
      const message = apiErrorMessage(err, 'Không thể tạo tài khoản');
      setError(message);
      setEmailTaken(message.includes('Email này đã được sử dụng'));
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendOtpByEmail(account.email),
    onSuccess: (data) => {
      navigate('/owner/verify-otp', { state: { userId: data.userId, email: data.email } });
    },
    onError: (err) => setResendMessage(apiErrorMessage(err, 'Không thể gửi lại mã kích hoạt')),
  });

  function handleStep1Submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (account.password !== account.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setStep(2);
  }

  function handleStep2Submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailTaken(false);
    setResendMessage(null);
    mutation.mutate();
  }

  return (
    <AuthLayout>
      <Card className="relative w-full max-w-md">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {step === 1 ? 'Bắt đầu quản lý phòng tập' : 'Doanh nghiệp của bạn'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {step === 1 ? 'Dùng thử miễn phí 7 ngày, không cần thẻ thanh toán' : 'Bước cuối cùng — chỉ mất một phút'}
          </p>
          <div className="flex gap-1.5">
            <span className={`h-1.5 w-6 rounded-full ${step >= 1 ? 'bg-emerald-600' : 'bg-stone-200 dark:bg-zinc-700'}`} />
            <span className={`h-1.5 w-6 rounded-full ${step >= 2 ? 'bg-emerald-600' : 'bg-stone-200 dark:bg-zinc-700'}`} />
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="mt-6 flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Họ và tên" htmlFor="fullName">
                <input
                  id="fullName"
                  required
                  className={inputClass}
                  value={account.fullName}
                  onChange={(e) => setAccount((f) => ({ ...f, fullName: e.target.value }))}
                />
              </FormField>
              <FormField label="Số điện thoại" htmlFor="phone">
                <input
                  id="phone"
                  className={inputClass}
                  value={account.phone}
                  onChange={(e) => setAccount((f) => ({ ...f, phone: e.target.value }))}
                />
              </FormField>
            </div>
            <FormField label="Email" htmlFor="email">
              <input
                id="email"
                type="email"
                required
                className={inputClass}
                value={account.email}
                onChange={(e) => setAccount((f) => ({ ...f, email: e.target.value }))}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Mật khẩu" htmlFor="password" hint="Tối thiểu 8 ký tự">
                <PasswordInput
                  id="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={account.password}
                  onChange={(value) => setAccount((f) => ({ ...f, password: value }))}
                />
              </FormField>
              <FormField label="Xác nhận mật khẩu" htmlFor="confirmPassword">
                <PasswordInput
                  id="confirmPassword"
                  required
                  autoComplete="new-password"
                  value={account.confirmPassword}
                  onChange={(value) => setAccount((f) => ({ ...f, confirmPassword: value }))}
                />
              </FormField>
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button type="submit" size="lg" className="w-full justify-center">
              Tiếp tục
            </Button>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="mt-5 flex flex-col gap-3.5">
            <FormField label="Tên phòng tập / thương hiệu" htmlFor="businessName">
              <input
                id="businessName"
                required
                placeholder="FitFlow Fitness"
                className={inputClass}
                value={business.businessName}
                onChange={(e) => {
                  const name = e.target.value;
                  setBusiness((f) => ({
                    ...f,
                    businessName: name,
                    // Tự điền địa chỉ truy cập theo tên, đúng kiểu KiotViet —
                    // dừng tự điền ngay khi Owner tự sửa ô bên dưới.
                    brandSlug: slugTouched ? f.brandSlug : slugify(name),
                  }));
                }}
              />
            </FormField>

            <FormField label="Địa chỉ truy cập" htmlFor="brandSlug">
              <div className="flex overflow-hidden rounded-2xl border border-stone-300 shadow-sm focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 dark:border-zinc-700">
                <input
                  id="brandSlug"
                  required
                  placeholder="fitflow-cau-giay"
                  pattern="[a-z0-9-]{2,50}"
                  className="min-w-0 flex-1 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
                  value={business.brandSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setBusiness((f) => ({ ...f, brandSlug: e.target.value.toLowerCase() }));
                  }}
                />
                <span className="flex shrink-0 items-center bg-stone-100 px-3 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  .fitfloww.store
                </span>
              </div>
              <p className="text-xs text-zinc-400">Đang chạy local — đây sẽ là địa chỉ đăng nhập khi có tên miền riêng.</p>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Loại hình" htmlFor="businessType">
                <select
                  id="businessType"
                  className={inputClass}
                  value={business.businessType}
                  onChange={(e) => setBusiness((f) => ({ ...f, businessType: e.target.value }))}
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Địa chỉ (không bắt buộc)" htmlFor="address">
                <input
                  id="address"
                  className={inputClass}
                  value={business.address}
                  onChange={(e) => setBusiness((f) => ({ ...f, address: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="rounded-2xl bg-stone-50 p-3 dark:bg-zinc-800/60">
              {!contactOverride ? (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-zinc-500 dark:text-zinc-400">Liên hệ doanh nghiệp</p>
                    <p className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                      {account.email}
                      {account.phone && ` · ${account.phone}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBusiness((f) => ({
                        ...f,
                        contactEmail: f.contactEmail || account.email,
                        contactPhone: f.contactPhone || account.phone,
                      }));
                      setContactOverride(true);
                    }}
                    className="shrink-0 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    Dùng liên hệ khác
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Liên hệ doanh nghiệp</p>
                    <button
                      type="button"
                      onClick={() => setContactOverride(false)}
                      className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      Dùng liên hệ tài khoản
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Email" htmlFor="contactEmail">
                      <input
                        id="contactEmail"
                        type="email"
                        required
                        className={inputClass}
                        value={business.contactEmail}
                        onChange={(e) => setBusiness((f) => ({ ...f, contactEmail: e.target.value }))}
                      />
                    </FormField>
                    <FormField label="Số điện thoại" htmlFor="contactPhone">
                      <input
                        id="contactPhone"
                        className={inputClass}
                        value={business.contactPhone}
                        onChange={(e) => setBusiness((f) => ({ ...f, contactPhone: e.target.value }))}
                      />
                    </FormField>
                  </div>
                </div>
              )}
            </div>

            <FormField label="Bắt đầu với" htmlFor="seedSampleData">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: true, label: 'Dữ liệu mẫu' },
                    { value: false, label: 'Trang trống' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setBusiness((f) => ({ ...f, seedSampleData: opt.value }))}
                    className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                      business.seedSampleData === opt.value
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'border-stone-300 text-zinc-600 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-400">
                {business.seedSampleData
                  ? 'Có sẵn chi nhánh, khách hàng, gói tập, PT... để bạn khám phá hệ thống.'
                  : 'Tự thiết lập chi nhánh, khách hàng... từ đầu.'}
              </p>
            </FormField>

            {error && !emailTaken && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {emailTaken && (
              <Callout
                tone="warning"
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={resendMutation.isPending}
                    onClick={() => resendMutation.mutate()}
                  >
                    {resendMutation.isPending ? 'Đang gửi...' : 'Gửi lại mã kích hoạt'}
                  </Button>
                }
              >
                Email này đã đăng ký trước đó nhưng chưa xác thực OTP. Gửi lại mã để tiếp tục kích hoạt tài khoản cũ.
              </Callout>
            )}
            {resendMessage && <p className="text-sm text-red-600 dark:text-red-400">{resendMessage}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={mutation.isPending}>
                Quay lại
              </Button>
              <Button type="submit" size="lg" className="flex-1 justify-center" disabled={mutation.isPending}>
                {mutation.isPending ? 'Đang khởi tạo...' : 'Bắt đầu dùng thử →'}
              </Button>
            </div>
          </form>
        )}

        {step === 1 && (
          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Đã có tài khoản?{' '}
            <Link to="/owner/login" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
              Đăng nhập
            </Link>
          </p>
        )}
      </Card>
    </AuthLayout>
  );
}
