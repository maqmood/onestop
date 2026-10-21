/**
 * src/proxy.ts
 *
 * Purpose:   Phase 0 private-alpha gate (backlog T0.2). Every request needs the shared HTTP
 *            Basic credential from ALPHA_BASIC_AUTH_USER and ALPHA_BASIC_AUTH_PASS.
 * Inputs:    Every incoming request. There is deliberately no matcher, so pages, API routes,
 *            static files and Server Function POSTs are all covered.
 * Outputs:   The request passed on, a 401 Basic challenge, or a 500 when unconfigured.
 * Invariants:
 *   - Fails closed: missing configuration never serves the site.
 *   - No cookies, no session, no logging of credentials or IPs (non-negotiables 4 and 5).
 *   - Responses have no body, so there is no UI text to translate.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { isAuthorized } from './auth/basic-auth';

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

  if (isAuthorized(request.headers.get('authorization'), user, pass)) return NextResponse.next();

  return new NextResponse(null, {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="alpha", charset="UTF-8"' },
  });
}
