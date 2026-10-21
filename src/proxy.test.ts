/**
 * src/proxy.test.ts
 * Credentials below are fixed test values, not real secrets.
 */
import { getRedirectUrl, getRewrittenUrl } from 'next/experimental/testing/server';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { proxy } from './proxy';

function request(authorization?: string, path = '/'): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    headers: authorization ? { authorization } : {},
  });
}

function basic(credentials: string): string {
  return `Basic ${Buffer.from(credentials, 'utf8').toString('base64')}`;
}

const SIGNED_IN = basic('alpha:test-pass');

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
    const response = proxy(request(SIGNED_IN));
    expect(response.status).toBe(200);
    expect(response.headers.get('www-authenticate')).toBeNull();
  });

  it('challenges before any locale routing happens', () => {
    expect(proxy(request(undefined, '/ar')).status).toBe(401);
  });
});

describe('proxy locale routing when signed in', () => {
  beforeEach(() => {
    vi.stubEnv('ALPHA_BASIC_AUTH_USER', 'alpha');
    vi.stubEnv('ALPHA_BASIC_AUTH_PASS', 'test-pass');
  });

  it('serves English at / without a prefix', () => {
    expect(getRewrittenUrl(proxy(request(SIGNED_IN, '/')))).toBe('http://localhost/en');
  });

  it('redirects the redundant /en prefix to the unprefixed path', () => {
    expect(getRedirectUrl(proxy(request(SIGNED_IN, '/en')))).toBe('http://localhost/');
  });

  it('serves Arabic under /ar without redirecting', () => {
    const response = proxy(request(SIGNED_IN, '/ar'));
    expect(getRedirectUrl(response)).toBeNull();
    expect(response.status).toBe(200);
  });

  it('ignores the Accept-Language header while Arabic is placeholder copy', () => {
    const arabicBrowser = new NextRequest('http://localhost/', {
      headers: { authorization: SIGNED_IN, 'accept-language': 'ar-AE,ar;q=0.9' },
    });
    expect(getRewrittenUrl(proxy(arabicBrowser))).toBe('http://localhost/en');
  });

  it('leaves static files alone', () => {
    const response = proxy(request(SIGNED_IN, '/_next/static/chunks/app.js'));
    expect(getRewrittenUrl(response)).toBeNull();
    expect(getRedirectUrl(response)).toBeNull();
  });

  it.each(['/', '/en', '/ar', '/_next/static/chunks/app.js'])('sets no cookie on %s', (path) => {
    expect(proxy(request(SIGNED_IN, path)).headers.get('set-cookie')).toBeNull();
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
