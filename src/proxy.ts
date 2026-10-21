/**
 * src/proxy.ts
 *
 * Purpose:   Phase 0 private-alpha gate (backlog T0.2), then locale routing (T0.3). Every
 *            request needs the shared HTTP Basic credential from ALPHA_BASIC_AUTH_USER and
 *            ALPHA_BASIC_AUTH_PASS; signed-in page requests then go through next-intl.
 * Inputs:    Every incoming request. There is deliberately no matcher, so pages, API routes,
 *            static files and Server Function POSTs are all covered by the gate.
 * Outputs:   A 401 Basic challenge, a 500 when unconfigured, or the request passed on
 *            (rewritten or redirected by next-intl for page paths).
 * Invariants:
 *   - The gate runs first: a signed-out visitor learns nothing about routes or locales.
 *   - Fails closed: missing configuration never serves the site.
 *   - No cookies, no session, no logging of credentials or IPs (non-negotiables 4 and 5).
 *   - Responses have no body, so there is no UI text to translate.
 */
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { isAuthorized } from './auth/basic-auth';
import { routing } from './i18n/routing';

const handleLocaleRouting = createMiddleware(routing);

// next-intl's recommended matcher, applied in code: the gate must see every request, but only
// page paths get locale routing (static files must not be redirected to /ar/_next/...).
const PAGE_PATH = /^\/(?!api|_next|_vercel|.*\..*)/;

/** Lets a request through only when it carries the shared alpha credential. */
export function proxy(request: NextRequest): NextResponse {
  const user = process.env.ALPHA_BASIC_AUTH_USER;
  const pass = process.env.ALPHA_BASIC_AUTH_PASS;
  if (!user || !pass) {
    console.error(
      'ALPHA_BASIC_AUTH_USER and ALPHA_BASIC_AUTH_PASS must both be set; refusing all requests.',
    );
    return new NextResponse(null, { status: 500 });
  }

  if (!isAuthorized(request.headers.get('authorization'), user, pass)) {
    return new NextResponse(null, {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="alpha", charset="UTF-8"' },
    });
  }

  return PAGE_PATH.test(request.nextUrl.pathname)
    ? handleLocaleRouting(request)
    : NextResponse.next();
}
