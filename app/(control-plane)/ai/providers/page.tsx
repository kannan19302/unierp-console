"use client";
/**
 * AI Platform → Providers.
 * Configured AI providers from the provider-side AI base endpoint.
 */
import { Cloud, Zap } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface ProviderRow {
  id?: string;
  name?: string;
  vendor?: string;
  organization?: string;
  model?: string;
  status?: string;
  baseUrl?: string;
  region?: string;
  createdAt?: string;
}

function statusVariant(s?: string): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  if (!s) return "default";
  const v = s.toUpperCase();
  if (["ACTIVE", "ENABLED", "READY", "OK", "HEALTHY", "VERIFIED"].includes(v)) return "success";
  if (["PENDING", "PROVISIONING", "SYNCING", "CONNECTING", "SCANNING"].includes(v)) return "warning";
  if (["DISABLED", "ERROR", "FAILED", "SUSPENDED", "DOWN", "NOT_FOUND"].includes(v)) return "danger";
  if (["EXPERIMENTAL", "BETA", "TRIAL"].includes(v)) return "info";
  return "default";
}

export default function AiProvidersPage() {
  const providers = useList<ProviderRow>({ path: "/ai" });

  const stats: StatCardItem[] = [
    { label: "Providers configured", value: providers.total ?? providers.data.length, icon: <Cloud size={18} /> },
    { label: "Active", value: providers.data.filter((r) => statusVariant(r.status) === "success").length || "—", icon: <Zap size={18} /> },
  ];

  return (
    <DomainShell
      domainId="ai"
      title="Providers"
      description="Model providers wired into the AI platform."
    >
      {providers.loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <StatCardRow stats={stats} columns={2} />
          <Card padding="md">
            {providers.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {providers.error.message}
              </p>
            ) : providers.data.length === 0 ? (
              <EmptyState title="No providers configured" description="The AI endpoints returned no provider rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-2) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {providers.data.map((p) => (
                  <li
                    key={p.id ?? p.vendor ?? p.name ?? "row"}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
                      <Cloud size={16} style={{ flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 500 }}>{p.name ?? p.vendor ?? p.organization ?? "Unnamed provider"}</span>
                        <span style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {[p.vendor, p.region, p.baseUrl].filter(Boolean).join(" · ") || "—"}
                        </span>
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                      {p.model ? (
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {String(p.model)}
                        </span>
                      ) : null}
                      <Badge variant={statusVariant(p.status)}>{p.status ?? "unknown"}</Badge>
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