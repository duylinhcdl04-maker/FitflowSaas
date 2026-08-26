/** Parses '15m' / '7d' / '30s' / '2h' (or a bare number of seconds) into seconds. */
export function toSeconds(input: string): number {
  const match = /^(\d+)(s|m|h|d)?$/.exec(input.trim());
  if (!match) return Number(input) || 0;

  const value = Number(match[1]);
  const unit = match[2] ?? 's';
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return value * multipliers[unit];
}
