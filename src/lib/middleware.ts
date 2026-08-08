// Console middleware — validates control-plane session
// In production: validates OIDC token from provider realm
// Any session without a valid control-plane grant is rejected at this layer
// This is Layer 3 of the defence-in-depth model (§ 1.2):
// Layer 1: reserved namespaces  |  Layer 2: ControlPlaneGuard  |  Layer 3: separate origin + realm

import { SessionTokenPayload } from "@kannan19302/auth";

export function isControlPlaneSession(token: unknown): boolean {
  if (!token || typeof token !== "object") return false;
  
  const payload = token as SessionTokenPayload;
  
  if (payload.realm !== "provider") return false;
  
  const hasMfa =
    payload.mfaVerified === true ||
    (Array.isArray(payload.amr) &&
      payload.amr.some((m: string) =>
        ["mfa", "otp", "totp", "hwk", "webauthn"].includes(m)
      ));
      
  return hasMfa;
}
