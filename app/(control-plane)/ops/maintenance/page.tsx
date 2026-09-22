"use client";

import { Badge, Button } from "@kannan19302/ui";
import { DataWorkspace } from "@kannan19302/ui/shell";
import { RefreshCw } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import { useList } from "@/lib/data";
import styles from "../record-workspace.module.css";

interface MaintenanceWindowRow {
  id?: string;
  title?: string;
  description?: string;
  message?: string;
  tenantId?: string;
  status?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  createdBy?: string;
  createdAt?: string;
}

function statusVariant(status?: string): "success" | "warning" | "danger" | "info" | "default" {
  const normalized = status?.toUpperCase() ?? "";
  if (normalized === "COMPLETED" || normalized === "CLOSED") return "success";
  if (normalized === "SCHEDULED") return "info";
  if (normalized === "ACTIVE" || normalized === "IN_PROGRESS") return "warning";
  if (normalized === "CANCELLED") return "danger";
  return "default";
}

const formatTime = (value: unknown): string => {
  if (typeof value !== "string" || !value) return "Not reported";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Invalid timestamp" : date.toLocaleString();
};

const count = (value: unknown): string => typeof value === "number" ? value.toLocaleString() : "Unknown";

export default function OpsMaintenance() {
  const windows = useList<MaintenanceWindowRow>({ path: "/platform/v1/broadcasts/windows" });
  const statusCount = (statuses: string[]) => windows.data.filter((window) => statuses.includes(window.status?.toUpperCase() ?? "")).length;

  return (
    <DomainShell
      domainId="ops"
      title="Maintenance"
      description="Scheduled provider maintenance and the audience receiving each service notice."
      actions={<Button variant="outline" size="sm" disabled={windows.loading} onClick={() => void windows.reload()}><RefreshCw size={14} aria-hidden="true" />Refresh windows</Button>}
    >
      <div className={styles.container}>
        <section className={styles.summaryStrip} aria-label="Maintenance summary">
          <div className={styles.summaryItem}><span>Windows reported</span><strong>{windows.error || windows.loading ? "Unknown" : count(windows.total ?? windows.data.length)}</strong></div>
          <div className={styles.summaryItem}><span>Scheduled</span><strong>{windows.error || windows.loading ? "Unknown" : count(statusCount(["SCHEDULED"]))}</strong></div>
          <div className={styles.summaryItem}><span>Active</span><strong>{windows.error || windows.loading ? "Unknown" : count(statusCount(["ACTIVE", "IN_PROGRESS"]))}</strong></div>
          <div className={styles.summaryItem}><span>Completed</span><strong>{windows.error || windows.loading ? "Unknown" : count(statusCount(["COMPLETED", "CLOSED"]))}</strong></div>
        </section>

        <section className={styles.workspacePanel} aria-labelledby="maintenance-records-heading">
          <div className={styles.panelHeader}><div><h2 id="maintenance-records-heading">Maintenance windows</h2><p>Timing, status and tenant scope reported by the broadcasts service.</p></div></div>
          <div className={styles.panelBody}>
            <DataWorkspace<MaintenanceWindowRow>
              data={windows.data} loading={windows.loading} getRowId={(row, index) => row.id ?? row.title ?? `window-${index}`}
              searchPlaceholder="Search maintenance windows…"
              error={windows.error ? <p role="alert" className={styles.sourceError}>{windows.error.message}</p> : undefined}
              emptyTitle={windows.error ? "Maintenance source unavailable" : "No maintenance windows reported"}
              emptyDescription="No maintenance windows were returned by the broadcasts service."
              columns={[
                { key: "title", header: "Window", render: (_value, row) => <><span className={styles.recordTitle}>{row.title ?? row.id ?? "Untitled window"}</span>{(row.description ?? row.message) && <span className={styles.recordDetail}>{row.description ?? row.message}</span>}</> },
                { key: "status", header: "Status", render: (value) => <Badge variant={statusVariant(typeof value === "string" ? value : undefined)}>{String(value ?? "UNKNOWN")}</Badge> },
                { key: "scheduledStart", header: "Starts", render: formatTime },
                { key: "scheduledEnd", header: "Ends", render: formatTime },
                { key: "tenantId", header: "Audience", render: (value) => typeof value === "string" && value ? value : "Provider estate" },
              ]}
            />
          </div>
        </section>
      </div>
    </DomainShell>
  );
}
