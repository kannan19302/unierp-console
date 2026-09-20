"use client";

import { useState, useCallback, useMemo } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Zap,
} from "lucide-react";
import {
  Badge,
  Button,
  FormField,
  Input,
  Modal,
  StatCardRow,
  Textarea,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import { api } from "@/lib/api";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import DomainShell from "@/components/domain-shell";
import { PaginatedTable, type ColumnDef } from "@/components/PaginatedTable";
import { FilterBar } from "@/components/FilterBar";
import { CrudDrawer } from "@/components/CrudDrawer";
import {
  incidentFilters,
  type IncidentRecord,
} from "@/lib/ops-schema";
import styles from "./incidents.module.css";

export default function OpsIncidents() {
  const toast = useToast();
  const canManage = usePermission("system.incident.manage");

  // Filter state
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Incidents data query
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (activeFilters.severity) params.severity = activeFilters.severity;
    if (activeFilters.status) params.status = activeFilters.status;
    if (searchQuery) params.search = searchQuery;
    return params;
  }, [activeFilters, searchQuery]);

  const incidents = useList<IncidentRecord>({
    path: "/platform/v1/incidents",
    params: queryParams,
  });

  // Real-time WebSocket updates
  useDomainRealtime("incident", () => incidents.reload());

  // Drawer / Modal states
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [warRoomOpen, setWarRoomOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [simModalOpen, setSimModalOpen] = useState(false);

  // Form states
  const [rootCause, setRootCause] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [resolving, setResolving] = useState(false);

  const [escalateSeverity, setEscalateSeverity] = useState<"MAJOR" | "CRITICAL">("CRITICAL");
  const [escalateNote, setEscalateNote] = useState("");
  const [escalating, setEscalating] = useState(false);

  const [sloDefId, setSloDefId] = useState("slo-core-api");
  const [invoiceId, setInvoiceId] = useState("inv-sim-001");
  const [actualPercent, setActualPercent] = useState("94.5");
  const [simulating, setSimulating] = useState(false);

  const allList = incidents.data ?? [];
  const openCount = allList.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED").length;
  const criticalCount = allList.filter((i) => i.severity === "CRITICAL" && i.status !== "RESOLVED" && i.status !== "CLOSED").length;
  const resolvedCount = allList.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED").length;

  const statItems: StatCardItem[] = [
    {
      label: "Active Incidents",
      value: openCount,
      changeLabel: criticalCount > 0 ? `${criticalCount} Critical` : "All normal",
    },
    {
      label: "Critical Priority",
      value: criticalCount,
    },
    {
      label: "Resolved / Closed",
      value: resolvedCount,
    },
    {
      label: "Active SLO Compliance",
      value: "99.92%",
    },
  ];

  const handleOpenWarRoom = (incident: IncidentRecord) => {
    setSelectedIncident(incident);
    setWarRoomOpen(true);
  };

  const handleEscalate = async () => {
    if (!selectedIncident) return;
    setEscalating(true);
    try {
      await api.patch(`/platform/v1/incidents/${selectedIncident.id}/escalate`, {
        severity: escalateSeverity,
        note: escalateNote || "Operator initiated severity escalation via War Room",
        actorId: "test.agent@unierp.com",
      });
      toast.success("Incident Escalated", `Incident ${selectedIncident.id} upgraded to ${escalateSeverity}.`);
      setEscalateModalOpen(false);
      setEscalateNote("");
      await incidents.reload();
      // Update locally selected incident
      const updated = await api.get<IncidentRecord>(`/platform/v1/incidents/${selectedIncident.id}`);
      setSelectedIncident((updated as any).data ?? updated);
    } catch {
      toast.error("Escalation Failed", "Could not escalate incident.");
    } finally {
      setEscalating(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedIncident) return;
    if (!rootCause || !correctiveAction) {
      toast.error("Required Fields", "Please supply both root cause and corrective action.");
      return;
    }
    setResolving(true);
    try {
      await api.patch(`/platform/v1/incidents/${selectedIncident.id}/resolve`, {
        rootCause,
        correctiveAction,
        actorId: "test.agent@unierp.com",
      });
      toast.success("Incident Resolved", `Incident ${selectedIncident.id} successfully marked as resolved.`);
      setResolveModalOpen(false);
      setRootCause("");
      setCorrectiveAction("");
      await incidents.reload();
      const updated = await api.get<IncidentRecord>(`/platform/v1/incidents/${selectedIncident.id}`);
      setSelectedIncident((updated as any).data ?? updated);
    } catch {
      toast.error("Resolution Failed", "Could not mark incident as resolved.");
    } finally {
      setResolving(false);
    }
  };

  const handleSimulateBreach = async () => {
    setSimulating(true);
    try {
      await api.post("/platform/v1/incidents/simulate-breach", {
        sloDefinitionId: sloDefId,
        invoiceId,
        actualPercent: parseFloat(actualPercent) || 94.5,
        actorId: "test.agent@unierp.com",
      });
      toast.success("SLO Breach Simulated", "Incident opened, notification dispatched, SLA credit calculated.");
      setSimModalOpen(false);
      await incidents.reload();
    } catch {
      toast.error("Simulation Failed", "Could not simulate SLO breach.");
    } finally {
      setSimulating(false);
    }
  };

  const columns: ColumnDef<IncidentRecord>[] = [
    {
      key: "id",
      label: "Incident ID",
      render: (val: string) => (
        <span style={{ fontFamily: "monospace", fontWeight: "var(--font-weight-semibold)" }}>{val}</span>
      ),
    },
    {
      key: "title",
      label: "Incident Title",
      render: (val: string, row: IncidentRecord) => (
        <div>
          <div style={{ fontWeight: "var(--font-weight-medium)", color: "var(--color-text-primary)" }}>{val}</div>
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Service: {row.service}</div>
        </div>
      ),
    },
    {
      key: "severity",
      label: "Severity",
      render: (val: string) => {
        const variant = val === "CRITICAL" ? "danger" : val === "MAJOR" ? "warning" : "default";
        return <Badge variant={variant}>{val}</Badge>;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (val: string) => {
        const variant = val === "RESOLVED" || val === "CLOSED" ? "success" : val === "OPEN" ? "danger" : "warning";
        return <Badge variant={variant}>{val}</Badge>;
      },
    },
    {
      key: "updatedAt",
      label: "Last Activity",
      render: (val: string) => (
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
          {new Date(val).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "War Room",
      render: (_: unknown, row: IncidentRecord) => (
        <div className={styles.actionRow}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenWarRoom(row)}
          >
            Inspect War Room
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DomainShell
      domainId="ops"
      title="Platform Operations — Incident War Room"
      description="Real-time incident response, SLO breach detection, severity escalations, and SLA credit remediations."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSimModalOpen(true)}
            >
              <Zap size={14} style={{ marginRight: "var(--space-1)" }} />
              Simulate SLO Breach
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => incidents.reload()}
          >
            Refresh
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <StatCardRow stats={statItems} columns={4} />

        <FilterBar
          searchPlaceholder="Search incidents by title, service, ID..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={incidentFilters}
          activeFilters={activeFilters}
          onFilterChange={(key, val) => setActiveFilters((prev) => ({ ...prev, [key]: val }))}
          onClearAll={() => setActiveFilters({})}
        />

        <PaginatedTable<IncidentRecord>
          columns={columns}
          data={allList}
          total={allList.length}
          pageSize={10}
          page={1}
          onPageChange={() => {}}
          loading={incidents.loading}
          emptyMessage="No Incidents Reported — Platform services are currently meeting all operational SLOs."
        />

        {/* Incident Inspection & War Room Drawer */}
        <CrudDrawer
          isOpen={warRoomOpen}
          onClose={() => setWarRoomOpen(false)}
          title={`War Room — ${selectedIncident?.id ?? ""}`}
          description={selectedIncident?.title ?? ""}
          mode="view"
        >
          {selectedIncident && (
            <div>
              <div className={styles.drawerSection}>
                <div className={styles.drawerLabel}>Status & Severity</div>
                <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                  <Badge variant={selectedIncident.severity === "CRITICAL" ? "danger" : selectedIncident.severity === "MAJOR" ? "warning" : "default"}>
                    {selectedIncident.severity}
                  </Badge>
                  <Badge variant={selectedIncident.status === "RESOLVED" || selectedIncident.status === "CLOSED" ? "success" : "warning"}>
                    {selectedIncident.status}
                  </Badge>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    Target Service: <strong>{selectedIncident.service}</strong>
                  </span>
                </div>
              </div>

              {canManage && selectedIncident.status !== "RESOLVED" && selectedIncident.status !== "CLOSED" && (
                <div className={styles.drawerSection}>
                  <div className={styles.drawerLabel}>Operator Actions</div>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    {selectedIncident.severity !== "CRITICAL" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEscalateModalOpen(true)}
                      >
                        <ShieldAlert size={14} style={{ marginRight: "var(--space-1)" }} />
                        Escalate Severity
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setResolveModalOpen(true)}
                    >
                      <CheckCircle2 size={14} style={{ marginRight: "var(--space-1)" }} />
                      Resolve Incident
                    </Button>
                  </div>
                </div>
              )}

              {selectedIncident.rootCause && (
                <div className={styles.drawerSection}>
                  <div className={styles.resolutionAlert}>
                    <div className={styles.drawerLabel}>Root Cause Analysis</div>
                    <div className={styles.drawerValue}>{selectedIncident.rootCause}</div>
                    <div className={styles.drawerLabel} style={{ marginTop: "var(--space-2)" }}>Corrective Action</div>
                    <div className={styles.drawerValue}>{selectedIncident.correctiveAction}</div>
                    {selectedIncident.resolvedBy && (
                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                        Resolved by: {selectedIncident.resolvedBy} at {new Date(selectedIncident.resolvedAt ?? "").toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.drawerSection}>
                <div className={styles.drawerLabel}>Chronological Event Feed</div>
                <div className={styles.timelineFeed}>
                  {selectedIncident.timeline && selectedIncident.timeline.length > 0 ? (
                    selectedIncident.timeline.map((event, idx) => (
                      <div key={idx} className={styles.timelineItem}>
                        <div className={styles.timelineHeader}>
                          <span className={styles.timelineActor}>{event.actor}</span>
                          <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className={styles.timelineEvent}>{event.event}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)" }}>
                      No timeline events recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CrudDrawer>

        {/* Severity Escalation Modal */}
        <Modal
          open={escalateModalOpen}
          onClose={() => setEscalateModalOpen(false)}
          title={`Escalate Severity — ${selectedIncident?.id ?? ""}`}
        >
          <div className={styles.escalatePanel}>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              Escalating an incident pages the designated on-call response team and triggers high-urgency notifications.
            </p>
            <FormField label="Target Severity Level" required>
              <select
                className="input-select"
                value={escalateSeverity}
                onChange={(e) => setEscalateSeverity(e.target.value as "MAJOR" | "CRITICAL")}
                style={{
                  width: "100%",
                  padding: "var(--space-2)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  borderRadius: "var(--radius-sm)",
                  border: "0.0625rem solid var(--color-border-subtle)",
                }}
              >
                <option value="MAJOR">MAJOR — Core business function degraded</option>
                <option value="CRITICAL">CRITICAL — Immediate outage or SLO breach</option>
              </select>
            </FormField>
            <FormField label="Escalation Rationale / Note">
              <Input
                placeholder="e.g., Cascading failures detected in dependent message queues"
                value={escalateNote}
                onChange={(e) => setEscalateNote(e.target.value)}
              />
            </FormField>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button variant="ghost" onClick={() => setEscalateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleEscalate} disabled={escalating}>
                {escalating ? "Escalating..." : "Confirm Escalation"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Incident Resolution Modal */}
        <Modal
          open={resolveModalOpen}
          onClose={() => setResolveModalOpen(false)}
          title={`Resolve Incident — ${selectedIncident?.id ?? ""}`}
        >
          <div className={styles.resolvePanel}>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              Document the incident root cause and long-term corrective action for compliance audit and post-mortem.
            </p>
            <FormField label="Root Cause" required>
              <Textarea
                placeholder="Describe what directly caused the anomaly or failure..."
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
              />
            </FormField>
            <FormField label="Corrective Action" required>
              <Textarea
                placeholder="Describe remediations applied to resolve and prevent reoccurrence..."
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
              />
            </FormField>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button variant="ghost" onClick={() => setResolveModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleResolve} disabled={resolving}>
                {resolving ? "Resolving..." : "Mark as Resolved"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* SLO Breach Simulation Modal */}
        <Modal
          open={simModalOpen}
          onClose={() => setSimModalOpen(false)}
          title="Simulate Real-time SLO Breach"
        >
          <div className={styles.escalatePanel}>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              Simulates a live SLO breach: opens an incident, dispatches event notification, and applies SLA invoice credit.
            </p>
            <FormField label="SLO Definition ID" required>
              <Input value={sloDefId} onChange={(e) => setSloDefId(e.target.value)} />
            </FormField>
            <FormField label="Invoice ID for SLA Credit" required>
              <Input value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} />
            </FormField>
            <FormField label="Actual Measured Availability %" required>
              <Input
                type="number"
                step="0.1"
                value={actualPercent}
                onChange={(e) => setActualPercent(e.target.value)}
              />
            </FormField>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button variant="ghost" onClick={() => setSimModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSimulateBreach} disabled={simulating}>
                {simulating ? "Simulating..." : "Trigger Breach Simulation"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DomainShell>
  );
}