"use client";
/**
 * Overview → Security.
 * Platform-wide security posture: alerts, SOC operations and health from the
 * control-plane endpoints.
 */
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";

interface AlertRow {
  id?: string;
  title?: string;
  severity?: string;
  status?: string;
  source?: string;
}

interface Incident {
  id?: string;
  title?: string;
  severity?: string;
  status?: string;
}

export default function OverviewSecurity() {
  const alerts = useList<AlertRow>({ path: "/admin/alerts" });
  const incidents = useList<Incident>({ path: "/platform/v1/operations/incidents" });

  const stats: StatCardItem[] = [
    { label: "Open alerts", value: alerts.data.filter((a) => a.status === "OPEN" || !a.status).length },
    { label: "Alerts total", value: alerts.data.length },
    { label: "Incidents", value: incidents.data.length },
    { label: "Encrypted at rest", value: "Enabled" },
  ];

  if (alerts.loading || incidents.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Security</h2>
        <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
          Platform security posture, alerts and active incidents.
        </p>
      </div>

      <StatCardRow stats={stats} columns={4} />

      <section>
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Security alerts</h3>
        {alerts.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{alerts.error.message}</p>
        ) : alerts.data.length === 0 ? (
          <EmptyState title="No security alerts" description="The alerts endpoint returned no rows." />
        ) : (
          <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
            {alerts.data.slice(0, 20).map((a) => (
              <li
                key={a.id ?? a.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-2) 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <span style={{ fontWeight: 500 }}>{a.title ?? a.id}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <Badge variant={a.severity === "CRITICAL" ? "danger" : a.severity === "HIGH" ? "warning" : "default"}>
                    {a.severity ?? "INFO"}
                  </Badge>
                  <Badge variant={a.status === "OPEN" ? "warning" : a.status === "ACKNOWLEDGED" ? "info" : "success"}>
                    {a.status ?? "OPEN"}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card padding="md">
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Security posture</h3>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>
          SOC actions, key rotation, quarantine and breach-response live under Security &amp; Compliance.
        </p>
      </Card>
    </div>
  );
}