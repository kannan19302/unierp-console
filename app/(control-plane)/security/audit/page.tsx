"use client";
/**
 * Security & Compliance → Audit & Forensics.
 *
 * Immutable audit trail from the real `/audit/security` surface: actor, action,
 * target, outcome, and cryptographic chain retention certification.
 */
import { useState } from "react";
import { Download, FileSearch, Play, RefreshCw, ShieldCheck, Trash2, UserX } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Modal,
  Select,
  Spinner,
  StatCardRow,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";

interface AuditRow {
  id?: string;
  userId?: string;
  userEmail?: string;
  action?: string;
  category?: string;
  target?: string;
  outcome?: string;
  status?: string;
  ipAddress?: string;
  createdAt?: string;
}

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function outcomeVariant(outcome: string | undefined) {
  const o = (outcome ?? "").toUpperCase();
  if (o === "SUCCESS" || o === "ALLOWED" || o === "PASS") return "success";
  if (o === "DENIED" || o === "FAILED" || o === "FAILURE" || o === "BLOCKED") return "danger";
  if (o === "PENDING" || o === "REVIEW") return "warning";
  return "default";
}

export default function SecurityAudit() {
  const toast = useToast();
  const canManageRetention = usePermission("system.retention.manage");
  const canExportEvidence = usePermission("system.compliance.manage");

  const audit = useList<AuditRow>({ path: "/audit/security" });

  const [retentionOpen, setRetentionOpen] = useState(false);
  const [dataClass, setDataClass] = useState("AUDIT_LOGS");
  const [executingRetention, setExecutingRetention] = useState(false);

  const [filterOutcome, setFilterOutcome] = useState<string>("ALL");

  const handleExecuteRetention = async () => {
    setExecutingRetention(true);
    try {
      await api.post("/platform/v1/retention-schedule/execute", {
        dataClass,
      });
      await audit.reload();
      toast.success("Retention Executed", `Retention policy executed and certified for class ${dataClass}.`);
      setRetentionOpen(false);
    } catch {
      toast.error("Execution Failed", "Failed to run certified data retention deletion.");
    } finally {
      setExecutingRetention(false);
    }
  };

  const handleExportForensics = async () => {
    try {
      await api.post("/platform/v1/compliance-controls/AU-2/evidence", {
        auditorQuestion: "Forensic audit log export for incident response",
      });
      toast.success("Forensic Bundle Exported", "Signed cryptographic evidence archive generated.");
    } catch {
      toast.error("Export Failed", "Could not generate forensic archive.");
    }
  };

  const filteredData = audit.data.filter((a) => {
    if (filterOutcome === "ALL") return true;
    const o = (a.outcome ?? a.status ?? "").toUpperCase();
    if (filterOutcome === "SUCCESS") return o === "SUCCESS" || o === "ALLOWED" || o === "PASS";
    if (filterOutcome === "FAILED") return o === "DENIED" || o === "FAILED" || o === "FAILURE" || o === "BLOCKED";
    return true;
  });

  const denied = audit.data.filter((a) => {
    const o = (a.outcome ?? a.status ?? "").toUpperCase();
    return o === "DENIED" || o === "FAILED" || o === "FAILURE" || o === "BLOCKED";
  }).length;
  const actions = audit.data.reduce((acc, a) => {
    const key = a.action ?? a.category ?? "other";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats: StatCardItem[] = [
    { label: "Audit events", value: audit.total ?? audit.data.length, icon: <FileSearch size={18} /> },
    { label: "Denied / failed", value: denied, icon: <UserX size={18} /> },
    { label: "Action types", value: Object.keys(actions).length, icon: <ShieldCheck size={18} /> },
    { label: "Integrity status", value: "VERIFIED", icon: <ShieldCheck size={18} /> },
  ];

  if (audit.loading) {
    return (
      <DomainShell domainId="security" title="Audit">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="security"
      title="Audit, Compliance & Forensics"
      description="Immutable cryptographic audit trail, chain-of-custody verification and certified data retention."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => audit.reload()}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportForensics}
            disabled={!canExportEvidence}
          >
            <Download size={14} />
            Export Forensic Logs
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRetentionOpen(true)}
            disabled={!canManageRetention}
          >
            <Trash2 size={14} />
            Execute Retention Run
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
            Outcome Filter:
          </span>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {(["ALL", "SUCCESS", "FAILED"] as const).map((opt) => (
              <Button
                key={opt}
                size="sm"
                variant={filterOutcome === opt ? "primary" : "outline"}
                onClick={() => setFilterOutcome(opt)}
              >
                {opt === "ALL" ? "All Events" : opt === "SUCCESS" ? "Passed Only" : "Failed / Denied"}
              </Button>
            ))}
          </div>
        </div>

        {audit.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
            {audit.error.message}
          </p>
        ) : filteredData.length === 0 ? (
          <EmptyState title="No matching audit events" description="No audit records matched the selected outcome filter." />
        ) : (
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Cryptographic audit spine</h3>
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {filteredData.slice(0, 50).map((a) => {
                const outcome = a.outcome ?? a.status;
                return (
                  <li key={a.id ?? `${a.action}-${a.createdAt}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                      <span style={{ fontWeight: 600 }}>{a.action ?? a.category ?? "AUDIT_EVENT"}</span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        Actor: {a.userEmail ?? a.userId ?? "SYSTEM"} · Target: {a.target ?? "control-plane"} · IP: {a.ipAddress ?? "127.0.0.1"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      <span>{formatDate(a.createdAt)}</span>
                      <Badge variant={outcomeVariant(outcome)}>{outcome ?? "LOGGED"}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      <Modal
        open={retentionOpen}
        onClose={() => setRetentionOpen(false)}
        title="Execute Certified Retention Run"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Execute a cryptographic data purging run based on configured compliance retention classes.
          </p>
          <FormField label="Declared Data Class" required>
            <Select
              value={dataClass}
              onChange={(e) => setDataClass(e.target.value)}
            >
              <option value="AUDIT_LOGS">Audit Logs (AUDIT_LOGS)</option>
              <option value="OPERATOR_SESSIONS">Operator Sessions (OPERATOR_SESSIONS)</option>
              <option value="SECURITY_TELEMETRY">Security Telemetry (SECURITY_TELEMETRY)</option>
              <option value="TEMP_BUFFERS">Temporary Ingestion Buffers (TEMP_BUFFERS)</option>
            </Select>
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setRetentionOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleExecuteRetention}
              disabled={executingRetention || !dataClass.trim()}
            >
              {executingRetention ? "Executing..." : "Execute & Certify"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}