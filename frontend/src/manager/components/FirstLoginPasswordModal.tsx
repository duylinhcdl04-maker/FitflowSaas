import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { LockKey, ShieldWarning, SignOut, CheckCircle } from '@phosphor-icons/react';
import { changeManagerPassword } from '../api/manager';
import { useAuthStore } from '../../owner/store/auth-store';
import { logout } from '../../owner/api/auth';
import { apiErrorMessage } from '../../owner/api/client';
import Modal from '../../owner/components/Modal';
import Button from '../../owner/components/Button';
import FormField from '../../owner/components/FormField';
import PasswordInput from '../../owner/components/PasswordInput';
import Callout from '../../owner/components/Callout';

interface FirstLoginPasswordModalProps {
  manualOpen?: boolean;
  onCloseManual?: () => void;
}

export default function FirstLoginPasswordModal({
  manualOpen = false,
  onCloseManual,
}: FirstLoginPasswordModalProps) {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isMustChange = Boolean(user?.mustChangePassword);
  const isOpen = isMustChange || manualOpen;

  const mutation = useMutation({
    mutationFn: () => changeManagerPassword(currentPassword, newPassword),
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      setTimeout(() => {
        if (user) {
          useAuthStore.getState().setSession(
            useAuthStore.getState().accessToken!,
            { ...user, mustChangePassword: false }
          );
        }
        handleClose();
      }, 1500);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể đổi mật khẩu')),
  });

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      window.location.href = '/owner/login';
    }
  }

  function handleClose() {
    setSuccess(false);
    setError(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    if (!isMustChange && onCloseManual) {
      onCloseManual();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không khớp');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu cũ');
      return;
    }

    mutation.mutate();
  }

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={isMustChange ? () => {} : handleClose}
      title={isMustChange ? 'Đặt lại mật khẩu lần đầu đăng nhập' : 'Đổi mật khẩu tài khoản'}
    >
      <div className="flex flex-col gap-4">
        {isMustChange ? (
          <Callout tone="warning">
            <div className="flex items-center gap-2">
              <ShieldWarning size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Đây là lần đầu tiên bạn đăng nhập với mật khẩu mặc định/tạm thời do Owner cấp. Để bảo vệ tài khoản chi nhánh, vui lòng đổi sang mật khẩu mới.
              </span>
            </div>
          </Callout>
        ) : (
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Vui lòng nhập mật khẩu hiện tại và mật khẩu cá nhân mới của bạn để bảo mật tài khoản.
          </p>
        )}

        {success ? (
          <div className="py-6 text-center flex flex-col items-center gap-2">
            <CheckCircle size={48} className="text-emerald-600 dark:text-emerald-400 animate-bounce" />
            <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Đổi mật khẩu thành công!
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Mật khẩu mới của bạn đã được cập nhật an toàn.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField label="Mật khẩu hiện tại *" htmlFor="curr-pwd">
              <PasswordInput
                id="curr-pwd"
                required
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Nhập mật khẩu hiện tại"
              />
            </FormField>

            <FormField label="Mật khẩu mới (ít nhất 6 ký tự) *" htmlFor="new-pwd">
              <PasswordInput
                id="new-pwd"
                required
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Nhập mật khẩu cá nhân mới"
              />
            </FormField>

            <FormField label="Xác nhận mật khẩu mới *" htmlFor="confirm-pwd">
              <PasswordInput
                id="confirm-pwd"
                required
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Nhập lại mật khẩu mới"
              />
            </FormField>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex justify-between items-center mt-2 pt-2 border-t border-stone-100 dark:border-zinc-800">
              {isMustChange ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 flex items-center gap-1 font-medium"
                >
                  <SignOut size={14} /> Đăng xuất
                </button>
              ) : (
                <Button type="button" variant="secondary" onClick={handleClose}>
                  Hủy
                </Button>
              )}

              <Button type="submit" disabled={mutation.isPending} className="gap-1.5">
                <LockKey size={16} />
                {mutation.isPending ? 'Đang lưu...' : 'Xác nhận đặt mật khẩu'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
