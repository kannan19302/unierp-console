"use client";

import { Badge, Button } from "@kannan19302/ui";
import { DataWorkspace } from "@kannan19302/ui/shell";
import { RefreshCw } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import { useList } from "@/lib/data";
import styles from "../record-workspace.module.css";

interface WorkflowRow {
  id?: string;
  name?: string;
  description?: string;
  trigger?: string;
  enabled?: boolean;
  lastRun?: string | null;
  lastStatus?: string | null;
  runs?: { total?: number; active?: number; completed?: number; failed?: number };
}

function statusVariant(status: string | null | undefined): "success" | "warning" | "danger" | "default" {
  const normalized = status?.toUpperCase() ?? "";
  if (normalized === "SUCCESS" || normalized === "COMPLETED" || normalized === "PASSED") return "success";
  if (normalized === "RUNNING" || normalized === "IN_PROGRESS" || normalized === "PENDING") return "warning";
  if (normalized === "FAILED" || normalized === "ERROR" || normalized === "CANCELLED") return "danger";
  return "default";
}

const formatTime = (value: unknown): string => {
  if (typeof value !== "string" || !value) return "Never reported";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Invalid timestamp" : date.toLocaleString();
};

const count = (value: unknown): string => typeof value === "number" ? value.toLocaleString() : "Unknown";

export default function OpsWorkflows() {
  const workflows = useList<WorkflowRow>({ path: "/platform/v1/workflows" });
  const enabledCount = workflows.data.filter((workflow) => workflow.enabled === true).length;
  const runningCount = workflows.data.filter((workflow) => ["RUNNING", "IN_PROGRESS"].includes(workflow.lastStatus?.toUpperCase() ?? "")).length;
  const failedCount = workflows.data.filter((workflow) => ["FAILED", "ERROR"].includes(workflow.lastStatus?.toUpperCase() ?? "")).length;

  return (
    <DomainShell
      domainId="ops"
      title="Workflows"
      description="Registered platform workflows and the latest execution state reported for each definition."
      actions={<Button variant="outline" size="sm" disabled={workflows.loading} onClick={() => void workflows.reload()}><RefreshCw size={14} aria-hidden="true" />Refresh workflows</Button>}
    >
      <div className={styles.container}>
        <section className={styles.summaryStrip} aria-label="Workflow summary">
          <div className={styles.summaryItem}><span>Definitions reported</span><strong>{workflows.error || workflows.loading ? "Unknown" : count(workflows.data.length)}</strong></div>
          <div className={styles.summaryItem}><span>Enabled</span><strong>{workflows.error || workflows.loading ? "Unknown" : count(enabledCount)}</strong></div>
          <div className={styles.summaryItem}><span>Running</span><strong>{workflows.error || workflows.loading ? "Unknown" : count(runningCount)}</strong></div>
          <div className={styles.summaryItem}><span>Failed</span><strong>{workflows.error || workflows.loading ? "Unknown" : count(failedCount)}</strong></div>
        </section>

        <section className={styles.workspacePanel} aria-labelledby="workflow-records-heading">
          <div className={styles.panelHeader}><div><h2 id="workflow-records-heading">Workflow definitions</h2><p>Trigger configuration and latest observed execution.</p></div></div>
          <div className={styles.panelBody}>
            <DataWorkspace<WorkflowRow>
              data={workflows.data} loading={workflows.loading} getRowId={(row, index) => row.id ?? row.name ?? `workflow-${index}`}
              searchPlaceholder="Search workflows, triggers or status…"
              error={workflows.error ? <p role="alert" className={styles.sourceError}>{workflows.error.message}</p> : undefined}
              emptyTitle={workflows.error ? "Workflow source unavailable" : "No workflows reported"}
              emptyDescription="Refresh after the workflow service reports registered definitions."
              columns={[
                { key: "name", header: "Workflow", render: (_value, row) => <><span className={styles.recordTitle}>{row.name ?? row.id ?? "Unnamed workflow"}</span>{row.description && <span className={styles.recordDetail}>{row.description}</span>}</> },
                { key: "trigger", header: "Trigger", render: (value) => String(value ?? "Not reported") },
                { key: "enabled", header: "Definition", render: (value) => <Badge variant={value === true ? "success" : value === false ? "default" : "default"}>{value === true ? "ENABLED" : value === false ? "DISABLED" : "UNKNOWN"}</Badge> },
                { key: "lastStatus", header: "Latest status", render: (value) => <Badge variant={statusVariant(typeof value === "string" ? value : undefined)}>{String(value ?? "UNKNOWN")}</Badge> },
                { key: "lastRun", header: "Last run", render: formatTime },
                { key: "runs", header: "Runs", align: "right", render: (_value, row) => count(row.runs?.total) },
              ]}
            />
          </div>
        </section>
      </div>
    </DomainShell>
  );
}
