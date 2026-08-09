"use client";
/**
 * Infrastructure → Kubernetes.
 * Cluster routing rules across the Kubernetes fleet — where traffic is
 * steered, at what weight and from which tenant. Real data from the
 * cluster-routing-deep routing endpoint.
 */
import { Container, Waypoints, Server, MapPin } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface RoutingRule {
  id?: string;
  name?: string;
  rule?: string;
  sourceCluster?: string;
  destinationCluster?: string;
  fromCluster?: string;
  toCluster?: string;
  source?: string;
  destination?: string;
  path?: string;
  route?: string;
  weight?: number;
  tenant?: string;
  status?: string;
}

interface ClusterRow {
  id?: string;
  name?: string;
  cluster?: string;
  region?: string;
  status?: string;
}

export default function InfrastructureKubernetes() {
  const routing = useList<RoutingRule>({ path: "/platform/v1/cluster-routing-deep/routing" });
  const clusters = useList<ClusterRow>({ path: "/platform/v1/cluster-routing-deep/clusters" });

  const regionCount = new Set(clusters.data.map((c) => c.region).filter(Boolean)).size;
  const healthyCount = clusters.data.filter((c) => c.status === "HEALTHY").length;

  const stats: StatCardItem[] = [
    { label: "Routing rules", value: routing.data.length, icon: <Waypoints size={18} /> },
    { label: "Clusters", value: clusters.data.length, icon: <Container size={18} /> },
    {
      label: "Healthy clusters",
      value: clusters.data.length ? `${healthyCount}/${clusters.data.length}` : "—",
      icon: <Server size={18} />,
    },
    { label: "Regions", value: regionCount || "—", icon: <MapPin size={18} /> },
  ];

  if (routing.loading || clusters.loading) {
    return (
      <DomainShell domainId="infrastructure" title="Kubernetes" description="Cluster routing rules and traffic steering across the Kubernetes fleet.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="infrastructure" title="Kubernetes" description="Cluster routing rules and traffic steering across the Kubernetes fleet.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Cluster routing</h3>
          {routing.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {routing.error.message}
            </p>
          ) : routing.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No routing rules" description="The cluster routing endpoint returned no rules." />
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
              {routing.data.slice(0, 30).map((r) => {
                const from = r.sourceCluster ?? r.fromCluster ?? r.source;
                const to = r.destinationCluster ?? r.toCluster ?? r.destination;
                return (
                  <li
                    key={r.id ?? r.name ?? r.rule ?? `${from}-${to}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 500 }}>{r.name ?? r.rule ?? r.route ?? "route"}</span>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                        {" "}
                        {from ? `${from} →` : ""} {to ?? "…"}
                        {r.tenant ? ` · tenant ${r.tenant}` : ""}
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {r.weight != null ? `weight ${r.weight}` : ""}
                        {r.path ? ` · ${r.path}` : ""}
                      </span>
                      <Badge
                        variant={
                          r.status === "ACTIVE" || r.status === "ENABLED"
                            ? "success"
                            : r.status === "DEGRADED"
                              ? "warning"
                              : r.status === "DISABLED"
                                ? "default"
                                : "info"
                        }
                      >
                        {r.status ?? "UNKNOWN"}
                      </Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}