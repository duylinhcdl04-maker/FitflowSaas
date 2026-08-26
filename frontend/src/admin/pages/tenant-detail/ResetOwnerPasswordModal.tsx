import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { resetOwnerPassword } from '../../api/tenants';
import { apiErrorMessage } from '../../api/client';
import Modal from '../../components/Modal';
import Callout from '../../components/Callout';
import FormField, { inputClass } from '../../components/FormField';
import Button from '../../components/Button';

export default function ResetOwnerPasswordModal({
  tenantId,
  onClose,
}: {
  tenantId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ownerEmail: string; ownerFullName: string; temporaryPassword: string } | null>(
    null,
  );

  const mutation = useMutation({
    mutationFn: () => resetOwnerPassword(tenantId, reason),
    onSuccess: setResult,
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <Modal
      title="Đặt lại mật khẩu Owner"
      onClose={onClose}
      footer={
        result ? (
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Huỷ
            </Button>
            <Button
              variant="primary"
              disabled={mutation.isPending || reason.length < 5}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </Button>
          </div>
        )
      }
    >
      {result ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Đã đặt lại mật khẩu cho <span className="font-medium text-zinc-900 dark:text-zinc-50">{result.ownerFullName}</span> (
            {result.ownerEmail}).
          </p>
          <Callout tone="warning" title="Mật khẩu tạm thời">
            <p>Hệ thống chưa gửi email tự động, hãy chuyển thủ công cho Owner qua kênh hỗ trợ đang dùng.</p>
            <p className="font-mono mt-2 select-all rounded-md bg-white/70 px-2.5 py-1.5 text-sm font-semibold text-amber-900 dark:bg-black/20 dark:text-amber-200">
              {result.temporaryPassword}
            </p>
          </Callout>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-500">
            Chỉ dùng khi Owner mất quyền truy cập tài khoản. Hành động này được ghi vào Audit Log.
          </p>
          <FormField label="Lý do (bắt buộc)" htmlFor="reset-reason">
            <textarea
              id="reset-reason"
              required
              rows={3}
              className={inputClass}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
