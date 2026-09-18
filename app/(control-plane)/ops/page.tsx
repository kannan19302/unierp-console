"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Button,
  Badge,
  StatCardRow,
  ConfirmDialog,
  usePermission,
} from "@kannan19302/ui";
import { DataWorkspace } from "@kannan19302/ui/shell";
import {
  RefreshCw,
  RotateCcw,
  HardDriveDownload,
  Database,
  Server,
  Activity,
  Radio,
  Layers,
  ShieldCheck,
  AlertOctagon,
  Clock,
  ExternalLink,
  Cpu,
  CheckCircle2,
  ArrowRight,
  ListFilter,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useItem, useList } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";
import styles from "./ops.module.css";

interface DashboardMetrics {
  queueDepth?: number;
  deadLetters?: number;
  outboxLagSeconds?: number;
  degradedTenants?: number;
  migrationState?: string;
}

interface DashboardSummary {
  status?: string;
  timestamp?: string;
  metrics?: DashboardMetrics;
  links?: {
    platformOverview?: string;
    perTenantSlo?: string;
  };
}

interface HealthData {
  status?: string;
  timestamp?: string;
  metrics?: {
    cpuUsage?: number;
    memoryUsage?: number;
    totalMemoryGB?: number;
    apiLatencyMs?: number;
  };
  services?: {
    database?: string;
  };
}

interface PlatformServiceHealth {
  service: string;
  name: string;
  status: string;
  latencyMs?: number;
  observedAt?: string;
}

interface QueueMetric {
  name: string;
  pending?: number;
  processing?: number;
  scheduled?: number;
  deadLetter?: number;
  total?: number;
  status?: string;
  active?: number;
  waiting?: number;
  completed?: number;
  failed?: number;
}

const formatNumber = (num: number | undefined): string =>
  num === undefined ? "Unknown" : num.toLocaleString();

export default function OpsOverviewPage() {
  const canRetry = usePermission("system.operations.update");
  const canBackup = usePermission("system.operations.backup");
  const summary = useItem<DashboardSummary>("/platform/v1/operations/dashboard");
  const health = useItem<HealthData>("/platform/v1/operations/health");
  const healthServices = useList<PlatformServiceHealth>({
    path: "/platform/v1/operations/health/services",
  });
  const queues = useList<QueueMetric>({
    path: "/platform/v1/operations/queues",
  });
  const jobs = useList<QueueMetric>({
    path: "/platform/v1/operations/jobs",
  });

  // Action states
  const [isProbing, setIsProbing] = useState(false);
  const [isRetryingJobs, setIsRetryingJobs] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Reload all telemetry data
  const handleProbeHealth = async () => {
    setIsProbing(true);
    try {
      const outcomes = await Promise.all([
        summary.reload(),
        health.reload(),
        healthServices.reload(),
        queues.reload(),
        jobs.reload(),
      ]);
      showToast(outcomes.every(Boolean) ? "success" : "error", outcomes.every(Boolean) ? "Measured telemetry refreshed." : "Some telemetry requests failed. Review the errors and retry.");
    } catch {
      showToast("error", "Failed to refresh platform telemetry.");
    } finally {
      setIsProbing(false);
    }
  };

  // Trigger retry of dead letters
  const handleRetryJobs = async () => {
    setIsRetryingJobs(true);
    try {
      await api.post("/platform/v1/operations/jobs/retry");
      await Promise.allSettled([jobs.reload(), queues.reload(), summary.reload()]);
      showToast("success", "Dead letter queue retries initiated for all operator queues.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to retry jobs.";
      showToast("error", msg);
    } finally {
      setIsRetryingJobs(false);
    }
  };

  // Create platform database snapshot
  const handleConfirmBackup = async () => {
    setIsBackingUp(true);
    try {
      await api.post("/platform/v1/operations/backups/create");
      setBackupDialogOpen(false);
      showToast("success", "Full platform snapshot initiated. Check back in Infrastructure / Backups.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Platform snapshot initiation failed.";
      showToast("error", msg);
    } finally {
      setIsBackingUp(false);
    }
  };

  const metrics = summary.data?.metrics;
  const isHealthy = !summary.error && !health.error && summary.data?.status === "HEALTHY" && health.data?.status === "OK";
  const observedTime = health.data?.timestamp
    ? new Date(health.data.timestamp).toLocaleTimeString()
    : "Not observed";

  // Primary queue telemetry from jobs endpoint (supported natively by API)
  const combinedQueueData = jobs.data.map((q) => ({
    name: q.name,
    pending: q.pending ?? q.waiting,
    processing: q.processing ?? q.active,
    scheduled: q.scheduled,
    deadLetter: q.deadLetter ?? q.failed,
    completed: q.completed,
    status: q.status ?? "UNKNOWN",
  }));

  return (
    <DomainShell
      domainId="ops"
      title="Platform Operations · Overview"
      description="Real-time control plane telemetry, core subsystems, BullMQ queue depths, outbox streams, and disaster recovery."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            size="sm"
            variant="outline"
            disabled={isProbing}
            onClick={() => void handleProbeHealth()}
          >
            <RefreshCw
              size={14}
              style={{
                marginRight: "var(--space-1-5)",
                animation: isProbing ? "spin 1s linear infinite" : undefined,
              }}
            />
            {isProbing ? "Probing Cluster…" : "Probe Health"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={isRetryingJobs || !canRetry || !!jobs.error}
            onClick={() => void handleRetryJobs()}
          >
            <RotateCcw size={14} style={{ marginRight: "var(--space-1-5)" }} />
            {isRetryingJobs ? "Retrying…" : "Retry Failed Jobs"}
          </Button>

          <Button
            size="sm"
            variant="primary"
            disabled={!canBackup || isBackingUp}
            onClick={() => setBackupDialogOpen(true)}
          >
            <HardDriveDownload size={14} style={{ marginRight: "var(--space-1-5)" }} />
            Create Backup
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        {summary.error && <p role="alert">Dashboard unavailable: {summary.error.message}</p>}
        {health.error && <p role="alert">Health unavailable: {health.error.message}</p>}
        {/* Toast Feedback Banner */}
        {toastMessage && (
          <div
            className={`${styles.toastBanner} ${
              toastMessage.type === "success" ? styles.toastSuccess : styles.toastError
            }`}
            role="status"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              {toastMessage.type === "success" ? (
                <Check size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                fontSize: "var(--text-xs)",
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Control & Live Status Bar */}
        <div className={styles.topBar}>
          <div className={styles.topBarStatus}>
            <div className={styles.statusIndicator}>
              <span
                className={styles.liveDot}
                style={{
                  backgroundColor: isHealthy
                    ? "var(--color-success)"
                    : "var(--color-warning)",
                  boxShadow: `0 0 var(--space-2) ${
                    isHealthy
                      ? "var(--color-success)"
                      : "var(--color-warning)"
                  }`,
                }}
              />
              <span>System Status:</span>
              <Badge variant={isHealthy ? "success" : "warning"}>
                {isHealthy ? "Measured sources healthy" : "Unknown or degraded"}
              </Badge>
            </div>
            <span className={styles.observedTime}>
              Last Probe: {observedTime}
            </span>
          </div>

          <div className={styles.topBarActions}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              API Latency:
            </span>
            <Badge variant="default">
              {health.data?.metrics?.apiLatencyMs !== undefined
                ? `${health.data.metrics.apiLatencyMs} ms`
                : "Unknown"}
            </Badge>
          </div>
        </div>

        {/* Quick Navigation Pills across PCC-01 */}
        <nav aria-label="Platform Operations Subsystems" className={styles.quickNav}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginRight: "var(--space-1)" }}>
            Subsystems:
          </span>
          <Link href="/ops/services" className={styles.navPill}>
            <Server size={12} /> Services Matrix
          </Link>
          <Link href="/ops/environments" className={styles.navPill}>
            <Database size={12} /> Schema & Environments
          </Link>
          <Link href="/ops/releases" className={styles.navPill}>
            <Layers size={12} /> Canary Releases
          </Link>
          <Link href="/ops/deployments" className={styles.navPill}>
            <Activity size={12} /> Deployments
          </Link>
          <Link href="/ops/jobs" className={styles.navPill}>
            <Clock size={12} /> Background Jobs
          </Link>
          <Link href="/ops/queues" className={styles.navPill}>
            <Radio size={12} /> BullMQ Queues
          </Link>
          <Link href="/ops/workflows" className={styles.navPill}>
            <ListFilter size={12} /> Workflows
          </Link>
          <Link href="/ops/automation" className={styles.navPill}>
            <Cpu size={12} /> Self-Healing Runbooks
          </Link>
          <Link href="/ops/incidents" className={styles.navPill}>
            <AlertOctagon size={12} /> Incident Command
          </Link>
          <Link href="/ops/maintenance" className={styles.navPill}>
            <Clock size={12} /> Maintenance Windows
          </Link>
        </nav>

        {/* KPI Summary Row */}
        <StatCardRow
          columns={4}
          stats={[
            {
              label: "Pipeline Queue Depth",
              value: formatNumber(metrics?.queueDepth),
            },
            {
              label: "Dead Letters (Failed)",
              value: formatNumber(metrics?.deadLetters),
            },
            {
              label: "Outbox Delivery Lag",
              value: metrics?.outboxLagSeconds === undefined ? "Unknown" : `${metrics.outboxLagSeconds}s`,
            },
            {
              label: "Degraded Tenants",
              value: formatNumber(metrics?.degradedTenants),
            },
          ]}
        />

        {/* Primary Dashboard Visual Grid */}
        <div className={styles.dashboardGrid}>
          {/* Subsystem Health Matrix */}
          <div className={`${styles.sectionCard} ${styles.col8}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Server size={16} /> Core Infrastructure & Subsystem Matrix
              </h2>
              <Link
                href="/ops/services"
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                  textDecoration: "none",
                }}
              >
                Inspect All Services <ArrowRight size={12} />
              </Link>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.subsystemsGrid}>
                {healthServices.error && <p role="alert">{healthServices.error.message}</p>}
                {!healthServices.loading && !healthServices.error && healthServices.data.length === 0 && <p>No service measurements reported.</p>}
                {healthServices.data.map(service => (
                  <div className={styles.subsystemCard} key={service.service}>
                    <div className={styles.subsystemIconBox}><Server size={18} /></div>
                    <div className={styles.subsystemDetails}>
                      <span className={styles.subsystemName}>{service.name}</span>
                      <div className={styles.subsystemMeta}>
                        <Badge variant={service.status === "HEALTHY" ? "success" : service.status === "UNHEALTHY" ? "danger" : "default"}>{service.status || "UNKNOWN"}</Badge>
                        <span className={styles.latencyPill}>{service.latencyMs === undefined ? "Latency unknown" : `${service.latencyMs} ms`}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Operational Intelligence & Incident Commander Panel */}
          <div className={`${styles.sectionCard} ${styles.col4}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <AlertOctagon size={16} /> Operational Posture
              </h2>
              <Link
                href="/ops/incidents"
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-primary)",
                  textDecoration: "none",
                }}
              >
                Triage &rarr;
              </Link>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Open P1/P2 Incidents</span>
                <span className={styles.metricValue}>
                  <Badge variant="default">Unknown</Badge>
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Host CPU Utilization</span>
                <span className={styles.metricValue}>
                  {formatNumber(health.data?.metrics?.cpuUsage)}%
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Host Memory Allocated</span>
                <span className={styles.metricValue}>
                  {formatNumber(health.data?.metrics?.memoryUsage)}% of{" "}
                  {formatNumber(health.data?.metrics?.totalMemoryGB)} GB
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Self-Healing Engine</span>
                <span className={styles.metricValue}>
                  <Link href="/ops/automation">Inspect configured rules</Link>
                </span>
              </div>

              <div style={{ marginTop: "var(--space-2)" }}>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    display: "block",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  External Telemetry & Observability
                </span>
                <div className={styles.quickLinkRow}>
                  <a
                    href={
                      summary.data?.links?.platformOverview ||
                      "http://localhost:3000/d/platform-overview/platform-overview"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.quickLink}
                  >
                    <span>Grafana Cluster Overview</span>
                    <ExternalLink size={12} />
                  </a>
                  <a
                    href={
                      summary.data?.links?.perTenantSlo ||
                      "http://localhost:3000/d/per-tenant-slo/tenant-slo-dashboard"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.quickLink}
                  >
                    <span>Per-Tenant SLO Dashboard</span>
                    <ExternalLink size={12} />
                  </a>
                  <Link href="/ops/incidents" className={styles.quickLink}>
                    <span>Incident Escalation Log</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Queue Backlog & Worker Telemetry Table */}
        <section aria-label="Job Queues Telemetry" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Radio size={16} /> Job Queues & Worker Telemetry
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <Link
                href="/ops/jobs"
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                  textDecoration: "none",
                }}
              >
                Inspect All Jobs <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          <DataWorkspace<QueueMetric>
            data={combinedQueueData}
            loading={jobs.loading}
            getRowId={(row) => row.name}
            error={
              jobs.error ? (
                <p role="alert" style={{ color: "var(--color-danger)" }}>
                  {jobs.error.message}
                </p>
              ) : undefined
            }
            emptyTitle="No Recorded Background Queues"
            emptyDescription="No recorded queues were returned. This does not establish worker health."
            columns={[
              {
                key: "name",
                header: "Queue Identifier",
                render: (_val: unknown, row: QueueMetric) => (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      color: "var(--color-text)",
                    }}
                  >
                    {row.name}
                  </span>
                ),
              },
              {
                key: "processing",
                header: "Active Running",
                align: "right",
                render: (_val: unknown, row: QueueMetric) => (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color:
                        (row.processing ?? 0) > 0
                          ? "var(--color-primary)"
                          : "var(--color-text-secondary)",
                      fontWeight: (row.processing ?? 0) > 0 ? 600 : 400,
                    }}
                  >
                    {formatNumber(row.processing)}
                  </span>
                ),
              },
              {
                key: "pending",
                header: "Pending / Waiting",
                align: "right",
                render: (_val: unknown, row: QueueMetric) => (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color:
                        (row.pending ?? 0) > 0
                          ? "var(--color-warning)"
                          : "var(--color-text-secondary)",
                      fontWeight: (row.pending ?? 0) > 0 ? 600 : 400,
                    }}
                  >
                    {formatNumber(row.pending)}
                  </span>
                ),
              },
              {
                key: "completed",
                header: "Completed",
                align: "right",
                render: (_val: unknown, row: QueueMetric) => (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {formatNumber(row.completed)}
                  </span>
                ),
              },
              {
                key: "deadLetter",
                header: "Dead Letters",
                align: "right",
                render: (_val: unknown, row: QueueMetric) => (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color:
                        (row.deadLetter ?? 0) > 0
                          ? "var(--color-danger)"
                          : "var(--color-text-secondary)",
                      fontWeight: (row.deadLetter ?? 0) > 0 ? 600 : 400,
                    }}
                  >
                    {formatNumber(row.deadLetter)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                align: "center",
                render: (_val: unknown, row: QueueMetric) => {
                  const hasFailed = (row.deadLetter ?? 0) > 0;
                  const isRunning = (row.processing ?? 0) > 0;
                  return (
                    <Badge variant={hasFailed ? "danger" : isRunning ? "primary" : "default"}>
                      {hasFailed ? "FAILED" : isRunning ? "RUNNING" : "IDLE"}
                    </Badge>
                  );
                },
              },
            ]}
          />
        </section>

        {/* Modal: Create Platform Backup (Fully opaque, non-blurred Strata ConfirmDialog) */}
        <ConfirmDialog
          open={backupDialogOpen}
          onClose={() => {
            if (!isBackingUp) setBackupDialogOpen(false);
          }}
          onConfirm={() => void handleConfirmBackup()}
          title="Create Platform Backup"
          message={
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <p>
                You are about to initiate an immediate, full instance-wide PostgreSQL database
                snapshot for the entire UniERP estate.
              </p>
              <div
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  backgroundColor: "var(--surface-sunken-bg, var(--color-bg-sunken))",
                  border: "1px solid var(--color-border-subtle, var(--color-border))",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-secondary)",
                }}
              >
                <strong>Scope:</strong> All tenant schemas, row-level security audit ledgers,
                active outbox delivery streams, and cryptographic key metadata with point-in-time
                recovery markers.
              </div>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                This action requires Platform Operator authority and will generate an audit log entry.
              </p>
            </div>
          }
          confirmLabel={isBackingUp ? "Initiating Snapshot…" : "Confirm Backup"}
          cancelLabel="Cancel"
          variant="primary"
          isLoading={isBackingUp}
        />
      </div>
    </DomainShell>
  );
}
