"use client";
/**
 * AI Platform → Knowledge.
 * Knowledge base summary from the admin AI aggregate. No standalone knowledge
 * endpoint is exposed, so this surfaces the knowledge fields the aggregate
 * returns; an absent section shows an honest empty state.
 */
import { Library, FileText, Database, ScrollText } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface KnowledgeItem {
  id?: string;
  name?: string;
  description?: string;
  type?: string;
  status?: string;
  docs?: number;
  documents?: number;
  source?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

function statusVariant(s?: string): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  if (!s) return "default";
  const v = s.toUpperCase();
  if (["ACTIVE", "ENABLED", "INDEXED", "SYNCED", "READY"].includes(v)) return "success";
  if (["PENDING", "INDEXING", "SYNCING", "STALE", "DEPRECATED"].includes(v)) return "warning";
  if (["DISABLED", "ERROR", "FAILED", "ORPHANED"].includes(v)) return "danger";
  if (["PRIVATE", "INTERNAL", "CURATED"].includes(v)) return "info";
  return "default";
}

function toKnowledge(rows: unknown): KnowledgeItem[] {
  if (Array.isArray(rows)) return rows as KnowledgeItem[];
  if (rows && typeof rows === "object") {
    const r = rows as Record<string, unknown>;
    const inner = r.knowledge ?? r.collections ?? r.documents ?? r.bases;
    if (Array.isArray(inner)) return inner as KnowledgeItem[];
  }
  return [];
}

export default function AiKnowledgePage() {
  const aggregate = useItem<Record<string, unknown>>("/admin/ai");
  const ai = aggregate.data ?? {};
  const items = toKnowledge(ai.knowledge ?? ai.knowledgeBase ?? ai.knowledgeBases);

  const totalDocs = items.reduce(
    (sum, k) => sum + Number(k.docs ?? k.documents ?? 0),
    0,
  );

  const stats: StatCardItem[] = [
    { label: "Knowledge bases", value: items.length, icon: <Library size={18} /> },
    { label: "Documents indexed", value: totalDocs || "—", icon: <FileText size={18} /> },
  ];

  return (
    <DomainShell
      domainId="ai"
      title="Knowledge"
      description="Knowledge bases and document sources for RAG."
    >
      {aggregate.loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <StatCardRow stats={stats} columns={2} />
          <Card padding="md">
            {aggregate.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {aggregate.error.message}
              </p>
            ) : items.length === 0 ? (
              <EmptyState
                title="No knowledge bases"
                description="The admin AI aggregate reported no knowledge collections."
              />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-2) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {items.map((k) => (
                  <li
                    key={k.id ?? k.name ?? "row"}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
                      <Database size={16} style={{ flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 500 }}>{k.name ?? k.id ?? "Unnamed collection"}</span>
                        <span style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {[k.type, k.source, k.description].filter(Boolean).join(" · ") || "—"}
                        </span>
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                      {Number(k.docs ?? k.documents ?? 0) > 0 ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          <ScrollText size={14} /> {Number(k.docs ?? k.documents).toLocaleString()}
                        </span>
                      ) : null}
                      <Badge variant={statusVariant(k.status)}>{k.status ?? "unknown"}</Badge>
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