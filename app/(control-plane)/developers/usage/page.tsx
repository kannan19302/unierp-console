"use client";
/**
 * Developers → Usage.
 * Developer-portal consumption — requests, calls and key usage across the
 * API platform, read from the SaaS usage and analytics endpoints.
 */
import { Activity, Server, BarChart3, Zap } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList, useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface UsageRow {
  id?: string;
  key?: string;
  name?: string;
  app?: string;
  clientKey?: string;
  requests?: number;
  calls?: number;
  bandwidth?: number;
  errors?: number;
  window?: string;
  period?: string;
}

export default function DevelopersUsage() {
  const usage = useList<UsageRow>({ path: "/saas/usage" });
  const analytics = useItem<Record<string, unknown>>("/analytics");

  const a = analytics.data ?? {};
  const totalRequests = numValue(a.totalRequests, a.requests, a.totalCalls) ?? usage.data.reduce((n, u) => n + (u.requests ?? u.calls ?? 0), 0);
  const activeKeys = numValue(a.activeKeys, a.keys) ?? new Set(usage.data.map((u) => u.key ?? u.clientKey)).size;
  const errorRate = numValue(a.errorRate, a.failureRate);

  const stats: StatCardItem[] = [
    { label: "Requests", value: totalRequests, icon: <BarChart3 size={18} /> },
    { label: "Active keys", value: activeKeys ?? "—", icon: <Server size={18} /> },
    { label: "Error rate", value: errorRate != null ? `${errorRate}%` : "—", icon: <BarChart3 size={18} /> },
  ];

  if (usage.loading || analytics.loading) {
    return (
      <DomainShell domainId="developers" title="Usage" description="Developer API consumption across the platform.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="developers" title="Usage" description="Developer API consumption across the platform.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={3} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Consumption by key</h3>
          {usage.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>
              {usage.error.message}
            </p>
          ) : usage.data.length === 0 ? (
            <EmptyState title="No usage recorded" description="The usage endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {usage.data.slice(0, 40).map((u) => (
                <li
                  key={u.id ?? u.key ?? u.clientKey ?? `${u.name}-${u.window ?? u.period}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
                    <Badge variant="info">{u.key ?? u.clientKey ?? "—"}</Badge>
                    <span style={{ fontWeight: 500, fontSize: "var(--text-sm)" }}>{u.name ?? u.app ?? "—"}</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {(u.requests ?? u.calls ?? 0).toLocaleString()} calls
                      {u.window ?? u.period ? ` · ${u.window ?? u.period}` : ""}
                    </span>
                    {u.errors != null ? (
                      <Badge variant={u.errors > 0 ? "warning" : "success"}>{u.errors} err</Badge>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {analytics.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{analytics.error.message}</p>
        ) : null}
      </div>
    </DomainShell>
  );
}

function numValue(...values: unknown[]): number | undefined {
  return values.find((v) => typeof v === "number") as number | undefined;
}