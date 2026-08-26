"use client";
/**
 * Infrastructure → Kubernetes (PCC-08 Multi-Cloud Infrastructure Fleet & OCC-05).
 * M19 — replaces the D044 read-only page: server-side filtering by
 * cluster, a detail route per routing row, and routing-weight changes as
 * a planned/approved/reconciled operation instead of a direct write.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container, Waypoints, Server, MapPin, Plus, RefreshCw, SlidersHorizontal, Zap } from "lucide-react";
import {
  Card,
  EmptyState,
  ErrorState,
  DataTable,
  FilterBar,
  Select,
  Badge,
  Button,
  FormField,
  Input,
  Modal,
  StatCardRow,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import { api } from "@/lib/api";
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
  const toast = useToast();
  const canUpdateClusters = usePermission("system.clusters.update");

  const [clusterFilter, setClusterFilter] = useState<string>("all");

  const clusters = useList<ClusterRow>({ path: "/platform/v1/cluster-routing-deep/clusters" });
  const routing = useList<RoutingRow>({
    path: "/platform/v1/kubernetes/routing",
    params: { clusterId: clusterFilter === "all" ? undefined : clusterFilter },
  });

  const [proposeOpen, setProposeOpen] = useState(false);
  const [targetTenant, setTargetTenant] = useState("tnt_prod_01");
  const [targetCluster, setTargetCluster] = useState("cls-us-east-1");
  const [targetWeight, setTargetWeight] = useState("100");
  const [proposing, setProposing] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  const handlePropose = async () => {
    setProposing(true);
    try {
      await api.post("/platform/v1/kubernetes/routing/propose", {
        tenantId: targetTenant.trim(),
        clusterId: targetCluster.trim(),
        weight: parseInt(targetWeight, 10) || 100,
      });
      await routing.reload();
      toast.success("Routing Change Proposed", `Proposed weight ${targetWeight} for ${targetTenant} on ${targetCluster}.`);
      setProposeOpen(false);
    } catch {
      toast.error("Proposal Failed", "Failed to propose routing weight adjustment.");
    } finally {
      setProposing(false);
    }
  };

  const handleReconcile = async () => {
    setReconciling(true);
    try {
      await api.post("/platform/v1/kubernetes/routing/reconcile");
      await routing.reload();
      toast.success("Fleet Reconciled", "Kubernetes ingress weights and cell topologies synchronized.");
    } catch {
      toast.error("Reconciliation Failed", "Fleet reconciliation encountered errors.");
    } finally {
      setReconciling(false);
    }
  };

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
    <DomainShell
      domainId="infrastructure"
      title="Multi-Cloud Fleet & Cell Topology"
      description="Cluster routing rules, traffic steering, cell partitions, and ingress weights across multi-cloud Kubernetes fleets."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clusters.reload();
              routing.reload();
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReconcile}
            disabled={reconciling || !canUpdateClusters}
          >
            <Zap size={14} />
            {reconciling ? "Reconciling..." : "Reconcile Fleet"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setProposeOpen(true)}
            disabled={!canUpdateClusters}
          >
            <SlidersHorizontal size={14} />
            Propose Routing
          </Button>
        </div>
      }
    >
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

      <Modal
        open={proposeOpen}
        onClose={() => setProposeOpen(false)}
        title="Propose Traffic Steering Routing Weight"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Adjust traffic weight steering to shift tenant workloads across cell clusters with zero downtime.
          </p>
          <FormField label="Tenant ID" required>
            <Input
              value={targetTenant}
              onChange={(e) => setTargetTenant(e.target.value)}
              placeholder="tnt_prod_01"
            />
          </FormField>
          <FormField label="Target Cluster ID" required>
            <Input
              value={targetCluster}
              onChange={(e) => setTargetCluster(e.target.value)}
              placeholder="cls-us-east-1"
            />
          </FormField>
          <FormField label="Traffic Steering Weight (0-100)" required>
            <Input
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              type="number"
              placeholder="100"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setProposeOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePropose}
              disabled={proposing || !targetTenant.trim() || !targetCluster.trim()}
            >
              {proposing ? "Submitting..." : "Submit Proposal"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}

