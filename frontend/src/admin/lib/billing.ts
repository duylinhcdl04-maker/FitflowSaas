/** SA-06: human label for a 1-12 month billing cycle. */
export function monthsLabel(months: number | null | undefined) {
  if (!months) return 'Tuỳ chỉnh';
  if (months === 1) return 'Hàng tháng';
  if (months === 3) return 'Hàng quý';
  if (months === 6) return '6 tháng / lần';
  if (months === 12) return 'Hàng năm';
  return `Mỗi ${months} tháng`;
}

export const BILLING_CYCLE_MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
