"use client";
/**
 * Infrastructure → Overview.
 * Regional infrastructure KPI dashboard: clusters, backups, regions and
 * platform health plus the most recent backup jobs. Real data only — KPIs and
 * rows come from the control-plane operations and cluster endpoints.
 */
import { Server, Archive, MapPin, ShieldCheck } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface ClusterRow {
  id?: string;
  name?: string;
  cluster?: string;
  region?: string;
  status?: string;
}

interface BackupJob {
  id?: string;
  name?: string;
  type?: string;
  status?: string;
  storage?: string;
  region?: string;
  size?: string | number;
  startedAt?: string;
  completedAt?: string;
  finishedAt?: string;
}

export default function InfrastructureOverview() {
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");
  const backups = useList<BackupJob>({ path: "/platform/v1/operations/backups" });
  const clusters = useList<ClusterRow>({ path: "/platform/v1/cluster-routing-deep/clusters" });

  const s = summary.data ?? {};
  const clustersTotal = Number(s.clustersTotal ?? s.totalClusters ?? clusters.data.length) || 0;
  const clustersHealthy = Number(s.clustersHealthy ?? s.healthyClusters) || 0;
  const backupTotal = Number(s.totalBackups) || (backups.total ?? backups.data.length);
  const regionCount = new Set(clusters.data.map((c) => c.region).filter(Boolean)).size;
  const availability =
    s.availability != null ? String(s.availability) : s.availabilityPct != null ? String(s.availabilityPct) : "—";

  const stats: StatCardItem[] = [
    { label: "Clusters", value: clustersTotal ? `${clustersHealthy}/${clustersTotal}` : "—", icon: <Server size={18} /> },
    { label: "Backups", value: backupTotal, icon: <Archive size={18} /> },
    { label: "Regions", value: regionCount || "—", icon: <MapPin size={18} /> },
    { label: "Availability", value: availability, icon: <ShieldCheck size={18} /> },
  ];

  if (backups.loading || clusters.loading) {
    return (
      <DomainShell
        domainId="infrastructure"
        title="Infrastructure"
        description="Regional infrastructure, compute clusters, storage, networking and backups at a glance."
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="infrastructure"
      title="Infrastructure"
      description="Regional infrastructure, compute clusters, storage, networking and backups at a glance."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Recent backup jobs</h3>
          {backups.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {backups.error.message}
            </p>
          ) : backups.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No backup jobs" description="The operations backup endpoint returned no rows." />
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
              {backups.data.slice(0, 10).map((b) => (
                <li
                  key={b.id ?? b.name ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{b.name ?? b.type ?? b.id ?? "backup"}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {b.region ?? "—"} · {b.storage ?? "—"} · {b.completedAt ?? b.finishedAt ?? b.startedAt ?? ""}
                    </span>
                    <Badge
                      variant={
                        b.status === "COMPLETED"
                          ? "success"
                          : b.status === "RUNNING" || b.status === "IN_PROGRESS"
                            ? "info"
                            : b.status === "FAILED" || b.status === "FAILED_EXTERNAL"
                              ? "danger"
                              : "default"
                      }
                    >
                      {b.status ?? "UNKNOWN"}
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