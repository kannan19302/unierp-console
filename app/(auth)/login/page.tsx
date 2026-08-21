"use client";

import { useEffect } from "react";
import { useSession } from "@kannan19302/shared/auth-client/react";

/**
 * This app's own login form is retired — same reasoning as every other
 * platform's replaced login page (W6): credentials are entered exactly once,
 * at the OIDC issuer's hosted login page, not here.
 *
 * This is the platform the W0 backdoor lived in (a server action that minted
 * a `["*", "system.superadmin.access"]` token whenever the real API call
 * failed, called from THIS page's own catch block). Retiring the whole form
 * — not just the fallback — removes the surface that bug lived on entirely,
 * rather than trusting a second layer of code here to keep guarding it.
 */
export default function LoginPage() {
  const { status, signIn } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      void signIn({ returnTo: "/" });
    } else if (status === "authenticated") {
      // Already signed in — landing here directly (an old bookmark, a
      // back-navigation) should go straight to the console, not sit on a
      // redirect page that has nothing left to redirect to.
      window.location.assign("/");
    }
  }, [status, signIn]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p>Redirecting to sign-in…</p>
    </div>
  );
}
