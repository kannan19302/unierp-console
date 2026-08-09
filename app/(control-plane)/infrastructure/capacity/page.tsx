"use client";
/**
 * Infrastructure → Capacity.
 * Platform headroom and per-cluster capacity: availability, error budget and
 * the compute capacity behind each cluster. Real reads from the health,
 * dashboard and cluster endpoints.
 */
import { Gauge, Server, Cpu, Activity } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface CapacityCluster {
  id?: string;
  name?: string;
  cluster?: string;
  region?: string;
  status?: string;
  nodeCount?: number;
  nodes?: number;
  cpu?: number;
  totalCpu?: number;
  memory?: number;
  totalMemory?: number;
  allocated?: string | number;
}

export default function InfrastructureCapacity() {
  const health = useItem<Record<string, unknown>>("/platform/v1/operations/health");
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");
  const clusters = useList<CapacityCluster>({ path: "/platform/v1/cluster-routing-deep/clusters" });

  const h = health.data ?? {};
  const s = summary.data ?? {};

  const clustersTotal = Number(s.clustersTotal ?? s.totalClusters ?? clusters.data.length) || 0;
  const clustersHealthy = Number(s.clustersHealthy ?? s.healthyClusters) || 0;
  const vertices = clusters.data.reduce((acc, c) => acc + Number(c.nodeCount ?? c.nodes ?? 0), 0);

  const stats: StatCardItem[] = [
    { label: "Availability", value: h.availability != null ? String(h.availability) : "—", icon: <Gauge size={18} /> },
    { label: "Error budget", value: h.errorBudget != null ? String(h.errorBudget) : "—", icon: <Activity size={18} /> },
    {
      label: "Cluster headroom",
      value: clustersTotal ? `${clustersHealthy}/${clustersTotal}` : "—",
      icon: <Server size={18} />,
    },
    { label: "Compute nodes", value: vertices || "—", icon: <Cpu size={18} /> },
  ];

  if (health.loading || clusters.loading) {
    return (
      <DomainShell domainId="infrastructure" title="Capacity" description="Platform headroom, availability and per-cluster compute capacity.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="infrastructure" title="Capacity" description="Platform headroom, availability and per-cluster compute capacity.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Platform headroom</h3>
          {health.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {health.error.message}
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: "var(--space-3) 0 0",
                padding: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {[
                { label: "Open incidents", value: Number(h.openIncidents) || 0 },
                { label: "Degraded services", value: Number(h.degradedServices) || 0 },
                { label: "Queue depth", value: Number(s.queueDepth) || 0 },
                { label: "Degraded tenants", value: Number(s.degradedTenants) || 0 },
              ].map((row) => (
                <li
                  key={row.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{row.value}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Per-cluster capacity</h3>
          {clusters.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {clusters.error.message}
            </p>
          ) : clusters.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No cluster capacity" description="The cluster endpoint returned no clusters." />
            </div>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: "var(--space-3) 0 0",
                padding: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {clusters.data.slice(0, 30).map((c) => (
                <li
                  key={c.id ?? c.name ?? c.cluster ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{c.name ?? c.cluster ?? "—"}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {c.region ? ` · ${c.region}` : ""}
                      {Number(c.totalCpu ?? c.cpu) ? ` · ${c.totalCpu ?? c.cpu} vCPU` : ""}
                      {Number(c.totalMemory ?? c.memory) ? ` · ${c.totalMemory ?? c.memory} GB` : ""}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {Number(c.nodeCount ?? c.nodes) ? `${c.nodeCount ?? c.nodes} nodes` : ""}
                      {c.allocated != null ? ` · ${c.allocated} allocated` : ""}
                    </span>
                    <Badge
                      variant={
                        c.status === "HEALTHY" || c.status === "ACTIVE"
                          ? "success"
                          : c.status === "DEGRADED" || c.status === "AT_CAPACITY"
                            ? "warning"
                            : c.status === "UNHEALTHY"
                              ? "danger"
                              : "default"
                      }
                    >
                      {c.status ?? "UNKNOWN"}
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