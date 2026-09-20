"use client";
/**
 * Security & Compliance → Compliance Control Catalogue.
 *
 * Continuous monitoring of individual compliance controls across frameworks,
 * automated spine evaluation, custom control lifecycle management, and evidence export.
 */
import { useState, useMemo } from "react";
import {
  ClipboardCheck,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Plus,
  Zap,
  Download,
  Edit2,
  Trash2,
  Play,
  ArrowLeft,
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
import { CrudDrawer } from "@/components/CrudDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  type ComplianceControl,
  createControlSchema,
  createControlFieldDefs,
  editControlSchema,
  editControlFieldDefs,
  controlFilterConfigs,
} from "@/lib/compliance-schema";

function statusVariant(status: ComplianceControl["status"]): "success" | "danger" | "default" {
  if (status === "PASS") return "success";
  if (status === "FAIL") return "danger";
  return "default";
}

function statusLabel(status: ComplianceControl["status"]) {
  if (status === "PASS") return "PASS";
  if (status === "FAIL") return "FAIL";
  return "NOT RUN";
}

export default function SecurityComplianceControlsPage() {
  const toast = useToast();
  const canManage = usePermission("system.compliance.manage");

  const controls = useList<ComplianceControl>({
    path: "/platform/v1/compliance-controls",
  });

  const [monitoring, setMonitoring] = useState(false);
  const [evaluatingCode, setEvaluatingCode] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // CRUD Drawer states
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [selectedControl, setSelectedControl] = useState<ComplianceControl | null>(null);

  // Delete Confirm Dialog
  const [deleteTarget, setDeleteTarget] = useState<ComplianceControl | null>(null);

  // Evidence Export Modal state
  const [exportTarget, setExportTarget] = useState<ComplianceControl | null>(null);
  const [auditorQuestion, setAuditorQuestion] = useState("");
  const [exporting, setExporting] = useState(false);

  // Stats calculation
  const passing = controls.data.filter((c) => c.status === "PASS").length;
  const failing = controls.data.filter((c) => c.status === "FAIL").length;
  const notRun = controls.data.filter((c) => c.status !== "PASS" && c.status !== "FAIL").length;

  const stats: StatCardItem[] = [
    { label: "Total Controls", value: controls.data.length, icon: <ClipboardCheck size={18} /> },
    { label: "Passing (Compliant)", value: passing, icon: <ShieldCheck size={18} /> },
    { label: "Failing (Non-Compliant)", value: failing, icon: <ShieldAlert size={18} /> },
    { label: "Not Evaluated", value: notRun, icon: <Activity size={18} /> },
  ];

  // Run all controls monitoring
  const handleRunMonitoring = async () => {
    setMonitoring(true);
    try {
      await api.post("/platform/v1/compliance-controls/monitor");
      await controls.reload();
      toast.success("Continuous monitoring completed over all active controls.", "Monitoring Pass Complete");
    } catch {
      toast.error("Could not run continuous compliance monitoring.", "Monitoring Failed");
    } finally {
      setMonitoring(false);
    }
  };

  // Evaluate single control
  const handleEvaluateSingle = async (code: string) => {
    setEvaluatingCode(code);
    try {
      const resp = await api.post<ComplianceControl>(`/platform/v1/compliance-controls/${code}/evaluate`);
      await controls.reload();
      if (resp.data?.status === "PASS") {
        toast.success(`Control ${code} PASSED with ${resp.data.observed ?? 0} spine records.`, "Evaluation Passed");
      } else {
        toast.error(`Control ${code} FAILED: ${resp.data?.finding ?? "Missing required records."}`, "Evaluation Failed");
      }
    } catch {
      toast.error(`Failed to evaluate control ${code}.`, "Evaluation Error");
    } finally {
      setEvaluatingCode(null);
    }
  };

  // Export evidence
  const handleExportEvidence = async () => {
    if (!exportTarget || !auditorQuestion.trim()) return;
    setExporting(true);
    try {
      await api.post(`/platform/v1/compliance-controls/${exportTarget.code}/evidence`, {
        auditorQuestion: auditorQuestion.trim(),
      });
      toast.success(`Cryptographic evidence generated for ${exportTarget.code}.`, "Evidence Generated");
      setExportTarget(null);
      setAuditorQuestion("");
    } catch {
      toast.error("Failed to generate compliance evidence bundle.", "Export Failed");
    } finally {
      setExporting(false);
    }
  };

  // Create control submit
  const handleCreateSubmit = async (data: Record<string, unknown>) => {
    try {
      await api.post("/platform/v1/compliance-controls", data);
      toast.success(`Control ${String(data.code)} registered successfully.`, "Control Created");
      setDrawerMode(null);
      await controls.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register control";
      toast.error(msg, "Creation Failed");
      throw err;
    }
  };

  // Edit control submit
  const handleEditSubmit = async (data: Record<string, unknown>) => {
    if (!selectedControl) return;
    try {
      await api.patch(`/platform/v1/compliance-controls/${selectedControl.code}`, data);
      toast.success(`Control ${selectedControl.code} updated successfully.`, "Control Updated");
      setDrawerMode(null);
      setSelectedControl(null);
      await controls.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update control";
      toast.error(msg, "Update Failed");
      throw err;
    }
  };

  // Delete control submit
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.del(`/platform/v1/compliance-controls/${deleteTarget.code}`);
      toast.success(`Custom control ${deleteTarget.code} removed.`, "Control Deleted");
      setDeleteTarget(null);
      await controls.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cannot delete control";
      toast.error(msg, "Deletion Failed");
    }
  };

  // Filter & search controls
  const filteredControls = useMemo(() => {
    return controls.data.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesQ =
          c.code.toLowerCase().includes(q) ||
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.frameworks?.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }
      if (activeFilters.status) {
        if (activeFilters.status === "NOT_RUN") {
          if (c.status === "PASS" || c.status === "FAIL") return false;
        } else if (c.status !== activeFilters.status) {
          return false;
        }
      }
      if (activeFilters.framework) {
        if (!c.frameworks?.toUpperCase().includes(activeFilters.framework.toUpperCase())) {
          return false;
        }
      }
      return true;
    });
  }, [controls.data, searchQuery, activeFilters]);

  const columns: ColumnDef<ComplianceControl>[] = [
    {
      key: "code",
      label: "Control Code",
      render: (_, row) => (
        <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{row.code}</span>
      ),
    },
    {
      key: "title",
      label: "Control Objective & Procedure",
      render: (_, row) => (
        <div style={{ maxWidth: "22rem" }}>
          <div style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{row.title}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "var(--space-0-5)" }}>
            {row.description}
          </div>
          {row.finding && (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: "var(--space-1)", fontWeight: 500 }}>
              Finding: {row.finding}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "frameworks",
      label: "Framework Mappings",
      render: (_, row) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)", maxWidth: "12rem" }}>
          {row.frameworks?.split(",").map((f: string) => (
            <Badge key={f} variant="default">
              {f.trim()}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, row) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-0-5)" }}>
          <Badge variant={statusVariant(row.status)}>{statusLabel(row.status)}</Badge>
          {row.observed != null && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              {row.observed} spine record(s)
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const isBuiltin = ["AUDIT-COMPLETE", "APPROVAL-TWO-PERSON", "SEPARATION-OF-DUTIES", "IMMUTABLE-LEDGER"].includes(row.code);
        const isEvaluating = evaluatingCode === row.code;

        return (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEvaluateSingle(row.code)}
              disabled={isEvaluating || !canManage}
              title="Evaluate this control against audit spine"
            >
              <Play size={13} className={isEvaluating ? "animate-spin" : ""} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setExportTarget(row);
                setAuditorQuestion(`Provide audit spine records for ${row.code}`);
              }}
              title="Export Cryptographic Evidence"
            >
              <Download size={13} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedControl(row);
                setDrawerMode("edit");
              }}
              disabled={!canManage}
              title="Edit Control"
            >
              <Edit2 size={13} />
            </Button>
            {!isBuiltin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(row)}
                disabled={!canManage}
                title="Delete Custom Control"
              >
                <Trash2 size={13} style={{ color: "var(--color-danger)" }} />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (controls.loading) {
    return (
      <DomainShell domainId="security" title="Compliance Controls">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="security"
      title="Compliance Control Catalogue"
      description="Continuous compliance verification over the audit spine. Failing controls are caught before an audit."
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Link href="/security/compliance" style={{ textDecoration: "none" }}>
            <Button variant="outline" size="sm">
              <ArrowLeft size={14} /> Back to Overview
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunMonitoring}
            disabled={monitoring || !canManage}
          >
            <Zap size={14} className={monitoring ? "animate-spin" : ""} />
            {monitoring ? "Evaluating All…" : "Run Monitoring"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setDrawerMode("create")}
            disabled={!canManage}
          >
            <Plus size={14} /> Register Control
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", padding: "var(--space-4)" }}>
        <StatCardRow stats={stats} columns={4} />

        {failing > 0 && (
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-danger)" }}>
              <ShieldAlert size={16} /> {failing} Failing Control(s) Detected
            </h3>
            <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              These controls failed continuous monitoring against the real audit spine and require remediation before external certification.
            </p>
          </Card>
        )}

        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search controls by code, title, framework..."
          filters={controlFilterConfigs}
          activeFilters={activeFilters}
          onFilterChange={(k, v) => setActiveFilters((prev) => ({ ...prev, [k]: v }))}
          onClearAll={() => {
            setActiveFilters({});
            setSearchQuery("");
          }}
        />

        {controls.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
            {controls.error.message}
          </p>
        ) : controls.data.length === 0 ? (
          <EmptyState
            title="No Compliance Controls Found"
            description="No controls have been registered in the platform compliance catalogue."
          />
        ) : (
          <PaginatedTable
            data={filteredControls}
            columns={columns}
            emptyMessage="No compliance controls match the selected filters."
            keyField="code"
          />
        )}
      </div>

      {/* Register Control Drawer */}
      <CrudDrawer
        open={drawerMode === "create"}
        mode="create"
        title="Register Compliance Control"
        schema={createControlSchema}
        fields={createControlFieldDefs}
        onSubmit={handleCreateSubmit}
        onClose={() => setDrawerMode(null)}
      />

      {/* Edit Control Drawer */}
      <CrudDrawer
        open={drawerMode === "edit"}
        mode="edit"
        title={`Edit Control: ${selectedControl?.code}`}
        schema={editControlSchema}
        fields={editControlFieldDefs}
        initialData={
          selectedControl
            ? {
                title: selectedControl.title,
                frameworks: selectedControl.frameworks,
                description: selectedControl.description,
              }
            : undefined
        }
        onSubmit={handleEditSubmit}
        onClose={() => {
          setDrawerMode(null);
          setSelectedControl(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete Control ${deleteTarget?.code}`}
        message={`Are you sure you want to delete custom control "${deleteTarget?.title}"? This action will remove continuous evaluation for this rule.`}
        confirmLabel="Delete Control"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Evidence Export Modal */}
      {exportTarget && (
        <Modal
          open
          onClose={() => setExportTarget(null)}
          title={`Export Evidence: ${exportTarget.code}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              Extract verifiable audit records matching control <strong>{exportTarget.code}</strong> with SHA-256 integrity hashing.
            </p>
            <FormField label="Auditor Inquiry / Question" required>
              <Input
                value={auditorQuestion}
                onChange={(e) => setAuditorQuestion(e.target.value)}
                placeholder="e.g. Provide evidence of two-person control approvals"
              />
            </FormField>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button variant="outline" onClick={() => setExportTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleExportEvidence}
                disabled={exporting || !auditorQuestion.trim()}
              >
                {exporting ? "Generating Artefact…" : "Generate Evidence"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DomainShell>
  );
}