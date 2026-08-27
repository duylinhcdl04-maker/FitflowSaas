import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from '@phosphor-icons/react';

interface DatePickerCustomProps {
  label?: string;
  selectedDate: Date;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
}

export default function DatePickerCustom({
  label,
  selectedDate,
  onChange,
  minDate,
  maxDate,
}: DatePickerCustomProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-emerald-600 dark:text-emerald-400 z-10 pointer-events-none">
          <Calendar size={18} weight="bold" />
        </span>

        <DatePicker
          selected={selectedDate}
          onChange={onChange}
          minDate={minDate}
          maxDate={maxDate}
          dateFormat="dd/MM/yyyy"
          className="w-full rounded-2xl border border-stone-200 bg-stone-50/80 pl-10 pr-4 py-2.5 text-xs font-bold text-zinc-900 shadow-sm transition hover:border-emerald-500 hover:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          calendarClassName="custom-datepicker-calendar"
        />
      </div>
    </div>
  );
}
