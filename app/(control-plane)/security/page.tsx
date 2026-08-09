"use client";
/**
 * Security & Compliance → Overview.
 * KPI dashboard + recent alerts. Real reads from the control-plane security,
 * enterprise-scale and audit endpoints. No mocked rows.
 */
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

interface AuditEvent {
  id?: string;
  userId?: string;
  action?: string;
  createdAt?: string;
  ipAddress?: string;
}

interface EnterpriseRow {
  id?: string;
  name?: string;
  key?: string;
}

interface OperationsSummary {
  status?: string;
  metrics?: {
    queueDepth?: number;
    deadLetters?: number;
    outboxLagSeconds?: number;
    degradedTenants?: number;
    migrationState?: string;
  };
}

export default function SecurityOverview() {
  const alerts = useList<AdminAlert>({ path: "/admin/alerts" });
  const keyRotations = useList<EnterpriseRow>({
    path: "/platform/v1/enterprise-scale/key-rotations",
  });
  const isolationPolicies = useList<EnterpriseRow>({
    path: "/platform/v1/enterprise-scale/isolation-policies",
  });
  const auditEvents = useList<AuditEvent>({ path: "/audit/security" });
  const ops = useItem<OperationsSummary>("/platform/v1/operations/dashboard");

  const openAlerts = alerts.data.filter((a) => !a.isDismissed).length;
  const unreadAlerts = alerts.data.filter((a) => !a.isRead).length;
  const rotationsTotal =
    Number(keyRotations.total) || keyRotations.data.length;
  const isolationTotal =
    Number(isolationPolicies.total) || isolationPolicies.data.length;
  const auditTotal = Number(auditEvents.total) || auditEvents.data.length;

  const stats: StatCardItem[] = [
    { label: "Open alerts", value: openAlerts },
    { label: "Key rotations", value: rotationsTotal },
    { label: "Isolation policies", value: isolationTotal },
    { label: "Audit events", value: auditTotal },
  ];

  const loading =
    alerts.loading ||
    keyRotations.loading ||
    isolationPolicies.loading ||
    auditEvents.loading ||
    ops.loading;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  const m = ops.data?.metrics;

  return (
    <DomainShell
      domainId="security"
      title="Security & Compliance"
      description="Alerts, key rotations, isolation policies and audit events across the platform."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Recent alerts</h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: "var(--space-1) 0 0" }}>
              {unreadAlerts > 0 ? `${unreadAlerts} unread` : "All alerts read"}
            </p>
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
                {alerts.data.slice(0, 12).map((a) => (
                  <li key={a.id ?? a.title} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.title ?? a.id}
                      </div>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {a.type ?? "ALERT"}
                      </div>
                    </div>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <Badge variant={severityVariant(a.severity)}>{a.severity ?? "WARNING"}</Badge>
                      <Badge variant={a.isRead ? "default" : "info"}>{a.isRead ? "Read" : "New"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Enterprise-scale resources</h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: "var(--space-1) 0 0" }}>
              Key rotation schedules and tenant isolation policies.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginTop: "var(--space-3)" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Key rotations</div>
                {keyRotations.error ? (
                  <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{keyRotations.error.message}</p>
                ) : keyRotations.data.length === 0 ? (
                  <EmptyState title="No key rotations" description="The key-rotations endpoint returned no rows." />
                ) : (
                  <ul style={{ listStyle: "none", margin: "var(--space-2) 0 0", padding: 0 }}>
{keyRotations.data.slice(0, 6).map((r) => (
                  <li key={r.id ?? r.key ?? r.name ?? "?"} style={{ padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
                    <span>{r.name ?? r.key ?? r.id}</span>
                  </li>
                ))}
                  </ul>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>Isolation policies</div>
                {isolationPolicies.error ? (
                  <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{isolationPolicies.error.message}</p>
                ) : isolationPolicies.data.length === 0 ? (
                  <EmptyState title="No isolation policies" description="The isolation-policies endpoint returned no rows." />
                ) : (
                  <ul style={{ listStyle: "none", margin: "var(--space-2) 0 0", padding: 0 }}>
                    {isolationPolicies.data.slice(0, 6).map((p) => (
                      <li key={p.key ?? p.name ?? "?"} style={{ padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
                        <span>{p.name ?? p.key}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Operations dashboard</h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: "var(--space-1) 0 0" }}>
              Control-plane health summary for context around security posture.
            </p>
            {ops.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {ops.error.message}
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Platform status</span>
                  <Badge variant={ops.data?.status === "HEALTHY" ? "success" : "warning"}>{ops.data?.status ?? "—"}</Badge>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Queue depth</span>
                  <span>{m?.queueDepth ?? "—"}</span>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Dead letters</span>
                  <span>{m?.deadLetters ?? "—"}</span>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Degraded tenants</span>
                  <span>{m?.degradedTenants ?? "—"}</span>
                </li>
              </ul>
            )}
          </Card>
        </div>
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