export const BILLING_CYCLE_LABELS = [
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'CUSTOM',
] as const;
export type BillingCycleLabel = (typeof BILLING_CYCLE_LABELS)[number];

/**
 * Derives the legacy `billing_cycle` enum column from a configurable
 * `billing_cycle_months` (1-12) value, so `saas_plans_billing_cycle_check`
 * keeps being satisfied without every call site needing to know about it.
 * Anything that isn't exactly 1/3/12 months (e.g. 2, 6, 9) is CUSTOM — the
 * enum stays a coarse label; billing_cycle_months is the real source of truth.
 */
export function deriveBillingCycleLabel(months: number): BillingCycleLabel {
  if (months === 1) return 'MONTHLY';
  if (months === 3) return 'QUARTERLY';
  if (months === 12) return 'YEARLY';
  return 'CUSTOM';
}
