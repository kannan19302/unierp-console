"use client";
/**
 * Analytics → Performance.
 * Platform performance and delivery health from the operations dashboard:
 * job queues, dead letters, outbox lag and degraded tenants.
 */
import { Cpu, GitBranch, AlertTriangle, Server } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { useItem } from "@/lib/data";

interface OpsDashboard {
  status?: string;
  timestamp?: string;
  metrics?: {
    queueDepth?: number;
    deadLetters?: number;
    outboxLagSeconds?: number;
    degradedTenants?: number;
    migrationState?: string;
  };
}

export default function AnalyticsPerformanceTab() {
  const dashboard = useItem<OpsDashboard>("/platform/v1/operations/dashboard");
  const m = dashboard.data?.metrics ?? ({} as NonNullable<OpsDashboard["metrics"]>);

  const seconds = (v?: number): string =>
    v == null || Number.isNaN(v) ? "—" : `${v}s`;

  const stats: StatCardItem[] = [
    {
      label: "Queue depth",
      value: m.queueDepth ?? "—",
      icon: <Cpu size={18} />,
    },
    {
      label: "Dead letters",
      value: m.deadLetters ?? "—",
      icon: <AlertTriangle size={18} />,
      color: m.deadLetters != null && m.deadLetters > 0 ? "var(--color-danger)" : undefined,
    },
    {
      label: "Outbox lag",
      value: seconds(m.outboxLagSeconds),
      icon: <GitBranch size={18} />,
    },
    {
      label: "Degraded tenants",
      value: m.degradedTenants ?? "—",
      icon: <Server size={18} />,
      color: m.degradedTenants != null && m.degradedTenants > 0 ? "var(--color-danger)" : undefined,
    },
    {
      label: "Platform status",
      value: dashboard.data?.status ?? "—",
      icon: <AlertTriangle size={18} />,
    },
  ];

  if (dashboard.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="analytics"
      title="Performance"
      description="Platform performance signals from the operations dashboard."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={5} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Operations snapshot</h3>
          {dashboard.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-3)" }}>
              {dashboard.error.message}
            </p>
          ) : (
            <>
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {(
                  [
                    ["Queue depth", m.queueDepth ?? "—"],
                    ["Dead letters", m.deadLetters ?? "—"],
                    ["Outbox lag", seconds(m.outboxLagSeconds)],
                    ["Degraded tenants", m.degradedTenants ?? "—"],
                    ["Migration state", m.migrationState ?? "—"],
                  ] as const
                ).map(([label, value]) => (
                  <li key={label} style={rowStyle}>
                    <span>{label}</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Platform health</span>
                <Badge variant={dashboard.data?.status === "HEALTHY" ? "success" : dashboard.data?.status === "DEGRADED" ? "danger" : "default"}>
                  {dashboard.data?.status ?? "UNKNOWN"}
                </Badge>
              </div>
            </>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>What this measures</h3>
          <p style={{ margin: "var(--space-3) 0 0", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
            Queued background jobs, failed jobs sitting in dead-letter queues,
            the age of the oldest pending outbox delivery, and tenants flagged for
            repeated error-level logging are read live from{" "}
            <code>platform/v1/operations/dashboard</code>.
          </p>
        </Card>
      </div>
    </DomainShell>
  );
}

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "var(--space-3)",
  padding: "var(--space-2) 0",
  borderBottom: "1px solid var(--color-border)",
  fontSize: "var(--text-sm)",
} as const;