import { useState, useMemo, useRef, useEffect } from 'react';
import {
  SunHorizon,
  MoonStars,
  Sparkle,
  Clock,
  Plus,
  Minus,
  CaretDown,
  Check,
} from '@phosphor-icons/react';

interface OperatingHoursPickerProps {
  openingTime: string; // e.g. "05:00"
  closingTime: string; // e.g. "22:00"
  onChange: (opening: string, closing: string) => void;
  className?: string;
}

const PRESETS = [
  { label: '05:00 - 22:00', open: '05:00', close: '22:00', badge: 'Phổ biến nhất' },
  { label: '06:00 - 22:00', open: '06:00', close: '22:00' },
  { label: '05:30 - 21:30', open: '05:30', close: '21:30' },
  { label: '24/7 (Cả ngày)', open: '00:00', close: '23:59' },
];

// Common gym opening times (04:00 - 12:00)
const OPENING_OPTIONS = [
  '04:00', '04:30', '05:00', '05:30', '06:00', '06:30',
  '07:00', '07:30', '08:00', '08:30', '09:00', '10:00', '00:00',
];

// Common gym closing times (18:00 - 24:00)
const CLOSING_OPTIONS = [
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
  '23:00', '23:30', '23:59', '00:00', '18:00', '19:00',
];

function adjustTime(timeStr: string, deltaMinutes: number): string {
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  const validH = isNaN(h) ? 0 : h;
  const validM = isNaN(m) ? 0 : m;
  let total = (validH * 60 + validM + deltaMinutes) % (24 * 60);
  if (total < 0) total += 24 * 60;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function OperatingHoursPicker({
  openingTime = '05:00',
  closingTime = '22:00',
  onChange,
  className = '',
}: OperatingHoursPickerProps) {
  const cleanOpen = openingTime.slice(0, 5) || '05:00';
  const cleanClose = closingTime.slice(0, 5) || '22:00';

  const [openDropdown, setOpenDropdown] = useState<'open' | 'close' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close custom dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Calculate daily operational duration
  const { durationText, pctStart, pctWidth } = useMemo(() => {
    const [h1, m1] = cleanOpen.split(':').map(Number);
    const [h2, m2] = cleanClose.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) {
      return { durationText: null, pctStart: 0, pctWidth: 100 };
    }

    const startMin = h1 * 60 + m1;
    let endMin = h2 * 60 + m2;
    if (endMin <= startMin) endMin += 24 * 60;

    const totalMinutes = endMin - startMin;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    let text = `${hours} tiếng / ngày`;
    if (hours >= 23 && mins >= 59) text = '24/24 (Mở liên tục)';
    else if (mins > 0) text = `${hours}h ${mins}p / ngày`;

    const startRatio = (startMin / (24 * 60)) * 100;
    const widthRatio = Math.min(100, (totalMinutes / (24 * 60)) * 100);

    return {
      durationText: text,
      pctStart: Math.min(95, Math.max(0, startRatio)),
      pctWidth: Math.min(100, Math.max(5, widthRatio)),
    };
  }, [cleanOpen, cleanClose]);

  return (
    <div className={`space-y-3.5 font-sans ${className}`} ref={containerRef}>
      {/* Header with Title & Duration Badge */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
          <Clock size={16} className="text-emerald-600 dark:text-emerald-400" />
          <span>Khung giờ hoạt động hàng ngày *</span>
        </label>
        {durationText && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-emerald-500/30">
            <Sparkle size={12} weight="fill" />
            <span>{durationText}</span>
          </span>
        )}
      </div>

      {/* Main Dual-Time Control Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Box 1: Opening Time */}
        <div className="relative rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
            <span className="flex items-center gap-1.5">
              <SunHorizon size={17} weight="bold" />
              <span>Giờ mở cửa</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500">
              Bắt đầu
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Decrement 30m */}
            <button
              type="button"
              onClick={() => onChange(adjustTime(cleanOpen, -30), cleanClose)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-all cursor-pointer active:scale-95"
              title="Giảm 30 phút"
            >
              <Minus size={14} weight="bold" />
            </button>

            {/* Time Display Button with Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'open' ? null : 'open')}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-emerald-500/30 bg-emerald-50/30 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer group"
            >
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white tracking-wider">
                {cleanOpen}
              </span>
              <CaretDown
                size={14}
                className={`text-emerald-600 transition-transform ${
                  openDropdown === 'open' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Increment 30m */}
            <button
              type="button"
              onClick={() => onChange(adjustTime(cleanOpen, 30), cleanClose)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-all cursor-pointer active:scale-95"
              title="Tăng 30 phút"
            >
              <Plus size={14} weight="bold" />
            </button>
          </div>

          {/* Custom Popover for Opening Time */}
          {openDropdown === 'open' && (
            <div className="absolute left-0 top-full mt-2 w-full z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-100">
              <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-2 uppercase tracking-wider">
                Chọn giờ mở cửa:
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {OPENING_OPTIONS.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      onChange(time, cleanClose);
                      setOpenDropdown(null);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      cleanOpen === time
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Box 2: Closing Time */}
        <div className="relative rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">
            <span className="flex items-center gap-1.5">
              <MoonStars size={17} weight="bold" />
              <span>Giờ đóng cửa</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500">
              Kết thúc
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Decrement 30m */}
            <button
              type="button"
              onClick={() => onChange(cleanOpen, adjustTime(cleanClose, -30))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-all cursor-pointer active:scale-95"
              title="Giảm 30 phút"
            >
              <Minus size={14} weight="bold" />
            </button>

            {/* Time Display Button with Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'close' ? null : 'close')}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-purple-500/30 bg-purple-50/30 hover:bg-purple-50 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 transition-colors cursor-pointer group"
            >
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white tracking-wider">
                {cleanClose}
              </span>
              <CaretDown
                size={14}
                className={`text-purple-600 transition-transform ${
                  openDropdown === 'close' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Increment 30m */}
            <button
              type="button"
              onClick={() => onChange(cleanOpen, adjustTime(cleanClose, 30))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-all cursor-pointer active:scale-95"
              title="Tăng 30 phút"
            >
              <Plus size={14} weight="bold" />
            </button>
          </div>

          {/* Custom Popover for Closing Time */}
          {openDropdown === 'close' && (
            <div className="absolute right-0 top-full mt-2 w-full z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-100">
              <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-2 uppercase tracking-wider">
                Chọn giờ đóng cửa:
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {CLOSING_OPTIONS.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      onChange(cleanOpen, time);
                      setOpenDropdown(null);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      cleanClose === time
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Timeline Bar (00:00 -> 24:00) */}
      <div className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 mb-1.5">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
        <div className="relative h-2.5 w-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-purple-500 transition-all duration-200"
            style={{
              left: `${pctStart}%`,
              width: `${pctWidth}%`,
            }}
          />
        </div>
      </div>

      {/* 1-Click Fitness Preset Buttons */}
      <div className="pt-1">
        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-1.5">
          Khung giờ phổ biến:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const isSelected = cleanOpen === p.open && cleanClose === p.close;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange(p.open, p.close)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {isSelected && <Check size={12} weight="bold" />}
                <span>{p.label}</span>
                {p.badge && !isSelected && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {p.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
