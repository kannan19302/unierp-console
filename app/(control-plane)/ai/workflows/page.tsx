"use client";
/**
 * AI Platform → Workflows.
 * Workflow definitions from the workflow endpoint plus engine status from
 * the workflow engine endpoint.
 */
import { Workflow, GitBranch, Gauge, PlayCircle } from "lucide-react";
import { Card, EmptyState, Spinner, Badge, StatCardRow, type StatCardItem } from "@kannan19302/ui";
import { useList, useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface WorkflowRow {
  id?: string;
  name?: string;
  description?: string;
  trigger?: string;
  triggerType?: string;
  status?: string;
  state?: string;
  runs?: number;
  runCount?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

function statusVariant(s?: string): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  if (!s) return "default";
  const v = s.toUpperCase();
  if (["ACTIVE", "ENABLED", "PUBLISHED", "RUNNING", "COMPLETED", "READY"].includes(v)) return "success";
  if (["PENDING", "DRAFT", "PAUSED", "QUEUED", "PROVISIONING", "STOPPING"].includes(v)) return "warning";
  if (["DISABLED", "ERROR", "FAILED", "CRASHED", "ARCHIVED", "STOPPED"].includes(v)) return "danger";
  if (["EXPERIMENTAL", "BETA", "TEMPLATE", "SCHEDULED"].includes(v)) return "info";
  return "default";
}

export default function AiWorkflowsPage() {
  const workflows = useList<WorkflowRow>({ path: "/workflow" });
  const engine = useItem<Record<string, unknown>>("/workflows/engine");

  const eng = engine.data ?? {};
  const activeRuns =
    typeof eng.activeRuns === "number"
      ? eng.activeRuns
      : typeof eng.running === "number"
        ? eng.running
        : undefined;
  const queueDepth =
    typeof eng.queueDepth === "number"
      ? eng.queueDepth
      : typeof eng.queued === "number"
        ? eng.queued
        : undefined;

  const stats: StatCardItem[] = [
    { label: "Workflows defined", value: workflows.total ?? workflows.data.length, icon: <Workflow size={18} /> },
    { label: "Active runs", value: activeRuns ?? "—", icon: <PlayCircle size={18} /> },
    { label: "Queued", value: queueDepth ?? "—", icon: <GitBranch size={18} /> },
    { label: "Engine status", value: eng.status ? String(eng.status) : "—", icon: <Gauge size={18} /> },
  ];

  return (
    <DomainShell
      domainId="ai"
      title="Workflows"
      description="Agentic workflow definitions and engine health."
    >
      {workflows.loading || engine.loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <StatCardRow stats={stats} columns={4} />

          {engine.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
              {engine.error.message}
            </p>
          ) : null}

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Workflow definitions</h3>
            {workflows.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {workflows.error.message}
              </p>
            ) : workflows.data.length === 0 ? (
              <EmptyState title="No workflows defined" description="The workflow endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {workflows.data.map((w) => (
                  <li
                    key={w.id ?? w.name ?? "row"}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
                      <GitBranch size={16} style={{ flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 500 }}>{w.name ?? w.id ?? "Unnamed workflow"}</span>
                        <span style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {w.description ?? w.trigger ?? w.triggerType ?? "—"}
                        </span>
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                      {typeof w.runCount === "number" || typeof w.runs === "number" ? (
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {(w.runCount ?? w.runs)?.toLocaleString()} runs
                        </span>
                      ) : null}
                      <Badge variant={statusVariant(w.status ?? w.state)}>{w.status ?? w.state ?? "unknown"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </DomainShell>
  );
}