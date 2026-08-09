"use client";
/**
 * Infrastructure → Backup.
 * Backup jobs and the enterprise-scale retention policies governing them.
 * Real data from the operations backups and backup-retentions endpoints.
 */
import { RefreshCw, Clock, TimerReset } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface BackupJob {
  id?: string;
  name?: string;
  type?: string;
  status?: string;
  storage?: string;
  region?: string;
  size?: string | number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  finishedAt?: string;
}

interface RetentionPolicy {
  id?: string;
  name?: string;
  policy?: string;
  scope?: string;
  tenant?: string;
  frequency?: string;
  interval?: string;
  retentionDays?: number;
  retentionCount?: number;
  destination?: string;
  region?: string;
  status?: string;
}

export default function InfrastructureBackup() {
  const backups = useList<BackupJob>({ path: "/platform/v1/operations/backups" });
  const retentions = useList<RetentionPolicy>({ path: "/platform/v1/enterprise-scale/backup-retentions" });

  const completed = backups.data.filter((b) => b.status === "COMPLETED").length;
  const failed = backups.data.filter((b) => b.status === "FAILED" || b.status === "FAILED_EXTERNAL").length;
  const running = backups.data.filter((b) => b.status === "RUNNING" || b.status === "IN_PROGRESS").length;

  const stats: StatCardItem[] = [
    { label: "Backup jobs", value: backups.data.length, icon: <RefreshCw size={18} /> },
    { label: "Completed", value: completed, icon: <Clock size={18} /> },
    { label: "Running", value: running || "—", icon: <TimerReset size={18} /> },
    { label: "Retention policies", value: retentions.data.length, icon: <RefreshCw size={18} /> },
  ];

  if (backups.loading || retentions.loading) {
    return (
      <DomainShell domainId="infrastructure" title="Backup" description="Backup jobs and retention policies across the platform.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="infrastructure" title="Backup" description="Backup jobs and retention policies across the platform.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Backup jobs</h3>
          {backups.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {backups.error.message}
            </p>
          ) : backups.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No backup jobs" description="The backups endpoint returned no jobs." />
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
              {backups.data.slice(0, 30).map((b) => (
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
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{b.name ?? b.type ?? b.id ?? "backup"}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {b.region ? ` · ${b.region}` : ""}
                      {b.storage ? ` · ${b.storage}` : ""}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {b.size != null ? `${b.size} · ` : ""}
                      {b.completedAt ?? b.finishedAt ?? b.startedAt ?? b.scheduledAt ?? ""}
                    </span>
                    <Badge
                      variant={
                        b.status === "COMPLETED" || b.status === "SUCCESS"
                          ? "success"
                          : b.status === "RUNNING" || b.status === "IN_PROGRESS" || b.status === "PENDING"
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

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Retention policies</h3>
          {retentions.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {retentions.error.message}
            </p>
          ) : retentions.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No retention policies" description="The backup-retentions endpoint returned no rows." />
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
              {retentions.data.slice(0, 30).map((r) => (
                <li
                  key={r.id ?? r.name ?? r.policy ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{r.name ?? r.policy ?? "—"}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {r.scope ? ` · ${r.scope}` : ""}
                      {r.tenant ? ` · ${r.tenant}` : ""}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {r.frequency ?? r.interval ? `every ${r.frequency ?? r.interval}` : ""}
                      {r.retentionDays != null ? ` · ${r.retentionDays}d retention` : ""}
                      {r.retentionCount != null ? ` · keep ${r.retentionCount}` : ""}
                      {r.destination ? ` · ${r.destination}` : ""}
                    </span>
                    <Badge
                      variant={
                        r.status === "ACTIVE" || r.status === "ENABLED"
                          ? "success"
                          : r.status === "PENDING" || r.status === "DRAFT"
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
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}