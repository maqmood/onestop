/**
 * src/proxy.test.ts
 * Credentials below are fixed test values, not real secrets.
 */
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { proxy } from './proxy';

function request(authorization?: string): NextRequest {
  return new NextRequest('http://localhost/', {
    headers: authorization ? { authorization } : {},
  });
}

function basic(credentials: string): string {
  return `Basic ${Buffer.from(credentials, 'utf8').toString('base64')}`;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('proxy with credentials configured', () => {
  beforeEach(() => {
    vi.stubEnv('ALPHA_BASIC_AUTH_USER', 'alpha');
    vi.stubEnv('ALPHA_BASIC_AUTH_PASS', 'test-pass');
  });

  it('challenges a request without credentials', () => {
    const response = proxy(request());
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toMatch(/^Basic realm="alpha"/);
  });

  it('challenges a wrong credential', () => {
    expect(proxy(request(basic('alpha:wrong'))).status).toBe(401);
  });

  it('lets the correct credential through', () => {
    const response = proxy(request(basic('alpha:test-pass')));
    expect(response.status).toBe(200);
    expect(response.headers.get('www-authenticate')).toBeNull();
  });
});

describe('proxy without credentials configured', () => {
  it('fails closed when both variables are unset', () => {
    vi.stubEnv('ALPHA_BASIC_AUTH_USER', undefined);
    vi.stubEnv('ALPHA_BASIC_AUTH_PASS', undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    // An empty credential must not match an empty configuration.
    expect(proxy(request(basic(':'))).status).toBe(500);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('ALPHA_BASIC_AUTH_PASS'));
  });

  it('fails closed when the password is empty', () => {
    vi.stubEnv('ALPHA_BASIC_AUTH_USER', 'alpha');
    vi.stubEnv('ALPHA_BASIC_AUTH_PASS', '');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(proxy(request(basic('alpha:'))).status).toBe(500);
  });
});
