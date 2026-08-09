"use client";
/**
 * Infrastructure → Regions.
 * Region inventory: residency governance policies per region and the compute
 * clusters running in each region. Real data from the residency-governances
 * and cluster endpoints.
 */
import { MapPin, Globe, Building2, Server } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface ResidencyGovernance {
  id?: string;
  name?: string;
  governance?: string;
  tenant?: string;
  dataClass?: string;
  dataType?: string;
  primaryRegion?: string;
  region?: string;
  secondaryRegion?: string;
  recoveryRegion?: string;
  status?: string;
}

interface RegionCluster {
  id?: string;
  name?: string;
  cluster?: string;
  region?: string;
  status?: string;
  nodeCount?: number;
  nodes?: number;
}

export default function InfrastructureRegions() {
  const governance = useList<ResidencyGovernance>({
    path: "/platform/v1/enterprise-scale/residency-governances",
  });
  const clusters = useList<RegionCluster>({ path: "/platform/v1/cluster-routing-deep/clusters" });

  const byRegion = new Map<string, RegionCluster[]>();
  for (const c of clusters.data) {
    const key = c.region ?? "Unknown";
    const list = byRegion.get(key) ?? [];
    list.push(c);
    byRegion.set(key, list);
  }

  const regionCount = byRegion.size;
  const healthyCount = clusters.data.filter((c) => c.status === "HEALTHY").length;

  const stats: StatCardItem[] = [
    { label: "Regions", value: regionCount || governance.data.length || "—", icon: <MapPin size={18} /> },
    { label: "Clusters", value: clusters.data.length, icon: <Globe size={18} /> },
    { label: "Residency policies", value: governance.data.length, icon: <Building2 size={18} /> },
    {
      label: "Healthy clusters",
      value: clusters.data.length ? `${healthyCount}/${clusters.data.length}` : "—",
      icon: <Server size={18} />,
    },
  ];

  if (governance.loading || clusters.loading) {
    return (
      <DomainShell domainId="infrastructure" title="Regions" description="Region inventory, residency policies and cluster footprint.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="infrastructure" title="Regions" description="Region inventory, residency policies and cluster footprint.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Clusters by region</h3>
          {clusters.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {clusters.error.message}
            </p>
          ) : clusters.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No cluster data" description="The cluster endpoint returned no clusters." />
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
              {Array.from(byRegion.entries()).map(([region, regionClusters]) => (
                <li key={region}>
                  <p style={{ margin: "var(--space-2) 0", fontWeight: 600, fontSize: "var(--text-sm)" }}>
                    {region} · {regionClusters.length} cluster{regionClusters.length === 1 ? "" : "s"}
                  </p>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
                    {regionClusters.slice(0, 15).map((c) => (
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
                        <span style={{ fontWeight: 500 }}>{c.name ?? c.cluster ?? "—"}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                            {Number(c.nodeCount ?? c.nodes) ? `${c.nodeCount ?? c.nodes} nodes` : ""}
                          </span>
                          <Badge
                            variant={
                              c.status === "HEALTHY"
                                ? "success"
                                : c.status === "DEGRADED"
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
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Residency governance</h3>
          {governance.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {governance.error.message}
            </p>
          ) : governance.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No residency policies" description="The residency-governances endpoint returned no rows." />
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
              {governance.data.slice(0, 30).map((g) => (
                <li
                  key={g.id ?? g.name ?? g.governance ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{g.name ?? g.governance ?? "—"}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {g.tenant ? ` · ${g.tenant}` : ""}
                      {g.dataClass ?? g.dataType ? ` · ${g.dataClass ?? g.dataType}` : ""}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {g.region ?? g.primaryRegion ? `${g.region ?? g.primaryRegion}` : ""}
                      {g.secondaryRegion ?? g.recoveryRegion ? ` → ${g.secondaryRegion ?? g.recoveryRegion}` : ""}
                    </span>
                    <Badge
                      variant={
                        g.status === "ACTIVE" || g.status === "ENABLED" || g.status === "COMPLIANT"
                          ? "success"
                          : g.status === "PENDING" || g.status === "DRAFT" || g.status === "NON_COMPLIANT"
                            ? "warning"
                            : "default"
                      }
                    >
                      {g.status ?? "UNKNOWN"}
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