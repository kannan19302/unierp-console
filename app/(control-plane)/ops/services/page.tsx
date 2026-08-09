"use client";
/**
 * Ops → Services.
 * Every control-plane service with its real health state, plus the platform
 * health headline metrics (availability, error budget, incidents, degraded
 * services) from the operations API.
 */
import { Server } from "lucide-react";
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

interface ServiceRow {
  service?: string;
  name?: string;
  status?: string;
  region?: string;
  p95LatencyMs?: number;
  errorRatePct?: number;
  version?: string;
}

function statusVariant(status: string | undefined): "success" | "warning" | "danger" | "default" {
  const s = status?.toUpperCase() ?? "";
  if (s === "HEALTHY" || s === "OK" || s === "ACTIVE" || s === "READY") return "success";
  if (s === "DEGRADED" || s === "WARN" || s === "STARTING") return "warning";
  if (s === "UNHEALTHY" || s === "DOWN" || s === "FAILED" || s === "ERROR") return "danger";
  return "default";
}

export default function OpsServices() {
  const health = useItem<Record<string, unknown>>("/platform/v1/operations/health");
  const services = useList<ServiceRow>({
    path: "/platform/v1/operations/health/services",
  });

  const h = health.data ?? {};
  const metrics = (h.metrics ?? {}) as Record<string, unknown>;
  const availability = h.availability ?? metrics.availability ?? "—";
  const errorBudget = h.errorBudget ?? metrics.errorBudget ?? "—";
  const openIncidents = Number(h.openIncidents ?? 0) || 0;
  const degradedServices = Number(h.degradedServices ?? 0) || 0;

  const stats: StatCardItem[] = [
    { label: "Availability", value: String(availability), icon: <Server size={18} /> },
    { label: "Error budget", value: String(errorBudget), icon: <Server size={18} /> },
    { label: "Open incidents", value: openIncidents, icon: <Server size={18} /> },
    { label: "Degraded services", value: degradedServices, icon: <Server size={18} /> },
  ];

  if (health.loading || services.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="ops"
      title="Services"
      description="Health of every control-plane service, with SLO headline metrics."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />
        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Service registry
          </h3>
          {services.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
              {services.error.message}
            </p>
          ) : services.data.length === 0 ? (
            <EmptyState
              title="No service telemetry"
              description="The health/services endpoint returned no services."
            />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {services.data.map((svc) => (
                <li
                  key={svc.name ?? svc.service ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{svc.name ?? svc.service}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {svc.p95LatencyMs != null ? `${svc.p95LatencyMs}ms` : ""}
                      {svc.errorRatePct != null ? ` · ${svc.errorRatePct}% err` : ""}
                      {svc.version ? ` · ${svc.version}` : ""}
                    </span>
                    <Badge variant={statusVariant(svc.status ?? "")}>
                      {svc.status ?? "UNKNOWN"}
                    </Badge>
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