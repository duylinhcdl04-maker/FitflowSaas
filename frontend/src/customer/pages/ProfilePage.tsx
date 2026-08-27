import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Check, IdentificationBadge, Key, ShieldCheck } from '@phosphor-icons/react';
import { getCustomerProfile, submitFaceConsent, updateCustomerProfile, type CustomerProfile } from '../api/customer';
import { apiErrorMessage } from '../../owner/api/client';
import Card from '../../owner/components/Card';
import Button from '../../owner/components/Button';
import FormField, { inputClass } from '../../owner/components/FormField';
import { Skeleton } from '../../owner/components/Skeleton';

function toDateInputValue(d?: string | null) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

type Message = { type: 'success' | 'error'; text: string } | null;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileQuery = useQuery({ queryKey: ['customer-profile'], queryFn: getCustomerProfile });
  const [message, setMessage] = useState<Message>(null);

  const faceMutation = useMutation({
    mutationFn: (imageDataUrl: string) => submitFaceConsent(imageDataUrl),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Đã cập nhật ảnh nhận diện khuôn mặt!' });
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
    },
    onError: (err) => setMessage({ type: 'error', text: apiErrorMessage(err, 'Không thể cập nhật ảnh') }),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') faceMutation.mutate(reader.result);
    };
    reader.readAsDataURL(file);
  }

  const profile = profileQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Cập nhật thông tin liên lạc và ảnh nhận diện khuôn mặt để check-in nhanh hơn.</p>
      </div>

      {message && (
        <div
          className={`rounded-2xl p-4 text-sm font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Avatar / Face ID */}
      <Card className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <div className="relative shrink-0">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-2xl font-black text-white shadow-md">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Ảnh đại diện" className="h-full w-full object-cover" />
            ) : (
              (profile?.fullName || 'HV').slice(0, 2).toUpperCase()
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-md hover:bg-emerald-700 dark:border-zinc-900"
            title="Cập nhật ảnh khuôn mặt"
          >
            <Camera size={14} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">{profile?.fullName}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Mã hội viên: <span className="font-mono">{profile?.customerCode}</span>
          </p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 sm:justify-start dark:text-emerald-400">
            <ShieldCheck size={14} weight="fill" />
            {profile?.faceConsentAt ? 'Đã đăng ký nhận diện khuôn mặt' : 'Chưa đăng ký nhận diện khuôn mặt'}
          </p>
        </div>
      </Card>

      {/* Contact info */}
      {profileQuery.isLoading || !profile ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <ContactInfoForm profile={profile} onMessage={setMessage} />
      )}

      <Card className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <Key size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Mật khẩu tài khoản</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Đổi mật khẩu tại menu tài khoản (biểu tượng avatar) ở góc trên bên phải.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Split out so `form`'s initial values can come straight from the `profile` prop
// (a plain lazy useState initializer) instead of a query→effect→setState sync —
// this component only mounts once `profile` is actually loaded.
function ContactInfoForm({ profile, onMessage }: { profile: CustomerProfile; onMessage: (m: Message) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({
    phone: profile.phone ?? '',
    address: profile.address ?? '',
    dateOfBirth: toDateInputValue(profile.dateOfBirth),
    gender: profile.gender ?? '',
    emergencyContactName: profile.emergencyContactName ?? '',
    emergencyContactPhone: profile.emergencyContactPhone ?? '',
  }));

  const updateMutation = useMutation({
    mutationFn: () => updateCustomerProfile(form),
    onSuccess: () => {
      onMessage({ type: 'success', text: 'Đã cập nhật thông tin cá nhân!' });
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
    },
    onError: (err) => onMessage({ type: 'error', text: apiErrorMessage(err, 'Không thể cập nhật thông tin') }),
  });

  return (
    <Card>
      <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
        <IdentificationBadge size={20} className="text-emerald-600 dark:text-emerald-400" /> Thông tin liên lạc
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateMutation.mutate();
        }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <FormField label="Email" htmlFor="p-email" hint="Liên hệ nhân viên để thay đổi email">
          <input id="p-email" disabled value={profile.email ?? ''} className={`${inputClass} opacity-60`} />
        </FormField>
        <FormField label="Số điện thoại" htmlFor="p-phone">
          <input
            id="p-phone"
            className={inputClass}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </FormField>
        <FormField label="Ngày sinh" htmlFor="p-dob">
          <input
            id="p-dob"
            type="date"
            className={inputClass}
            value={form.dateOfBirth}
            onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
          />
        </FormField>
        <FormField label="Giới tính" htmlFor="p-gender">
          <select
            id="p-gender"
            className={inputClass}
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
          >
            <option value="">Không chọn</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </FormField>
        <FormField label="Địa chỉ" htmlFor="p-address">
          <input
            id="p-address"
            className={inputClass}
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </FormField>
        <FormField label="Người liên hệ khẩn cấp" htmlFor="p-ec-name">
          <input
            id="p-ec-name"
            className={inputClass}
            value={form.emergencyContactName}
            onChange={(e) => setForm((f) => ({ ...f, emergencyContactName: e.target.value }))}
          />
        </FormField>
        <FormField label="SĐT liên hệ khẩn cấp" htmlFor="p-ec-phone">
          <input
            id="p-ec-phone"
            className={inputClass}
            value={form.emergencyContactPhone}
            onChange={(e) => setForm((f) => ({ ...f, emergencyContactPhone: e.target.value }))}
          />
        </FormField>

        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending} className="gap-1.5">
            <Check size={16} />
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
