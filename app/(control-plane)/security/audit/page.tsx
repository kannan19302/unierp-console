"use client";
/**
 * Security & Compliance → Audit & Forensics Spine.
 *
 * Immutable append-only audit trail backed by cryptographic SHA-256 chained hashes.
 * Supports operator chain integrity verification, forensic evidence export, and certified retention.
 */
import { useState, useMemo, useEffect } from "react";
import {
  Download,
  FileCheck,
  History,
  Lock,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Trash2,
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
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useToast } from "@/lib/use-toast";
import { useList } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";
import { PaginatedTable, type ColumnDef } from "@/components/PaginatedTable";
import { FilterBar } from "@/components/FilterBar";
import {
  type ControlPlaneAuditRecord,
  type AuditSpineStats,
  auditFilterConfigs,
} from "@/lib/security-schema";
import styles from "./audit.module.css";

function actionBadgeVariant(action: string): "success" | "warning" | "danger" | "default" {
  if (action.includes("delete") || action.includes("quarantine") || action.includes("revoke")) {
    return "danger";
  }
  if (action.includes("update") || action.includes("patch") || action.includes("modify")) {
    return "warning";
  }
  if (action.includes("create") || action.includes("provision") || action.includes("approve")) {
    return "success";
  }
  return "default";
}

export default function SecurityAuditPage() {
  const toast = useToast();
  const canManageRetention = usePermission("system.retention.manage");
  const canExportEvidence = usePermission("system.compliance.manage");
  const canReadAudit = usePermission("pcc.security.view");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Retention Modal state
  const [retentionOpen, setRetentionOpen] = useState(false);
  const [dataClass, setDataClass] = useState("AUDIT_LOGS");
  const [executingRetention, setExecutingRetention] = useState(false);

  // Forensic Export Modal state
  const [exportOpen, setExportOpen] = useState(false);
  const [auditorQuestion, setAuditorQuestion] = useState("Forensic audit records export for incident triage");
  const [exportingEvidence, setExportingEvidence] = useState(false);

  // Chain Verification Modal state
  const [verifyTarget, setVerifyTarget] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ verified: number; brokenAt?: number } | null>(null);
  const [verifyingChain, setVerifyingChain] = useState(false);

  // Inspect Payload Modal state
  const [inspectRecord, setInspectRecord] = useState<ControlPlaneAuditRecord | null>(null);

  // Stats state
  const [statsData, setStatsData] = useState<AuditSpineStats>({
    totalRecords: 0,
    uniqueActorsCount: 0,
    chainIntegrityStatus: "VERIFIED",
  });

  // Query audit records
  const auditList = useList<ControlPlaneAuditRecord>({
    path: "/platform/v1/audit/records",
  });

  // Fetch summary stats
  const fetchStats = async () => {
    try {
      const res = await api.get<AuditSpineStats>("/platform/v1/audit/stats");
      if (res.data) {
        setStatsData(res.data);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchStats();
  }, [auditList.data]);

  // Execute Retention
  const handleExecuteRetention = async () => {
    setExecutingRetention(true);
    try {
      await api.post("/platform/v1/retention-schedule/execute", { dataClass });
      toast.success(`Retention policy executed and certified for class ${dataClass}.`, "Retention Executed");
      setRetentionOpen(false);
      await auditList.reload();
      await fetchStats();
    } catch {
      toast.error("Failed to run certified data retention deletion.", "Execution Failed");
    } finally {
      setExecutingRetention(false);
    }
  };

  // Export Forensic Evidence
  const handleExportForensics = async () => {
    setExportingEvidence(true);
    try {
      await api.post("/platform/v1/compliance-controls/AUDIT-COMPLETE/evidence", {
        auditorQuestion,
      });
      toast.success("Signed cryptographic audit evidence archive generated.", "Evidence Exported");
      setExportOpen(false);
    } catch {
      toast.error("Could not generate forensic evidence bundle.", "Export Failed");
    } finally {
      setExportingEvidence(false);
    }
  };

  // Verify Tamper-evident Chain
  const handleVerifyChain = async (actorId: string) => {
    setVerifyTarget(actorId);
    setVerifyingChain(true);
    setVerifyResult(null);
    try {
      const res = await api.get<{ verified: number; brokenAt?: number }>(
        `/platform/v1/audit/verify-chain/${actorId}`
      );
      setVerifyResult(res.data);
      if (res.data?.brokenAt !== undefined) {
        toast.error(`Chain broken at record sequence ${res.data.brokenAt}!`, "Integrity Alert");
      } else {
        toast.success(`Verified ${res.data?.verified ?? 0} record(s). Chain is intact.`, "Chain Verified");
      }
    } catch {
      toast.error(`Failed to verify audit hash chain for actor ${actorId}.`, "Verification Failed");
    } finally {
      setVerifyingChain(false);
    }
  };

  // Filter audit records
  const filteredRecords = useMemo(() => {
    return auditList.data.filter((r) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesQ =
          r.action?.toLowerCase().includes(q) ||
          r.actorId?.toLowerCase().includes(q) ||
          r.actorRole?.toLowerCase().includes(q) ||
          r.targetId?.toLowerCase().includes(q) ||
          r.contentHash?.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }
      if (activeFilters.action && !r.action?.includes(activeFilters.action)) {
        return false;
      }
      return true;
    });
  }, [auditList.data, searchQuery, activeFilters]);

  const stats: StatCardItem[] = [
    { label: "Total Audit Records", value: statsData.totalRecords || auditList.data.length, icon: <History size={18} /> },
    { label: "Unique Operators", value: statsData.uniqueActorsCount ?? "Unknown", icon: <ShieldCheck size={18} /> },
    {
      label: "Tamper-Evidence",
      value: statsData.chainIntegrityStatus,
      icon: <Lock size={18} />,
    },
    { label: "Spine Sequence", value: `#${auditList.data[0]?.sequenceNum ?? 1}`, icon: <FileCheck size={18} /> },
  ];

  const columns: ColumnDef<ControlPlaneAuditRecord>[] = [
    {
      key: "sequenceNum",
      label: "Seq & Time",
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            #{row.sequenceNum ?? "—"}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            {row.createdAt ? new Date(row.createdAt).toLocaleTimeString() : "—"}
          </div>
        </div>
      ),
    },
    {
      key: "actorId",
      label: "Operator / Actor",
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{row.actorId}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            {row.actorRole}
          </div>
        </div>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (_, row) => (
        <Badge variant={actionBadgeVariant(row.action)}>{row.action}</Badge>
      ),
    },
    {
      key: "targetId",
      label: "Target Entity",
      render: (_, row) => (
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          {row.targetId || "Global Platform"}
        </span>
      ),
    },
    {
      key: "contentHash",
      label: "SHA-256 Hash",
      render: (_, row) => (
        <code className={styles.hashBadge} title={row.contentHash}>
          {row.contentHash ? `${row.contentHash.substring(0, 16)}…` : "N/A"}
        </code>
      ),
    },
    {
      key: "actions",
      label: "Forensics",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInspectRecord(row)}
            title="Inspect Payload"
          >
            <Eye size={13} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVerifyChain(row.actorId)}
            title="Verify SHA-256 Hash Chain"
          >
            <ShieldCheck size={13} style={{ color: "var(--color-success)" }} />
          </Button>
        </div>
      ),
    },
  ];

  if (auditList.loading) {
    return (
      <DomainShell domainId="security" title="Audit & Forensics">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="security"
      title="Audit Spine & Forensics"
      description="Cryptographically linked, immutable provider audit trail with SHA-256 hash chaining."
      actions={
        <div className={styles.headerActions}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            disabled={!canExportEvidence}
          >
            <Download size={14} /> Export Forensics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRetentionOpen(true)}
            disabled={!canManageRetention}
          >
            <Trash2 size={14} /> Certified Retention
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => auditList.reload()}
          >
            <RefreshCw size={14} /> Refresh Spine
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={4} />

        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search audit spine by actor, action, target, or content hash..."
          filters={auditFilterConfigs}
          activeFilters={activeFilters}
          onFilterChange={(k, v) => setActiveFilters((prev) => ({ ...prev, [k]: v }))}
          onClearAll={() => {
            setActiveFilters({});
            setSearchQuery("");
          }}
        />

        {auditList.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
            {auditList.error.message}
          </p>
        ) : auditList.data.length === 0 ? (
          <EmptyState
            title="Audit Spine is Empty"
            description="No provider operations have been recorded on the immutable spine."
          />
        ) : (
          <PaginatedTable
            data={filteredRecords}
            columns={columns}
            emptyMessage="No audit logs matched the selected filters."
            keyField="id"
          />
        )}
      </div>

      {/* Certified Retention Modal */}
      <Modal
        open={retentionOpen}
        onClose={() => setRetentionOpen(false)}
        title="Execute Certified Data Retention"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Execute certified, cryptographic retention purge across declared platform data classes per SOC 2 & GDPR policies.
          </p>
          <FormField label="Retention Data Class" required>
            <Select
              value={dataClass}
              onChange={(e) => setDataClass(e.target.value)}
            >
              <option value="AUDIT_LOGS">Audit Logs (AUDIT_LOGS)</option>
              <option value="AUTH_TOKENS">Temporary Auth Tokens (AUTH_TOKENS)</option>
              <option value="DIAGNOSTICS">Ephemeral Diagnostics (DIAGNOSTICS)</option>
            </Select>
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setRetentionOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExecuteRetention}
              disabled={executingRetention}
            >
              {executingRetention ? "Certifying Purge…" : "Execute & Certify"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Export Forensics Modal */}
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Forensic Audit Bundle"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Extract cryptographic evidence bundle directly from the audit spine for incident response and auditor verification.
          </p>
          <FormField label="Inquiry / Forensic Scope" required>
            <Input
              value={auditorQuestion}
              onChange={(e) => setAuditorQuestion(e.target.value)}
              placeholder="e.g. Extract full immutable logs for operator-admin in Q3"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExportForensics}
              disabled={exportingEvidence || !auditorQuestion.trim()}
            >
              {exportingEvidence ? "Packaging Evidence…" : "Export Bundle"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Verify Chain Modal */}
      {verifyTarget && (
        <Modal
          open
          onClose={() => setVerifyTarget(null)}
          title={`Hash Chain Verification: ${verifyTarget}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-2) 0" }}>
            {verifyingChain ? (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-4)" }}>
                <Spinner size="md" />
                <span>Traversing and re-hashing cryptographic chain from Genesis block…</span>
              </div>
            ) : verifyResult ? (
              <div className={styles.chainReportCard}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  {verifyResult.brokenAt !== undefined ? (
                    <ShieldAlert size={20} style={{ color: "var(--color-danger)" }} />
                  ) : (
                    <ShieldCheck size={20} style={{ color: "var(--color-success)" }} />
                  )}
                  <strong>
                    {verifyResult.brokenAt !== undefined
                      ? "Hash Chain Broken / Tampering Detected!"
                      : "Cryptographic Hash Chain Verified Intact"}
                  </strong>
                </div>
                <div>
                  <strong>Records Replayed:</strong> {verifyResult.verified}
                </div>
                {verifyResult.brokenAt !== undefined && (
                  <div style={{ color: "var(--color-danger)" }}>
                    <strong>Broken Link at Sequence:</strong> #{verifyResult.brokenAt}
                  </div>
                )}
              </div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
              <Button variant="outline" onClick={() => setVerifyTarget(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Inspect Payload Modal */}
      {inspectRecord && (
        <Modal
          open
          onClose={() => setInspectRecord(null)}
          title={`Audit Payload: ${inspectRecord.action} (#${inspectRecord.sequenceNum})`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-2) 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", fontSize: "var(--text-xs)" }}>
              <div><strong>Actor:</strong> {inspectRecord.actorId} ({inspectRecord.actorRole})</div>
              <div><strong>Target:</strong> {inspectRecord.targetId || "Global"}</div>
              <div><strong>IP Address:</strong> {inspectRecord.ipAddress || "Internal"}</div>
              <div><strong>Correlation ID:</strong> {inspectRecord.correlationId || "None"}</div>
            </div>
            <div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>
                PREVIOUS SHA-256 LINK:
              </div>
              <code className={styles.hashBadge} style={{ maxWidth: "100%" }}>
                {inspectRecord.previousHash || "(Genesis block — no predecessor)"}
              </code>
            </div>
            <div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>
                CONTENT SHA-256:
              </div>
              <code className={styles.hashBadge} style={{ maxWidth: "100%" }}>
                {inspectRecord.contentHash}
              </code>
            </div>
            <div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>
                RECORD MUTATION DETAILS (JSON):
              </div>
              <pre className={styles.payloadPre}>
                {JSON.stringify(inspectRecord.details ?? {}, null, 2)}
              </pre>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
              <Button variant="outline" onClick={() => setInspectRecord(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DomainShell>
  );
}
