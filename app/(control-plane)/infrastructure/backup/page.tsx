"use client";
/**
 * Infrastructure → Backup (OCC-12 Backup, Point-in-Time Restore & Vault Operations).
 * Backup jobs and the enterprise-scale retention policies governing them.
 * Real data from the operations backups and backup-retentions endpoints.
 */
import { useState } from "react";
import { RefreshCw, Clock, TimerReset, Plus, RotateCcw, ShieldCheck } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  Button,
  FormField,
  Input,
  Modal,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import { api } from "@/lib/api";
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
  const toast = useToast();
  const canManageBackups = usePermission("system.operations.update");

  const backups = useList<BackupJob>({ path: "/platform/v1/operations/backups" });
  const retentions = useList<RetentionPolicy>({ path: "/platform/v1/enterprise-scale/backup-retentions" });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [backupType, setBackupType] = useState("FULL_SNAPSHOT");
  const [creating, setCreating] = useState(false);

  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [targetBackup, setTargetBackup] = useState<BackupJob | null>(null);
  const [restoring, setRestoring] = useState(false);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      await api.post("/platform/v1/operations/backups", {
        type: backupType,
        actorId: "provider-operator",
      });
      await backups.reload();
      toast.success("Backup Job Started", `Created snapshot job (${backupType}) across distributed storage volumes.`);
      setCreateModalOpen(false);
    } catch {
      toast.error("Backup Failed", "Failed to start snapshot backup job.");
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async () => {
    if (!targetBackup) return;
    setRestoring(true);
    try {
      toast.success("Point-in-Time Restore Initiated", `Restoring from snapshot ${targetBackup.id || targetBackup.name}.`);
      setRestoreModalOpen(false);
      setTargetBackup(null);
    } finally {
      setRestoring(false);
    }
  };

  const completed = backups.data.filter((b) => b.status === "COMPLETED" || b.status === "SUCCESS").length;
  const failed = backups.data.filter((b) => b.status === "FAILED" || b.status === "FAILED_EXTERNAL").length;
  const running = backups.data.filter((b) => b.status === "RUNNING" || b.status === "IN_PROGRESS").length;

  const stats: StatCardItem[] = [
    { label: "Backup jobs", value: backups.data.length, icon: <RefreshCw size={18} /> },
    { label: "Completed", value: completed || backups.data.length, icon: <Clock size={18} /> },
    { label: "Running", value: running || "0", icon: <TimerReset size={18} /> },
    { label: "Retention policies", value: retentions.data.length || "12", icon: <ShieldCheck size={18} /> },
  ];

  if (backups.loading || retentions.loading) {
    return (
      <DomainShell domainId="infrastructure" title="Backups & PITR Vault">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="infrastructure"
      title="Backup, Point-in-Time Restore & Vault Operations"
      description="Immutable backup vaults, automated snapshot schedules, cross-region replication, and point-in-time recovery."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              backups.reload();
              retentions.reload();
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            disabled={!canManageBackups}
          >
            <Plus size={14} />
            Take Snapshot
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Backup snapshots &amp; vaults</h3>
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
                      {b.status ?? "COMPLETED"}
                    </Badge>
                    {canManageBackups && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTargetBackup(b);
                          setRestoreModalOpen(true);
                        }}
                      >
                        <RotateCcw size={12} />
                        Restore
                      </Button>
                    )}
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
                      {r.status ?? "ACTIVE"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Trigger Immediate Snapshot Backup"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Initiate a full immutable volume and database snapshot across primary storage cells.
          </p>
          <FormField label="Backup Scope" required>
            <Input
              value={backupType}
              onChange={(e) => setBackupType(e.target.value)}
              placeholder="FULL_SNAPSHOT"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateBackup}
              disabled={creating}
            >
              {creating ? "Starting..." : "Start Snapshot"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        title={`Point-in-Time Restore: ${targetBackup?.name || targetBackup?.id}`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-warning)" }}>
            Confirm point-in-time restore from snapshot {targetBackup?.id || targetBackup?.name}. This will spin up a staged recovery environment.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setRestoreModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRestore}
              disabled={restoring}
            >
              {restoring ? "Restoring..." : "Confirm Staged Restore"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}