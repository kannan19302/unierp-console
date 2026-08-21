"use client";

import { UniErpAuthProvider, RequireSession, usePermissions } from "@kannan19302/shared/auth-client/react";
import { PermissionContext } from "@kannan19302/ui";
import { oidcConfig } from "@/lib/oidc-config";
import type { TokenSet } from "@kannan19302/shared/auth-client";

/**
 * Client-side auth boundary for the Provider Admin OS — the control-plane
 * realm, and the one this migration matters most for.
 *
 * Before W6 this app had its own SessionProvider (src/lib/session.tsx),
 * hardened fail-closed in W0 after a checked-in server action was found
 * minting `["*", "system.superadmin.access"]` tokens whenever the API was
 * unreachable. That fix made the SYMPTOM (a fabricated identity on failure)
 * impossible; it did not connect this app to the entitlement boundary W1/W2
 * actually built — `/oidc/authorize`'s control-plane check
 * (PlatformEntitlementService), which refuses a P2 token to anyone without a
 * genuine `system.*`/`platform.*` permission, wildcard included. A session
 * minted by this app's own `/auth/provider/login` cookie flow never passed
 * through that check at all. This migration is what actually wires P2 into
 * the same entitlement boundary every other platform already goes through.
 *
 * `usePermissions()` feeds the design system's `PermissionContext`, which
 * `usePermission()` (console-shell.tsx's sidebar, and every
 * `<ProtectedComponent>` in this app) already reads — bridging the shared
 * OIDC session into existing UI code rather than rewriting every consumer.
 */
async function restoreSession(): Promise<TokenSet | null> {
  const res = await fetch("/api/session", { credentials: "include" });
  if (!res.ok) return null;
  const body = await res.json();
  return {
    accessToken: body.accessToken,
    idToken: body.idToken,
    expiresAt: body.expiresAt,
    scope: body.scope,
  };
}

function PermissionBridge({ children }: { children: React.ReactNode }) {
  const { permissions } = usePermissions();
  return (
    <PermissionContext.Provider value={{ permissions, resolvedAccess: null }}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Split in two, not one, because the (auth) and (control-plane) route groups
 * need DIFFERENT things from the same session:
 *
 *   RootAuthProvider  — one token store for the whole app. Mounted at the
 *                        root layout so BOTH the login page and every
 *                        control-plane page share it; the login page calls
 *                        useSession() itself to redirect once authenticated.
 *   ControlPlaneGate   — the actual enforcement (redirect-if-unauthenticated,
 *                        permission bridge). Scoped to (control-plane) only —
 *                        mounting it at the root would redirect the LOGIN
 *                        page itself into a loop the moment status resolves
 *                        to "unauthenticated", since that is exactly the
 *                        state a not-yet-signed-in visitor on /login is in.
 */
export function RootAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <UniErpAuthProvider
      config={oidcConfig}
      restoreSession={restoreSession}
      defaultPostLogoutRedirectUri="http://localhost:4000/"
    >
      {children}
    </UniErpAuthProvider>
  );
}

export function ControlPlaneGate({ children }: { children: React.ReactNode }) {
  return (
    <RequireSession>
      <PermissionBridge>{children}</PermissionBridge>
    </RequireSession>
  );
}
