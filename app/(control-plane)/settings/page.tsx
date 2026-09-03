"use client";
/**
 * Settings → Overview.
 *
 * KPI dashboard for the settings domain: feature-flag rules, rate-limit
 * policies, reporting templates, platform queue depth (operations dashboard)
 * and the provider platform-settings summary. Real data only — every section
 * renders honest loading/error/empty states from the control-plane API.
 */
import { Flag, Gauge, FileText, Layers, AlertTriangle } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface FeatureFlagRule {
  id: string;
  flagKey: string;
  name?: string;
  description?: string;
  percentageRollout?: number;
  userSegments?: string[];
  active?: boolean;
  enabled?: boolean;
}

interface RateLimitPolicy {
  id?: string;
  name?: string;
  policy?: string;
  limitPerMinute?: number;
  burst?: number;
  enabled?: boolean;
  status?: string;
}

interface ReportTemplate {
  id: string;
  title: string;
  category: string;
  isSystem?: boolean;
  createdAt?: string;
}

interface DashboardMetrics {
  queueDepth?: number;
  deadLetters?: number;
  outboxLagSeconds?: number;
  degradedTenants?: number;
  migrationState?: string;
}

interface DashboardSummary {
  status?: string;
  timestamp?: string;
  metrics?: DashboardMetrics;
}

interface SettingsTenant {
  id?: string;
  name?: string;
  slug?: string;
  plan?: string;
  status?: string;
  settings?: Record<string, unknown>;
}

interface SettingsOrganization {
  name?: string;
  email?: string;
  taxId?: string;
  currency?: string;
  timezone?: string;
  region?: string;
  address?: string;
}

interface SettingsPayload {
  tenant?: SettingsTenant;
  organization?: SettingsOrganization | null;
}

function flagsActiveCount(rules: FeatureFlagRule[]): number {
  return rules.filter((r) => r.active ?? r.enabled).length;
}

function badgeForStatus(status: string | undefined): "success" | "warning" | "danger" | "default" {
  const s = status?.toUpperCase();
  if (s === "ACTIVE" || s === "HEALTHY" || s === "ENABLED") return "success";
  if (s === "DEGRADED" || s === "SUSPENDED" || s === "PENDING") return "warning";
  if (s === "DISABLED" || s === "TERMINATED" || s === "FAILED") return "danger";
  return "default";
}

export default function OverviewSettingsPage() {
  const flags = useList<FeatureFlagRule>({
    path: "/platform/v1/flags-metering/feature-flags/rules",
  });
  const policies = useList<RateLimitPolicy>({
    path: "/platform/v1/enterprise-scale/rate-limit-policies",
  });
  const templates = useList<ReportTemplate>({
    path: "/reporting/templates-deep/templates",
  });
  const dashboard = useItem<DashboardSummary>("/platform/v1/operations/dashboard");
  const settings = useItem<SettingsPayload>("/admin/settings");

  const metrics = dashboard.data?.metrics ?? {};
  const activeFlags = flagsActiveCount(flags.data);
  const queueDepth = Number(metrics.queueDepth) || 0;
  const degradedTenants = Number(metrics.degradedTenants) || 0;

  const stats: StatCardItem[] = [
    { label: "Feature flag rules", value: flags.data.length, icon: <Flag size={18} /> },
    { label: "Rate-limit policies", value: policies.data.length, icon: <Gauge size={18} /> },
    { label: "Report templates", value: templates.data.length, icon: <FileText size={18} /> },
    { label: "Flagged active", value: activeFlags, icon: <Flag size={18} /> },
    { label: "Queue depth", value: queueDepth, icon: <Layers size={18} /> },
  ];

  if (
    flags.loading ||
    policies.loading ||
    templates.loading ||
    settings.loading
  ) {
    return (
      <DomainShell domainId="settings" title="Overview">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  const tenant = settings.data?.tenant;
  const org = settings.data?.organization;

  return (
    <DomainShell
      domainId="settings"
      title="Overview"
      description="Platform settings — flags, policies, templates, formatting and brand across the control plane."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={5} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Platform settings
            </h3>
            {settings.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {settings.error.message}
              </p>
            ) : !tenant ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No platform settings" description="The admin settings endpoint returned no data." />
              </div>
            ) : (
              <dl style={{ margin: "var(--space-3) 0 0", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Tenant</dt>
                  <dd style={{ margin: 0, fontWeight: 500 }}>{tenant.name ?? tenant.slug ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Plan</dt>
                  <dd style={{ margin: 0, fontWeight: 500 }}>{tenant.plan ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Status</dt>
                  <dd style={{ margin: 0 }}>
                    <Badge variant={badgeForStatus(tenant.status)}>{tenant.status ?? "UNKNOWN"}</Badge>
                  </dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Organization</dt>
                  <dd style={{ margin: 0, fontWeight: 500 }}>{org?.name ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Contact email</dt>
                  <dd style={{ margin: 0 }}>{org?.email ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Currency</dt>
                  <dd style={{ margin: 0 }}>{org?.currency ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Timezone</dt>
                  <dd style={{ margin: 0 }}>{org?.timezone ?? "—"}</dd>
                </div>
              </dl>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Feature flag rules
            </h3>
            {flags.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {flags.error.message}
              </p>
            ) : flags.data.length === 0 ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No feature flag rules" description="The feature-flags endpoint returned no rules." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {flags.data.slice(0, 12).map((f) => {
                  const on = f.active ?? f.enabled;
                  return (
                    <li key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                      <span style={{ fontWeight: 500 }}>{f.name ?? f.flagKey}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                        {f.percentageRollout != null && (
                          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                            {f.percentageRollout}% rollout
                          </span>
                        )}
                        <Badge variant={on ? "success" : "default"}>{on ? "ACTIVE" : "OFF"}</Badge>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Reporting templates
            </h3>
            {templates.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {templates.error.message}
              </p>
            ) : templates.data.length === 0 ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No reporting templates" description="The templates endpoint returned no templates." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {templates.data.slice(0, 12).map((tpl) => (
                  <li key={tpl.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontWeight: 500 }}>{tpl.title}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {tpl.category}
                      </span>
                      {tpl.isSystem && <Badge variant="info">SYSTEM</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Rate-limit policies
            </h3>
            {policies.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {policies.error.message}
              </p>
            ) : policies.data.length === 0 ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No rate-limit policies" description="The enterprise-scale endpoint returned no policies." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {policies.data.slice(0, 12).map((p) => (
                  <li key={p.id ?? p.name ?? "?"} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontWeight: 500 }}>{p.name ?? p.status ?? "—"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      {p.limitPerMinute != null && (
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          limit {p.limitPerMinute}
                        </span>
                      )}
                      <Badge variant={p.enabled ? "success" : "default"}>
                        {p.enabled ? "ENABLED" : "DISABLED"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Platform operations
          </h3>
          {dashboard.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {dashboard.error.message}
            </p>
          ) : (
            <div style={{ margin: "var(--space-3) 0 0", display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                {degradedTenants > 0 ? (
                  <AlertTriangle size={16} color="var(--color-danger)" />
                ) : null}
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Degraded tenants
                </span>
                <Badge variant={degradedTenants > 0 ? "danger" : "success"}>{degradedTenants}</Badge>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Dead letters
                </span>
                <span style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>{Number(metrics.deadLetters) || 0}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Outbox lag
                </span>
                <span style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>
                  {Number(metrics.outboxLagSeconds) || 0}s
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Migrations
                </span>
                <span style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>
                  {metrics.migrationState ?? "—"}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}