"use client";
/**
 * Users & Access → Authentication.
 * SSO providers and security policy are read from the verified SaaS
 * endpoints (/saas/sso, /saas/security). Password, MFA, lockout and session
 * policy settings are shown directly from the API.
 */
import { Fingerprint, Globe, Lock } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { useItem } from "@/lib/data";

interface SsoProvider {
  id?: string;
  name?: string;
  provider?: string;
  type?: string;
  issuer?: string;
  domain?: string;
  status?: string;
  enabled?: boolean;
  clients?: unknown[];
}

interface SsoConfig {
  enabled?: boolean;
  defaultProvider?: string;
  forceSso?: boolean;
  domains?: string[];
  providers?: SsoProvider[];
  saml?: Record<string, unknown>;
  oidc?: Record<string, unknown>;
}

interface SecurityConfig {
  passwordPolicy?: Record<string, unknown>;
  mfa?: Record<string, unknown>;
  mfaEnabled?: boolean;
  session?: Record<string, unknown>;
  lockout?: Record<string, unknown>;
  sessionTimeoutMinutes?: number;
  maxSessionsPerUser?: number;
  minPasswordLength?: number;
}

function flag(value: unknown): "success" | "danger" | "warning" {
  if (value === true || value === "true" || value === "ENABLED") return "success";
  if (value === false || value === "false" || value === "DISABLED") return "danger";
  return "warning";
}

export default function AccessAuthentication() {
  const sso = useItem<SsoConfig>("/saas/sso");
  const security = useItem<SecurityConfig>("/saas/security");

  const providers = sso.data?.providers ?? [];
  const enabledProviders = providers.filter((p) => p.enabled === true || p.status === "ENABLED").length;

  const stats: StatCardItem[] = [
    { label: "SSO providers", value: providers.length, icon: <Globe size={18} /> },
    { label: "Enabled", value: enabledProviders, icon: <Fingerprint size={18} /> },
    { label: "MFA", value: security.data?.mfaEnabled === true ? "Enabled" : "Disabled", icon: <Lock size={18} /> },
    { label: "Session timeout (min)", value: security.data?.sessionTimeoutMinutes ?? "—", icon: <Lock size={18} /> },
  ];

  if (sso.loading || security.loading) {
    return (
      <DomainShell domainId="access" title="Authentication" description="SSO providers and platform authentication policy.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="access" title="Authentication" description="SSO providers and platform authentication policy.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>SSO configuration</h3>
            {sso.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{sso.error.message}</p>
            ) : providers.length === 0 ? (
              <EmptyState title="No SSO providers" description="The SSO configuration returned no providers." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", marginTop: "var(--space-3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Default provider</span>
                  <span style={{ fontWeight: 500 }}>{sso.data?.defaultProvider ?? "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Force SSO</span>
                  <span style={{ fontWeight: 500 }}>{sso.data?.forceSso === true ? "Yes" : "No"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Allowed domains</span>
                  <span style={{ fontWeight: 500 }}>{sso.data?.domains?.join(", ") ?? "—"}</span>
                </div>
                <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                  {providers.map((p) => (
                    <li
                      key={p.id ?? p.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "var(--space-2) 0",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{p.name ?? p.provider ?? p.type ?? p.id}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{p.domain ?? p.issuer ?? ""}</span>
                        <Badge variant={flag(p.enabled ?? p.status)}>
                          {p.status ?? (p.enabled === true ? "ENABLED" : "DISABLED")}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Security policy</h3>
            {security.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{security.error.message}</p>
            ) : !security.data ? (
              <EmptyState title="No security policy" description="The security configuration endpoint returned no data." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", marginTop: "var(--space-3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>MFA</span>
                  <span style={{ fontWeight: 500 }}>{security.data.mfaEnabled === true ? "Enabled" : "Disabled"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Min password length</span>
                  <span style={{ fontWeight: 500 }}>{security.data.minPasswordLength ?? "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Session timeout (min)</span>
                  <span style={{ fontWeight: 500 }}>{security.data.sessionTimeoutMinutes ?? "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Max sessions per user</span>
                  <span style={{ fontWeight: 500 }}>{security.data.maxSessionsPerUser ?? "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Password policy</span>
                  <span style={{ fontWeight: 500 }}>
                    {security.data.passwordPolicy ? "Configured" : security.data.mfa ? "Configured" : "—"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Lockout</span>
                  <span style={{ fontWeight: 500 }}>{security.data.lockout ? "Configured" : "—"}</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DomainShell>
  );
}