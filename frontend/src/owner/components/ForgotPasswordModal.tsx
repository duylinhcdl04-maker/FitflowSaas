import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { forgotPassword, resetPassword } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import Modal from './Modal';
import Button from './Button';
import FormField, { inputClass } from './FormField';
import PasswordInput from './PasswordInput';

export default function ForgotPasswordModal({
  open,
  onClose,
  initialEmail = '',
}: {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState(initialEmail);
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const requestOtpMutation = useMutation({
    mutationFn: () => forgotPassword(email),
    onSuccess: (data) => {
      setUserId(data.userId);
      setStep(2);
      setError(null);
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Không thể gửi mã xác nhận khôi phục mật khẩu'));
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetPassword(userId, code, newPassword),
    onSuccess: (data) => {
      setSuccessMessage(data.message || 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
      setError(null);
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Không thể đặt lại mật khẩu'));
    },
  });

  function handleClose() {
    setStep(1);
    setError(null);
    setSuccessMessage(null);
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  }

  function handleRequestOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    requestOtpMutation.mutate();
  }

  function handleResetSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    resetMutation.mutate();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Quên mật khẩu">
      {successMessage ? (
        <div className="flex flex-col gap-4 text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-xl">
            ✓
          </div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{successMessage}</p>
          <Button type="button" onClick={handleClose} className="mt-2 w-full justify-center">
            Đăng nhập ngay
          </Button>
        </div>
      ) : step === 1 ? (
        <form onSubmit={handleRequestOtpSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nhập địa chỉ email đăng ký tài khoản Owner của bạn. Chúng tôi sẽ gửi mã xác thực OTP gồm 6 chữ số đến email này.
          </p>

          <FormField label="Email tài khoản Owner *" htmlFor="forgot-email">
            <input
              id="forgot-email"
              type="email"
              required
              className={inputClass}
              placeholder="owner@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={requestOtpMutation.isPending}>
              {requestOtpMutation.isPending ? 'Đang gửi...' : 'Gửi mã OTP'}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
          <div className="rounded-xl bg-stone-100 p-3 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
            Mã OTP đã được gửi đến <span className="font-semibold text-zinc-900 dark:text-zinc-100">{email}</span>. Vui lòng kiểm tra hộp thư.
          </div>

          <FormField label="Mã xác nhận OTP (6 số) *" htmlFor="reset-code">
            <input
              id="reset-code"
              type="text"
              required
              maxLength={6}
              className={`${inputClass} tracking-widest font-mono text-center text-lg`}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </FormField>

          <FormField label="Mật khẩu mới *" htmlFor="reset-new-password">
            <PasswordInput
              id="reset-new-password"
              required
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={setNewPassword}
            />
          </FormField>

          <FormField label="Xác nhận mật khẩu mới *" htmlFor="reset-confirm-password">
            <PasswordInput
              id="reset-confirm-password"
              required
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          </FormField>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-between items-center mt-2">
            <button
              type="button"
              onClick={() => {
                setError(null);
                requestOtpMutation.mutate();
              }}
              disabled={requestOtpMutation.isPending}
              className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              {requestOtpMutation.isPending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
            </button>

            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={resetMutation.isPending}>
                {resetMutation.isPending ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
