import { Package, CheckCircle } from '@phosphor-icons/react';
import type { Addon, Plan } from '../../../api/plans';

interface AddonsSectionProps {
  plan: Plan;
  addons: Addon[];
}

export default function AddonsSection({ plan, addons }: AddonsSectionProps) {
  const compatibleAddons = addons.filter(
    (a) =>
      a.compatible_plan_codes.length === 0 ||
      a.compatible_plan_codes.includes(plan.code),
  );

  return (
    <div className="space-y-6">
      <div className="bg-cyan-50/70 border border-cyan-200/80 dark:bg-cyan-950/20 dark:border-cyan-800/40 rounded-2xl p-4 flex items-start gap-3">
        <Package className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-0.5 shrink-0" weight="bold" />
        <div className="text-sm text-cyan-900 dark:text-cyan-200">
          <p className="font-bold">Dimension 6: Tiện ích mở rộng tương thích (Add-ons Catalog)</p>
          <p className="mt-0.5 text-xs text-cyan-700/80 dark:text-cyan-300/80">
            Cơ chế mở rộng tài nguyên và tính năng không làm gãy kiến trúc gói cơ sở. Công thức tính toán quyền hạn hiệu dụng:
          </p>
          <div className="mt-2.5 p-2.5 bg-white dark:bg-zinc-900 border border-cyan-300/60 dark:border-cyan-800/60 rounded-xl font-mono text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 shadow-xs">
            <span className="text-zinc-600 dark:text-zinc-400 font-sans font-semibold">Công thức:</span>
            <span>Base Plan + Active Add-ons = Effective Entitlement</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {compatibleAddons.map((addon) => {
          const isResource = addon.addon_type === 'RESOURCE';
          const isFeature = addon.addon_type === 'FEATURE';

          return (
            <div
              key={addon.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      isResource
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
                        : isFeature
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40'
                    }`}
                  >
                    {addon.addon_type} ADD-ON
                  </span>
                  <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    +{new Intl.NumberFormat('vi-VN').format(Number(addon.price))} VND
                  </span>
                </div>

                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-1">{addon.name}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                  {addon.description}
                </p>

                {addon.addon_quotas && addon.addon_quotas.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {addon.addon_quotas.map((aq, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 px-2.5 py-1 rounded-lg flex items-center justify-between"
                      >
                        <span className="text-zinc-600 dark:text-zinc-400 font-medium">{aq.platform_quotas?.name}</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">
                          +{aq.added_value} {aq.platform_quotas?.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <span>Mã: <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold">{addon.code}</span></span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                  <CheckCircle className="w-3.5 h-3.5" weight="bold" />
                  Khả dụng
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
