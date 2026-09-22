"use client";

import { useState } from "react";
import { Eye, FilePlus2, Play, RefreshCw, Send, Trash2 } from "lucide-react";
import { Badge, Button, FormField, Input, Modal, usePermission, useToast } from "@kannan19302/ui";
import { DataWorkspace } from "@kannan19302/ui/shell";
import DomainShell from "@/components/domain-shell";
import { CrudDrawer } from "@/components/CrudDrawer";
import { api } from "@/lib/api";
import { useList } from "@/lib/data";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import {
  runbookAuthorSchema,
  runbookFields,
  runbookFilters,
  type RunbookRecord,
} from "@/lib/ops-schema";
import styles from "./automation.module.css";

type DryRunEvidence = { state: "passed"; planCount: number | null } | { state: "failed" };

const formatDate = (value: unknown): string => {
  if (typeof value !== "string" || !value) return "Not reported";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Invalid timestamp" : date.toLocaleString();
};

const statusVariant = (status: string): "success" | "warning" | "default" => {
  if (status === "PUBLISHED") return "success";
  if (status === "DRAFT") return "warning";
  return "default";
};

export default function OpsAutomation() {
  const toast = useToast();
  const canManage = usePermission("system.runbook.manage");
  const runbooks = useList<RunbookRecord>({ path: "/platform/v1/runbooks" });

  useDomainRealtime("runbook", () => void runbooks.reload());

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRunbook, setSelectedRunbook] = useState<RunbookRecord | null>(null);
  const [policyName, setPolicyName] = useState("");
  const [decommissionConfirmed, setDecommissionConfirmed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dryRunningId, setDryRunningId] = useState<string | null>(null);
  const [dryRunEvidence, setDryRunEvidence] = useState<Record<string, DryRunEvidence>>({});

  const allRunbooks = runbooks.data;
  const publishedCount = allRunbooks.filter((runbook) => runbook.status === "PUBLISHED").length;
  const draftCount = allRunbooks.filter((runbook) => runbook.status === "DRAFT").length;
  const validatedCount = Object.values(dryRunEvidence).filter((evidence) => evidence.state === "passed").length;

  const openInspect = (runbook: RunbookRecord) => {
    setSelectedRunbook(runbook);
    setInspectModalOpen(true);
  };

  const openPublish = (runbook: RunbookRecord) => {
    setSelectedRunbook(runbook);
    setPolicyName("");
    setPublishModalOpen(true);
  };

  const openDelete = (runbook: RunbookRecord) => {
    setSelectedRunbook(runbook);
    setDecommissionConfirmed(false);
    setDeleteModalOpen(true);
  };

  const handleAuthorRunbook = async (formData: Record<string, unknown>) => {
    try {
      const steps = JSON.parse(String(formData.stepsJson));
      await api.post("/platform/v1/runbooks", { name: formData.name, steps });
      toast.success("Runbook drafted", `${String(formData.name)} is ready for dry-run validation.`);
      setCreateDrawerOpen(false);
      await runbooks.reload();
    } catch {
      toast.error("Runbook not drafted", "The authoring request was not accepted.");
    }
  };

  const handleDryRun = async (runbook: RunbookRecord) => {
    setDryRunningId(runbook.id);
    try {
      const response = await api.get<unknown[]>(`/platform/v1/runbooks/${runbook.id}/dry-run`);
      const planCount = Array.isArray(response.data) ? response.data.length : null;
      setDryRunEvidence((current) => ({ ...current, [runbook.id]: { state: "passed", planCount } }));
      toast.success("Dry run passed", planCount === null ? "The validation service accepted every step." : `${planCount} plan${planCount === 1 ? "" : "s"} validated without execution.`);
    } catch {
      setDryRunEvidence((current) => ({ ...current, [runbook.id]: { state: "failed" } }));
      toast.error("Dry run failed", `Validation failed for ${runbook.name}.`);
    } finally {
      setDryRunningId(null);
    }
  };

  const handlePublish = async () => {
    if (!selectedRunbook || !policyName.trim()) return;
    setPublishing(true);
    try {
      await api.post(`/platform/v1/runbooks/${selectedRunbook.id}/publish`, { policyName: policyName.trim() });
      toast.success("Runbook published", `${selectedRunbook.name} passed policy ${policyName.trim()}.`);
      setPublishModalOpen(false);
      await runbooks.reload();
    } catch {
      toast.error("Publication refused", "The policy evaluation did not permit publication.");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRunbook || !decommissionConfirmed) return;
    setDeleting(true);
    try {
      await api.del(`/platform/v1/runbooks/${selectedRunbook.id}`);
      toast.success("Runbook decommissioned", `${selectedRunbook.name} was removed.`);
      setDeleteModalOpen(false);
      await runbooks.reload();
    } catch {
      toast.error("Runbook not decommissioned", "The decommission request did not complete.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DomainShell
      domainId="ops"
      title="Automation"
      description="Author, validate and publish versioned operational runbooks. Execution remains incident-bound and dual-controlled."
      actions={
        <div className={styles.headerActions}>
          <Button size="sm" variant="outline" disabled={runbooks.loading} onClick={() => void runbooks.reload()}>
            <RefreshCw size={14} aria-hidden="true" />Refresh runbooks
          </Button>
          {canManage && (
            <Button size="sm" variant="primary" onClick={() => setCreateDrawerOpen(true)}>
              <FilePlus2 size={14} aria-hidden="true" />Draft runbook
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.container}>
        <section className={styles.automationLedger} aria-label="Runbook register summary">
          <div><span>Runbooks reported</span><strong>{runbooks.loading || runbooks.error ? "Unknown" : allRunbooks.length.toLocaleString()}</strong></div>
          <div><span>Published</span><strong>{runbooks.loading || runbooks.error ? "Unknown" : publishedCount.toLocaleString()}</strong></div>
          <div><span>Drafts</span><strong>{runbooks.loading || runbooks.error ? "Unknown" : draftCount.toLocaleString()}</strong></div>
          <div><span>Validated this session</span><strong>{validatedCount.toLocaleString()}</strong></div>
        </section>

        <section className={styles.registerPanel} aria-labelledby="runbook-register-heading">
          <div className={styles.panelHeader}>
            <div><h2 id="runbook-register-heading">Runbook register</h2><p>Source-reported definitions and session validation evidence.</p></div>
          </div>
          <DataWorkspace<RunbookRecord>
            data={allRunbooks}
            loading={runbooks.loading}
            getRowId={(runbook) => runbook.id}
            searchPlaceholder="Search runbooks…"
            searchableFields={["id", "name", "status"]}
            filters={runbookFilters.map((filter) => ({ key: filter.key, label: filter.label, options: filter.options }))}
            error={runbooks.error ? <p role="alert" className={styles.sourceError}>{runbooks.error.message}</p> : undefined}
            emptyTitle={runbooks.error ? "Runbook source unavailable" : "No runbooks reported"}
            emptyDescription="Draft a runbook when an operational procedure is ready to be defined and reviewed."
            columns={[
              {
                key: "name",
                header: "Runbook",
                render: (value, row) => <><span className={styles.recordTitle}>{String(value ?? "Unnamed runbook")}</span><span className={styles.recordDetail}>{row.id} / Version {row.version ?? "unknown"}</span></>,
              },
              { key: "status", header: "Status", render: (value) => <Badge variant={statusVariant(String(value ?? ""))}>{String(value ?? "UNKNOWN")}</Badge> },
              { key: "steps", header: "Steps", align: "right", render: (value) => Array.isArray(value) ? value.length.toLocaleString() : "Unknown" },
              { key: "createdAt", header: "Created", render: formatDate },
              {
                key: "validation",
                header: "Session validation",
                render: (_value, row) => {
                  const evidence = dryRunEvidence[row.id];
                  if (!evidence) return <span className={styles.mutedValue}>Not run</span>;
                  if (evidence.state === "failed") return <Badge variant="danger">FAILED</Badge>;
                  return <Badge variant="success">{evidence.planCount === null ? "PASSED" : `${evidence.planCount} ${evidence.planCount === 1 ? "PLAN" : "PLANS"}`}</Badge>;
                },
              },
              {
                key: "actions",
                header: "Actions",
                align: "right",
                render: (_value, row) => (
                  <div className={styles.actionRow}>
                    <Button size="sm" variant="ghost" onClick={() => openInspect(row)}><Eye size={13} aria-hidden="true" />Inspect</Button>
                    <Button size="sm" variant="outline" onClick={() => void handleDryRun(row)} disabled={dryRunningId === row.id}><Play size={13} aria-hidden="true" />{dryRunningId === row.id ? "Validating…" : "Dry run"}</Button>
                    {canManage && row.status === "DRAFT" && <Button size="sm" variant="primary" onClick={() => openPublish(row)}><Send size={13} aria-hidden="true" />Publish</Button>}
                    {canManage && <Button size="sm" variant="ghost" onClick={() => openDelete(row)} aria-label={`Decommission ${row.name}`}><Trash2 size={13} aria-hidden="true" />Decommission</Button>}
                  </div>
                ),
              },
            ]}
          />
        </section>

        <CrudDrawer
          isOpen={createDrawerOpen}
          onClose={() => setCreateDrawerOpen(false)}
          title="Draft runbook"
          description="Define ordered resource transitions. The draft must pass a dry run and policy review before publication."
          fields={runbookFields}
          schema={runbookAuthorSchema}
          initialData={{ name: "", stepsJson: "" }}
          onSubmit={handleAuthorRunbook}
          mode="create"
        />

        <Modal className={styles.commandModal} open={inspectModalOpen} onClose={() => setInspectModalOpen(false)} title={selectedRunbook ? `Runbook steps: ${selectedRunbook.name}` : "Runbook steps"}>
          <div className={styles.stepInspector}>
            {selectedRunbook?.steps.length ? selectedRunbook.steps.map((step, index) => (
              <section key={`${step.resourceId}-${index}`} className={styles.stepRecord} aria-label={`Step ${index + 1}`}>
                <div className={styles.stepIndex}>{index + 1}</div>
                <div className={styles.stepBody}><span>Target resource</span><strong>{step.resourceId || "Not reported"}</strong><pre>{JSON.stringify(step.proposedState, null, 2)}</pre></div>
              </section>
            )) : <p className={styles.emptySteps}>No steps were reported for this runbook.</p>}
          </div>
        </Modal>

        <Modal className={styles.commandModal} open={publishModalOpen} onClose={() => !publishing && setPublishModalOpen(false)} title="Publish runbook">
          <div className={styles.commandDialog}>
            <p>Evaluate every proposed state against the selected platform policy before changing this draft to published.</p>
            <dl>
              <div><dt>Runbook</dt><dd>{selectedRunbook?.name ?? "Unavailable"}</dd></div>
              <div><dt>Version</dt><dd>{selectedRunbook?.version ?? "Unknown"}</dd></div>
              <div><dt>Steps</dt><dd>{selectedRunbook?.steps.length ?? "Unknown"}</dd></div>
            </dl>
            <FormField label="Policy name" required><Input value={policyName} onChange={(event) => setPolicyName(event.target.value)} placeholder="Enter a registered platform policy" /></FormField>
            <p className={styles.fieldHint}>Publication is refused if any step breaches this policy.</p>
            <div className={styles.dialogActions}><Button variant="ghost" disabled={publishing} onClick={() => setPublishModalOpen(false)}>Cancel</Button><Button variant="primary" disabled={publishing || !policyName.trim()} onClick={() => void handlePublish()}>{publishing ? "Evaluating…" : "Evaluate and publish"}</Button></div>
          </div>
        </Modal>

        <Modal className={styles.commandModal} open={deleteModalOpen} onClose={() => !deleting && setDeleteModalOpen(false)} title="Decommission runbook">
          <div className={styles.commandDialog}>
            <p>Remove this runbook from the provider register. This action cannot be undone from the console.</p>
            <dl>
              <div><dt>Runbook</dt><dd>{selectedRunbook?.name ?? "Unavailable"}</dd></div>
              <div><dt>Status</dt><dd>{selectedRunbook?.status ?? "Unknown"}</dd></div>
              <div><dt>Identifier</dt><dd>{selectedRunbook?.id ?? "Unknown"}</dd></div>
            </dl>
            <label className={styles.confirmCheck}><input type="checkbox" checked={decommissionConfirmed} onChange={(event) => setDecommissionConfirmed(event.target.checked)} /><span>I understand this removes the runbook definition and cannot be undone here.</span></label>
            <div className={styles.dialogActions}><Button variant="ghost" disabled={deleting} onClick={() => setDeleteModalOpen(false)}>Cancel</Button><Button variant="danger" disabled={deleting || !decommissionConfirmed} onClick={() => void handleDelete()}>{deleting ? "Decommissioning…" : "Decommission runbook"}</Button></div>
          </div>
        </Modal>
      </div>
    </DomainShell>
  );
}
