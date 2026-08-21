import { OidcClient, type OidcClientConfig } from "@kannan19302/shared/auth-client";

/**
 * This platform's own OIDC client registration — client id
 * "unierp-provider-admin-os", seeded by data/prisma/seed-oidc-clients.ts as a PUBLIC
 * client (no secret; PKCE-only, same as every browser client in this system).
 * Registered in W1; wired up as this app's actual auth mechanism in W6.
 */
export const oidcConfig: OidcClientConfig = {
  issuer: process.env.NEXT_PUBLIC_OIDC_ISSUER || "http://localhost:3005",
  clientId: "unierp-provider-admin-os",
  redirectUri:
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:4002") +
    "/auth/callback",
  // NO erp.read/erp.write. This is the control plane, and the tenant/
  // control-plane boundary is the thing the IdP's negative tests (phases 7
  // and 8 of idp/scripts/verify-oidc-flow.mjs) exist to defend — a console
  // that administers tenants must not also carry their ERP data scopes.
  // seed-oidc-clients.ts registers P2 with BASE_SCOPES only, so asking for
  // more was not merely redundant: it failed sign-in with invalid_scope.
  scope: ["openid", "profile", "email", "tenant", "offline_access"],
};

export function createOidcClient(): OidcClient {
  return new OidcClient(oidcConfig);
}
