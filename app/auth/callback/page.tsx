"use client";

import { useEffect, useRef, useState } from "react";
import { createOidcClient } from "@/lib/oidc-config";

/**
 * The OIDC callback for unierp-provider-admin-os. Same pattern as the Global Platform
 * Wizard (W4): completes the code exchange, hands the refresh token to the
 * server-side session route, and resumes whatever deep link started the flow.
 */
export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const client = createOidcClient();
        const { tokens, returnTo } = await client.handleCallback(window.location.href);

        if (tokens.refreshToken) {
          await fetch("/api/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
            credentials: "include",
          });
        }

        window.location.assign(returnTo || "/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in failed");
      }
    })();
  }, []);

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 16 }}>
        <p>Sign-in failed: {error}</p>
        <button onClick={() => window.location.assign("/")}>Try again</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p>Completing sign-in…</p>
    </div>
  );
}
