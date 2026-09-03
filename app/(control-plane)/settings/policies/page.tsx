"use client";
/**
 * Settings → Policies.
 *
 * Platform-wide policies: security policies, rate-limit policies and access
 * policies from the control-plane API. Every section renders honest
 * loading/error/empty states.
 */
import { KeyRound, Gauge, Fingerprint, ShieldCheck } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface RateLimitPolicy {
  id?: string;
  name?: string;
  policy?: string;
  limitPerMinute?: number;
  burst?: number;
  enabled?: boolean;
  status?: string;
}

interface SecurityPolicy {
  id: string;
  name?: string;
  description?: string;
  mfaRequired?: boolean;
  sessionTimeoutMinutes?: number;
  passwordPolicy?: string;
  enabled?: boolean;
}

interface AccessPolicy {
  id: string;
  name?: string;
  description?: string;
  roles?: string[];
  permissionKey?: string;
  enabled?: boolean;
  status?: string;
}

export default function PoliciesSettingsPage() {
  const rateLimits = useList<RateLimitPolicy>({
    path: "/platform/v1/enterprise-scale/rate-limit-policies",
  });
  const security = useList<SecurityPolicy>({
    path: "/platform/v1/auth/security-policies",
  });
  const access = useList<AccessPolicy>({
    path: "/admin/access-policies",
  });

  const loading = rateLimits.loading || security.loading || access.loading;

  const activeRateLimits = rateLimits.data.filter((p) => p.enabled).length;
  const activeSecurity = security.data.filter((p) => p.enabled ?? true).length;

  const stats: StatCardItem[] = [
    { label: "Rate-limit policies", value: rateLimits.data.length, icon: <Gauge size={18} /> },
    { label: "Rate-limit enabled", value: activeRateLimits, icon: <Gauge size={18} /> },
    { label: "Security policies", value: security.data.length, icon: <ShieldCheck size={18} /> },
    { label: "Access policies", value: access.data.length, icon: <KeyRound size={18} /> },
    { label: "Security enforced", value: activeSecurity, icon: <Fingerprint size={18} /> },
  ];

  if (loading) {
    return (
      <DomainShell domainId="settings" title="Policies">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  const renderRateLimits = () => {
    if (rateLimits.error) {
      return (
        <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
          {rateLimits.error.message}
        </p>
      );
    }
    if (rateLimits.data.length === 0) {
      return (
        <div style={{ margin: "var(--space-3) 0 0" }}>
          <EmptyState title="No rate-limit policies" description="The enterprise-scale endpoint returned no policies." />
        </div>
      );
    }
    return (
      <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
        {rateLimits.data.slice(0, 12).map((p) => (
          <li key={p.id ?? p.name ?? "?"} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ fontWeight: 500 }}>{p.name ?? p.policy ?? p.status ?? "—"}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              {p.limitPerMinute != null && (
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  {p.limitPerMinute}/min{p.burst ? ` +${p.burst} burst` : ""}
                </span>
              )}
              <Badge variant={p.enabled ? "success" : "default"}>
                {p.enabled ? "ENABLED" : "DISABLED"}
              </Badge>
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderSecurity = () => {
    if (security.error) {
      return (
        <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
          {security.error.message}
        </p>
      );
    }
    if (security.data.length === 0) {
      return (
        <div style={{ margin: "var(--space-3) 0 0" }}>
          <EmptyState title="No security policies" description="The auth endpoint returned no security policies." />
        </div>
      );
    }
    return (
      <dl style={{ margin: "var(--space-3) 0 0", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
        {security.data.slice(0, 12).map((s) => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
            <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>{s.name ?? s.id}</dt>
            <dd style={{ margin: 0, display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              {s.mfaRequired && <Badge variant="info">MFA</Badge>}
              {s.sessionTimeoutMinutes != null && (
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  {s.sessionTimeoutMinutes}m timeout
                </span>
              )}
              <Badge variant={s.enabled ? "success" : "default"}>
                {s.enabled ? "ENABLED" : "DISABLED"}
              </Badge>
            </dd>
          </div>
        ))}
      </dl>
    );
  };

  return (
    <DomainShell
      domainId="settings"
      title="Policies"
      description="Platform-wide policies — rate limits, security and access control."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={5} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Rate-limit policies</h3>
            {renderRateLimits()}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Security policies</h3>
            {renderSecurity()}
          </Card>
        </div>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Access policies</h3>
          {access.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {access.error.message}
            </p>
          ) : access.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No access policies" description="The access-policies endpoint returned no policies." />
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {access.data.slice(0, 12).map((a) => (
                <li key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ fontWeight: 500 }}>{a.name ?? a.id}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    {a.roles && a.roles.length > 0 && (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {a.roles.join(", ")}
                      </span>
                    )}
                    <Badge variant={a.enabled ? "success" : "default"}>
                      {a.enabled ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}