"use client";

import { useEffect, useMemo } from "react";
import { UniErpAuthProvider, RequireSession, usePermissions, useSession } from "@kannan19302/shared/auth-client/react";
import { PermissionContext } from "@kannan19302/ui/components";
import { oidcConfig } from "@/lib/oidc-config";
import { setTokenGetter } from "@/lib/api";
import type { TokenSet } from "@kannan19302/shared/auth-client";

function parseJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function TokenBridge() {
  const { getAccessToken } = useSession();
  useEffect(() => {
    setTokenGetter(getAccessToken);
    return () => setTokenGetter(null);
  }, [getAccessToken]);
  return null;
}

async function restoreSession(): Promise<TokenSet | null> {
  // 1. Try server-side session route (for OIDC refresh token exchange)
  try {
    const res = await fetch("/api/session", { credentials: "include" });
    if (res.ok) {
      const body = await res.json();
      if (body.accessToken) {
        document.cookie = `auth_token=${encodeURIComponent(body.accessToken)}; Path=/; SameSite=Lax`;
        try { localStorage.setItem("token", body.accessToken); } catch {}
        return {
          accessToken: body.accessToken,
          idToken: body.idToken,
          expiresAt: body.expiresAt,
          scope: body.scope,
        };
      }
    }
  } catch {
    // Continue to cookie/localStorage fallback
  }

  // 2. Check for active auth_token or __session cookie or localStorage token
  if (typeof window !== "undefined") {
    const cookieToken = readCookie("auth_token") || readCookie("__session") || localStorage.getItem("token");
    if (cookieToken && cookieToken.includes(".")) {
      const claims = parseJwt(cookieToken);
      if (claims && typeof claims === "object") {
        const now = Math.floor(Date.now() / 1000);
        if (!claims.exp || claims.exp > now) {
          document.cookie = `auth_token=${encodeURIComponent(cookieToken)}; Path=/; SameSite=Lax`;
          try { localStorage.setItem("token", cookieToken); } catch {}
          return {
            accessToken: cookieToken,
            idToken: cookieToken,
            expiresAt: claims.exp ? claims.exp * 1000 : Date.now() + 86400000,
            scope: "openid profile email tenant",
          };
        } else {
          // Token is expired! Clean up dead cookies so they don't cause 401 spam
          document.cookie = "auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          document.cookie = "__session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          try { localStorage.removeItem("token"); } catch {}
        }
      }
    }
  }

  return null;
}

function PermissionBridge({ children }: { children: React.ReactNode }) {
  const { permissions: oidcPermissions } = usePermissions();

  const permissions = useMemo(() => {
    if (oidcPermissions && oidcPermissions.length > 0) return oidcPermissions;

    if (typeof window !== "undefined") {
      const token = readCookie("auth_token") || readCookie("__session") || localStorage.getItem("token");
      if (token && token.includes(".")) {
        const claims = parseJwt(token);
        if (claims?.permissions && Array.isArray(claims.permissions)) {
          return claims.permissions;
        }
        if (claims?.role === "SUPER_ADMIN" || claims?.roles?.includes("SUPER_ADMIN") || claims?.permissions?.includes("*")) {
          return ["*"];
        }
      }
    }
    return [];
  }, [oidcPermissions]);

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
      <TokenBridge />
      <PermissionBridge>
        {children}
      </PermissionBridge>
    </UniErpAuthProvider>
  );
}

export function ControlPlaneGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated" && typeof window !== "undefined") {
      const current = window.location.pathname + window.location.search;
      if (current !== "/login" && !current.startsWith("/login?")) {
        window.location.href = `/login?returnTo=${encodeURIComponent(current)}`;
      }
    }
  }, [status]);

  if (status !== "authenticated") {
    return (
      <main aria-label="Provider sign-in" style={{ padding: "var(--space-6)", color: "var(--color-text)" }}>
        <h1 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>Opening the provider console</h1>
        <p role="status" style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
          Checking your session and connecting to sign-in…
        </p>
        <a href="/login" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
          Continue to sign-in
        </a>
      </main>
    );
  }

  return <PermissionBridge>{children}</PermissionBridge>;
}
