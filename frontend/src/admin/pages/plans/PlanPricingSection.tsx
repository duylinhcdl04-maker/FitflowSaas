import { useState } from 'react';
import { Tag, Sparkle, Calculator, ShieldCheck } from '@phosphor-icons/react';
import type { Plan } from '../../api/plans';
import { inputClass } from '../../components/FormField';
import { monthsLabel, BILLING_CYCLE_MONTH_OPTIONS } from '../../lib/billing';

function formatMoney(amount: number, currency: string) {
  if (amount === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);
}

interface PlanPricingSectionProps {
  plan: Plan;
  price: number;
  currency: string;
  billingCycleMonths: number;
  onChangePrice: (price: number) => void;
  onChangeCurrency: (currency: string) => void;
  onChangeBillingCycle: (months: number) => void;
  disabled?: boolean;
}

export default function PlanPricingSection({
  plan,
  price,
  currency,
  billingCycleMonths,
  onChangePrice,
  onChangeCurrency,
  onChangeBillingCycle,
  disabled,
}: PlanPricingSectionProps) {
  const isTrial = plan.trial_days > 0;
  // Calculate yearly estimate & discount benchmark
  const monthlyEquivalent = billingCycleMonths > 0 ? price / billingCycleMonths : price;
  const yearlyRegular = monthlyEquivalent * 12;
  const yearlyDiscounted = Math.round(yearlyRegular * 0.83); // ~17% off yearly incentive

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Thiết lập Bảng giá & Chu kỳ thanh toán
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Cấu hình mức phí định kỳ và chu kỳ gia hạn dịch vụ cho các phòng gym.
        </p>
      </div>

      {/* Pricing options grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* 1. Monthly Cycle Card */}
        <div
          onClick={() => !disabled && onChangeBillingCycle(1)}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            billingCycleMonths === 1
              ? 'border-emerald-500 bg-emerald-50/40 shadow-xs dark:border-emerald-500 dark:bg-emerald-950/20'
              : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Gói Tháng</span>
            {billingCycleMonths === 1 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                Đang chọn
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {formatMoney(price, currency)}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">/ 1 tháng linh hoạt</p>
          </div>
          <div className="mt-3 border-t border-zinc-100 pt-2 text-[11px] text-zinc-500 dark:border-zinc-800">
            Thanh toán theo từng tháng
          </div>
        </div>

        {/* 2. Yearly Cycle Card */}
        <div
          onClick={() => !disabled && onChangeBillingCycle(12)}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            billingCycleMonths === 12
              ? 'border-emerald-500 bg-emerald-50/40 shadow-xs dark:border-emerald-500 dark:bg-emerald-950/20'
              : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Gói Năm</span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                <Sparkle className="h-3 w-3" />
                Tiết kiệm ~17%
              </span>
            </div>
            {billingCycleMonths === 12 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                Đang chọn
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {formatMoney(billingCycleMonths === 12 ? price : yearlyDiscounted, currency)}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">/ 12 tháng trọn gói</p>
          </div>
          <div className="mt-3 border-t border-zinc-100 pt-2 text-[11px] text-emerald-600 dark:border-zinc-800 dark:text-emerald-400">
            Tặng thêm 2 tháng sử dụng
          </div>
        </div>

        {/* 3. Custom Cycle Card */}
        <div
          onClick={() => !disabled && billingCycleMonths !== 1 && billingCycleMonths !== 12 ? null : onChangeBillingCycle(3)}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            billingCycleMonths !== 1 && billingCycleMonths !== 12
              ? 'border-emerald-500 bg-emerald-50/40 shadow-xs dark:border-emerald-500 dark:bg-emerald-950/20'
              : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Chu kỳ tùy chỉnh</span>
            {billingCycleMonths !== 1 && billingCycleMonths !== 12 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                {billingCycleMonths} tháng
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {formatMoney(price, currency)}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">/ {monthsLabel(billingCycleMonths)}</p>
          </div>
          <div className="mt-3 border-t border-zinc-100 pt-2 text-[11px] text-zinc-500 dark:border-zinc-800">
            Tự do chọn 1 - 12 tháng
          </div>
        </div>
      </div>

      {/* Main Pricing Input Controls */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Chi tiết mức giá & Chu kỳ
        </h4>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Price amount */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Giá niêm yết ({currency}) <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <input
                type="number"
                min={0}
                step={10000}
                disabled={disabled || isTrial}
                value={price}
                onChange={(e) => onChangePrice(Math.max(0, Number(e.target.value) || 0))}
                className={`w-full pr-12 font-bold ${inputClass}`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                {currency}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">
              {isTrial ? 'Gói dùng thử luôn có giá 0 ₫' : `Tương đương ~${formatMoney(Math.round(monthlyEquivalent), currency)}/tháng`}
            </p>
          </div>

          {/* Billing Cycle Months */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Chu kỳ thanh toán (Tháng) <span className="text-red-500">*</span>
            </label>
            <select
              disabled={disabled || isTrial}
              value={billingCycleMonths}
              onChange={(e) => onChangeBillingCycle(Number(e.target.value) || 1)}
              className={`mt-1.5 w-full ${inputClass}`}
            >
              {BILLING_CYCLE_MONTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Đơn vị tiền tệ
            </label>
            <select
              disabled={disabled}
              value={currency}
              onChange={(e) => onChangeCurrency(e.target.value)}
              className={`mt-1.5 w-full ${inputClass}`}
            >
              <option value="VND">VND (Việt Nam Đồng)</option>
              <option value="USD">USD (Đô la Mỹ)</option>
            </select>
          </div>
        </div>

        {/* Pricing Notice */}
        <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Nguyên tắc snapshot bất biến:</span>{' '}
            Thay đổi giá trên gói chỉ áp dụng khi có tenant đăng ký mới hoặc khi tenant chủ động gia hạn theo gói mới.
            Các hợp đồng và hoá đơn đang chạy của tenant hiện tại được bảo lưu nguyên vẹn.
          </div>
        </div>
      </div>
    </div>
  );
}
