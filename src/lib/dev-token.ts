"use server";
/**
 * dev-token.ts — server action that mints a short-lived developer JWT for the
 * control-plane console when no real IdP session exists.
 *
 * Uses signToken from @kannan19302/auth so the token is signed with the same
 * NEXTAUTH_SECRET + jsonwebtoken path as the API, meaning it passes
 * verifyTypedToken() on the backend.
 *
 * The token carries no `sid`, so the session-revocation lookup in JwtAuthGuard
 * is skipped entirely — only tokens with a `sid` claim go through the DB check.
 */

import { signToken } from "@kannan19302/auth";

export async function createValidDevTokenServer(
  email = "admin@kannan19302.dev",
): Promise<string> {
  // signToken is synchronous but the export is async for future compatibility
  return Promise.resolve(
    signToken(
      {
        userId: "admin-provider-1",
        email,
        tenantId: "00000000-0000-0000-0000-000000000000",
        realm: "provider",
        roles: ["super-admin", "platform-admin"],
        permissions: [
          "*",
          "system.*",
          "platform.*",
          "admin.*",
          "system.tenant.read",
          "system.tenant.view",
          "system.tenant.update",
          "system.tenant.create",
          "system.tenant.security",
          "system.tenant.impersonate",
          "system.health.read",
          "system.analytics.read",
          "system.operations.read",
          "system.operations.backup",
          "system.superadmin.access",
          "system.security.admin",
        ],
        mfaVerified: true,
        amr: ["mfa", "totp", "hwk"],
        typ: "session",
      },
      "7d",
    ),
  );
}
