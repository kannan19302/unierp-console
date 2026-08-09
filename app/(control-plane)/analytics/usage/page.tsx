"use client";
/**
 * Analytics → Usage.
 * Metered consumption (users, storage, metrics) from the SaaS usage endpoint
 * plus the analytics module configuration.
 */
import { Users, Database, Gauge, Settings2, HardDrive } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { useItem, useList } from "@/lib/data";

interface UsageSummary {
  plan?: string;
  overQuota?: boolean;
  users?: { current?: number; limit?: number; pct?: number };
  storage?: {
    current?: number;
    limit?: number;
    pct?: number;
    perApp?: { appSlug?: string; rowCount?: number; estimatedMb?: number }[];
  };
  metrics?: { metric?: string; current?: number; limit?: number; pct?: number }[];
}

interface AnalyticsSettingRow {
  key?: string;
  value?: unknown;
  scope?: string;
  updatedAt?: string;
}

export default function AnalyticsUsageTab() {
  const usage = useItem<UsageSummary>("/saas/usage");
  const settings = useList<AnalyticsSettingRow>({ path: "/analytics/settings" });

  const u = usage.data ?? ({} as UsageSummary);

  const mb = (v?: number): string =>
    v == null || Number.isNaN(v) ? "—" : `${Math.round(v).toLocaleString()} MB`;

  const stats: StatCardItem[] = [
    {
      label: "Users",
      value: u.users?.current != null ? `${u.users.current} / ${u.users.limit ?? "—"}` : "—",
      icon: <Users size={18} />,
    },
    {
      label: "Storage usage",
      value: u.storage?.current != null ? `${u.storage.pct ?? 0}%` : "—",
      icon: <Database size={18} />,
    },
    {
      label: "Metered metrics",
      value: u.metrics?.length ?? "—",
      icon: <Gauge size={18} />,
    },
    {
      label: "Analytics settings",
      value: settings.data.length > 0 ? settings.data.length : settings.total ?? "—",
      icon: <Settings2 size={18} />,
    },
    {
      label: "Plan",
      value: u.plan ?? "—",
      icon: <HardDrive size={18} />,
    },
  ];

  if (usage.loading || settings.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="analytics"
      title="Usage"
      description="Metered consumption across users, storage and tracked metrics."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={5} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <section>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Metered metrics</h3>
            {usage.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                {usage.error.message}
              </p>
            ) : !u.metrics || u.metrics.length === 0 ? (
              <EmptyState title="No metered metrics" description="The usage endpoint returned no metric rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {u.metrics.map((m) => (
                  <li
                    key={m.metric}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{m.metric}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {m.current ?? 0} / {m.limit ?? 0}
                      </span>
                      <Badge variant={m.pct == null ? "default" : m.pct >= 80 ? "danger" : m.pct >= 50 ? "warning" : "success"}>
                        {m.pct ?? 0}%
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Storage by app</h3>
            {usage.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                {usage.error.message}
              </p>
            ) : !u.storage?.perApp || u.storage.perApp.length === 0 ? (
              <EmptyState title="No storage breakdown" description="The usage endpoint returned no per-app storage." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {u.storage.perApp.map((a) => (
                  <li
                    key={a.appSlug}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ fontWeight: 500 }}>{a.appSlug}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {mb(a.estimatedMb)} · {a.rowCount ?? 0} rows
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Analytics configuration</h3>
            {settings.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-3)" }}>
                {settings.error.message}
              </p>
            ) : settings.data.length === 0 ? (
              <EmptyState title="No analytics settings" description="The settings endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {settings.data.slice(0, 15).map((s, i) => (
                  <li
                    key={s.key ?? `setting-${i}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ fontWeight: 500, fontSize: "var(--text-sm)" }}>{s.key ?? "—"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {s.value != null ? String(s.value) : "—"}
                      </span>
                      {s.scope && <Badge variant="info">{s.scope}</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </DomainShell>
  );
}