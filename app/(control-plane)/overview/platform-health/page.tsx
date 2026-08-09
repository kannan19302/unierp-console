"use client";
/**
 * Overview → Platform Health.
 * Real reads from the control-plane health and operations endpoints.
 */
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";

interface HealthRow {
  service?: string;
  name?: string;
  status?: string;
  region?: string;
  p95LatencyMs?: number;
  errorRatePct?: number;
}

export default function PlatformHealth() {
  const health = useItem<Record<string, unknown>>("/platform/v1/operations/health");
  const services = useList<HealthRow>({
    path: "/platform/v1/operations/health/services",
  });

  const h = health.data ?? {};
const stats: StatCardItem[] = [
    { label: "Availability", value: h.availability != null ? String(h.availability) : "—" },
    { label: "Error budget", value: h.errorBudget != null ? String(h.errorBudget) : "—" },
    { label: "Open incidents", value: Number(h.openIncidents) || 0 },
    { label: "Degraded services", value: Number(h.degradedServices) || 0 },
  ];

  if (health.loading || services.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Platform Health</h2>
        <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
          SLI/SLO, error budgets and per-service status.
        </p>
      </div>
      <StatCardRow stats={stats} columns={4} />
      <Card padding="md">
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Service registry</h3>
        {services.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{services.error.message}</p>
        ) : services.data.length === 0 ? (
          <EmptyState title="No service telemetry" description="The health endpoint returned no services." />
        ) : (
          <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
            {services.data.slice(0, 20).map((svc) => (
              <li key={svc.name ?? svc.service ?? "?"} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ fontWeight: 500 }}>{svc.name ?? svc.service}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    {svc.p95LatencyMs != null ? `${svc.p95LatencyMs}ms` : "—"} · {svc.errorRatePct != null ? `${svc.errorRatePct}% err` : ""}
                  </span>
                  <Badge variant={svc.status === "HEALTHY" ? "success" : svc.status === "DEGRADED" ? "warning" : "danger"}>
                    {svc.status ?? "UNKNOWN"}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}