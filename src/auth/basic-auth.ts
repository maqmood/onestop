/**
 * src/auth/basic-auth.ts
 *
 * Purpose:   Check an HTTP Basic `Authorization` header against the alpha's shared credential.
 * Inputs:    The raw header value (or null) and the expected username and password.
 * Outputs:   true only for an exact match. Never throws.
 * Invariants:
 *   - Constant-time: both sides are SHA-256 hashed so `timingSafeEqual` always gets
 *     equal-length inputs, and timing reveals neither content nor length.
 *   - The decoded `user:pass` is compared as one string. RFC 7617 forbids ':' in the
 *     user-id, so a password containing ':' still matches correctly without splitting.
 *   - Privacy: the credential is never logged or returned.
 */
import { createHash, timingSafeEqual } from 'node:crypto';

const BASIC_SCHEME = /^basic\s+/i;

/** True when `header` carries exactly `user:pass` under the Basic scheme. */
export function isAuthorized(header: string | null, user: string, pass: string): boolean {
  if (!header || !BASIC_SCHEME.test(header)) return false;
  const supplied = Buffer.from(header.replace(BASIC_SCHEME, ''), 'base64').toString('utf8');
  return timingSafeEqual(sha256(supplied), sha256(`${user}:${pass}`));
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}
