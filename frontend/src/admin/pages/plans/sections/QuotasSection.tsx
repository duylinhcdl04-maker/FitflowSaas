import { Gauge, Infinity as InfinityIcon, Prohibit, Sliders } from '@phosphor-icons/react';
import type { PlatformQuota } from '../../../api/plans';

export interface QuotaFormItem {
  quotaId: string;
  mode: 'LIMITED' | 'UNLIMITED' | 'DISABLED';
  quotaValue: number | null;
}

interface QuotasSectionProps {
  quotas: PlatformQuota[];
  quotaValues: Record<string, QuotaFormItem>;
  onUpdateQuota: (code: string, mode: 'LIMITED' | 'UNLIMITED' | 'DISABLED', value?: number | null) => void;
}

export default function QuotasSection({
  quotas,
  quotaValues,
  onUpdateQuota,
}: QuotasSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-amber-50/70 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-800/40 rounded-2xl p-4 flex items-start gap-3">
        <Gauge className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" weight="bold" />
        <div className="text-sm text-amber-900 dark:text-amber-200">
          <p className="font-bold">Dimension 4: Giới hạn tài nguyên (Resource Quotas)</p>
          <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-300/80">
            Hạn ngạch áp dụng tri-state rõ ràng:{' '}
            <span className="font-bold">Giới hạn (Limited)</span>,{' '}
            <span className="font-bold">Không giới hạn (Unlimited)</span>, hoặc{' '}
            <span className="font-bold">Vô hiệu hóa (Disabled)</span>. Không dùng số 0 làm giá trị đại diện chung.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quotas.map((q) => {
          const item = quotaValues[q.code] || {
            quotaId: q.id,
            mode: 'LIMITED',
            quotaValue: 100,
          };

          return (
            <div
              key={q.code}
              className={`p-5 rounded-2xl border transition-all shadow-xs ${
                item.mode === 'LIMITED'
                  ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  : item.mode === 'UNLIMITED'
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                  : 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{q.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium">
                      {q.code}
                    </span>
                  </div>
                  {q.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{q.description}</p>
                  )}
                </div>
              </div>

              {/* Tri-state mode selector */}
              <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => onUpdateQuota(q.code, 'LIMITED', item.quotaValue || 10)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      item.mode === 'LIMITED'
                        ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Limited</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateQuota(q.code, 'UNLIMITED', null)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      item.mode === 'UNLIMITED'
                        ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <InfinityIcon className="w-3.5 h-3.5" />
                    <span>Unlimited</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateQuota(q.code, 'DISABLED', null)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      item.mode === 'DISABLED'
                        ? 'bg-white dark:bg-zinc-900 text-rose-700 dark:text-rose-400 shadow-xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Prohibit className="w-3.5 h-3.5" />
                    <span>Disabled</span>
                  </button>
                </div>

                {/* Numeric value input when LIMITED */}
                {item.mode === 'LIMITED' ? (
                  <div className="flex items-center rounded-xl border border-zinc-200 bg-white shadow-xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-850">
                    <input
                      type="number"
                      min="1"
                      value={item.quotaValue ?? ''}
                      onChange={(e) =>
                        onUpdateQuota(
                          q.code,
                          'LIMITED',
                          e.target.value === '' ? null : Number(e.target.value),
                        )
                      }
                      placeholder="Nhập số lượng giới hạn"
                      className="h-10 w-full bg-transparent px-3 text-right font-mono text-sm font-bold text-zinc-900 focus:outline-none dark:text-zinc-100"
                    />
                    <span className="shrink-0 rounded-r-xl border-l border-zinc-100 bg-zinc-50 px-3 py-2.5 text-xs font-medium text-zinc-500 select-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                      {q.unit}
                    </span>
                  </div>
                ) : item.mode === 'UNLIMITED' ? (
                  <div className="py-2.5 px-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <InfinityIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Không giới hạn hạn mức ({q.unit}) cho tenant này</span>
                  </div>
                ) : (
                  <div className="py-2.5 px-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
                    <Prohibit className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Tài nguyên bị khóa hoàn toàn trong gói này (Cần mua Add-on)</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
