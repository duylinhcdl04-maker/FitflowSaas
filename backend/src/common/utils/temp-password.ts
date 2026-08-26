import { randomBytes } from 'crypto';

// Excludes visually ambiguous characters (0/O, 1/l/I) since this is meant to be
// read aloud or retyped by a support agent relaying it to a Tenant Owner.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

/** Generates a random temporary password for SA-03 "reset Owner password". */
export function generateTempPassword(length = 12): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
