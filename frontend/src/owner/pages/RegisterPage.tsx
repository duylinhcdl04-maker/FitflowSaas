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
      <Card className="relative w-full max-w-lg">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="font-['Be_Vietnam_Pro',sans-serif] text-2xl font-black text-white">
            {step === 1 ? 'Khởi tạo tài khoản FitFlow' : 'Thiết lập phòng gym của bạn'}
          </h1>
          <p className="font-['Plus_Jakarta_Sans',sans-serif] text-sm text-[#A7A1AD]">
            {step === 1 ? '14 ngày trải nghiệm đầy đủ tính năng, không cần thẻ tín dụng' : 'Chỉ mất 1 phút để đồng bộ hệ thống'}
          </p>
          <div className="flex gap-2 mt-2">
            <span className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-purple-600 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'bg-white/10'}`} />
            <span className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-purple-600 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'bg-white/10'}`} />
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="mt-8 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Họ và tên" htmlFor="fullName">
                <input
                  id="fullName"
                  required
                  placeholder="Nguyễn Văn A"
                  className={inputClass}
                  value={account.fullName}
                  onChange={(e) => setAccount((f) => ({ ...f, fullName: e.target.value }))}
                />
              </FormField>
              <FormField label="Số điện thoại" htmlFor="phone">
                <input
                  id="phone"
                  placeholder="0987654321"
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
                placeholder="chuphong@gmail.com"
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
            {error && <p className="text-sm text-rose-400 font-medium">{error}</p>}
            <Button type="submit" size="lg" className="w-full justify-center mt-2">
              Tiếp tục thiết lập phòng gym →
            </Button>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="mt-8 flex flex-col gap-4">
            <FormField label="Tên phòng tập / thương hiệu" htmlFor="businessName">
              <input
                id="businessName"
                required
                placeholder="FitFlow Fitness & Yoga"
                className={inputClass}
                value={business.businessName}
                onChange={(e) => {
                  const name = e.target.value;
                  setBusiness((f) => ({
                    ...f,
                    businessName: name,
                    brandSlug: slugTouched ? f.brandSlug : slugify(name),
                  }));
                }}
              />
            </FormField>

            <FormField label="Địa chỉ truy cập" htmlFor="brandSlug">
              <div className="flex overflow-hidden rounded-xl border border-white/10 bg-[#151119] focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                <input
                  id="brandSlug"
                  required
                  placeholder="fitflow-cau-giay"
                  pattern="[a-z0-9\\-]{2,50}"
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-[#F5F3F7] placeholder:text-[#6F6877] focus:outline-none"
                  value={business.brandSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setBusiness((f) => ({ ...f, brandSlug: e.target.value.toLowerCase() }));
                  }}
                />
                <span className="flex shrink-0 items-center bg-[#1B1521] px-3.5 text-xs font-['JetBrains_Mono'] text-purple-300/80 border-l border-white/8">
                  .fitfloww.store
                </span>
              </div>
              <p className="text-xs text-[#7A7485]">Địa chỉ đăng nhập trực tiếp cho phòng gym của bạn.</p>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Loại hình" htmlFor="businessType">
                <select
                  id="businessType"
                  className={`${inputClass} bg-[#151119] text-[#F5F3F7]`}
                  value={business.businessType}
                  onChange={(e) => setBusiness((f) => ({ ...f, businessType: e.target.value }))}
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-[#151119] text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Địa chỉ (không bắt buộc)" htmlFor="address">
                <input
                  id="address"
                  placeholder="Quận / Thành phố"
                  className={inputClass}
                  value={business.address}
                  onChange={(e) => setBusiness((f) => ({ ...f, address: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="rounded-xl bg-[#151119] p-3.5 border border-white/8">
              {!contactOverride ? (
                <div className="flex items-center justify-between gap-3 text-sm font-['Plus_Jakarta_Sans',sans-serif]">
                  <div className="min-w-0">
                    <p className="text-xs text-[#A7A1AD]">Liên hệ doanh nghiệp</p>
                    <p className="truncate font-semibold text-white">
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
                    className="shrink-0 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Dùng liên hệ khác
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#A7A1AD]">Liên hệ doanh nghiệp</p>
                    <button
                      type="button"
                      onClick={() => setContactOverride(false)}
                      className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
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
                    { value: true, label: 'Dữ liệu mẫu (Khuyên dùng)' },
                    { value: false, label: 'Dữ liệu trống' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setBusiness((f) => ({ ...f, seedSampleData: opt.value }))}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
                      business.seedSampleData === opt.value
                        ? 'border-purple-500 bg-purple-950/60 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                        : 'border-white/10 bg-[#151119] text-[#A7A1AD] hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#7A7485]">
                {business.seedSampleData
                  ? 'Có sẵn chi nhánh, hội viên, gói tập, PT... để bạn dễ dàng trải nghiệm.'
                  : 'Tự thiết lập dữ liệu từ đầu.'}
              </p>
            </FormField>

            {error && !emailTaken && <p className="text-sm text-rose-400 font-medium">{error}</p>}
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
            {resendMessage && <p className="text-sm text-rose-400 font-medium">{resendMessage}</p>}
            <div className="flex gap-3 mt-2">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={mutation.isPending}>
                ← Quay lại
              </Button>
              <Button type="submit" size="lg" className="flex-1 justify-center" disabled={mutation.isPending}>
                {mutation.isPending ? 'Đang khởi tạo...' : 'Bắt đầu dùng thử FitFlow →'}
              </Button>
            </div>
          </form>
        )}

        {step === 1 && (
          <p className="mt-8 text-center text-sm font-['Plus_Jakarta_Sans',sans-serif] text-[#A7A1AD]">
            Đã có tài khoản?{' '}
            <Link to="/owner/login" className="font-bold text-purple-400 hover:text-purple-300 transition-colors">
              Đăng nhập
            </Link>
          </p>
        )}
      </Card>
    </AuthLayout>
  );
}
