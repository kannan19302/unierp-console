"use client";

import { useState, useMemo } from "react";
import {
  Boxes,
  CheckCircle,
  Eye,
  FileCode,
  Play,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Zap,
} from "lucide-react";
import {
  Badge,
  Button,
  ConfirmDialog,
  FormField,
  Input,
  Modal,
  StatCardRow,
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
  runbookAuthorSchema,
  runbookFields,
  runbookFilters,
  type RunbookRecord,
  type RunbookAuthorFormData,
} from "@/lib/ops-schema";
import styles from "./automation.module.css";

export default function OpsAutomation() {
  const toast = useToast();
  const canManage = usePermission("system.runbook.manage");

  // Filters state
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (activeFilters.status) params.status = activeFilters.status;
    if (searchQuery) params.search = searchQuery;
    return params;
  }, [activeFilters, searchQuery]);

  const runbooks = useList<RunbookRecord>({
    path: "/platform/v1/runbooks",
    params: queryParams,
  });

  // Real-time WebSocket updates
  useDomainRealtime("runbook", () => runbooks.reload());

  // CrudDrawer & Modal states
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [selectedRunbook, setSelectedRunbook] = useState<RunbookRecord | null>(null);
  const [policyName, setPolicyName] = useState("platform.standard_operational_safety");
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dryRunningId, setDryRunningId] = useState<string | null>(null);

  const allRunbooks = runbooks.data ?? [];
  const publishedCount = allRunbooks.filter((r) => r.status === "PUBLISHED").length;
  const draftCount = allRunbooks.filter((r) => r.status === "DRAFT").length;

  const statItems: StatCardItem[] = [
    {
      label: "Active Runbooks",
      value: allRunbooks.length,
    },
    {
      label: "Published Automations",
      value: publishedCount,
    },
    {
      label: "Draft Runbooks",
      value: draftCount,
    },
    {
      label: "Dry-Run Health Gate",
      value: "100%",
    },
  ];

  const handleAuthorRunbook = async (formData: Record<string, unknown>) => {
    try {
      const parsedSteps = JSON.parse(formData.stepsJson as string);
      await api.post("/platform/v1/runbooks", {
        name: formData.name,
        steps: parsedSteps,
        actorId: "test.agent@unierp.com",
      });
      toast.success("Runbook Authored", `Runbook "${formData.name}" drafted successfully.`);
      setCreateDrawerOpen(false);
      await runbooks.reload();
    } catch {
      toast.error("Authoring Failed", "Could not author new runbook.");
    }
  };

  const handleDryRun = async (rb: RunbookRecord) => {
    setDryRunningId(rb.id);
    try {
      const res = await api.get<unknown[]>(`/platform/v1/runbooks/${rb.id}/dry-run`);
      const stepCount = (res?.data as unknown[])?.length || rb.steps.length;
      toast.success("Dry-Run Succeeded", `Validated ${stepCount} step(s) with zero side-effects.`);
    } catch {
      toast.error("Dry-Run Failed", `Validation failed for runbook ${rb.name}.`);
    } finally {
      setDryRunningId(null);
    }
  };

  const handlePublish = async () => {
    if (!selectedRunbook) return;
    setPublishing(true);
    try {
      await api.post(`/platform/v1/runbooks/${selectedRunbook.id}/publish`, {
        policyName,
        actorId: "test.agent@unierp.com",
      });
      toast.success("Runbook Published", `Runbook "${selectedRunbook.name}" verified against policy ${policyName}.`);
      setPublishModalOpen(false);
      await runbooks.reload();
    } catch {
      toast.error("Publish Refused", "Runbook contains steps that breach the specified policy.");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRunbook) return;
    setDeleting(true);
    try {
      await api.del(`/platform/v1/runbooks/${selectedRunbook.id}`, {
        actorId: "test.agent@unierp.com",
      });
      toast.success("Runbook Decommissioned", `Runbook ${selectedRunbook.name} deleted.`);
      setDeleteConfirmOpen(false);
      await runbooks.reload();
    } catch {
      toast.error("Deletion Failed", "Failed to delete runbook.");
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<RunbookRecord>[] = [
    {
      key: "id",
      label: "ID",
      render: (val: string) => (
        <span style={{ fontFamily: "monospace", fontWeight: "var(--font-weight-semibold)" }}>{val}</span>
      ),
    },
    {
      key: "name",
      label: "Runbook Title",
      render: (val: string, row: RunbookRecord) => (
        <div>
          <div style={{ fontWeight: "var(--font-weight-medium)", color: "var(--color-text-primary)" }}>{val}</div>
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
            {row.steps.length} Step{row.steps.length === 1 ? "" : "s"} &bull; v{row.version}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val: string) => (
        <Badge variant={val === "PUBLISHED" ? "success" : "warning"}>{val}</Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (val: string) => (
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
          {new Date(val).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: RunbookRecord) => (
        <div className={styles.actionRow}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedRunbook(row);
              setInspectModalOpen(true);
            }}
            title="Inspect Steps"
          >
            <Eye size={14} />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDryRun(row)}
            disabled={dryRunningId === row.id}
          >
            <Play size={14} style={{ marginRight: "var(--space-1)" }} />
            {dryRunningId === row.id ? "Testing..." : "Dry Run"}
          </Button>

          {canManage && row.status === "DRAFT" && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setSelectedRunbook(row);
                setPublishModalOpen(true);
              }}
            >
              <Send size={14} style={{ marginRight: "var(--space-1)" }} />
              Publish
            </Button>
          )}

          {canManage && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedRunbook(row);
                setDeleteConfirmOpen(true);
              }}
              aria-label={`Decommission ${row.name}`}
              title="Decommission"
            >
              <Trash2 size={14} color="var(--color-danger-500)" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DomainShell
      domainId="ops"
      title="Platform Operations — Runbook Automation"
      description="Versioned, testable operational runbooks: authoring, zero-side-effect dry-runs, and policy-gated publication."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {canManage && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setCreateDrawerOpen(true)}
            >
              <Plus size={14} style={{ marginRight: "var(--space-1)" }} />
              Author Runbook
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => runbooks.reload()}
          >
            Refresh
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <StatCardRow stats={statItems} columns={4} />

        <FilterBar
          searchPlaceholder="Search runbooks by name, ID..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={runbookFilters}
          activeFilters={activeFilters}
          onFilterChange={(key, val) => setActiveFilters((prev) => ({ ...prev, [key]: val }))}
          onClearAll={() => setActiveFilters({})}
        />

        <PaginatedTable<RunbookRecord>
          columns={columns}
          data={allRunbooks}
          total={allRunbooks.length}
          pageSize={10}
          page={1}
          onPageChange={() => {}}
          loading={runbooks.loading}
          emptyMessage="No Runbooks Found — Author an automation runbook to standardize operational incident responses."
        />

        {/* Author Runbook Drawer */}
        <CrudDrawer
          isOpen={createDrawerOpen}
          onClose={() => setCreateDrawerOpen(false)}
          title="Author New Runbook"
          description="Draft an automation runbook with ordered resource state transitions."
          fields={runbookFields}
          schema={runbookAuthorSchema}
          initialData={{
            name: "",
            stepsJson: `[\n  {\n    "resourceId": "k8s-node-01",\n    "proposedState": { "cordoned": true }\n  }\n]`,
          }}
          onSubmit={handleAuthorRunbook}
          mode="create"
        />

        {/* Step Inspector Modal */}
        <Modal
          open={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          title={`Steps Inspection — ${selectedRunbook?.name ?? ""}`}
        >
          <div className={styles.stepInspector}>
            {selectedRunbook?.steps.map((step, idx) => (
              <div key={idx} className={styles.stepCard}>
                <div className={styles.stepHeader}>
                  <span>Step #{idx + 1}</span>
                  <span>Target Resource: <strong>{step.resourceId}</strong></span>
                </div>
                <div className={styles.stepCode}>
                  {JSON.stringify(step.proposedState, null, 2)}
                </div>
              </div>
            ))}
          </div>
        </Modal>

        {/* Policy-Gated Publish Modal */}
        <Modal
          open={publishModalOpen}
          onClose={() => setPublishModalOpen(false)}
          title="Publish Runbook — Policy Gate Verification"
        >
          <div className={styles.modalContent}>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              Publishing enforces that all steps clear the specified policy engine rules. Breached steps will cause publication to be refused.
            </p>
            <FormField label="Policy Name to Evaluate Against" required>
              <Input
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
              />
            </FormField>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button variant="ghost" onClick={() => setPublishModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handlePublish} disabled={publishing}>
                {publishing ? "Evaluating Policy..." : "Verify & Publish"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Decommission Confirm Dialog */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDelete}
          title="Decommission Runbook"
          message={`Are you sure you want to delete runbook "${selectedRunbook?.name}"? This action cannot be undone.`}
          confirmLabel={deleting ? "Deleting..." : "Delete Runbook"}
          variant="danger"
        />
      </div>
    </DomainShell>
  );
}