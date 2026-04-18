import { createHash, randomBytes } from 'crypto';

export function generateRawResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashResetToken(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

/** 64 hex chars from 32 random bytes — reject before hashing junk input. */
export function isValidResetTokenFormat(raw: string): boolean {
  return /^[a-f0-9]{64}$/i.test(raw);
}
