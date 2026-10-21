/**
 * src/auth/basic-auth.test.ts
 * Credentials below are fixed test values, not real secrets.
 */
import { describe, expect, it } from 'vitest';
import { isAuthorized } from './basic-auth';

const USER = 'alpha';
const PASS = 'test-pass';

function basic(credentials: string, scheme = 'Basic'): string {
  return `${scheme} ${Buffer.from(credentials, 'utf8').toString('base64')}`;
}

describe('isAuthorized', () => {
  it('accepts the configured credential', () => {
    expect(isAuthorized(basic(`${USER}:${PASS}`), USER, PASS)).toBe(true);
  });

  it('rejects a wrong username', () => {
    expect(isAuthorized(basic(`someone:${PASS}`), USER, PASS)).toBe(false);
  });

  it('rejects a wrong password', () => {
    expect(isAuthorized(basic(`${USER}:wrong`), USER, PASS)).toBe(false);
  });

  it('rejects the right password with extra characters appended', () => {
    expect(isAuthorized(basic(`${USER}:${PASS}x`), USER, PASS)).toBe(false);
  });

  it('rejects a missing header', () => {
    expect(isAuthorized(null, USER, PASS)).toBe(false);
  });

  it('rejects a non-Basic scheme carrying the right credential', () => {
    expect(isAuthorized(basic(`${USER}:${PASS}`, 'Bearer'), USER, PASS)).toBe(false);
  });

  it('rejects a payload that is not base64 credentials', () => {
    expect(isAuthorized('Basic !!!not-base64!!!', USER, PASS)).toBe(false);
  });

  it('accepts the scheme name in any case', () => {
    expect(isAuthorized(basic(`${USER}:${PASS}`, 'basic'), USER, PASS)).toBe(true);
  });

  it('accepts a password that contains a colon', () => {
    expect(isAuthorized(basic(`${USER}:a:b`), USER, 'a:b')).toBe(true);
  });
});
