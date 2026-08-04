// Console middleware — validates control-plane session
// In production: validates OIDC token from provider realm
// Any session without a valid control-plane grant is rejected at this layer
// This is Layer 3 of the defence-in-depth model (§ 1.2):
// Layer 1: reserved namespaces  |  Layer 2: ControlPlaneGuard  |  Layer 3: separate origin + realm

export function isControlPlaneSession(_token: unknown): boolean {
  // Production: verify IdP realm == 'provider', check MFA claim
  return false; // fail-closed by default
}
