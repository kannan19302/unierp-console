"use client";
/**
 * Billing → Configuration.
 * Enterprise billing configuration: automation rules (dunning, invoice
 * delivery, retries) and platform-wide quota limits.
 */
import { Bot, Settings, SlidersHorizontal } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface AutomationRow {
  id?: string;
  name?: string;
  automationType?: string;
  type?: string;
  description?: string;
  trigger?: string;
  schedule?: string;
  enabled?: boolean;
  status?: string;
  lastRunAt?: string;
}

interface QuotaLimitRow {
  id?: string;
  key?: string;
  name?: string;
  defaultLimit?: number;
  limit?: number;
  unit?: string;
  enabled?: boolean;
  enforced?: boolean;
}

export default function BillingConfiguration() {
  const automations = useList<AutomationRow>({ path: "/platform/v1/enterprise-scale/billing-automations" });
  const limits = useList<QuotaLimitRow>({ path: "/platform/v1/metering/quota-limits" });

  const enabledCount = automations.data.filter(
    (a) => a.enabled === true || (a.status ?? "").toUpperCase() === "ACTIVE",
  ).length;

  const stats: StatCardItem[] = [
    { label: "Automations", value: automations.data.length, icon: <Bot size={18} /> },
    { label: "Enabled automations", value: enabledCount, icon: <Settings size={18} /> },
    { label: "Quota limits", value: limits.data.length, icon: <SlidersHorizontal size={18} /> },
  ];

  return (
    <DomainShell
      domainId="billing"
      title="Billing"
      description="Revenue, plans, subscriptions, invoices and metering across the platform."
      breadcrumb={[{ label: "Billing", href: "/billing" }, { label: "Configuration" }]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={3} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Billing automations</h3>
            {automations.loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
                <Spinner size="md" />
              </div>
            ) : automations.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {automations.error.message}
              </p>
            ) : automations.data.length === 0 ? (
              <EmptyState title="No automations configured" description="The billing-automations endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {automations.data.slice(0, 20).map((a) => {
                  const on = a.enabled === true || (a.status ?? "").toUpperCase() === "ACTIVE";
                  return (
                    <li
                      key={a.id ?? a.name ?? a.type ?? "?"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "var(--space-3)",
                        padding: "var(--space-2) 0",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500 }}>{a.name ?? a.automationType ?? a.type ?? "—"}</div>
                        {a.description ? (
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                            {a.description}
                          </div>
                        ) : a.trigger ? (
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                            Trigger: {a.trigger} {a.schedule ? ` · ${a.schedule}` : ""}
                          </div>
                        ) : null}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                        {a.lastRunAt ? (
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                            last {a.lastRunAt}
                          </span>
                        ) : null}
                        <Badge variant={on ? "success" : "default"}>{on ? "Enabled" : "Disabled"}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Quota limits</h3>
            {limits.loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
                <Spinner size="md" />
              </div>
            ) : limits.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {limits.error.message}
              </p>
            ) : limits.data.length === 0 ? (
              <EmptyState title="No quota limits" description="The quota-limits endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {limits.data.slice(0, 20).map((q) => (
                  <li
                    key={q.id ?? q.key ?? q.name ?? "?"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{q.name ?? q.key ?? q.id ?? "—"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {q.defaultLimit ?? q.limit ?? "—"}
                        {q.unit ? ` ${q.unit}` : ""}
                      </span>
                      <Badge variant={q.enabled === false || q.enforced === false ? "default" : "primary"}>
                        {q.enabled === false || q.enforced === false ? "Disabled" : "Enforced"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </DomainShell>
  );
}