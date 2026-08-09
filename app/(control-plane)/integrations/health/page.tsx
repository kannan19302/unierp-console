"use client";
/**
 * Integrations → Health.
 * Integration gateway health: connection status counts, governance summary
 * state and overall platform operations health.
 */
import { HeartPulse, Server, ShieldCheck, Activity } from "lucide-react";
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

interface ConnectionStatus {
  total?: number;
  active?: number;
  inactive?: number;
  error?: number;
  expired?: number;
}

interface GovernanceSummary {
  releases?: number;
  runLogsCount?: number;
  connectorsCount?: number;
  environmentState?: string;
}

interface OperationsDashboard {
  status?: string;
  metrics?: {
    queueDepth?: number;
    deadLetters?: number;
    outboxLagSeconds?: number;
    degradedTenants?: number;
    migrationState?: string;
  };
  timestamp?: string;
}

interface GatewayAnalytics {
  totalConnections?: number;
  activeConnections?: number;
  successRate?: number;
  logsLast24h?: number;
}

export default function IntegrationsHealth() {
  const status = useItem<ConnectionStatus>("/ext-gateway/connections/status");
  const summary = useItem<GovernanceSummary>("/builder/governance/summary");
  const dashboard = useItem<OperationsDashboard>("/platform/v1/operations/dashboard");
  const analytics = useItem<GatewayAnalytics>("/ext-gateway/analytics");

  const healthy = status.data?.error === 0;
  const opsStatus = dashboard.data?.status ?? "—";

  const stats: StatCardItem[] = [
    { label: "Connections", value: status.data?.total ?? "—", icon: <Server size={18} /> },
    { label: "Active", value: status.data?.active ?? "—", icon: <Activity size={18} /> },
    { label: "Errors", value: status.data?.error ?? "—", icon: <HeartPulse size={18} /> },
    {
      label: "Governance",
      value: summary.data?.environmentState ?? "—",
      icon: <ShieldCheck size={18} />,
    },
    { label: "Platform status", value: opsStatus, icon: <Activity size={18} /> },
  ];

  if (status.loading || dashboard.loading) {
    return (
      <DomainShell
        domainId="integrations"
        title="Integrations"
        description="SaaS integrations, connectors, credentials and gateway activity across the platform."
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="integrations"
      title="Integrations"
      description="SaaS integrations, connectors, credentials and gateway activity across the platform."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Health</h2>
          <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
            Gateway, governance and platform-level health indicators.
          </p>
        </div>

        <StatCardRow stats={stats} columns={5} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Connection health</h3>
            <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", marginTop: "var(--space-3)" }}>
              <Badge variant={healthy ? "success" : "danger"}>
                {healthy ? "Healthy" : "Attention required"}
              </Badge>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                {status.data?.active ?? 0} active / {status.data?.error ?? 0} errors
              </span>
            </div>
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span>Active</span>
                <Badge variant="success">{status.data?.active ?? "—"}</Badge>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span>Inactive</span>
                <Badge variant="default">{status.data?.inactive ?? "—"}</Badge>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span>Error</span>
                <Badge variant="danger">{status.data?.error ?? "—"}</Badge>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span>Expired</span>
                <Badge variant="warning">{status.data?.expired ?? "—"}</Badge>
              </li>
            </ul>
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Governance</h3>
            {summary.data ? (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span>Environment state</span>
                  <Badge variant={summary.data.environmentState === "HEALTHY" ? "success" : "warning"}>
                    {summary.data.environmentState ?? "—"}
                  </Badge>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span>Releases</span>
                  <Badge variant="info">{summary.data.releases ?? "—"}</Badge>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span>Run logs</span>
                  <Badge variant="info">{summary.data.runLogsCount ?? "—"}</Badge>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span>Connectors</span>
                  <Badge variant="info">{summary.data.connectorsCount ?? "—"}</Badge>
                </li>
              </ul>
            ) : summary.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{summary.error.message}</p>
            ) : (
              <EmptyState title="No governance summary" description="The governance summary endpoint returned no data." />
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Platform operations</h3>
            {dashboard.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{dashboard.error.message}</p>
            ) : dashboard.data ? (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span>Status</span>
                  <Badge variant={dashboard.data.status === "HEALTHY" ? "success" : "danger"}>
                    {dashboard.data.status ?? "—"}
                  </Badge>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span>Queue depth</span>
                  <Badge variant="info">{dashboard.data.metrics?.queueDepth ?? "—"}</Badge>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span>Dead letters</span>
                  <Badge variant={Number(dashboard.data.metrics?.deadLetters) > 0 ? "danger" : "default"}>
                    {dashboard.data.metrics?.deadLetters ?? "—"}
                  </Badge>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span>Outbox lag (s)</span>
                  <Badge variant="info">{dashboard.data.metrics?.outboxLagSeconds ?? "—"}</Badge>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span>Degraded tenants</span>
                  <Badge variant={Number(dashboard.data.metrics?.degradedTenants) > 0 ? "warning" : "success"}>
                    {dashboard.data.metrics?.degradedTenants ?? "—"}
                  </Badge>
                </li>
              </ul>
            ) : null}
          </Card>
        </div>
      </div>
    </DomainShell>
  );
}