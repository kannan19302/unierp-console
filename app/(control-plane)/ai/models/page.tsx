"use client";
/**
 * AI Platform → Models.
 * Model registry from the AI expansion endpoint.
 */
import { Boxes, Layers, Cpu } from "lucide-react";
import { Card, EmptyState, Spinner, Badge, StatCardRow, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface ModelRow {
  id?: string;
  name?: string;
  family?: string;
  provider?: string;
  vendor?: string;
  contextWindow?: number;
  contextLength?: number;
  modality?: string;
  kind?: string;
  status?: string;
  [key: string]: unknown;
}

function statusVariant(s?: string): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  if (!s) return "default";
  const v = s.toUpperCase();
  if (["ACTIVE", "ENABLED", "AVAILABLE", "READY", "PRODUCTION", "LIVE"].includes(v)) return "success";
  if (["PENDING", "PROVISIONING", "DEPRECATED", "BETA", "PREVIEW", "SYNCING"].includes(v)) return "warning";
  if (["DISABLED", "ERROR", "FAILED", "RETIRED", "ARCHIVED", "BLOCKED"].includes(v)) return "danger";
  if (["EXPERIMENTAL", "TRIAL", "INTERNAL"].includes(v)) return "info";
  return "default";
}

export default function AiModelsPage() {
  const models = useList<ModelRow>({ path: "/ai/expansion" });

  const total = models.total ?? models.data.length;
  const active = models.data.filter((m) => statusVariant(m.status) === "success").length;
  const modalities = new Set(
    models.data.map((m) => m.modality ?? m.kind ?? "").filter(Boolean),
  ).size;

  const stats: StatCardItem[] = [
    { label: "Models registered", value: total, icon: <Boxes size={18} /> },
    { label: "Active", value: active || "—", icon: <Cpu size={18} /> },
    { label: "Modalities", value: modalities || "—", icon: <Layers size={18} /> },
  ];

  return (
    <DomainShell
      domainId="ai"
      title="Models"
      description="Model registry, capability and lifecycle status."
    >
      {models.loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <StatCardRow stats={stats} columns={3} />
          <Card padding="md">
            {models.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {models.error.message}
              </p>
            ) : models.data.length === 0 ? (
              <EmptyState title="No models registered" description="The AI expansion endpoint returned no model rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-2) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {models.data.map((m) => {
                  const context = m.contextWindow ?? m.contextLength;
                  return (
                    <li
                      key={m.id ?? m.name ?? "row"}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
                        <Boxes size={16} style={{ flexShrink: 0 }} />
                        <span style={{ minWidth: 0 }}>
                          <span style={{ fontWeight: 500 }}>{m.name ?? m.id ?? "Unnamed model"}</span>
                          <span style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                            {[m.provider ?? m.vendor, m.family, m.modality ?? m.kind]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </span>
                        </span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                        {typeof context === "number" ? (
                          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                            {context.toLocaleString()} ctx
                          </span>
                        ) : null}
                        <Badge variant={statusVariant(m.status)}>{m.status ?? "unknown"}</Badge>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </DomainShell>
  );
}