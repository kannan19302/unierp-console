"use client";
/**
 * Security & Compliance → Identity.
 * Identity provider posture: MFA, sessions, API keys and the security score,
 * read from the real `/saas/security` controller resources.
 */
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface SecurityOverview {
  apiKeyCount?: number;
  activeSessions?: number;
  mfaEnabled?: boolean;
  ipRestrictions?: boolean;
  lastLogin?: string;
  securityScore?: number;
}

interface Session {
  id?: string;
  ip?: string;
  userAgent?: string;
  lastActive?: string;
  isCurrent?: boolean;
}

interface ApiKey {
  id?: string;
  name?: string;
  status?: string;
  expiresAt?: string;
  createdAt?: string;
}

export default function SecurityIdentity() {
  const overview = useItem<SecurityOverview>("/saas/security/overview");
  const sessions = useList<Session>({ path: "/saas/security/sessions" });
  const apiKeys = useList<ApiKey>({ path: "/saas/security/api-keys" });

  const score = overview.data?.securityScore;

  const stats: StatCardItem[] = [
    { label: "Security score", value: score != null ? `${score}/100` : "—" },
    { label: "Active sessions", value: Number(overview.data?.activeSessions) || sessions.data.length },
    { label: "API keys", value: Number(overview.data?.apiKeyCount) || apiKeys.data.length },
    { label: "MFA", value: overview.data?.mfaEnabled ? "Enabled" : "Off" },
  ];

  const loading = overview.loading || sessions.loading || apiKeys.loading;
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="security"
      title="Identity"
      description="Provider identity posture: sessions, API keys and MFA."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Security configuration</h3>
            {overview.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {overview.error.message}
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>MFA</span>
                  <Badge variant={overview.data?.mfaEnabled ? "success" : "warning"}>
                    {overview.data?.mfaEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>IP restrictions</span>
                  <Badge variant={overview.data?.ipRestrictions ? "success" : "default"}>
                    {overview.data?.ipRestrictions ? "Enabled" : "Off"}
                  </Badge>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>API keys</span>
                  <span>{overview.data?.apiKeyCount ?? "—"}</span>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Last login</span>
                  <span>{overview.data?.lastLogin ?? "—"}</span>
                </li>
              </ul>
            )}
          </Card>
        </div>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Active sessions</h3>
          {sessions.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {sessions.error.message}
            </p>
          ) : sessions.data.length === 0 ? (
            <div style={{ marginTop: "var(--space-3)" }}>
              <EmptyState title="No active sessions" description="The sessions endpoint returned no rows." />
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {sessions.data.map((s) => (
                <li key={s.id ?? s.ip} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{s.ip ?? "—"}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {s.userAgent ?? "Unknown UA"} {s.lastActive ? ` · active ${s.lastActive}` : ""}
                    </div>
                  </div>
                  {s.isCurrent && <Badge variant="info">Current</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>API keys</h3>
          {apiKeys.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {apiKeys.error.message}
            </p>
          ) : apiKeys.data.length === 0 ? (
            <div style={{ marginTop: "var(--space-3)" }}>
              <EmptyState title="No API keys" description="The api-keys endpoint returned no rows." />
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {apiKeys.data.map((k) => (
                <li key={k.id ?? k.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{k.name ?? k.id}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {k.expiresAt ? `expires ${k.expiresAt}` : "no expiry"}
                    </div>
                  </div>
                  <Badge variant={k.status === "REVOKED" ? "danger" : k.status === "EXPIRED" ? "warning" : "success"}>
                    {k.status ?? "ACTIVE"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}