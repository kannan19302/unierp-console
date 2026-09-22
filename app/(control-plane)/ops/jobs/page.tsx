"use client";

import { useState } from "react";
import { Play, RefreshCw, RotateCcw } from "lucide-react";
import { Badge, Button, usePermission, useToast } from "@kannan19302/ui";
import { DataWorkspace } from "@kannan19302/ui/shell";
import DomainShell from "@/components/domain-shell";
import { api } from "@/lib/api";
import { useList } from "@/lib/data";
import styles from "../record-workspace.module.css";

interface JobQueueRow {
  name?: string;
  active?: number;
  waiting?: number;
  completed?: number;
  failed?: number;
}

interface TaskRow {
  id?: string;
  name?: string;
  expression?: string;
  handler?: string;
  nextRun?: string | null;
  lastRun?: string | null;
  lastResult?: string | null;
  status?: string;
}

const count = (value: unknown): string =>
  typeof value === "number" && Number.isFinite(value) ? value.toLocaleString() : "Unknown";

const formatTime = (value: string | null | undefined): string => {
  if (!value) return "Not reported";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Invalid timestamp" : date.toLocaleString();
};

function sumWhenMeasured(rows: JobQueueRow[], fields: Array<keyof JobQueueRow>): number | undefined {
  if (rows.length === 0 || rows.some((row) => fields.some((field) => typeof row[field] !== "number"))) return undefined;
  return rows.reduce((total, row) => total + fields.reduce((subtotal, field) => subtotal + Number(row[field]), 0), 0);
}

function taskStatusVariant(status?: string, lastResult?: string | null): "success" | "danger" | "warning" | "default" {
  const normalized = status?.toUpperCase() ?? "";
  if (normalized === "ENABLED" || normalized === "ACTIVE" || normalized === "COMPLETED") return "success";
  if (normalized === "FAILED" || normalized === "ERROR" || lastResult?.toUpperCase() === "FAILED") return "danger";
  if (normalized === "RUNNING") return "warning";
  return "default";
}

export default function OpsJobs() {
  const toast = useToast();
  const canUpdate = usePermission("system.operations.update");
  const jobs = useList<JobQueueRow>({ path: "/platform/v1/operations/jobs" });
  const tasks = useList<TaskRow>({ path: "/platform/v1/operations/tasks" });
  const [retrying, setRetrying] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const inFlight = sumWhenMeasured(jobs.data, ["active", "waiting"]);
  const failed = sumWhenMeasured(jobs.data, ["failed"]);

  const reloadAll = () => void Promise.all([jobs.reload(), tasks.reload()]);

  const handleRetryAll = async () => {
    setRetrying(true);
    try {
      const response = await api.post<{ message?: string }>("/platform/v1/operations/jobs/retry");
      await jobs.reload();
      toast.success("Retry requested", response.data?.message ?? "Failed jobs were submitted for retry.");
    } catch {
      toast.error("Retry failed", "The failed-job retry request was not accepted.");
    } finally {
      setRetrying(false);
    }
  };

  const handleTriggerTask = async (task: TaskRow) => {
    if (!task.id) return;
    setTriggeringId(task.id);
    try {
      const response = await api.post<{ message?: string }>(`/platform/v1/operations/tasks/${task.id}/trigger`);
      await Promise.all([tasks.reload(), jobs.reload()]);
      toast.success("Task trigger requested", response.data?.message ?? `Trigger requested for ${task.name ?? task.handler ?? task.id}.`);
    } catch {
      toast.error("Trigger failed", `The trigger request for ${task.name ?? task.handler ?? task.id} was not accepted.`);
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <DomainShell
      domainId="ops"
      title="Jobs"
      description="Queue pressure and scheduled platform work reported by operations services."
      actions={
        <div className={styles.headerActions}>
          <Button variant="outline" size="sm" disabled={jobs.loading || tasks.loading} onClick={reloadAll}>
            <RefreshCw size={14} aria-hidden="true" />Refresh records
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handleRetryAll()} disabled={retrying || !canUpdate || failed === undefined || failed === 0}>
            <RotateCcw size={14} aria-hidden="true" />{retrying ? "Requesting retry…" : "Retry failed jobs"}
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <section className={styles.summaryStrip} aria-label="Job workload summary">
          <div className={styles.summaryItem}><span>Queues reported</span><strong>{jobs.error || jobs.loading ? "Unknown" : count(jobs.data.length)}</strong></div>
          <div className={styles.summaryItem}><span>In flight</span><strong>{count(inFlight)}</strong></div>
          <div className={styles.summaryItem}><span>Failed</span><strong>{count(failed)}</strong></div>
          <div className={styles.summaryItem}><span>Scheduled tasks</span><strong>{tasks.error || tasks.loading ? "Unknown" : count(tasks.data.length)}</strong></div>
        </section>

        <div className={styles.workspaceStack}>
          <section className={styles.workspacePanel} aria-labelledby="queue-records-heading">
            <div className={styles.panelHeader}><div><h2 id="queue-records-heading">Job queues</h2><p>Measured work and failure counts by queue.</p></div></div>
            <div className={styles.panelBody}>
              <DataWorkspace<JobQueueRow>
                data={jobs.data} loading={jobs.loading} getRowId={(row, index) => row.name ?? `queue-${index}`}
                searchPlaceholder="Search job queues…"
                error={jobs.error ? <p role="alert" className={styles.sourceError}>{jobs.error.message}</p> : undefined}
                emptyTitle={jobs.error ? "Job queue source unavailable" : "No job queues reported"}
                emptyDescription="Refresh after the job service reports queue measurements."
                columns={[
                  { key: "name", header: "Queue", render: (value) => <span className={styles.recordTitle}>{String(value ?? "Unnamed queue")}</span> },
                  { key: "active", header: "Running", align: "right", render: count },
                  { key: "waiting", header: "Waiting", align: "right", render: count },
                  { key: "completed", header: "Completed", align: "right", render: count },
                  { key: "failed", header: "Failed", align: "right", render: (value) => <span className={typeof value === "number" && value > 0 ? styles.dangerValue : styles.numericValue}>{count(value)}</span> },
                  { key: "condition", header: "Condition", render: (_value, row) => <Badge variant={typeof row.failed !== "number" ? "default" : row.failed > 0 ? "danger" : "success"}>{typeof row.failed !== "number" ? "UNKNOWN" : row.failed > 0 ? "ATTENTION" : "CLEAR"}</Badge> },
                ]}
              />
            </div>
          </section>

          <section className={styles.workspacePanel} aria-labelledby="task-records-heading">
            <div className={styles.panelHeader}><div><h2 id="task-records-heading">Scheduled tasks</h2><p>Registered schedules and their latest reported outcome.</p></div></div>
            <div className={styles.panelBody}>
              <DataWorkspace<TaskRow>
                data={tasks.data} loading={tasks.loading} getRowId={(row, index) => row.id ?? row.name ?? `task-${index}`}
                searchPlaceholder="Search tasks, handlers or schedules…"
                error={tasks.error ? <p role="alert" className={styles.sourceError}>{tasks.error.message}</p> : undefined}
                emptyTitle={tasks.error ? "Scheduled-task source unavailable" : "No scheduled tasks reported"}
                emptyDescription="Refresh after the scheduler reports registered tasks."
                columns={[
                  { key: "name", header: "Task", render: (_value, row) => <><span className={styles.recordTitle}>{row.name ?? row.handler ?? row.id ?? "Unnamed task"}</span>{row.handler && <span className={styles.recordDetail}>{row.handler}</span>}</> },
                  { key: "expression", header: "Schedule", render: (value) => String(value ?? "Unknown") },
                  { key: "nextRun", header: "Next run", render: (value) => formatTime(typeof value === "string" ? value : undefined) },
                  { key: "lastResult", header: "Last result", render: (value, row) => <Badge variant={taskStatusVariant(row.status, typeof value === "string" ? value : undefined)}>{String(value ?? "UNKNOWN")}</Badge> },
                  { key: "action", header: "Action", align: "right", render: (_value, row) => row.id ? <Button size="sm" variant="outline" disabled={!canUpdate || triggeringId === row.id} onClick={() => void handleTriggerTask(row)}><Play size={12} aria-hidden="true" />{triggeringId === row.id ? "Requesting…" : "Trigger"}</Button> : "Unavailable" },
                ]}
              />
            </div>
          </section>
        </div>
      </div>
    </DomainShell>
  );
}
