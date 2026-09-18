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
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};