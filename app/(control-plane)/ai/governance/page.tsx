"use client";
/**
 * AI Platform → Governance.
 * Governance posture from the admin AI aggregate. No standalone governance
 * endpoint is exposed, so this surfaces the governance fields the aggregate
 * returns; an absent section shows an honest empty state.
 */
import { ShieldCheck, Ban, ShieldAlert, Eye, ScrollText } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

type BadgeVariant = "success" | "default" | "primary" | "warning" | "danger" | "info";

function booleanBadge(
  value: unknown,
  labels: [string, string],
): { text: string; variant: BadgeVariant } {
  if (value === undefined || value === null) return { text: "unknown", variant: "default" };
  return value === true
    ? { text: labels[0], variant: "success" }
    : { text: labels[1], variant: "danger" };
}

function stringValue(v: unknown): string | undefined {
  if (typeof v === "string" && v !== "") return v;
  return undefined;
}

export default function AiGovernancePage() {
  const aggregate = useItem<Record<string, unknown>>("/admin/ai");
  const ai = aggregate.data ?? {};

  const blocked = Array.isArray(ai.blockedTools)
    ? (ai.blockedTools as unknown[])
    : Array.isArray(ai.deniedTools)
      ? (ai.deniedTools as unknown[])
      : [];
  const allowed = Array.isArray(ai.allowedTools)
    ? (ai.allowedTools as unknown[])
    : Array.isArray(ai.approvedTools)
      ? (ai.approvedTools as unknown[])
      : [];
  const policies = Array.isArray(ai.policies)
    ? (ai.policies as unknown[])
    : Array.isArray(ai.governancePolicies)
      ? (ai.governancePolicies as unknown[])
      : [];

  const auditState = booleanBadge(
    ai.auditEnabled ?? ai.auditLogged ?? ai.auditLogging,
    ["Enabled", "Disabled"],
  );
  const monitoringState = booleanBadge(
    ai.monitoringEnabled ?? ai.modelMonitoring,
    ["Enabled", "Disabled"],
  );

  const stats: StatCardItem[] = [
    { label: "Approved tools", value: allowed.length, icon: <ShieldCheck size={18} /> },
    { label: "Blocked tools", value: blocked.length, icon: <Ban size={18} /> },
    { label: "Policies", value: policies.length, icon: <ShieldAlert size={18} /> },
  ];

  return (
    <DomainShell
      domainId="ai"
      title="Governance"
      description="Guardrails, tool allowlists and policy posture."
    >
      {aggregate.loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <StatCardRow stats={stats} columns={3} />

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Control posture</h3>
            {aggregate.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
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
                }}
              >
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                    <Eye size={14} /> Model monitoring
                  </span>
                  <Badge variant={monitoringState.variant}>{monitoringState.text}</Badge>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                    <ScrollText size={14} /> Audit logging
                  </span>
                  <Badge variant={auditState.variant}>{auditState.text}</Badge>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                    Data residency
                  </span>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>
                    {stringValue(ai.dataResidency) ?? "—"}
                  </span>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                    Compliance baseline
                  </span>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>
                    {stringValue(ai.complianceBaseline) ?? "—"}
                  </span>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                    Human-in-the-loop
                  </span>
                  <Badge variant={booleanBadge(ai.hitlEnabled, ["Required", "Off"]).variant}>
                    {booleanBadge(ai.hitlEnabled, ["Required", "Off"]).text}
                  </Badge>
                </li>
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Locked-down tools</h3>
            {aggregate.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {aggregate.error.message}
              </p>
            ) : blocked.length === 0 ? (
              <div style={{ marginTop: "var(--space-3)" }}>
                <EmptyState
                  title="No blocked tools"
                  description="The admin AI aggregate reported no tool restrictions."
                />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                {blocked.map((t, i) => (
                  <li key={`${String(t)}-${i}`}>
                    <Badge variant="danger">{String(t)}</Badge>
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