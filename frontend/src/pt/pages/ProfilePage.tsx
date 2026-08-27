import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UserGear,
  Clock,
  Certificate,
  FloppyDisk,
  EnvelopeSimple,
  Phone,
} from '@phosphor-icons/react';
import { getPtWorkingHours, updatePtWorkingHours, type PtWorkingHour } from '../api/pt';
import { useAuthStore } from '../../owner/store/auth-store';
import { Skeleton } from '../../owner/components/Skeleton';
import { showToast } from '../../owner/utils/swal';

const WEEKDAYS = [
  { id: 1, label: 'Thứ Hai' },
  { id: 2, label: 'Thứ Ba' },
  { id: 3, label: 'Thứ Tư' },
  { id: 4, label: 'Thứ Năm' },
  { id: 5, label: 'Thứ Sáu' },
  { id: 6, label: 'Thứ Bảy' },
  { id: 7, label: 'Chủ Nhật' },
];

interface DayHours {
  weekday: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

// Safely converts ISO datetime string or HH:mm time string into HH:mm
function toHHMM(isoOrTime: string): string {
  if (!isoOrTime) return '08:00';
  if (/^\d{2}:\d{2}/.test(isoOrTime)) {
    return isoOrTime.substring(0, 5);
  }
  const d = new Date(isoOrTime);
  if (isNaN(d.getTime())) return '08:00';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Seeds all 7 weekdays from whatever the PT already saved — a day with no saved row
// starts `enabled: false` (previously: Sunday specifically could never even be
// configured, because the old hardcoded default state only ever had 6 entries and
// the onChange handler was a `.map()` that silently no-ops for a missing weekday).
function buildInitialHours(saved: PtWorkingHour[]): DayHours[] {
  const byWeekday = new Map(saved.map((h) => [h.weekday, h]));
  return WEEKDAYS.map((day) => {
    const existing = byWeekday.get(day.id);
    return existing
      ? { weekday: day.id, enabled: true, startTime: toHHMM(existing.start_time), endTime: toHHMM(existing.end_time) }
      : { weekday: day.id, enabled: false, startTime: '08:00', endTime: '17:00' };
  });
}

export default function PtProfilePage() {
  const user = useAuthStore((s) => s.user);
  const hoursQuery = useQuery({ queryKey: ['pt-working-hours'], queryFn: getPtWorkingHours });

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
        {hoursQuery.isLoading ? (
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <WorkingHoursCard key={hoursQuery.dataUpdatedAt} initialHours={hoursQuery.data ?? []} />
        )}
      </div>
    </div>
  );
}

// Split out so `workingHours`'s initial state can read straight from the already-loaded
// query data (a plain lazy useState initializer) instead of a query→effect→setState sync
// — this component only mounts once `hoursQuery` has actually resolved. `key={dataUpdatedAt}`
// on the parent's usage re-mounts it (re-seeding state) after a save invalidates the query.
function WorkingHoursCard({ initialHours }: { initialHours: PtWorkingHour[] }) {
  const queryClient = useQueryClient();
  const [workingHours, setWorkingHours] = useState<DayHours[]>(() => buildInitialHours(initialHours));
  const [saved, setSaved] = useState(false);

  const hoursMutation = useMutation({
    mutationFn: async () => {
      for (const day of workingHours) {
        if (day.enabled && day.startTime >= day.endTime) {
          const weekdayLabel = WEEKDAYS.find((w) => w.id === day.weekday)?.label || `Thứ ${day.weekday}`;
          throw new Error(`${weekdayLabel}: Giờ kết thúc phải muộn hơn giờ bắt đầu.`);
        }
      }
      return updatePtWorkingHours(
        workingHours.filter((h) => h.enabled).map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime })),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-working-hours'] });
      setSaved(true);
      showToast('Cập nhật khung giờ làm việc thành công!', 'success');
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu khung giờ làm việc';
      const formattedMsg = Array.isArray(msg) ? msg.join(', ') : msg;
      showToast(formattedMsg, 'error');
    },
  });

  function updateDay(weekday: number, patch: Partial<DayHours>) {
    setWorkingHours((prev) => prev.map((h) => (h.weekday === weekday ? { ...h, ...patch } : h)));
  }

  const enabledCount = workingHours.filter((h) => h.enabled).length;

  return (
    <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
        <div>
          <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Thiết Lập Khung Giờ Làm Việc Theo Tuần
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Hội viên chỉ có thể chọn ca đặt lịch trong khung giờ khả dụng bạn thiết lập dưới đây.
            {enabledCount === 0 && (
              <span className="ml-1 font-bold text-amber-600 dark:text-amber-400">
                Bạn chưa bật ngày làm việc nào — hội viên sẽ không đặt được lịch.
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          disabled={hoursMutation.isPending}
          onClick={() => hoursMutation.mutate()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
        >
          <FloppyDisk className="h-4 w-4" />
          <span>{hoursMutation.isPending ? 'Đang lưu...' : saved ? 'Đã lưu!' : 'Lưu Thay Đổi'}</span>
        </button>
      </div>

      <div className="space-y-3">
        {WEEKDAYS.map((day) => {
          const current = workingHours.find((h) => h.weekday === day.id)!;

          return (
            <div
              key={day.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-xs transition-colors ${
                current.enabled
                  ? 'border-slate-200/80 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800/40'
                  : 'border-dashed border-slate-200 bg-white dark:border-zinc-800 dark:bg-transparent'
              }`}
            >
              <label className="flex w-32 shrink-0 items-center gap-2">
                <input
                  type="checkbox"
                  checked={current.enabled}
                  onChange={(e) => updateDay(day.id, { enabled: e.target.checked })}
                  className="h-4 w-4 rounded accent-emerald-600"
                />
                <span className={`font-extrabold ${current.enabled ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-500'}`}>
                  {day.label}
                </span>
              </label>

              {current.enabled ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">Từ:</span>
                  <input
                    type="time"
                    value={current.startTime}
                    onChange={(e) => updateDay(day.id, { startTime: e.target.value })}
                    className="rounded-lg border border-slate-300 p-1.5 font-mono text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">Đến:</span>
                  <input
                    type="time"
                    value={current.endTime}
                    onChange={(e) => updateDay(day.id, { endTime: e.target.value })}
                    className="rounded-lg border border-slate-300 p-1.5 font-mono text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              ) : (
                <span className="text-slate-400 dark:text-zinc-500">Nghỉ</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
