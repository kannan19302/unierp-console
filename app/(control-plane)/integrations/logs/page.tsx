"use client";
/**
 * Integrations → Logs.
 * Execution run logs from the builder governance API and connection log
 * telemetry from the ext-gateway analytics endpoint.
 */
import { ScrollText, Timer, Activity } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  Badge,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList, useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface RunLog {
  id?: string;
  level?: string;
  message?: string;
  stackTrace?: string | null;
  timestamp?: string;
}

interface GatewayAnalytics {
  totalConnections?: number;
  activeConnections?: number;
  totalWebhooks?: number;
  totalDeliveries?: number;
  successDeliveries?: number;
  failedDeliveries?: number;
  successRate?: number;
  totalRateLimits?: number;
  logsLast24h?: number;
}

export default function IntegrationsLogs() {
  const runLogs = useList<RunLog>({ path: "/builder/governance/logs" });
  const analytics = useItem<GatewayAnalytics>("/ext-gateway/analytics");

  const stats: StatCardItem[] = [
    { label: "Run logs", value: runLogs.total ?? runLogs.data.length, icon: <ScrollText size={18} /> },
    { label: "Connection logs (24h)", value: analytics.data?.logsLast24h ?? "—", icon: <Timer size={18} /> },
    { label: "Webhook deliveries", value: analytics.data?.totalDeliveries ?? "—", icon: <Activity size={18} /> },
  ];

  if (runLogs.loading || analytics.loading) {
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
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Logs</h2>
          <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
            Execution run logs and gateway activity from the control-plane.
          </p>
        </div>

        <StatCardRow stats={stats} columns={3} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Execution run logs</h3>
          {runLogs.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{runLogs.error.message}</p>
          ) : runLogs.data.length === 0 ? (
            <EmptyState title="No run logs" description="The governance logs endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {runLogs.data.slice(0, 50).map((l) => (
                <li
                  key={l.id ?? l.timestamp}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.message}
                    {l.stackTrace ? (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}> — {l.stackTrace}</span>
                    ) : null}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{l.timestamp ?? ""}</span>
                    <Badge variant={l.level === "ERROR" ? "danger" : l.level === "WARN" ? "warning" : "info"}>
                      {l.level ?? "—"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Gateway activity</h3>
          {analytics.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{analytics.error.message}</p>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span>Connections</span>
                <Badge variant="info">{analytics.data?.totalConnections ?? "—"}</Badge>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span>Active connections</span>
                <Badge variant="success">{analytics.data?.activeConnections ?? "—"}</Badge>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span>Webhook configs</span>
                <Badge variant="info">{analytics.data?.totalWebhooks ?? "—"}</Badge>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span>Deliveries in last 24h</span>
                <Badge variant={typeof analytics.data?.logsLast24h === "number" && analytics.data.logsLast24h > 0 ? "success" : "default"}>
                  {analytics.data?.logsLast24h ?? "—"}
                </Badge>
              </li>
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}