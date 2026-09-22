"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";
import { Badge, Button, FormField, Input, Modal, Textarea, usePermission, useToast } from "@kannan19302/ui";
import { DataWorkspace } from "@kannan19302/ui/shell";
import DomainShell from "@/components/domain-shell";
import { api } from "@/lib/api";
import { useList } from "@/lib/data";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import { incidentFilters, type IncidentRecord } from "@/lib/ops-schema";
import styles from "./incidents.module.css";

const terminalStatuses = new Set(["RESOLVED", "CLOSED"]);

const formatTimestamp = (value: string | undefined): string => {
  if (!value) return "Not reported";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Invalid timestamp" : date.toLocaleString();
};

const severityVariant = (severity?: string): "danger" | "warning" | "default" => {
  if (severity === "CRITICAL") return "danger";
  if (severity === "MAJOR") return "warning";
  return "default";
};

const statusVariant = (status?: string): "success" | "danger" | "warning" | "default" => {
  if (status && terminalStatuses.has(status)) return "success";
  if (status === "OPEN") return "danger";
  if (status === "INVESTIGATING" || status === "IDENTIFIED" || status === "MITIGATED") return "warning";
  return "default";
};

export default function OpsIncidents() {
  const toast = useToast();
  const canManage = usePermission("system.incident.manage");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (activeFilters.severity) params.severity = activeFilters.severity;
    if (activeFilters.status) params.status = activeFilters.status;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    return params;
  }, [activeFilters, searchQuery]);

  const incidents = useList<IncidentRecord>({ path: "/platform/v1/incidents", params: queryParams });
  useDomainRealtime("incident", () => void incidents.reload());

  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [warRoomOpen, setWarRoomOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [rootCause, setRootCause] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [resolving, setResolving] = useState(false);
  const [escalateSeverity, setEscalateSeverity] = useState<"MAJOR" | "CRITICAL">("CRITICAL");
  const [escalateNote, setEscalateNote] = useState("");
  const [escalating, setEscalating] = useState(false);

  const allIncidents = incidents.data;
  const activeCount = allIncidents.filter((incident) => !terminalStatuses.has(incident.status)).length;
  const criticalCount = allIncidents.filter((incident) => incident.severity === "CRITICAL" && !terminalStatuses.has(incident.status)).length;
  const resolvedCount = allIncidents.filter((incident) => terminalStatuses.has(incident.status)).length;
  const resolutionReady = rootCause.trim().length >= 5 && correctiveAction.trim().length >= 5;
  const escalationReady = escalateNote.trim().length >= 10;

  const openWarRoom = (incident: IncidentRecord) => {
    setSelectedIncident(incident);
    setWarRoomOpen(true);
  };

  const openEscalation = () => {
    if (!selectedIncident) return;
    setEscalateSeverity(selectedIncident.severity === "MINOR" ? "MAJOR" : "CRITICAL");
    setEscalateNote("");
    setEscalateModalOpen(true);
  };

  const openResolution = () => {
    setRootCause("");
    setCorrectiveAction("");
    setResolveModalOpen(true);
  };

  const refreshSelectedIncident = async () => {
    if (!selectedIncident) return;
    const response = await api.get<IncidentRecord>(`/platform/v1/incidents/${selectedIncident.id}`);
    if (response.data) setSelectedIncident(response.data);
  };

  const handleEscalate = async () => {
    if (!selectedIncident || !escalationReady) return;
    setEscalating(true);
    try {
      await api.patch(`/platform/v1/incidents/${selectedIncident.id}/escalate`, {
        severity: escalateSeverity,
        note: escalateNote.trim(),
      });
      toast.success("Incident escalated", `${selectedIncident.id} was escalated to ${escalateSeverity}.`);
      setEscalateModalOpen(false);
      await Promise.all([incidents.reload(), refreshSelectedIncident()]);
    } catch {
      toast.error("Incident not escalated", "The escalation request was not accepted.");
    } finally {
      setEscalating(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedIncident || !resolutionReady) return;
    setResolving(true);
    try {
      await api.patch(`/platform/v1/incidents/${selectedIncident.id}/resolve`, {
        rootCause: rootCause.trim(),
        correctiveAction: correctiveAction.trim(),
      });
      toast.success("Incident resolved", `${selectedIncident.id} was marked resolved.`);
      setResolveModalOpen(false);
      await Promise.all([incidents.reload(), refreshSelectedIncident()]);
    } catch {
      toast.error("Incident not resolved", "The resolution request did not complete.");
    } finally {
      setResolving(false);
    }
  };

  const sourceUnknown = incidents.loading || Boolean(incidents.error);

  return (
    <DomainShell
      domainId="ops"
      title="Incidents"
      description="Investigate provider incidents, review response evidence and record controlled resolution."
      actions={
        <div className={styles.headerActions}>
          <Button size="sm" variant="outline" disabled={incidents.loading} onClick={() => void incidents.reload()}>
            <RefreshCw size={14} aria-hidden="true" />Refresh incidents
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <section className={styles.incidentLedger} aria-label="Incident register summary">
          <div><span>Incidents reported</span><strong>{sourceUnknown ? "Unknown" : allIncidents.length.toLocaleString()}</strong></div>
          <div><span>Active response</span><strong>{sourceUnknown ? "Unknown" : activeCount.toLocaleString()}</strong></div>
          <div><span>Critical active</span><strong>{sourceUnknown ? "Unknown" : criticalCount.toLocaleString()}</strong></div>
          <div><span>Resolved or closed</span><strong>{sourceUnknown ? "Unknown" : resolvedCount.toLocaleString()}</strong></div>
        </section>

        <section className={styles.registerPanel} aria-labelledby="incident-register-heading">
          <div className={styles.panelHeader}><div><h2 id="incident-register-heading">Incident register</h2><p>Provider events, ownership context and latest response state.</p></div></div>
          <DataWorkspace<IncidentRecord>
            mode="server"
            data={allIncidents}
            loading={incidents.loading}
            getRowId={(incident) => incident.id}
            searchPlaceholder="Search incidents…"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={incidentFilters.map((filter) => ({ key: filter.key, label: filter.label, options: filter.options }))}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            error={incidents.error ? <p role="alert" className={styles.sourceError}>{incidents.error.message}</p> : undefined}
            emptyTitle={incidents.error ? "Incident source unavailable" : "No incidents reported"}
            emptyDescription="Change the filters or refresh after the incident service reports a record."
            columns={[
              { key: "title", header: "Incident", render: (value, row) => <><span className={styles.recordTitle}>{String(value ?? "Untitled incident")}</span><span className={styles.recordDetail}>{row.id} / {row.service || "Service not reported"}</span></> },
              { key: "severity", header: "Severity", render: (value) => <Badge variant={severityVariant(typeof value === "string" ? value : undefined)}>{String(value ?? "UNKNOWN")}</Badge> },
              { key: "status", header: "Status", render: (value) => <Badge variant={statusVariant(typeof value === "string" ? value : undefined)}>{String(value ?? "UNKNOWN")}</Badge> },
              { key: "updatedAt", header: "Last activity", render: (value) => formatTimestamp(typeof value === "string" ? value : undefined) },
              { key: "actions", header: "Response", align: "right", render: (_value, row) => <Button size="sm" variant="outline" onClick={() => openWarRoom(row)}>Open incident</Button> },
            ]}
          />
        </section>

        <Modal className={styles.commandModal} open={warRoomOpen} onClose={() => setWarRoomOpen(false)} title={selectedIncident ? `Incident ${selectedIncident.id}` : "Incident"} description={selectedIncident?.title ?? ""}>
          {selectedIncident && (
            <div className={styles.responseWorkspace}>
              <section className={styles.factSection} aria-labelledby="incident-facts-heading">
                <div className={styles.sectionHeading}><h3 id="incident-facts-heading">Current state</h3><span>{formatTimestamp(selectedIncident.updatedAt)}</span></div>
                <dl className={styles.factGrid}>
                  <div><dt>Severity</dt><dd><Badge variant={severityVariant(selectedIncident.severity)}>{selectedIncident.severity}</Badge></dd></div>
                  <div><dt>Status</dt><dd><Badge variant={statusVariant(selectedIncident.status)}>{selectedIncident.status}</Badge></dd></div>
                  <div><dt>Service</dt><dd>{selectedIncident.service || "Not reported"}</dd></div>
                  <div><dt>Opened</dt><dd>{formatTimestamp(selectedIncident.createdAt)}</dd></div>
                  {typeof selectedIncident.actualPercent === "number" && <div><dt>Measured availability</dt><dd>{selectedIncident.actualPercent}%</dd></div>}
                </dl>
              </section>

              {canManage && !terminalStatuses.has(selectedIncident.status) && (
                <section className={styles.actionSection} aria-labelledby="response-actions-heading">
                  <div className={styles.sectionHeading}><h3 id="response-actions-heading">Response actions</h3></div>
                  <div className={styles.responseActions}>
                    {selectedIncident.severity !== "CRITICAL" && <Button size="sm" variant="outline" onClick={openEscalation}><ShieldAlert size={14} aria-hidden="true" />Escalate severity</Button>}
                    <Button size="sm" variant="primary" onClick={openResolution}><CheckCircle2 size={14} aria-hidden="true" />Resolve incident</Button>
                  </div>
                </section>
              )}

              {(selectedIncident.rootCause || selectedIncident.correctiveAction) && (
                <section className={styles.resolutionSection} aria-labelledby="resolution-evidence-heading">
                  <div className={styles.sectionHeading}><h3 id="resolution-evidence-heading">Resolution evidence</h3><span>{formatTimestamp(selectedIncident.resolvedAt)}</span></div>
                  <dl className={styles.resolutionGrid}>
                    <div><dt>Root cause</dt><dd>{selectedIncident.rootCause ?? "Not reported"}</dd></div>
                    <div><dt>Corrective action</dt><dd>{selectedIncident.correctiveAction ?? "Not reported"}</dd></div>
                    <div><dt>Resolved by</dt><dd>{selectedIncident.resolvedBy ?? "Not reported"}</dd></div>
                  </dl>
                </section>
              )}

              <section className={styles.timelineSection} aria-labelledby="timeline-heading">
                <div className={styles.sectionHeading}><h3 id="timeline-heading">Response timeline</h3><span>{selectedIncident.timeline?.length ?? 0} events</span></div>
                {selectedIncident.timeline?.length ? (
                  <ol className={styles.timelineFeed}>
                    {[...selectedIncident.timeline]
                      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      .map((event, index) => (
                        <li key={`${event.timestamp}-${index}`} className={styles.timelineItem}>
                          <time dateTime={event.timestamp}>{formatTimestamp(event.timestamp)}</time>
                          <strong>{event.actor || "Actor not reported"}</strong>
                          <p>{event.event}</p>
                        </li>
                      ))}
                  </ol>
                ) : <p className={styles.emptyTimeline}>No timeline events were reported for this incident.</p>}
              </section>
            </div>
          )}
        </Modal>

        <Modal className={styles.commandModal} open={escalateModalOpen} onClose={() => !escalating && setEscalateModalOpen(false)} title="Escalate incident">
          <div className={styles.commandDialog}>
            <p>Increase response urgency for this incident and record why the current severity is no longer sufficient.</p>
            <dl>
              <div><dt>Incident</dt><dd>{selectedIncident?.id ?? "Unavailable"}</dd></div>
              <div><dt>Current severity</dt><dd>{selectedIncident?.severity ?? "Unknown"}</dd></div>
            </dl>
            <FormField label="Target severity" required>
              <select className={styles.select} value={escalateSeverity} onChange={(event) => setEscalateSeverity(event.target.value as "MAJOR" | "CRITICAL")}>
                {selectedIncident?.severity === "MINOR" && <option value="MAJOR">Major</option>}
                <option value="CRITICAL">Critical</option>
              </select>
            </FormField>
            <FormField label="Escalation rationale" required><Input value={escalateNote} onChange={(event) => setEscalateNote(event.target.value)} placeholder="Describe the measured change requiring escalation" /></FormField>
            <p className={styles.fieldHint}>Enter at least 10 characters for the incident timeline.</p>
            <div className={styles.dialogActions}><Button variant="ghost" disabled={escalating} onClick={() => setEscalateModalOpen(false)}>Cancel</Button><Button variant="danger" disabled={escalating || !escalationReady} onClick={() => void handleEscalate()}>{escalating ? "Escalating…" : "Escalate incident"}</Button></div>
          </div>
        </Modal>

        <Modal className={styles.commandModal} open={resolveModalOpen} onClose={() => !resolving && setResolveModalOpen(false)} title="Resolve incident">
          <div className={styles.commandDialog}>
            <p>Close active response only after the cause and durable corrective action are understood.</p>
            <dl><div><dt>Incident</dt><dd>{selectedIncident?.id ?? "Unavailable"}</dd></div><div><dt>Service</dt><dd>{selectedIncident?.service ?? "Not reported"}</dd></div></dl>
            <FormField label="Root cause" required><Textarea value={rootCause} onChange={(event) => setRootCause(event.target.value)} placeholder="Describe the direct cause of the incident" /></FormField>
            <FormField label="Corrective action" required><Textarea value={correctiveAction} onChange={(event) => setCorrectiveAction(event.target.value)} placeholder="Describe the durable remediation and prevention work" /></FormField>
            <p className={styles.fieldHint}>Both fields require at least 5 characters and become part of the incident record.</p>
            <div className={styles.dialogActions}><Button variant="ghost" disabled={resolving} onClick={() => setResolveModalOpen(false)}>Cancel</Button><Button variant="primary" disabled={resolving || !resolutionReady} onClick={() => void handleResolve()}>{resolving ? "Resolving…" : "Resolve incident"}</Button></div>
          </div>
        </Modal>
      </div>
    </DomainShell>
  );
}
