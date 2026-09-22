"use client";

import { Badge, Button } from "@kannan19302/ui";
import { DataWorkspace } from "@kannan19302/ui/shell";
import { RefreshCw } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import { useList } from "@/lib/data";
import styles from "../../ops/record-workspace.module.css";

interface IncidentRow { id: string; title?: string; summary?: string; status?: string; severity?: string; service?: string; startedAt?: string; }
const terminal = ["RESOLVED", "CLOSED", "MITIGATED"];
const critical = ["CRITICAL", "SEV1", "HIGH", "P1"];
function variant(value: string | undefined, kind: "severity" | "status"): "danger" | "warning" | "success" | "info" | "default" {
  const normalized = (value ?? "").toUpperCase();
  if (kind === "severity") return critical.includes(normalized) ? "danger" : ["MAJOR", "MEDIUM", "SEV2", "P2", "WARNING"].includes(normalized) ? "warning" : normalized ? "info" : "default";
  if (terminal.includes(normalized)) return "success";
  if (["OPEN", "ACTIVE", "DISRUPTION"].includes(normalized)) return "danger";
  if (["INVESTIGATING", "MONITORING", "MONITOR"].includes(normalized)) return "warning";
  return normalized ? "info" : "default";
}
function formatDate(value?: string): string { if (!value) return "Not reported"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Invalid timestamp" : date.toLocaleString(); }

export default function SupportIncidents() {
  const incidents = useList<IncidentRow>({ path: "/platform/v1/operations/incidents" });
  const active = incidents.data.filter((incident) => !terminal.includes((incident.status ?? "").toUpperCase())).length;
  const highSeverity = incidents.data.filter((incident) => critical.includes((incident.severity ?? "").toUpperCase())).length;
  const unknown = incidents.error || incidents.loading;
  return <DomainShell domainId="support" title="Incidents" description="Customer-facing impact reported by the operations incident service."
    actions={<Button variant="outline" size="sm" disabled={incidents.loading} onClick={() => void incidents.reload()}><RefreshCw size={14} aria-hidden="true" />Refresh incidents</Button>}>
    <div className={styles.container}>
      <section className={styles.summaryStrip} aria-label="Support incident summary">
        <div className={styles.summaryItem}><span>Incidents reported</span><strong>{unknown ? "Unknown" : incidents.data.length.toLocaleString()}</strong></div>
        <div className={styles.summaryItem}><span>Active response</span><strong>{unknown ? "Unknown" : active.toLocaleString()}</strong></div>
        <div className={styles.summaryItem}><span>High severity</span><strong>{unknown ? "Unknown" : highSeverity.toLocaleString()}</strong></div>
        <div className={styles.summaryItem}><span>Resolved or closed</span><strong>{unknown ? "Unknown" : (incidents.data.length - active).toLocaleString()}</strong></div>
      </section>
      <section className={styles.workspacePanel} aria-labelledby="support-incidents-heading">
        <div className={styles.panelHeader}><div><h2 id="support-incidents-heading">Incident register</h2><p>Service, impact, severity and lifecycle state from the operations source.</p></div></div>
        <div className={styles.panelBody}><DataWorkspace<IncidentRow> data={incidents.data} loading={incidents.loading} getRowId={(row) => row.id}
          searchPlaceholder="Search incidents…" error={incidents.error ? <p role="alert" className={styles.sourceError}>{incidents.error.message}</p> : undefined}
          emptyTitle={incidents.error ? "Incident source unavailable" : "No incidents reported"} emptyDescription="No customer-facing incidents were returned by the operations service."
          columns={[
            { key: "title", header: "Incident", render: (_value, row) => <><span className={styles.recordTitle}>{row.title ?? row.id}</span><span className={styles.recordDetail}>{row.summary ?? "No summary reported"}</span></> },
            { key: "service", header: "Service", render: (value) => typeof value === "string" && value ? value : "Not reported" },
            { key: "severity", header: "Severity", render: (value) => <Badge variant={variant(typeof value === "string" ? value : undefined, "severity")}>{String(value ?? "UNKNOWN")}</Badge> },
            { key: "status", header: "Status", render: (value) => <Badge variant={variant(typeof value === "string" ? value : undefined, "status")}>{String(value ?? "UNKNOWN")}</Badge> },
            { key: "startedAt", header: "Started", render: (value) => formatDate(typeof value === "string" ? value : undefined) },
          ]}
        /></div>
      </section>
    </div>
  </DomainShell>;
}
