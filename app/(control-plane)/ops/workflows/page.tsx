"use client";
/**
 * Ops — Workflows.
 *
 * Platform workflows from the workflows API: definition, current status and
 * the ability to trace runs. Real reads with honest states.
 */
import { GitBranch, Play, Square, Terminal } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface WorkflowRow {
  id?: string;
  name?: string;
  description?: string;
  trigger?: string;
  enabled?: boolean;
  lastRun?: string | null;
  lastStatus?: string | null;
  runs?: { total?: number; active?: number; completed?: number; failed?: number };
}

function statusVariant(status: string | null | undefined) {
  const s = (status ?? "").toUpperCase();
  if (s === "SUCCESS" || s === "COMPLETED" || s === "PASSED") return "success";
  if (s === "RUNNING" || s === "IN_PROGRESS" || s === "PENDING") return "warning";
  if (s === "FAILED" || s === "ERROR" || s === "CANCELLED") return "danger";
  return "default";
}

export default function OpsWorkflows() {
  const workflows = useList<WorkflowRow>({ path: "/platform/v1/workflows" });

  const enabledCount = workflows.data.filter((w) => w.enabled).length;
  const runningCount = workflows.data.filter((w) => {
    const s = (w.lastRun ?? "").toUpperCase();
    return s === "RUNNING" || s === "IN_PROGRESS";
  }).length;

  const stats: StatCardItem[] = [
    { label: "Workflows", value: workflows.data.length, icon: <GitBranch size={18} /> },
    { label: "Enabled", value: enabledCount, icon: <Play size={18} /> },
    { label: "Running", value: runningCount, icon: <Terminal size={18} /> },
  ];

  if (workflows.loading) {
    return (
      <DomainShell domainId="ops" title="Workflows">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="ops"
      title="Workflows"
      description="Platform workflows and their execution state."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        {workflows.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
            {workflows.error.message}
          </p>
        ) : workflows.data.length === 0 ? (
          <EmptyState title="No workflows" description="The workflows endpoint returned no workflows." />
        ) : (
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              <GitBranch size={16} /> Workflows
            </h3>
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {workflows.data.map((w) => (
                <li key={w.id ?? w.name ?? "?"} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{w.name ?? w.id ?? "—"}</span>
                    {w.description && (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {w.description}
                      </span>
                    )}
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      trigger {w.trigger ?? "—"}
                    </span>
                    <Badge variant={w.enabled ? "success" : "default"}>
                      {w.enabled ? "ENABLED" : "DISABLED"}
                    </Badge>
                    <Badge variant={statusVariant(w.lastRun)}>{w.lastRun ?? "NEVER RUN"}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </DomainShell>
  );
}