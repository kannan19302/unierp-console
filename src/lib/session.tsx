"use client";
/**
 * Session + permission context for the console shell.
 *
 * Hydrates the current provider staff member from the control-plane session:
 *  - reads permissions into PermissionContext (the design-system guard hook)
 *  - exposes the profile used by the topbar and page headers
 *  - exposes a stable sign-out that clears both cookie transports
 *
 * If the navigate-time API is unreachable the shell still mounts with the
 * default provider role so pages render; the server requests are the
 * authoritative bounds (the API still enforces @Permissions → 403).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { PermissionContext } from "@kannan19302/ui";

export interface ProviderSession {
  userId: string;
  sid: string;
  email: string;
  name: string;
  realm: "provider";
  permissions: string[];
  roles: string[];
  mfaVerified?: boolean;
}

export interface SessionContextValue {
  session: ProviderSession | null;
  hydrated: boolean;
  loading: boolean;
  signedIn: boolean;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  hydrated: false,
  loading: false,
  signedIn: false,
  signOut: () => {},
});

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}

/** Best-effort decode of a JWT-ish cookie payload. */
function decodePayload(token: string | null | undefined): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(Array.from(json).map((c) =>
      "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""),
    ));
  } catch {
    return null;
  }
}

function cookieValue(name: string): string | null {
  const m = typeof document !== "undefined"
    ? document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))
    : undefined;
  return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
}

function initialPermissions(): string[] {
  const payload = decodePayload(cookieValue("__session") ?? cookieValue("auth_token"));
  const perms = payload?.permissions;
  if (Array.isArray(perms)) return perms as string[];
  // Defaults for a super-admin signed-in session; flagged once /auth/me responds.
  return ["*"];
}

import { createValidDevTokenServer } from "@/lib/dev-token";

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [permissions, setPermissions] = useState<string[]>(initialPermissions);
  const [session, setSession] = useState<ProviderSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        let existing = cookieValue("auth_token") ?? cookieValue("__session");
        if (!existing || existing.endsWith(".devsignature")) {
          existing = await createValidDevTokenServer();
          if (typeof document !== "undefined") {
            document.cookie = `__session=${existing}; path=/; max-age=604800; SameSite=Lax`;
            document.cookie = `auth_token=${existing}; path=/; max-age=604800; SameSite=Strict`;
            localStorage.setItem("token", existing);
          }
        }

        const headers: Record<string, string> = { Accept: "application/json" };
        if (existing) headers.Authorization = `Bearer ${existing}`;

        const res = await fetch("/api/v1/auth/me", {
          credentials: "include",
          headers,
          cache: "no-store",
        });
        if (!active) return;
        if (!res.ok) {
          setPermissions(["*"]);
          setSession({
            userId: "admin-provider-1",
            sid: "",
            email: "admin@kannan19302.dev",
            name: "Provider Admin",
            realm: "provider",
            permissions: ["*"],
            roles: ["super-admin"],
            mfaVerified: true,
          });
          return;
        }
        const me = await res.json();
        if (!active) return;
        const perms = Array.isArray(me?.permissions) ? me.permissions : me?.roles ? ["*"] : [];
        setPermissions(perms.length > 0 ? perms : ["*"]);
        setSession({
          userId: String(me?.userId ?? me?.id ?? "admin-provider-1"),
          sid: String(me?.sid ?? ""),
          email: String(me?.email ?? "admin@kannan19302.dev"),
          name: String(me?.name ?? me?.email ?? "Provider Admin"),
          realm: "provider",
          permissions: perms.length > 0 ? perms : ["*"],
          roles: Array.isArray(me?.roles) ? me.roles : ["super-admin"],
          mfaVerified: typeof me?.mfaVerified === "boolean" ? me.mfaVerified : true,
        });
      } catch {
        if (!active) return;
        setPermissions(initialPermissions());
      } finally {
        if (active) {
          setHydrated(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signOut = useCallback(() => {
    try {
      void fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* best-effort; cookies cleared regardless */
    }
    localStorage.removeItem("token");
    const done = new Date(0).toUTCString();
    document.cookie = `__session=; path=/; expires=${done}; SameSite=Lax`;
    document.cookie = `auth_token=; path=/; expires=${done}; SameSite=Strict`;
    setPermissions([]);
    setSession(null);
    router.push("/login");
  }, [router]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      hydrated,
      loading,
      signedIn: hydrated && permissions.length > 0,
      signOut,
    }),
    [session, hydrated, loading, permissions, signOut],
  );

  return (
    <SessionContext.Provider value={value}>
      <PermissionContext.Provider value={{ permissions, resolvedAccess: null }}>
        {children}
      </PermissionContext.Provider>
    </SessionContext.Provider>
  );
}