"use client";
/**
 * Infrastructure → Compute.
 * The compute cluster fleet across regions: node counts, capacity and health,
 * read from the cluster-routing-deep clusters endpoint. Real data only.
 */
import { Server, Cpu, MapPin } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface ComputeCluster {
  id?: string;
  name?: string;
  cluster?: string;
  version?: string;
  region?: string;
  env?: string;
  provider?: string;
  status?: string;
  nodeCount?: number;
  nodes?: number;
  cpu?: number;
  memory?: number;
  totalCpu?: number;
  totalMemory?: number;
}

function statusVariant(status?: string): "success" | "default" | "warning" | "danger" | "info" {
  if (status === "HEALTHY" || status === "ACTIVE" || status === "READY") return "success";
  if (status === "DEGRADED" || status === "WARNING") return "warning";
  if (status === "UNHEALTHY" || status === "DOWN") return "danger";
  if (status === "SCALING" || status === "PENDING") return "info";
  return "default";
}

export default function InfrastructureCompute() {
  const clusters = useList<ComputeCluster>({ path: "/platform/v1/cluster-routing-deep/clusters" });

  const totalNodes = clusters.data.reduce(
    (acc, c) => acc + Number(c.nodeCount ?? c.nodes ?? 0),
    0,
  );
  const healthyCount = clusters.data.filter((c) => c.status === "HEALTHY").length;
  const regionCount = new Set(clusters.data.map((c) => c.region).filter(Boolean)).size;

  const stats: StatCardItem[] = [
    { label: "Clusters", value: clusters.data.length, icon: <Server size={18} /> },
    { label: "Healthy", value: clusters.data.length ? `${healthyCount}/${clusters.data.length}` : "—", icon: <Server size={18} /> },
    { label: "Compute nodes", value: totalNodes || "—", icon: <Cpu size={18} /> },
    { label: "Regions", value: regionCount || "—", icon: <MapPin size={18} /> },
  ];

  if (clusters.loading) {
    return (
      <DomainShell domainId="infrastructure" title="Compute" description="Compute cluster fleet, nodes, CPUs and capacity by region.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="infrastructure" title="Compute" description="Compute cluster fleet, nodes, and capacity by region.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Cluster fleet</h3>
          {clusters.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {clusters.error.message}
            </p>
          ) : clusters.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No compute clusters" description="The cluster endpoint returned no clusters." />
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
                    <span style={{ fontWeight: 500 }}>{c.name ?? c.cluster ?? c.id ?? "—"}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {" "}· {c.provider ?? "cloud"}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {c.version ? `k8s ${c.version} · ` : ""}
                      {Number(c.nodeCount ?? c.nodes) ? `${c.nodeCount ?? c.nodes} nodes` : ""}
                      {c.cpu != null ? ` · ${c.cpu} vCPU` : ""}
                      {c.memory != null ? ` · ${c.memory} GB` : ""}
                    </span>
                    <Badge variant={statusVariant(c.status)}>{c.status ?? "UNKNOWN"}</Badge>
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