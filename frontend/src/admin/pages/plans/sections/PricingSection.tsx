import type { Dispatch, SetStateAction } from 'react';
import { CurrencyDollar, Percent, Plus, Trash, CheckCircle } from '@phosphor-icons/react';
import type { PlanPrice } from '../../../api/plans';

interface PricingSectionProps {
  price: number;
  setPrice: (v: number) => void;
  currency: string;
  setCurrency: (v: string) => void;
  prices: PlanPrice[];
  setPrices: Dispatch<SetStateAction<PlanPrice[]>>;
}

const inputClass =
  'bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all shadow-xs';

export default function PricingSection({
  price,
  setPrice,
  currency,
  setCurrency,
  prices,
  setPrices,
}: PricingSectionProps) {
  const formatMoney = (val: number) =>
    new Intl.NumberFormat('vi-VN').format(val) + ' ' + currency;

  const handleUpdatePriceRow = (
    index: number,
    field: keyof PlanPrice,
    value: any,
  ) => {
    const updated = [...prices];
    updated[index] = { ...updated[index], [field]: value };
    setPrices(updated);
  };

  const handleAddCycle = () => {
    const months = 6;
    const exists = prices.some((p) => p.billing_cycle_months === months);
    if (exists) return;

    setPrices([
      ...prices,
      {
        billing_cycle: 'SEMI_ANNUAL',
        billing_cycle_months: 6,
        price: Math.round(price * 6 * 0.9),
        currency: 'VND',
        discount_percentage: 10,
        is_active: true,
      },
    ]);
  };

  const handleRemoveCycle = (index: number) => {
    setPrices(prices.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50/70 border border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/40 rounded-2xl p-4 flex items-start gap-3">
        <CurrencyDollar className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" weight="bold" />
        <div className="text-sm text-emerald-900 dark:text-emerald-200">
          <p className="font-bold">Dimension 2: Giá & Chu kỳ thanh toán (Pricing & Billing)</p>
          <p className="mt-0.5 text-xs text-emerald-700/80 dark:text-emerald-300/80">
            Hỗ trợ bảng giá linh hoạt đa chu kỳ (Tháng, Quý, Năm) với tỷ lệ chiết khấu hấp dẫn để khuyến khích cam kết dài hạn.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
            Giá niêm yết cơ sở (1 Tháng) <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center rounded-xl border border-zinc-200 bg-white shadow-xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-850">
            <input
              type="number"
              step="10000"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              className="h-11 w-full bg-transparent px-3.5 text-right font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
            />
            <span className="shrink-0 rounded-r-xl border-l border-zinc-100 bg-zinc-50 px-3.5 py-3 text-xs font-bold text-zinc-500 select-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
              {currency}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Tương đương: {formatMoney(price)} / tháng</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
            Loại tiền tệ niêm yết
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={`w-full ${inputClass}`}
          >
            <option value="VND">VND (Việt Nam Đồng)</option>
            <option value="USD">USD (Đô la Mỹ)</option>
          </select>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Đơn vị tiền tệ chính thanh toán hóa đơn</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>Bảng giá đa chu kỳ thanh toán</span>
            <span className="text-xs font-medium text-zinc-400">({prices.length} chu kỳ đang kích hoạt)</span>
          </h4>
          <button
            type="button"
            onClick={handleAddCycle}
            className="px-3 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-zinc-300 rounded-lg flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" weight="bold" />
            <span>Thêm chu kỳ 6 Tháng</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-850 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">Chu kỳ</th>
                <th className="py-3 px-4">Số tháng</th>
                <th className="py-3 px-4">Giá gói trọn gói</th>
                <th className="py-3 px-4">Chiết khấu (%)</th>
                <th className="py-3 px-4">Giá TB / tháng</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {prices.map((p, idx) => {
                const numericPrice = Number(p.price) || 0;
                const avgPerMonth = p.billing_cycle_months > 0 ? Math.round(numericPrice / p.billing_cycle_months) : numericPrice;

                return (
                  <tr key={idx} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {p.billing_cycle_months === 1
                        ? '1 Tháng (Hàng tháng)'
                        : p.billing_cycle_months === 3
                        ? '3 Tháng (Theo quý)'
                        : p.billing_cycle_months === 6
                        ? '6 Tháng (Bán niên)'
                        : p.billing_cycle_months === 12
                        ? '12 Tháng (Theo năm)'
                        : `${p.billing_cycle_months} Tháng`}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                      {p.billing_cycle_months} tháng
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="10000"
                        value={Number(p.price)}
                        onChange={(e) =>
                          handleUpdatePriceRow(idx, 'price', Number(e.target.value) || 0)
                        }
                        className="w-36 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          value={Number(p.discount_percentage)}
                          onChange={(e) =>
                            handleUpdatePriceRow(
                              idx,
                              'discount_percentage',
                              Number(e.target.value) || 0,
                            )
                          }
                          className="w-20 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                        />
                        <Percent className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      {formatMoney(avgPerMonth)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleUpdatePriceRow(idx, 'is_active', !p.is_active)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                          p.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        <CheckCircle className="w-3 h-3" weight={p.is_active ? 'fill' : 'regular'} />
                        {p.is_active ? 'Kích hoạt' : 'Tạm tắt'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.billing_cycle_months !== 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCycle(idx)}
                          className="text-zinc-400 hover:text-rose-500 p-1 rounded-md transition-colors"
                          title="Xóa chu kỳ"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
