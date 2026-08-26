"use client";
/**
 * Ops → Incidents.
 * Open incidents from the health endpoint plus the structured error-log feed
 * (level, context, request id, resolution state) from the operations API.
 */
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  FileWarning,
  Plus,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  Select,
  Spinner,
  StatCardRow,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";

interface LogRow {
  id?: string;
  timestamp?: string;
  level?: string;
  context?: string;
  message?: string;
  requestId?: string;
  stack?: string;
  resolved?: boolean;
}

function levelVariant(level?: string): "success" | "warning" | "danger" | "default" {
  const s = level?.toUpperCase() ?? "";
  if (s === "FATAL") return "danger";
  if (s === "ERROR") return "danger";
  if (s === "WARN" || s === "WARNING") return "warning";
  return "default";
}

export default function OpsIncidents() {
  const toast = useToast();
  const canManage = usePermission("system.incident.manage");
  const canUpdate = usePermission("system.operations.update");

  const health = useItem<Record<string, unknown>>("/platform/v1/operations/health");
  const logs = useList<LogRow>({ path: "/platform/v1/operations/logs" });

  const [filter, setFilter] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Simulation form state
  const [sloDefId, setSloDefId] = useState("slo-core-api");
  const [invoiceId, setInvoiceId] = useState("inv-sim-001");
  const [actualPercent, setActualPercent] = useState("98.5");

  const h = health.data ?? {};
  const metrics = (h.metrics ?? {}) as Record<string, unknown>;
  const openIncidents = Number(h.openIncidents ?? 0) || 0;
  const degradedServices = Number(h.degradedServices ?? metrics.degradedServices ?? 0) || 0;
  const availability = h.availability ?? metrics.availability ?? "—";

  const unresolved = logs.data.filter((l) => !l.resolved).length;

  const handleResolveLog = async (id: string) => {
    setResolvingId(id);
    try {
      await api.post(`/platform/v1/operations/logs/${id}/resolve`);
      await logs.reload();
      toast.success("Error Log Resolved", `Log ${id} marked as resolved.`);
    } catch {
      toast.error("Resolution Failed", `Could not resolve log ${id}.`);
    } finally {
      setResolvingId(null);
    }
  };

  const handleSimulateBreach = async () => {
    setSimulating(true);
    try {
      await api.post("/platform/v1/incidents/simulate-breach", {
        sloDefinitionId: sloDefId,
        invoiceId: invoiceId,
        actualPercent: parseFloat(actualPercent) || 98.5,
        actorId: "console-operator",
      });
      await health.reload();
      toast.success("SLO Breach Simulated", "Incident opened and SLA credit calculation triggered.");
      setSimModalOpen(false);
    } catch {
      toast.error("Simulation Failed", "Unable to simulate SLO breach.");
    } finally {
      setSimulating(false);
    }
  };

  const filteredLogs = logs.data.filter((l) => {
    if (filter === "OPEN" && l.resolved) return false;
    if (filter === "RESOLVED" && !l.resolved) return false;
    if (levelFilter !== "ALL" && (l.level?.toUpperCase() ?? "") !== levelFilter) return false;
    return true;
  });

  const stats: StatCardItem[] = [
    { label: "Open incidents", value: openIncidents },
    { label: "Degraded services", value: degradedServices },
    { label: "Error log entries", value: logs.total ?? logs.data.length },
    { label: "Unresolved logs", value: unresolved },
  ];

  if (logs.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="ops"
      title="Incidents"
      description="Open incidents, degraded services and the error-log feed behind them."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              health.reload();
              logs.reload();
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setSimModalOpen(true)}
            disabled={!canManage}
          >
            <Zap size={14} />
            Simulate SLO Breach
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            <FileWarning size={16} /> Incidents & degraded services
          </h3>
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
            <Badge variant={openIncidents > 0 ? "danger" : "success"}>
              {openIncidents} open
            </Badge>
            <Badge variant={degradedServices > 0 ? "warning" : "success"}>
              {degradedServices} degraded
            </Badge>
            <Badge variant="info">avail {String(availability)}</Badge>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Error log feed ({filteredLogs.length})
            </h3>
            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "var(--space-1)" }}>
                <Button
                  size="sm"
                  variant={filter === "ALL" ? "primary" : "outline"}
                  onClick={() => setFilter("ALL")}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filter === "OPEN" ? "primary" : "outline"}
                  onClick={() => setFilter("OPEN")}
                >
                  Open ({unresolved})
                </Button>
                <Button
                  size="sm"
                  variant={filter === "RESOLVED" ? "primary" : "outline"}
                  onClick={() => setFilter("RESOLVED")}
                >
                  Resolved
                </Button>
              </div>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                style={{
                  padding: "var(--space-1) var(--space-2)",
                  fontSize: "var(--text-xs)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
              >
                <option value="ALL">All Levels</option>
                <option value="FATAL">FATAL</option>
                <option value="ERROR">ERROR</option>
                <option value="WARN">WARN</option>
              </select>
            </div>
          </div>

          {logs.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
              {logs.error.message}
            </p>
          ) : filteredLogs.length === 0 ? (
            <EmptyState title="No error logs match filter" description="No error log entries meet the selected criteria." />
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
              {filteredLogs.slice(0, 50).map((l) => (
                <li
                  key={l.id ?? l.message}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-1)",
                    padding: "var(--space-3) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
                    <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.message}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
                      <Badge variant={levelVariant(l.level)}>{l.level ?? "—"}</Badge>
                      <Badge variant={l.resolved ? "success" : "warning"}>
                        {l.resolved ? "resolved" : "open"}
                      </Badge>
                      {!l.resolved && l.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveLog(l.id!)}
                          disabled={resolvingId === l.id || !canUpdate}
                        >
                          <CheckCircle size={12} />
                          {resolvingId === l.id ? "Resolving..." : "Resolve"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {l.timestamp && <span>{formatTime(l.timestamp)}</span>}
                    {l.context && <span>{l.context}</span>}
                    {l.requestId && <span>req: {l.requestId}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={simModalOpen}
        onClose={() => setSimModalOpen(false)}
        title="Simulate SLO Breach & Incident"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Simulate an automated SLO violation: opens an incident, notifies notification channels, and computes SLA credits.
          </p>
          <FormField label="SLO Definition ID">
            <Input
              value={sloDefId}
              onChange={(e) => setSloDefId(e.target.value)}
              placeholder="e.g. slo-core-api"
            />
          </FormField>
          <FormField label="Target Invoice ID">
            <Input
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="e.g. inv-sim-001"
            />
          </FormField>
          <FormField label="Observed Availability %">
            <Input
              value={actualPercent}
              onChange={(e) => setActualPercent(e.target.value)}
              placeholder="e.g. 98.5"
              type="number"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setSimModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleSimulateBreach}
              disabled={simulating || !sloDefId.trim() || !invoiceId.trim()}
            >
              {simulating ? "Simulating..." : "Trigger Breach"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}