import { useState, type KeyboardEvent } from 'react';
import {
  ShieldCheck,
  LockKey,
  Clock,
  Plus,
  X,
  FloppyDisk,
  WarningCircle,
  DeviceMobile,
  CheckCircle,
} from '@phosphor-icons/react';
import type { SecuritySettings } from '../../api/settings';
import FormField, { inputClass } from '../../components/FormField';
import Button from '../../components/Button';
import Toggle from '../../components/Toggle';

interface SecurityTabProps {
  data: SecuritySettings;
  onChange: (data: SecuritySettings) => void;
  onSave: () => void;
  isSaving: boolean;
  error?: string;
  updatedAt?: string | null;
}

export default function SecurityTab({
  data,
  onChange,
  onSave,
  isSaving,
  error,
  updatedAt,
}: SecurityTabProps) {
  const [ipInput, setIpInput] = useState('');
  const [ipError, setIpError] = useState<string | null>(null);

  const ipList = data.ipAllowlist ?? [];

  const addIp = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;

    // Basic IP validation regex (IPv4 or IPv6 or CIDR)
    const ipRegex =
      /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^([a-fA-F0-9:]+:+)+[a-fA-F0-9]+(\/\d{1,3})?$/;
    if (!ipRegex.test(trimmed)) {
      setIpError('Định dạng địa chỉ IP hoặc CIDR không hợp lệ (Ví dụ: 118.69.123.45 hoặc 10.0.0.0/24)');
      return;
    }

    if (ipList.includes(trimmed)) {
      setIpError('Địa chỉ IP này đã tồn tại trong danh sách');
      return;
    }

    setIpError(null);
    onChange({ ...data, ipAllowlist: [...ipList, trimmed] });
    setIpInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addIp(ipInput);
    }
  };

  const removeIp = (targetIp: string) => {
    onChange({
      ...data,
      ipAllowlist: ipList.filter((ip) => ip !== targetIp),
    });
  };

  const addCurrentIp = () => {
    // Convenience helper
    addIp('118.69.182.204'); // Sample current IP address
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* IP Allowlist Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                  <ShieldCheck className="h-5 w-5" weight="duotone" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Bảo mật Mạng & IP Allowlist
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Chỉ cho phép các dải IP được ủy quyền truy cập vào cổng quản trị Super Admin.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Địa chỉ IP được phép (Nhập IP và nhấn Enter)
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={ipInput}
                    onChange={(e) => {
                      setIpInput(e.target.value);
                      if (ipError) setIpError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ví dụ: 118.69.123.45 hoặc 10.0.0.0/24"
                    className={inputClass}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => addIp(ipInput)}
                    className="shrink-0 flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm IP
                  </Button>
                </div>
                {ipError && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                    {ipError}
                  </p>
                )}
              </div>

              {/* Tag Badges of IPs */}
              <div className="min-h-[60px] rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                {ipList.length === 0 ? (
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Chưa cấu hình IP Allowlist (Hiện mở cho mọi IP)</span>
                    <button
                      type="button"
                      onClick={addCurrentIp}
                      className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      + Thêm IP hiện tại của bạn
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {ipList.map((ip) => (
                      <span
                        key={ip}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-mono font-medium text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
                      >
                        {ip}
                        <button
                          type="button"
                          onClick={() => removeIp(ip)}
                          className="rounded p-0.5 hover:bg-purple-200/60 text-purple-600 dark:text-purple-400 dark:hover:bg-purple-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => onChange({ ...data, ipAllowlist: [] })}
                      className="ml-auto text-xs text-red-500 hover:underline font-medium"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Session & Auth Security */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <LockKey className="h-5 w-5" weight="duotone" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Phiên làm việc & Xác thực
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Thời hạn token, tự động đăng xuất và bảo vệ tài khoản quản trị.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Thời hạn phiên đăng nhập (phút)"
                  htmlFor="sessionMinutes"
                >
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <input
                      id="sessionMinutes"
                      type="number"
                      min={10}
                      max={1440}
                      className={`${inputClass} pl-9`}
                      placeholder="60"
                      value={data.sessionMinutes ?? ''}
                      onChange={(e) =>
                        onChange({
                          ...data,
                          sessionMinutes: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                </FormField>

                <FormField
                  label="Số lần đăng nhập sai tối đa"
                  htmlFor="maxFailedLogins"
                >
                  <div className="relative">
                    <WarningCircle className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <input
                      id="maxFailedLogins"
                      type="number"
                      min={3}
                      max={10}
                      className={`${inputClass} pl-9`}
                      placeholder="5"
                      value={data.maxFailedLogins ?? ''}
                      onChange={(e) =>
                        onChange({
                          ...data,
                          maxFailedLogins: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                </FormField>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="flex items-center gap-3">
                  <DeviceMobile className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Bắt buộc xác thực hai yếu tố (2FA / OTP)
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Yêu cầu mã xác thực Authenticator app khi đăng nhập tài khoản Super Admin.
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={data.enforce2FA ?? false}
                  onChange={(checked) => onChange({ ...data, enforce2FA: checked })}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {updatedAt ? (
              <span className="text-xs text-zinc-400">
                Cập nhật lần cuối: {new Date(updatedAt).toLocaleString('vi-VN')}
              </span>
            ) : (
              <span />
            )}
            <Button
              variant="primary"
              size="md"
              disabled={isSaving}
              onClick={onSave}
              className="flex items-center gap-2 shadow-md shadow-emerald-600/20"
            >
              <FloppyDisk className="h-4 w-4" />
              {isSaving ? 'Đang lưu...' : 'Lưu cấu hình bảo mật'}
            </Button>
          </div>
        </div>

        {/* Security Recommendations sidebar (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              Tiêu chuẩn Bảo mật Khuyến nghị
            </h3>

            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" weight="fill" />
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Hạn chế IP cho môi trường Quản trị
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Nên chỉ định địa chỉ IP tĩnh của văn phòng hoặc VPN nội bộ để ngăn chặn quét cổng từ Internet.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" weight="fill" />
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Thời gian Session dưới 120 phút
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Phiên làm việc ngắn hạn giúp giảm thiểu nguy cơ bị chiếm quyền điều khiển phiên nếu quản trị viên quên khóa máy.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" weight="fill" />
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Ghi lại Audit Logs toàn diện
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Mọi thay đổi trong phần Cài đặt nền tảng đều được tự động ghi lại trong Nhật ký hệ thống (Audit Logs).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
