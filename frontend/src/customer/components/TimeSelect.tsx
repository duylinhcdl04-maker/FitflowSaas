import { useState, useRef, useEffect } from 'react';
import { Clock, CaretDown, Check } from '@phosphor-icons/react';

interface TimeSelectProps {
  label?: string;
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  disabled?: boolean;
  align?: 'left' | 'right';
}

const HOURS = Array.from({ length: 16 }, (_, i) => String(i + 6).padStart(2, '0')); // 06..21
const MINUTES = ['00', '15', '30', '45'];

export default function TimeSelect({
  label,
  value,
  onChange,
  disabled = false,
  align = 'left',
}: TimeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentHour, currentMinute] = value ? value.split(':') : ['09', '00'];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHourSelect = (h: string) => {
    onChange(`${h}:${currentMinute || '00'}`);
  };

  const handleMinuteSelect = (m: string) => {
    onChange(`${currentHour || '09'}:${m}`);
  };

  const alignClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-1.5 rounded-2xl border border-stone-200 bg-stone-50/80 px-3 py-2 text-xs font-semibold text-zinc-900 shadow-sm transition hover:border-emerald-500 hover:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:border-emerald-500"
      >
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Clock size={14} weight="bold" />
          </span>
          <span className="font-mono text-xs font-bold tracking-wide">
            {value || '09:00'}
          </span>
        </div>
        <CaretDown
          size={13}
          className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className={`absolute ${alignClass} top-full z-50 mt-1.5 w-64 rounded-2xl border border-stone-200 bg-white p-3 shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-150`}>
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-stone-100 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
            <span>Chọn giờ & phút</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs font-extrabold">{currentHour}:{currentMinute}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Hours Column */}
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-1">Giờ (Hour)</span>
              <div className="max-h-32 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
                {HOURS.map((h) => {
                  const isSelected = h === currentHour;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleHourSelect(h)}
                      className={`w-full flex items-center justify-between rounded-lg px-2 py-1 text-[11px] font-mono font-bold transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-zinc-700 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span>{h} giờ</span>
                      {isSelected && <Check size={11} weight="bold" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes Column */}
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-1">Phút (Min)</span>
              <div className="space-y-1">
                {MINUTES.map((m) => {
                  const isSelected = m === currentMinute;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMinuteSelect(m)}
                      className={`w-full flex items-center justify-between rounded-lg px-2 py-1 text-[11px] font-mono font-bold transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-zinc-700 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span>:{m}</span>
                      {isSelected && <Check size={11} weight="bold" />}
                    </button>
                  );
                })}
              </div>

              {/* Presets */}
              <div className="mt-2 pt-1.5 border-t border-stone-100 dark:border-zinc-800">
                <span className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Nhanh</span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {['08:00', '09:00', '14:00', '17:00'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        onChange(preset);
                        setIsOpen(false);
                      }}
                      className="rounded-md bg-stone-100 py-0.5 text-center font-mono font-semibold text-zinc-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-stone-100 dark:border-zinc-800 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition shadow-sm"
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
