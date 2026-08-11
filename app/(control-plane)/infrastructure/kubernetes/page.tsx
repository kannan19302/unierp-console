"use client";
/**
 * Infrastructure → Kubernetes.
 * M19 — replaces the D044 read-only page: server-side filtering by
 * cluster, a detail route per routing row, and routing-weight changes as
 * a planned/approved/reconciled operation instead of a direct write.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container, Waypoints, Server, MapPin } from "lucide-react";
import { Card, EmptyState, ErrorState, DataTable, FilterBar, Select, Badge, StatCardRow, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface RoutingRow {
  id: string;
  tenantId: string;
  clusterId: string;
  nodeGroup: string;
  weight: number;
  isDedicated: boolean;
}

interface ClusterRow {
  id?: string;
  clusterName?: string;
  region?: string;
  status?: string;
}

export default function InfrastructureKubernetes() {
  const router = useRouter();
  const [clusterFilter, setClusterFilter] = useState<string>("all");

  const clusters = useList<ClusterRow>({ path: "/platform/v1/cluster-routing-deep/clusters" });
  const routing = useList<RoutingRow>({
    path: "/platform/v1/kubernetes/routing",
    params: { clusterId: clusterFilter === "all" ? undefined : clusterFilter },
  });

  const regionCount = new Set(clusters.data.map((c) => c.region).filter(Boolean)).size;
  const healthyCount = clusters.data.filter((c) => c.status === "HEALTHY").length;

  const stats: StatCardItem[] = [
    { label: "Routing rows", value: routing.data.length, icon: <Waypoints size={18} /> },
    { label: "Clusters", value: clusters.data.length, icon: <Container size={18} /> },
    {
      label: "Healthy clusters",
      value: clusters.data.length ? `${healthyCount}/${clusters.data.length}` : "—",
      icon: <Server size={18} />,
    },
    { label: "Regions", value: regionCount || "—", icon: <MapPin size={18} /> },
  ];

  return (
    <DomainShell domainId="infrastructure" title="Infrastructure · Kubernetes" description="Cluster routing rules and traffic steering across the Kubernetes fleet.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <FilterBar onClearAll={() => setClusterFilter("all")}>
          <Select value={clusterFilter} onChange={(e: any) => setClusterFilter(e.target.value)}>
            <option value="all">All clusters</option>
            {clusters.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.clusterName ?? c.id}
              </option>
            ))}
          </Select>
        </FilterBar>

        <Card padding="md">
          <h3 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: 600 }}>Cluster routing</h3>
          {routing.error ? (
            <ErrorState description={routing.error.message} onRetry={routing.reload} />
          ) : (
            <DataTable<RoutingRow>
              columns={[
                { key: "tenantId", header: "Tenant", render: (row) => row.tenantId },
                { key: "clusterId", header: "Cluster", render: (row) => row.clusterId },
                { key: "nodeGroup", header: "Node group", render: (row) => row.nodeGroup },
                { key: "weight", header: "Weight", render: (row) => <Badge variant={row.weight === 0 ? "danger" : "default"}>{row.weight}</Badge> },
                { key: "isDedicated", header: "Dedicated", render: (row) => (row.isDedicated ? <Badge variant="info">dedicated</Badge> : "—") },
              ]}
              data={routing.data}
              loading={routing.loading}
              rowKey={(row) => row.id}
              onRowClick={(row) => router.push(`/infrastructure/kubernetes/${row.id}`)}
              emptyTitle={clusterFilter === "all" ? "No routing rows" : "No routing rows for this cluster"}
              emptyMessage="Establish tenant routing via cluster registration first."
            />
          )}
        </Card>
      </div>
    </DomainShell>
  );
}
