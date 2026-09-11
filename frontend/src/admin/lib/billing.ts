/** SA-06: human label for a 1-12 month billing cycle. */
export function monthsLabel(months: number | null | undefined) {
  if (!months) return 'Tuỳ chỉnh';
  if (months === 1) return 'Hàng tháng';
  if (months === 3) return 'Hàng quý';
  if (months === 6) return '6 tháng / lần';
  if (months === 12) return 'Hàng năm';
  return `Mỗi ${months} tháng`;
}

export interface BillingCycleOption {
  value: number;
  label: string;
}

export const BILLING_CYCLE_MONTH_OPTIONS: BillingCycleOption[] = [
  { value: 1, label: '1 tháng (Hàng tháng)' },
  { value: 2, label: '2 tháng' },
  { value: 3, label: '3 tháng (Hàng quý)' },
  { value: 4, label: '4 tháng' },
  { value: 5, label: '5 tháng' },
  { value: 6, label: '6 tháng (Bán niên)' },
  { value: 7, label: '7 tháng' },
  { value: 8, label: '8 tháng' },
  { value: 9, label: '9 tháng' },
  { value: 10, label: '10 tháng' },
  { value: 11, label: '11 tháng' },
  { value: 12, label: '12 tháng (Hàng năm)' },
];
