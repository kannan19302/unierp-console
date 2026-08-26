"use client";
/**
 * Ops → Automation.
 *
 * Automation rules / workflows configured on the platform from the operations
 * API and Runbooks engine. Real reads with honest loading/error/empty states.
 */
import { useState } from "react";
import { Workflow, Zap, Boxes, CircleCheck, Play, Plus, RefreshCw, Eye } from "lucide-react";
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
  Textarea,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";

interface AutomationRule {
  id?: string;
  name?: string;
  description?: string;
  trigger?: string;
  action?: string;
  enabled?: boolean;
  status?: string;
}

interface RunbookRow {
  id?: string;
  name?: string;
  version?: number;
  status?: string;
  steps?: Array<{ resourceId: string; proposedState: Record<string, unknown> }>;
  createdAt?: string;
}

function isEnabled(r: AutomationRule): boolean {
  if (r.enabled != null) return r.enabled;
  return (r.status ?? "").toUpperCase() === "ENABLED";
}

export default function OpsAutomation() {
  const toast = useToast();
  const canManage = usePermission("system.runbook.manage");

  const rules = useList<AutomationRule>({ path: "/platform/v1/operations/automation" });
  const runbooks = useList<RunbookRow>({ path: "/platform/v1/runbooks" });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [runbookName, setRunbookName] = useState("");
  const [runbookStepsJson, setRunbookStepsJson] = useState(`[\n  {\n    "resourceId": "res-db-primary",\n    "proposedState": { "replicaCount": 3 }\n  }\n]`);
  const [creating, setCreating] = useState(false);

  const [executingId, setExecutingId] = useState<string | null>(null);

  const handleCreateRunbook = async () => {
    setCreating(true);
    try {
      let parsedSteps = [];
      try {
        parsedSteps = JSON.parse(runbookStepsJson);
      } catch {
        toast.error("Invalid JSON", "Please ensure the steps field contains valid JSON array.");
        setCreating(false);
        return;
      }
      await api.post("/platform/v1/runbooks", {
        name: runbookName,
        steps: parsedSteps,
      });
      await runbooks.reload();
      toast.success("Runbook Created", `Runbook "${runbookName}" drafted successfully.`);
      setCreateModalOpen(false);
      setRunbookName("");
    } catch {
      toast.error("Creation Failed", "Could not author new runbook.");
    } finally {
      setCreating(false);
    }
  };

  const handleDryRun = async (id: string, name?: string) => {
    try {
      const res = await api.get<{ valid?: boolean; stepCount?: number }>(`/platform/v1/runbooks/${id}/dry-run`);
      toast.success("Dry-Run Succeeded", `Runbook "${name || id}" validated without side-effects.`);
    } catch {
      toast.error("Dry-Run Failed", `Validation failed for runbook ${name || id}.`);
    }
  };

  const enabled = rules.data.filter(isEnabled);

  const stats: StatCardItem[] = [
    { label: "Automation rules", value: rules.data.length, icon: <Workflow size={18} /> },
    { label: "Enabled rules", value: enabled.length, icon: <CircleCheck size={18} /> },
    { label: "Runbooks", value: runbooks.data.length, icon: <Boxes size={18} /> },
  ];

  if (rules.loading && runbooks.loading) {
    return (
      <DomainShell domainId="ops" title="Automation">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="ops"
      title="Automation"
      description="Automation rules and executable runbooks across the platform."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              rules.reload();
              runbooks.reload();
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            disabled={!canManage}
          >
            <Plus size={14} />
            Author Runbook
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={3} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            <Boxes size={16} /> Executable runbooks ({runbooks.data.length})
          </h3>
          {runbooks.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
              {runbooks.error.message}
            </p>
          ) : runbooks.data.length === 0 ? (
            <EmptyState title="No runbooks authored" description="Author a runbook to automate incident remediation steps." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {runbooks.data.map((rb) => (
                <li
                  key={rb.id ?? rb.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-3) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 500 }}>{rb.name ?? rb.id}</span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginLeft: "var(--space-2)" }}>
                      v{rb.version ?? 1} · {rb.steps?.length ?? 0} step(s)
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Badge variant={rb.status === "PUBLISHED" ? "success" : "default"}>
                      {rb.status ?? "DRAFT"}
                    </Badge>
                    {rb.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDryRun(rb.id!, rb.name)}
                      >
                        <Eye size={12} />
                        Dry-Run
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {rules.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
            {rules.error.message}
          </p>
        ) : rules.data.length === 0 ? (
          <EmptyState title="No automation rules" description="The automation endpoint returned no rules." />
        ) : (
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              <Workflow size={16} /> Automation rules ({rules.data.length})
            </h3>
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {rules.data.map((r) => (
                <li key={r.id ?? r.name ?? "?"} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontWeight: 500 }}>
                    <Boxes size={15} />
                    {r.name ?? r.id ?? "—"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {[r.trigger, r.action].filter(Boolean).join(" → ") || "—"}
                    </span>
                    <Badge variant={isEnabled(r) ? "success" : "default"}>
                      {isEnabled(r) ? "ENABLED" : "DISABLED"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Author New Runbook"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <FormField label="Runbook Name">
            <Input
              value={runbookName}
              onChange={(e) => setRunbookName(e.target.value)}
              placeholder="e.g. Scale Up Core Database Replicas"
            />
          </FormField>
          <FormField label="Execution Steps (JSON Array)">
            <Textarea
              value={runbookStepsJson}
              onChange={(e) => setRunbookStepsJson(e.target.value)}
              rows={6}
              style={{ fontFamily: "monospace", fontSize: "var(--text-xs)" }}
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRunbook}
              disabled={creating || !runbookName.trim()}
            >
              {creating ? "Authoring..." : "Create Runbook"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}