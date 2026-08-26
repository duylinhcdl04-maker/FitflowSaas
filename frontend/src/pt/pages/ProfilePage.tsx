import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserGear,
  Clock,
  Certificate,
  FloppyDisk,
  EnvelopeSimple,
  Phone,
} from '@phosphor-icons/react';
import { updatePtWorkingHours } from '../api/pt';
import { useAuthStore } from '../../owner/store/auth-store';

export default function PtProfilePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const weekdays = [
    { id: 1, label: 'Thứ Hai' },
    { id: 2, label: 'Thứ Ba' },
    { id: 3, label: 'Thứ Tư' },
    { id: 4, label: 'Thứ Năm' },
    { id: 5, label: 'Thứ Sáu' },
    { id: 6, label: 'Thứ Bảy' },
    { id: 7, label: 'Chủ Nhật' },
  ];

  const [workingHours, setWorkingHours] = useState([
    { weekday: 1, startTime: '06:00', endTime: '12:00' },
    { weekday: 2, startTime: '06:00', endTime: '12:00' },
    { weekday: 3, startTime: '06:00', endTime: '12:00' },
    { weekday: 4, startTime: '06:00', endTime: '12:00' },
    { weekday: 5, startTime: '06:00', endTime: '12:00' },
    { weekday: 6, startTime: '08:00', endTime: '16:00' },
  ]);

  const hoursMutation = useMutation({
    mutationFn: () => updatePtWorkingHours(workingHours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-working-hours'] });
      alert('Đã cập nhật khung giờ làm việc thành công!');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <UserGear className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /> Hồ Sơ Chuyên Môn & Lịch Khả Dụng
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
          Cập nhật thông tin cá nhân, chứng chỉ chuyên môn và thiết lập khung giờ làm việc khả dụng để học viên đặt lịch.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Personal Profile Info Card */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-3xl shadow-lg shadow-emerald-500/20">
              {user?.fullName?.charAt(0) || 'P'}
            </div>
            <h2 className="mt-3 font-extrabold text-lg text-slate-900 dark:text-white">
              {user?.fullName || 'Huấn Luyện Viên'}
            </h2>
            <span className="mt-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[11px] font-black uppercase text-emerald-800 dark:text-emerald-300">
              PERSONAL TRAINER
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
              <EnvelopeSimple className="h-4 w-4 text-emerald-600" />
              <span>Email: <strong>{user?.email || 'N/A'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
              <Phone className="h-4 w-4 text-emerald-600" />
              <span>SĐT: <strong>{(user as any)?.phone || 'Chưa cập nhật'}</strong></span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <Certificate className="h-4 w-4 text-emerald-600" /> Bằng Cấp & Chứng Chỉ:
            </h3>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 font-bold border border-emerald-200 dark:border-emerald-900">
                NASM Certified Personal Trainer
              </span>
              <span className="rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 font-bold border border-emerald-200 dark:border-emerald-900">
                CPR / AED First Aid
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Working Hours Setup Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Thiết Lập Khung Giờ Làm Việc Theo Tuần
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Hội viên chỉ có thể chọn ca đặt lịch trong khung giờ khả dụng bạn thiết lập dưới đây.
              </p>
            </div>

            <button
              type="button"
              disabled={hoursMutation.isPending}
              onClick={() => hoursMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <FloppyDisk className="h-4 w-4" />
              <span>{hoursMutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {weekdays.map((day) => {
              const current = workingHours.find((h) => h.weekday === day.id);

              return (
                <div
                  key={day.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800/40 text-xs"
                >
                  <span className="font-extrabold text-slate-900 dark:text-white w-24">{day.label}</span>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-zinc-400 font-medium">Từ:</span>
                    <input
                      type="time"
                      value={current?.startTime || '08:00'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWorkingHours((prev) =>
                          prev.map((h) => (h.weekday === day.id ? { ...h, startTime: val } : h))
                        );
                      }}
                      className="rounded-lg border border-slate-300 p-1.5 font-mono text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />

                    <span className="text-slate-500 dark:text-zinc-400 font-medium">Đến:</span>
                    <input
                      type="time"
                      value={current?.endTime || '12:00'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWorkingHours((prev) =>
                          prev.map((h) => (h.weekday === day.id ? { ...h, endTime: val } : h))
                        );
                      }}
                      className="rounded-lg border border-slate-300 p-1.5 font-mono text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
