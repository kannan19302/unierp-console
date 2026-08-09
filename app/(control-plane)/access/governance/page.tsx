"use client";
/**
 * Users & Access → Governance.
 * Access governance surfaces: access package catalog, governance/security
 * policy knobs and platform settings, all read from the verified admin
 * endpoints. Real data only.
 */
import { BadgeCheck, Package, Settings } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { useItem, useList } from "@/lib/data";

interface AccessPackageRow {
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  approvers?: string[];
  approvalRequired?: boolean;
  period?: string;
  grantedBy?: string[];
  permissions?: string[];
  entitlements?: string[];
}

interface SettingsRow {
  id?: string;
  key?: string;
  name?: string;
  value?: string;
  type?: string;
  updatedAt?: string;
}

interface SecurityConfig {
  mfaEnabled?: boolean;
  sessionTimeoutMinutes?: number;
  passwordPolicy?: Record<string, unknown>;
  mfa?: Record<string, unknown>;
}

function statusVariant(status?: string): "success" | "warning" | "danger" | "default" {
  const s = String(status ?? "").toUpperCase();
  if (["ACTIVE", "ENABLED", "PUBLISHED", "GRANTED"].includes(s)) return "success";
  if (["PENDING", "DRAFT", "REVIEW"].includes(s)) return "warning";
  if (["DISABLED", "ARCHIVED", "REVOKED", "RETIRED"].includes(s)) return "danger";
  return "default";
}

function flag(value: unknown): "success" | "danger" | "warning" {
  if (value === true || value === "true") return "success";
  if (value === false || value === "false") return "danger";
  return "warning";
}

export default function AccessGovernance() {
  const packages = useList<AccessPackageRow>({ path: "/admin/access-packages" });
  const settings = useList<SettingsRow>({ path: "/admin/settings" });
  const security = useItem<SecurityConfig>("/saas/security");

  const published = packages.data.filter((p) => statusVariant(p.status) === "success").length;
  const review = packages.data.filter((p) => statusVariant(p.status) === "warning").length;

  const stats: StatCardItem[] = [
    { label: "Access packages", value: packages.data.length, icon: <Package size={18} /> },
    { label: "Published", value: published, icon: <BadgeCheck size={18} /> },
    { label: "In review", value: review, icon: <BadgeCheck size={18} /> },
    { label: "Settings keys", value: settings.data.length, icon: <Settings size={18} /> },
  ];

  if (packages.loading || settings.loading || security.loading) {
    return (
      <DomainShell domainId="access" title="Governance" description="Access packages, policy controls and platform governance settings.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="access" title="Governance" description="Access packages, policy controls and platform governance settings.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Access packages</h3>
          {packages.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{packages.error.message}</p>
          ) : packages.data.length === 0 ? (
            <EmptyState title="No access packages" description="The access-packages endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {packages.data.slice(0, 30).map((p) => (
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
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    {p.description ? (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}> — {p.description}</span>
                    ) : null}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    {p.approvalRequired === true ? <Badge variant="warning">Approval required</Badge> : null}
                    {p.period ? (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{p.period}</span>
                    ) : null}
                    <Badge variant={statusVariant(p.status)}>{p.status ?? "ACTIVE"}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Settings size={16} /> Governance settings
              </span>
            </h3>
            {settings.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{settings.error.message}</p>
            ) : settings.data.length === 0 ? (
              <EmptyState title="No settings" description="The settings endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {settings.data.slice(0, 25).map((s) => (
                  <li
                    key={s.id ?? s.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{s.name ?? s.key}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{s.value ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Package size={16} /> Policy posture
              </span>
            </h3>
            {security.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{security.error.message}</p>
            ) : !security.data ? (
              <EmptyState title="No policy data" description="The security configuration endpoint returned no data." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", marginTop: "var(--space-3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>MFA</span>
                  <Badge variant={security.data.mfaEnabled === true ? "success" : "danger"}>
                    {security.data.mfaEnabled === true ? "Required" : "Optional"}
                  </Badge>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Password policy</span>
                  <Badge variant={flag(Boolean(security.data.passwordPolicy))}>
                    {security.data.passwordPolicy ? "Configured" : "Not configured"}
                  </Badge>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Session timeout (min)</span>
                  <span style={{ fontWeight: 500 }}>{security.data.sessionTimeoutMinutes ?? "—"}</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DomainShell>
  );
}