"use client";
/**
 * Security & Compliance → Threats.
 * Security alerts (severity/status) and the alert thresholds that drive them.
 */
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface AdminAlert {
  id?: string;
  type?: string;
  severity?: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  isDismissed?: boolean;
  createdAt?: string;
}

interface AlertThreshold {
  id?: string;
  metric?: string;
  operator?: string;
  value?: number | string;
  severity?: string;
  isActive?: boolean;
  notifyEmail?: boolean;
  cooldownMin?: number;
  createdAt?: string;
}

export default function SecurityThreats() {
  const alerts = useList<AdminAlert>({ path: "/admin/alerts" });
  const thresholds = useList<AlertThreshold>({ path: "/admin/alerts/thresholds" });

  const critical = alerts.data.filter((a) => (a.severity ?? "").toUpperCase() === "CRITICAL").length;
  const unread = alerts.data.filter((a) => !a.isRead).length;
  const activeThresholds = thresholds.data.filter((t) => t.isActive !== false).length;

  const stats: StatCardItem[] = [
    { label: "Total alerts", value: alerts.data.length },
    { label: "Critical", value: critical },
    { label: "Unread", value: unread },
    { label: "Active thresholds", value: activeThresholds },
  ];

  const loading = alerts.loading || thresholds.loading;
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
      title="Threats"
      description="Security alerts, severities and the thresholds that trigger them."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Security alerts</h3>
          {alerts.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {alerts.error.message}
            </p>
          ) : alerts.data.length === 0 ? (
            <div style={{ marginTop: "var(--space-3)" }}>
              <EmptyState title="No security alerts" description="The alerts endpoint returned no rows." />
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {alerts.data.map((a) => (
                <li key={a.id ?? a.title} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.title ?? a.id}
                    </div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.message ?? a.type ?? ""}
                    </div>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Badge variant={severityVariant(a.severity)}>{a.severity ?? "WARNING"}</Badge>
                    <Badge variant={a.isRead ? "default" : "info"}>{a.isRead ? "Read" : "Unread"}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Alert thresholds</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: "var(--space-1) 0 0" }}>
            Rules per metric that give rise to security alerts.
          </p>
          {thresholds.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {thresholds.error.message}
            </p>
          ) : thresholds.data.length === 0 ? (
            <div style={{ marginTop: "var(--space-3)" }}>
              <EmptyState title="No thresholds configured" description="The thresholds endpoint returned no rows." />
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {thresholds.data.map((t) => (
                <li key={t.id ?? t.metric} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{t.metric ?? "—"}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {t.operator ?? "—"} {t.value != null ? String(t.value) : "—"}
                      {t.cooldownMin != null ? ` · cooldown ${t.cooldownMin} min` : ""}
                    </div>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Badge variant={severityVariant(t.severity)}>{t.severity ?? "WARNING"}</Badge>
                    <Badge variant={t.isActive === false ? "default" : "success"}>
                      {t.isActive === false ? "Inactive" : "Active"}
                    </Badge>
                    {t.notifyEmail === true && <Badge variant="info">Email</Badge>}
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

function severityVariant(severity?: string): "success" | "warning" | "danger" | "info" | "default" {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
    case "ERROR":
      return "danger";
    case "HIGH":
    case "WARNING":
      return "warning";
    case "LOW":
      return "info";
    case "INFO":
      return "success";
    default:
      return "default";
  }
}