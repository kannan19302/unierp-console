"use client";
/**
 * AI Platform → Overview.
 * KPI dashboard (providers, models, agents, costs) + recent AI activity.
 * Reads real data from the admin AI aggregate and the platform operations
 * dashboard summary. Sections without data show honest empty/error states.
 */
import {
  Bot,
  Boxes,
  Workflow,
  PiggyBank,
  Cloud,
  Activity,
} from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface ActivityRow {
  id?: string;
  actor?: string;
  action?: string;
  resource?: string;
  tenant?: string;
  createdAt?: string;
  timestamp?: string;
}

function num(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return undefined;
}

function asArray(v: unknown): Record<string, unknown>[] {
  if (Array.isArray(v)) return v as Record<string, unknown>[];
  if (v && typeof v === "object" && Array.isArray((v as { recent?: unknown }).recent)) {
    return asArray((v as { recent: unknown }).recent);
  }
  return [];
}

function fmtMoney(v: unknown): string {
  const n = num(v);
  if (n === undefined) return "—";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AiOverview() {
  const aggregate = useItem<Record<string, unknown>>("/admin/ai");
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");

  const ai = aggregate.data ?? {};
  const s = summary.data ?? {};

  const providers = num(ai.providersCount) ?? num(ai.providers);
  const models = num(ai.modelsCount) ?? num(ai.models);
  const agents = num(ai.agentsCount) ?? num(ai.agents);
  const cost = num(ai.costsTotal) ?? num(ai.totalCost) ?? num(ai.costs);
  const workflows = num(ai.workflowsCount) ?? num(ai.workflows);
  const tools = num(ai.toolsCount) ?? num(ai.tools);

  const asyncEngines = num(s.aiWorkers) ?? num(s.agentRunners) ?? num(s.workers);

  const stats: StatCardItem[] = [
    {
      label: "Providers",
      value: providers !== undefined ? providers.toLocaleString() : "—",
      icon: <Cloud size={18} />,
    },
    {
      label: "Models",
      value: models !== undefined ? models.toLocaleString() : "—",
      icon: <Boxes size={18} />,
    },
    {
      label: "Agents",
      value: agents !== undefined ? agents.toLocaleString() : "—",
      icon: <Bot size={18} />,
    },
    {
      label: "Workflows",
      value: workflows !== undefined ? workflows.toLocaleString() : "—",
      icon: <Workflow size={18} />,
    },
    {
      label: "Monthly AI cost",
      value: fmtMoney(cost),
      icon: <PiggyBank size={18} />,
    },
    {
      label: "AI workers",
      value: asyncEngines !== undefined ? asyncEngines.toLocaleString() : "—",
      icon: <Activity size={18} />,
    },
  ];

  const activity = asArray(ai.activity ?? ai.recent ?? ai.events)
    .map((a) => ({
      id: String(a.id ?? a.eventId ?? "a"),
      actor: a.actor ? String(a.actor) : undefined,
      action: a.action ? String(a.action) : undefined,
      resource: a.resource ? String(a.resource) : undefined,
      tenant: a.tenant ? String(a.tenant) : undefined,
      createdAt: (a.createdAt ?? a.timestamp) ? String(a.createdAt ?? a.timestamp) : undefined,
    }))
    .filter((a) => a.action || a.resource);

  const toolsList = Array.isArray(ai.toolsEnrolled)
    ? (ai.toolsEnrolled as string[])
    : [];

  return (
    <DomainShell
      domainId="ai"
      title="AI Platform Overview"
      description="Provider-side AI estate — providers, models, agents, tooling and spend."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        {aggregate.loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
            <Spinner size="md" />
          </div>
        ) : (
          <>
            <StatCardRow stats={stats} columns={5} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "var(--space-4)",
              }}
            >
              <Card padding="md">
                <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
                  Recent AI activity
                </h3>
                {activity.length === 0 ? (
                  <EmptyState
                    title="No activity recorded"
                    description="The AI admin endpoint returned no recent activity."
                  />
                ) : (
                  <ul
                    style={{
                      listStyle: "none",
                      margin: "var(--space-3) 0 0",
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {activity.slice(0, 12).map((a) => (
                      <li
                        key={`${a.id}-${a.createdAt ?? ""}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "var(--space-2) 0",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 500 }}>
                            {a.action ?? a.resource ?? "event"}
                          </span>
                          {a.tenant ? (
                            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                              {" "}· {a.tenant}
                            </span>
                          ) : null}
                        </span>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {a.actor ?? "System"}
                          {" · "}
                          {a.createdAt ?? ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card padding="md">
                <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
                  Status & governance
                </h3>
                {aggregate.error ? (
                  <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                    {aggregate.error.message}
                  </p>
                ) : (
                  <ul
                    style={{
                      listStyle: "none",
                      margin: "var(--space-3) 0 0",
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-2)",
                    }}
                  >
                    <li style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        Governance mode
                      </span>
                      <Badge variant="info">
                        {String(ai.governanceEnabled === false ? "Disabled" : "Active")}
                      </Badge>
                    </li>
                    <li style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        Approved tools
                      </span>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>
                        {toolsList.length}
                      </span>
                    </li>
                    <li style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        Data residency
                      </span>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>
                        {ai.dataResidency ? String(ai.dataResidency) : "—"}
                      </span>
                    </li>
                    <li style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        Compliance baseline
                      </span>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>
                        {ai.complianceBaseline ? String(ai.complianceBaseline) : "—"}
                      </span>
                    </li>
                  </ul>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </DomainShell>
  );
}