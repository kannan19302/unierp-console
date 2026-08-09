"use client";
/**
 * AI Platform → Tools.
 * Tool/function registry from the AI enterprise endpoint.
 */
import { Blocks, Wrench, ShieldCheck } from "lucide-react";
import { Card, EmptyState, Spinner, Badge, StatCardRow, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface ToolRow {
  id?: string;
  name?: string;
  description?: string;
  category?: string;
  kind?: string;
  type?: string;
  status?: string;
  enabled?: boolean;
  [key: string]: unknown;
}

function statusVariant(s?: string): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  if (!s) return "default";
  const v = s.toUpperCase();
  if (["ACTIVE", "ENABLED", "PUBLISHED", "APPROVED", "READY"].includes(v)) return "success";
  if (["PENDING", "REVIEW", "DRAFT", "BETA", "DEPRECATED", "PAUSED"].includes(v)) return "warning";
  if (["DISABLED", "BLOCKED", "REVOKED", "FAILED", "ERROR"].includes(v)) return "danger";
  if (["INTERNAL", "EXPERIMENTAL", "PRIVATE"].includes(v)) return "info";
  return "default";
}

export default function AiToolsPage() {
  const tools = useList<ToolRow>({ path: "/ai/enterprise" });

  const categories = new Set(
    tools.data.map((t) => t.category ?? t.kind ?? t.type ?? "").filter(Boolean),
  ).size;
  const approved = tools.data.filter((t) => statusVariant(t.status) === "success").length;

  const stats: StatCardItem[] = [
    { label: "Tools registered", value: tools.total ?? tools.data.length, icon: <Blocks size={18} /> },
    { label: "Categories", value: categories || "—", icon: <Wrench size={18} /> },
    { label: "Approved", value: approved || "—", icon: <ShieldCheck size={18} /> },
  ];

  return (
    <DomainShell
      domainId="ai"
      title="Tools"
      description="Tools and function bindings exposed to agents."
    >
      {tools.loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <StatCardRow stats={stats} columns={3} />
          <Card padding="md">
            {tools.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {tools.error.message}
              </p>
            ) : tools.data.length === 0 ? (
              <EmptyState title="No tools registered" description="The AI enterprise endpoint returned no tool rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-2) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {tools.data.map((t) => (
                  <li
                    key={t.id ?? t.name ?? "row"}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
                      <Blocks size={16} style={{ flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 500 }}>{t.name ?? t.id ?? "Unnamed tool"}</span>
                        <span style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {t.description ?? t.category ?? t.kind ?? t.type ?? "—"}
                        </span>
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                      {t.enabled === true ? <Badge variant="success">Enabled</Badge> : null}
                      <Badge variant={statusVariant(t.status)}>{t.status ?? "unknown"}</Badge>
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