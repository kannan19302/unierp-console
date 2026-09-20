"use client";
/**
 * Security & Compliance → Compliance Posture & Evidence Vault.
 *
 * Real continuous compliance posture computed across SOC 2, ISO 27001, GDPR,
 * HIPAA, and PCI-DSS, with cryptographic evidence artefacts generated directly
 * from the immutable audit spine.
 */
import { useState, useMemo } from "react";
import {
  Scale,
  ShieldCheck,
  ShieldAlert,
  Download,
  FileCheck,
  Zap,
  Eye,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
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
  type ComplianceFramework,
  type ExportedEvidence,
  evidenceFilterConfigs,
} from "@/lib/compliance-schema";
import styles from "./compliance.module.css";

function statusVariant(status: string | undefined): "success" | "warning" | "danger" | "default" {
  const s = (status ?? "").toUpperCase();
  if (s === "COMPLIANT" || s === "PASS" || s === "HEALTHY") return "success";
  if (s === "PARTIAL" || s === "REVIEW" || s === "IN_PROGRESS") return "warning";
  if (s === "NON_COMPLIANT" || s === "FAIL" || s === "BREACHED") return "danger";
  return "default";
}

function progressClass(pct: number) {
  if (pct >= 80) return styles.progressSuccess;
  if (pct >= 50) return styles.progressWarning;
  return styles.progressDanger;
}

export default function SecurityCompliancePage() {
  const toast = useToast();
  const canManage = usePermission("system.compliance.manage");

  const [activeTab, setActiveTab] = useState<"frameworks" | "evidence">("frameworks");
  const [runningMonitoring, setRunningMonitoring] = useState(false);

  // Evidence Export Modal state
  const [exportOpen, setExportOpen] = useState(false);
  const [controlCode, setControlCode] = useState("AUDIT-COMPLETE");
  const [auditorQuestion, setAuditorQuestion] = useState("Provide real audit spine records proving operator immutability.");
  const [exporting, setExporting] = useState(false);

  // Evidence Inspection Modal state
  const [inspectEvidence, setInspectEvidence] = useState<ExportedEvidence | null>(null);

  // Filter & Search states for Evidence Vault
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Frameworks list from backend
  const frameworks = useList<ComplianceFramework>({
    path: "/platform/v1/compliance-controls/frameworks",
  });

  // Evidence artefacts from backend
  const evidenceList = useList<ExportedEvidence>({
    path: "/platform/v1/compliance-controls/evidence",
  });

  const handleRunMonitoring = async () => {
    setRunningMonitoring(true);
    try {
      await api.post("/platform/v1/compliance-controls/monitor");
      await frameworks.reload();
      await evidenceList.reload();
      toast.success("Continuous monitoring completed against the audit spine.", "Monitoring Run Complete");
    } catch {
      toast.error("Could not trigger continuous compliance monitoring.", "Monitoring Run Failed");
    } finally {
      setRunningMonitoring(false);
    }
  };

  const handleExportEvidence = async () => {
    if (!controlCode.trim() || !auditorQuestion.trim()) return;
    setExporting(true);
    try {
      const resp = await api.post<ExportedEvidence>(
        `/platform/v1/compliance-controls/${controlCode.trim().toUpperCase()}/evidence`,
        { auditorQuestion: auditorQuestion.trim() }
      );
      toast.success(
        `Generated cryptographically verifiable bundle with ${resp.data?.recordCount ?? 0} record(s).`,
        "Evidence Exported"
      );
      setExportOpen(false);
      await evidenceList.reload();
      await frameworks.reload();
    } catch {
      toast.error("Failed to generate audit evidence artefact.", "Export Failed");
    } finally {
      setExporting(false);
    }
  };

  // Filtered evidence items
  const filteredEvidence = useMemo(() => {
    return evidenceList.data.filter((ev) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesQ =
          ev.controlCode?.toLowerCase().includes(q) ||
          ev.auditorQuestion?.toLowerCase().includes(q) ||
          ev.generatedBy?.toLowerCase().includes(q) ||
          ev.contentHash?.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }
      if (activeFilters.controlCode && ev.controlCode !== activeFilters.controlCode) {
        return false;
      }
      return true;
    });
  }, [evidenceList.data, searchQuery, activeFilters]);

  // Statistics calculation
  const totalFrameworks = frameworks.data.length;
  const compliantCount = frameworks.data.filter((f) => f.status === "COMPLIANT" || f.coveragePct === 100).length;
  const totalControls = frameworks.data.reduce((acc, f) => acc + (f.controls ?? 0), 0);
  const evidenceCount = evidenceList.data.length;

  const stats: StatCardItem[] = [
    { label: "Active Frameworks", value: totalFrameworks, icon: <Scale size={18} /> },
    { label: "Fully Compliant", value: compliantCount, icon: <ShieldCheck size={18} /> },
    { label: "Mapped Controls", value: totalControls, icon: <FileCheck size={18} /> },
    { label: "Evidence Artefacts", value: evidenceCount, icon: <Download size={18} /> },
  ];

  const evidenceColumns: ColumnDef<ExportedEvidence>[] = [
    {
      key: "controlCode",
      label: "Control Code",
      render: (_, row) => (
        <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>{row.controlCode}</span>
      ),
    },
    {
      key: "auditorQuestion",
      label: "Auditor Inquiry / Scope",
      render: (_, row) => (
        <div style={{ maxWidth: "24rem" }}>
          <div style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{row.auditorQuestion}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Generated by {row.generatedBy}
          </div>
        </div>
      ),
    },
    {
      key: "contentHash",
      label: "Cryptographic SHA-256",
      render: (_, row) => (
        <code className={styles.hashBadge} title={row.contentHash}>
          {row.contentHash ? `${row.contentHash.substring(0, 16)}…` : "N/A"}
        </code>
      ),
    },
    {
      key: "recordCount",
      label: "Spine Records",
      render: (_, row) => (
        <Badge variant={row.recordCount > 0 ? "success" : "warning"}>
          {row.recordCount} records
        </Badge>
      ),
    },
    {
      key: "generatedAt",
      label: "Generated Date",
      render: (_, row) => (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
          {row.generatedAt ? new Date(row.generatedAt).toLocaleString() : "Unknown"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setInspectEvidence(row)}
        >
          <Eye size={14} /> Inspect
        </Button>
      ),
    },
  ];

  if (frameworks.loading || evidenceList.loading) {
    return (
      <DomainShell domainId="security" title="Compliance Posture">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="security"
      title="Compliance & Audit Posture"
      description="Continuous compliance verification over the immutable audit spine with cryptographic evidence export."
      actions={
        <div className={styles.headerActions}>
          <Link href="/security/compliance/controls" style={{ textDecoration: "none" }}>
            <Button variant="outline" size="sm">
              <ExternalLink size={14} /> Control Catalogue
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunMonitoring}
            disabled={runningMonitoring || !canManage}
          >
            <Zap size={14} className={runningMonitoring ? "animate-spin" : ""} />
            {runningMonitoring ? "Evaluating Spine…" : "Run Monitoring"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setExportOpen(true)}
            disabled={!canManage}
          >
            <Download size={14} /> Export Evidence
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={4} />

        <div className={styles.tabs}>
          <button
            type="button"
            data-testid="tab-frameworks"
            className={`${styles.tabButton} ${activeTab === "frameworks" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("frameworks")}
          >
            <Scale size={16} /> Framework Posture
          </button>
          <button
            type="button"
            data-testid="tab-evidence"
            className={`${styles.tabButton} ${activeTab === "evidence" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("evidence")}
          >
            <Download size={16} /> Evidence Vault ({evidenceList.data.length})
          </button>
        </div>

        {activeTab === "frameworks" ? (
          <div>
            {frameworks.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
                {frameworks.error.message}
              </p>
            ) : frameworks.data.length === 0 ? (
              <Card padding="md">
                <EmptyState
                  title="No Frameworks Mapped"
                  description="No compliance frameworks are currently declared in the platform catalogue."
                />
              </Card>
            ) : (
              <div className={styles.frameworkGrid}>
                {frameworks.data.map((fw) => (
                  <div key={fw.id} className={styles.frameworkCard}>
                    <div className={styles.frameworkHeader}>
                      <div>
                        <h3 className={styles.frameworkTitle}>{fw.name}</h3>
                        <div className={styles.frameworkVersion}>{fw.version}</div>
                      </div>
                      <Badge variant={statusVariant(fw.status)}>{fw.status}</Badge>
                    </div>

                    <div className={styles.progressContainer}>
                      <div className={styles.progressLabelRow}>
                        <span>Spine Compliance</span>
                        <strong>{fw.coveragePct}%</strong>
                      </div>
                      <div className={styles.progressTrack}>
                        <div
                          className={`${styles.progressFill} ${progressClass(fw.coveragePct)}`}
                          style={{ width: `${Math.min(100, Math.max(0, fw.coveragePct))}%` }}
                        />
                      </div>
                    </div>

                    <div className={styles.statsRow}>
                      <span>Controls Evaluated</span>
                      <span>
                        <strong>{fw.controlsPassed}</strong> / {fw.controls} passing
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search by control code, inquiry, or SHA-256 hash..."
              filters={evidenceFilterConfigs}
              activeFilters={activeFilters}
              onFilterChange={(k, v) => setActiveFilters((prev) => ({ ...prev, [k]: v }))}
              onClearAll={() => {
                setActiveFilters({});
                setSearchQuery("");
              }}
            />
            <div style={{ marginTop: "var(--space-4)" }}>
              <PaginatedTable
                data={filteredEvidence}
                columns={evidenceColumns}
                emptyMessage="No evidence artefacts exported yet. Click 'Export Evidence' to generate verifiable audit proof."
                keyField="id"
              />
            </div>
          </div>
        )}
      </div>

      {/* Export Evidence Modal */}
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Cryptographic Compliance Evidence"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Extract cryptographic audit records directly from the immutable audit spine with a SHA-256 integrity hash.
          </p>
          <FormField label="Control Code" required>
            <Input
              value={controlCode}
              onChange={(e) => setControlCode(e.target.value)}
              placeholder="e.g. AUDIT-COMPLETE, APPROVAL-TWO-PERSON"
            />
          </FormField>
          <FormField label="Auditor Inquiry / Question" required>
            <Input
              value={auditorQuestion}
              onChange={(e) => setAuditorQuestion(e.target.value)}
              placeholder="e.g. Show proof of two-person control approvals for privileged operations"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExportEvidence}
              disabled={exporting || !controlCode.trim() || !auditorQuestion.trim()}
            >
              {exporting ? "Generating Artefact…" : "Generate Evidence"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Inspect Evidence Modal */}
      {inspectEvidence && (
        <Modal
          open
          onClose={() => setInspectEvidence(null)}
          title={`Evidence Bundle: ${inspectEvidence.controlCode}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-2) 0" }}>
            <div className={styles.artefactCard}>
              <div><strong>Auditor Question:</strong> {inspectEvidence.auditorQuestion}</div>
              <div><strong>Exported By:</strong> {inspectEvidence.generatedBy}</div>
              <div><strong>Generated At:</strong> {inspectEvidence.generatedAt ? new Date(inspectEvidence.generatedAt).toLocaleString() : "Unknown"}</div>
              <div><strong>Spine Records Packaged:</strong> {inspectEvidence.recordCount}</div>
              <div>
                <strong>Cryptographic SHA-256:</strong>
                <div style={{ marginTop: "var(--space-1)" }}>
                  <code className={styles.hashBadge} style={{ maxWidth: "100%" }}>
                    {inspectEvidence.contentHash}
                  </code>
                </div>
              </div>
            </div>
            {inspectEvidence.artefact?.records && (
              <div>
                <h4 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  SAMPLE AUDIT RECORDS
                </h4>
                <pre
                  style={{
                    maxHeight: "12rem",
                    overflowY: "auto",
                    background: "var(--color-surface)",
                    border: "0.0625rem solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-3)",
                    fontSize: "var(--text-xs)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {JSON.stringify(inspectEvidence.artefact.records, null, 2)}
                </pre>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
              <Button variant="outline" onClick={() => setInspectEvidence(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DomainShell>
  );
}