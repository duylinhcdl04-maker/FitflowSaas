import { randomInt } from 'crypto';

/** Generates a 6-digit numeric OTP for OW-01 email verification. */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}
