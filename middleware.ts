import { NextRequest, NextResponse } from "next/server";

/**
 * P2 — Provider Admin OS (Platform Control Center).
 *
 * Session authentication and authorization are managed by:
 * 1. Client session boundary: `<RootAuthProvider>` and `<ControlPlaneGate>`
 *    (`RequireSession`) in `src/components/AuthShell.tsx`.
 * 2. Hosted OIDC Auth flow: `/login` -> `/oidc/authorize` -> `/auth/callback`.
 * 3. Server-side API guard: `RbacGuard` + `@Permissions(...)` on all control plane APIs.
 *
 * Edge middleware keeps platform static assets and API paths out of the way.
 */
export function middleware(_req: NextRequest) {
  const res = NextResponse.next();

  // Defense-in-depth security headers
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data: https:; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:* https: wss:;"
  );

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};