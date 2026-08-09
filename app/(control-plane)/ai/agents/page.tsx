"use client";
/**
 * AI Platform → Agents.
 * Agent registry from the AI deep-expansion endpoint.
 */
import { Bot, Cpu, ShieldCheck } from "lucide-react";
import { Card, EmptyState, Spinner, Badge, StatCardRow, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface AgentRow {
  id?: string;
  name?: string;
  model?: string;
  role?: string;
  description?: string;
  type?: string;
  status?: string;
  tenant?: string;
  createdAt?: string;
  [key: string]: unknown;
}

function statusVariant(s?: string): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  if (!s) return "default";
  const v = s.toUpperCase();
  if (["ACTIVE", "ENABLED", "READY", "RUNNING", "ONLINE", "DEPLOYED"].includes(v)) return "success";
  if (["PENDING", "PAUSED", "PROVISIONING", "SYNCING", "QUEUED", "IDLE"].includes(v)) return "warning";
  if (["DISABLED", "ERROR", "FAILED", "STOPPED", "OFFLINE", "SUSPENDED"].includes(v)) return "danger";
  if (["EXPERIMENTAL", "BETA", "TRIAL", "DRAFT"].includes(v)) return "info";
  return "default";
}

export default function AiAgentsPage() {
  const agents = useList<AgentRow>({ path: "/ai/deep-expansion" });

  const types = new Set(agents.data.map((a) => a.type ?? a.role ?? "").filter(Boolean));
  const guarded = agents.data.filter(
    (a) => a.guardrailsEnabled === true || a.complianceMode === true,
  ).length;

  const stats: StatCardItem[] = [
    { label: "Agents deployed", value: agents.total ?? agents.data.length, icon: <Bot size={18} /> },
    { label: "Roles / types", value: types.size || "—", icon: <Cpu size={18} /> },
    { label: "Guardrails on", value: guarded || "—", icon: <ShieldCheck size={18} /> },
  ];

  return (
    <DomainShell
      domainId="ai"
      title="Agents"
      description="Agent runtime inventory across tenants."
    >
      {agents.loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <StatCardRow stats={stats} columns={3} />
          <Card padding="md">
            {agents.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {agents.error.message}
              </p>
            ) : agents.data.length === 0 ? (
              <EmptyState title="No agents deployed" description="The AI deep-expansion endpoint returned no agent rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-2) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {agents.data.map((a) => (
                  <li
                    key={a.id ?? a.name ?? "row"}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
                      <Bot size={16} style={{ flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 500 }}>{a.name ?? a.id ?? "Unnamed agent"}</span>
                        <span style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {[a.type ?? a.role, a.model, a.tenant].filter(Boolean).join(" · ") || "—"}
                        </span>
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                      {a.guardrailEnabled === true || a.guardrailsEnabled === true ? (
                        <Badge variant="info">Guarded</Badge>
                      ) : null}
                      <Badge variant={statusVariant(a.status)}>{a.status ?? "unknown"}</Badge>
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