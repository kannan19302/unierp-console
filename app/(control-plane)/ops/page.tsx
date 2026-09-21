"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, LoadingState, usePermission } from "@kannan19302/ui";
import { DataWorkspace } from "@kannan19302/ui/shell";
import { AlertTriangle, Check, ExternalLink, HardDriveDownload, RefreshCw, RotateCcw } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import { api } from "@/lib/api";
import { useItem, useList } from "@/lib/data";
import styles from "./ops.module.css";

interface DashboardMetrics {
  queueDepth?: number;
  deadLetters?: number;
  outboxLagSeconds?: number;
  degradedTenants?: number;
}

interface DashboardSummary {
  status?: string;
  timestamp?: string;
  metrics?: DashboardMetrics;
  links?: { platformOverview?: string; perTenantSlo?: string };
}

interface HealthData {
  status?: string;
  timestamp?: string;
  metrics?: { cpuUsage?: number; memoryUsage?: number; totalMemoryGB?: number; apiLatencyMs?: number };
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

interface IncidentSummary {
  id: string;
  severity?: string;
  status?: string;
}

const operationsRoutes = [
  ["Services", "/ops/services"], ["Environments", "/ops/environments"],
  ["Releases", "/ops/releases"], ["Deployments", "/ops/deployments"],
  ["Jobs", "/ops/jobs"], ["Queues", "/ops/queues"],
  ["Workflows", "/ops/workflows"], ["Automation", "/ops/automation"],
  ["Incidents", "/ops/incidents"], ["Maintenance", "/ops/maintenance"],
] as const;

const formatNumber = (value: number | undefined): string =>
  typeof value === "number" && Number.isFinite(value) ? value.toLocaleString() : "Unknown";

const formatPercent = (value: number | undefined): string =>
  typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString()}%` : "Unknown";

const formatTimestamp = (value: string | undefined, mode: "date-time" | "time"): string => {
  if (!value) return "Not reported";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid timestamp";
  return mode === "time"
    ? new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(date)
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const statusVariant = (status?: string): "success" | "danger" | "warning" | "default" => {
  const normalized = status?.toUpperCase();
  if (normalized === "HEALTHY" || normalized === "OK") return "success";
  if (normalized === "UNHEALTHY" || normalized === "FAILED" || normalized === "CRITICAL") return "danger";
  if (normalized === "DEGRADED" || normalized === "WARNING") return "warning";
  return "default";
};

export default function OpsOverviewPage() {
  const canRetry = usePermission("system.operations.update");
  const canBackup = usePermission("system.operations.backup");
  const summary = useItem<DashboardSummary>("/platform/v1/operations/dashboard");
  const health = useItem<HealthData>("/platform/v1/operations/health");
  const healthServices = useList<PlatformServiceHealth>({ path: "/platform/v1/operations/health/services" });
  const jobs = useList<QueueMetric>({ path: "/platform/v1/operations/jobs" });
  const incidents = useList<IncidentSummary>({ path: "/platform/v1/operations/incidents" });

  const [isProbing, setIsProbing] = useState(false);
  const [isRetryingJobs, setIsRetryingJobs] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    window.setTimeout(() => setToastMessage(null), 6000);
  };

  const handleProbeHealth = async () => {
    setIsProbing(true);
    try {
      const outcomes = await Promise.all([summary.reload(), health.reload(), healthServices.reload(), jobs.reload(), incidents.reload()]);
      const complete = outcomes.every(Boolean);
      showToast(complete ? "success" : "error", complete ? "Telemetry sources refreshed." : "Some telemetry requests failed. Review the source errors and retry.");
    } catch {
      showToast("error", "Platform telemetry could not be refreshed.");
    } finally {
      setIsProbing(false);
    }
  };

  const handleRetryJobs = async () => {
    setIsRetryingJobs(true);
    try {
      await api.post("/platform/v1/operations/jobs/retry");
      await Promise.allSettled([jobs.reload(), summary.reload()]);
      showToast("success", "Retry request accepted. Queue measurements are refreshing.");
    } catch (error: unknown) {
      showToast("error", error instanceof Error ? error.message : "Failed jobs could not be retried.");
    } finally {
      setIsRetryingJobs(false);
    }
  };

  const handleConfirmBackup = async () => {
    setIsBackingUp(true);
    try {
      await api.post("/platform/v1/operations/backups/create");
      setBackupDialogOpen(false);
      showToast("success", "Backup request accepted. Track progress in Infrastructure / Backups.");
    } catch (error: unknown) {
      showToast("error", error instanceof Error ? error.message : "The backup request failed.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const metrics = summary.data?.metrics;
  const measuring = summary.loading || health.loading;
  const measuredHealthy = Boolean(summary.data && health.data) && !summary.error && !health.error &&
    summary.data?.status === "HEALTHY" && (health.data?.status === "OK" || health.data?.status === "HEALTHY");
  const measuredDegraded = !measuring && (Boolean(summary.error || health.error) ||
    (Boolean(summary.data?.status) && summary.data?.status !== "HEALTHY") ||
    (Boolean(health.data?.status) && health.data?.status !== "OK" && health.data?.status !== "HEALTHY"));
  const estateStatus = measuring ? "Measuring" : measuredHealthy ? "Healthy" : measuredDegraded ? "Degraded" : "Unknown";
  const observedAt = formatTimestamp(health.data?.timestamp, "date-time");
  const activeIncidents = incidents.data.filter((incident) => {
    const status = incident.status?.toUpperCase();
    return status !== "RESOLVED" && status !== "CLOSED";
  });
  const combinedQueueData = jobs.data.map((queue) => ({
    name: queue.name,
    pending: queue.pending ?? queue.waiting,
    processing: queue.processing ?? queue.active,
    scheduled: queue.scheduled,
    deadLetter: queue.deadLetter ?? queue.failed,
    completed: queue.completed,
    status: queue.status ?? "UNKNOWN",
  }));

  return (
    <DomainShell
      domainId="ops"
      title="Platform operations"
      description="Service health, workload pressure and recovery controls across the provider estate."
      actions={
        <div className={styles.headerActions}>
          <Button size="sm" variant="outline" disabled={isProbing} onClick={() => void handleProbeHealth()}>
            <RefreshCw size={14} aria-hidden="true" />{isProbing ? "Refreshing…" : "Refresh telemetry"}
          </Button>
          <Button size="sm" variant="outline" disabled={isRetryingJobs || !canRetry || Boolean(jobs.error)} onClick={() => void handleRetryJobs()}>
            <RotateCcw size={14} aria-hidden="true" />{isRetryingJobs ? "Requesting retry…" : "Retry failed jobs"}
          </Button>
          <Button size="sm" variant="primary" disabled={!canBackup || isBackingUp} onClick={() => setBackupDialogOpen(true)}>
            <HardDriveDownload size={14} aria-hidden="true" />Create backup
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        {(summary.error || health.error) && (
          <div className={styles.sourceErrors} role="alert">
            {summary.error && <span>Dashboard unavailable: {summary.error.message}</span>}
            {health.error && <span>Health unavailable: {health.error.message}</span>}
          </div>
        )}

        {toastMessage && (
          <div className={`${styles.notice} ${toastMessage.type === "success" ? styles.noticeSuccess : styles.noticeError}`} role="status">
            <span className={styles.noticeMessage}>
              {toastMessage.type === "success" ? <Check size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}
              {toastMessage.text}
            </span>
            <button type="button" onClick={() => setToastMessage(null)}>Dismiss</button>
          </div>
        )}

        <section className={styles.statusLedger} aria-label="Current operational posture">
          <div className={styles.statusLead}>
            <span>Provider estate</span><strong>{estateStatus}</strong>
            <Badge variant={measuredHealthy ? "success" : measuredDegraded ? "warning" : "default"}>
              {measuredHealthy ? "Measured sources agree" : measuring ? "Requests in progress" : measuredDegraded ? "Review source failures" : "Insufficient evidence"}
            </Badge>
          </div>
          <div className={styles.ledgerItem}><span>Observed</span><strong>{observedAt}</strong></div>
          <div className={styles.ledgerItem}><span>API latency</span><strong>{health.data?.metrics?.apiLatencyMs === undefined ? "Unknown" : `${health.data.metrics.apiLatencyMs} ms`}</strong></div>
          <div className={styles.ledgerItem}><span>Active incidents</span><strong>{incidents.loading || incidents.error ? "Unknown" : formatNumber(activeIncidents.length)}</strong></div>
        </section>

        <section className={styles.pressureStrip} aria-label="Workload pressure">
          <div><span>Queue depth</span><strong>{formatNumber(metrics?.queueDepth)}</strong></div>
          <div><span>Dead letters</span><strong>{formatNumber(metrics?.deadLetters)}</strong></div>
          <div><span>Outbox lag</span><strong>{metrics?.outboxLagSeconds === undefined ? "Unknown" : `${metrics.outboxLagSeconds}s`}</strong></div>
          <div><span>Degraded tenants</span><strong>{formatNumber(metrics?.degradedTenants)}</strong></div>
        </section>

        <div className={styles.workspaceGrid}>
          <section className={styles.primaryPanel} aria-labelledby="service-register-heading">
            <div className={styles.panelHeader}>
              <div><h2 id="service-register-heading">Service register</h2><p>Latest health response from each reporting platform service.</p></div>
              <Link href="/ops/services">Inspect services</Link>
            </div>
            <div className={styles.panelBody}>
              {healthServices.loading ? <LoadingState message="Loading service measurements…" /> :
                healthServices.error ? <ErrorState description={healthServices.error.message} onRetry={healthServices.reload} /> :
                healthServices.data.length === 0 ? <EmptyState title="No service measurements" description="No service health records were returned. Estate health remains unknown." /> : (
                  <div className={styles.tableFrame}>
                    <table className={styles.serviceTable}>
                      <thead><tr><th>Service</th><th>Status</th><th>Latency</th><th>Observed</th></tr></thead>
                      <tbody>{healthServices.data.slice(0, 8).map((service) => (
                        <tr key={service.service}>
                          <td><strong>{service.name}</strong><span>{service.service}</span></td>
                          <td><Badge variant={statusVariant(service.status)}>{service.status || "UNKNOWN"}</Badge></td>
                          <td>{service.latencyMs === undefined ? "Unknown" : `${service.latencyMs} ms`}</td>
                          <td>{formatTimestamp(service.observedAt, "time")}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
            </div>
          </section>

          <aside className={styles.sideColumn}>
            <section className={styles.sidePanel} aria-labelledby="host-heading">
              <div className={styles.panelHeader}><div><h2 id="host-heading">Host measurements</h2><p>Latest values reported by the health source.</p></div></div>
              <dl className={styles.definitionList}>
                <div><dt>CPU utilization</dt><dd>{formatPercent(health.data?.metrics?.cpuUsage)}</dd></div>
                <div><dt>Memory utilization</dt><dd>{formatPercent(health.data?.metrics?.memoryUsage)}</dd></div>
                <div><dt>Total memory</dt><dd>{health.data?.metrics?.totalMemoryGB === undefined ? "Unknown" : `${formatNumber(health.data.metrics.totalMemoryGB)} GB`}</dd></div>
              </dl>
            </section>

            <section className={styles.sidePanel} aria-labelledby="route-index-heading">
              <div className={styles.panelHeader}><div><h2 id="route-index-heading">Operations index</h2><p>Move directly to a specialist workspace.</p></div></div>
              <nav className={styles.routeIndex} aria-label="Operations workspaces">
                {operationsRoutes.map(([label, href]) => <Link key={href} href={href}><span>{label}</span><span aria-hidden="true">›</span></Link>)}
              </nav>
            </section>

            <section className={styles.sidePanel} aria-labelledby="observability-heading">
              <div className={styles.panelHeader}><div><h2 id="observability-heading">Observability</h2><p>Configured external telemetry destinations.</p></div></div>
              <div className={styles.externalLinks}>
                {summary.data?.links?.platformOverview ? <a href={summary.data.links.platformOverview} target="_blank" rel="noopener noreferrer">Cluster overview <ExternalLink size={13} aria-hidden="true" /></a> : <span>Cluster overview not configured</span>}
                {summary.data?.links?.perTenantSlo ? <a href={summary.data.links.perTenantSlo} target="_blank" rel="noopener noreferrer">Tenant SLOs <ExternalLink size={13} aria-hidden="true" /></a> : <span>Tenant SLO destination not configured</span>}
              </div>
            </section>
          </aside>
        </div>

        <section className={styles.queuePanel} aria-labelledby="queue-heading">
          <div className={styles.panelHeader}>
            <div><h2 id="queue-heading">Job queue activity</h2><p>Reported workload and failure counts by queue.</p></div>
            <Link href="/ops/jobs">Inspect jobs</Link>
          </div>
          <DataWorkspace<QueueMetric>
            data={combinedQueueData} loading={jobs.loading} getRowId={(row) => row.name}
            error={jobs.error ? <p role="alert" className={styles.inlineError}>{jobs.error.message}</p> : undefined}
            emptyTitle="No job queues reported" emptyDescription="No queue records were returned. This does not establish worker health."
            columns={[
              { key: "name", header: "Queue", render: (_value: unknown, row: QueueMetric) => <strong>{row.name}</strong> },
              { key: "processing", header: "Running", align: "right", render: (_value: unknown, row: QueueMetric) => formatNumber(row.processing) },
              { key: "pending", header: "Waiting", align: "right", render: (_value: unknown, row: QueueMetric) => formatNumber(row.pending) },
              { key: "completed", header: "Completed", align: "right", render: (_value: unknown, row: QueueMetric) => formatNumber(row.completed) },
              { key: "deadLetter", header: "Dead letters", align: "right", render: (_value: unknown, row: QueueMetric) => <span className={(row.deadLetter ?? 0) > 0 ? styles.dangerValue : undefined}>{formatNumber(row.deadLetter)}</span> },
              { key: "status", header: "Status", align: "center", render: (_value: unknown, row: QueueMetric) => <Badge variant={statusVariant((row.deadLetter ?? 0) > 0 ? "FAILED" : row.status)}>{row.status ?? "UNKNOWN"}</Badge> },
            ]}
          />
        </section>

        <ConfirmDialog
          open={backupDialogOpen} onClose={() => { if (!isBackingUp) setBackupDialogOpen(false); }}
          onConfirm={() => void handleConfirmBackup()} title="Create platform backup"
          message={<div className={styles.confirmCopy}>
            <p>Start a full provider-estate PostgreSQL snapshot.</p>
            <dl>
              <div><dt>Target</dt><dd>Provider platform database</dd></div>
              <div><dt>Scope</dt><dd>Tenant schemas, audit ledgers, outbox streams and key metadata</dd></div>
              <div><dt>Recovery</dt><dd>Track and restore through Infrastructure / Backups</dd></div>
            </dl>
            <p>This request requires Platform Operator authority and creates an audit record.</p>
          </div>}
          confirmLabel={isBackingUp ? "Requesting backup…" : "Create backup"} cancelLabel="Cancel"
          variant="primary" isLoading={isBackingUp}
        />
      </div>
    </DomainShell>
  );
}
