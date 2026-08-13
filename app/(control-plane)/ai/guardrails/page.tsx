"use client";
/**
 * AI Platform → Guardrails.
 * Platform guardrail policies and their events from the control-plane AI API.
 */
import { ShieldCheck, ShieldAlert, Ban, ScrollText } from "lucide-react";
import { Card, EmptyState, Spinner, Badge, StatCardRow, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

type BadgeVariant = "success" | "default" | "primary" | "warning" | "danger" | "info";

interface GuardrailRow {
  id?: string;
  name?: string;
  ruleType?: string;
  pattern?: string;
  action?: string;
  enabled?: boolean;
  description?: string;
}

interface EventRow {
  id?: string;
  action?: string;
  policyId?: string;
  tenantRef?: string;
  inputHash?: string;
  createdAt?: string;
}

function actionVariant(action?: string): BadgeVariant {
  const v = (action ?? "").toUpperCase();
  if (v === "BLOCK") return "danger";
  if (v === "WARN") return "warning";
  return "default";
}

export default function AiGuardrailsPage() {
  const policies = useList<GuardrailRow>({ path: "/platform/v1/ai/guardrails" });
  const events = useList<EventRow>({ path: "/platform/v1/ai/guardrails/events" });

  const enabled = policies.data.filter((p) => p.enabled === true).length;
  const blocks = events.data.filter((e) => (e.action ?? "").toUpperCase() === "BLOCK").length;

  const stats: StatCardItem[] = [
    { label: "Guardrail policies", value: policies.total ?? policies.data.length, icon: <ShieldCheck size={18} /> },
    { label: "Enabled", value: enabled || "—", icon: <ShieldAlert size={18} /> },
    { label: "Blocks recorded", value: blocks || "—", icon: <Ban size={18} /> },
  ];

  return (
    <DomainShell
      domainId="ai"
      title="Guardrails"
      description="Prompt guardrail policies evaluated before every model call."
    >
      {policies.loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <StatCardRow stats={stats} columns={3} />

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Policies</h3>
            {policies.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {policies.error.message}
              </p>
            ) : policies.data.length === 0 ? (
              <div style={{ marginTop: "var(--space-3)" }}>
                <EmptyState title="No guardrail policies" description="No policies have been created yet." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {policies.data.map((p) => (
                  <li
                    key={p.id ?? p.name ?? "row"}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
                      <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 500 }}>{p.name ?? p.id ?? "Unnamed policy"}</span>
                        <span style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {[p.ruleType, p.pattern, p.description].filter(Boolean).join(" · ") || "—"}
                        </span>
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                      <Badge variant={actionVariant(p.action)}>{p.action ?? "unknown"}</Badge>
                      <Badge variant={p.enabled === true ? "success" : "default"}>
                        {p.enabled === true ? "enabled" : "disabled"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Events</h3>
            {events.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {events.error.message}
              </p>
            ) : events.data.length === 0 ? (
              <div style={{ marginTop: "var(--space-3)" }}>
                <EmptyState title="No guardrail events" description="No prompt has matched a guardrail yet." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {events.data.map((e, i) => (
                  <li
                    key={e.id ?? `${e.action ?? "event"}-${i}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
                      <ScrollText size={16} style={{ flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 500 }}>{e.action ?? "event"}</span>
                        <span style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {[e.policyId ? `policy ${e.policyId}` : null, e.tenantRef ? `tenant ${e.tenantRef}` : null, e.inputHash ? e.inputHash.slice(0, 12) : null]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </span>
                    </span>
                    <span style={{ flexShrink: 0 }}>
                      <Badge variant={actionVariant(e.action)}>{e.action ?? "unknown"}</Badge>
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