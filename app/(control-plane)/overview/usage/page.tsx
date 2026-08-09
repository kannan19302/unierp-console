"use client";
/**
 * Overview → Usage.
 * Metering, quotas and plan consumption across every tenant, read from the
 * control-plane metering and quota administration endpoints.
 */
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";

interface MeterRow {
  meterKey?: string;
  metric?: string;
  name?: string;
  unit?: string;
  usage?: number;
  consumed?: number;
  threshold?: number;
  periodCount?: number;
  p95?: number;
  quotaBreaches?: number;
}

interface RuleRow {
  id?: string;
  key?: string;
  name?: string;
  defaultLimit?: number;
  enabled?: boolean;
}

export default function OverviewUsage() {
  const usage = useList<MeterRow>({ path: "/platform/v1/metering/usage-summary" });
  const rules = useList<RuleRow>({ path: "/platform/v1/quotas/rules" });
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");

  const s = summary.data ?? {};
  const totalTenants = Number(s.totalTenants) || 0;
  const activeTenants = Number(s.activeTenants) || 0;

  const stats: StatCardItem[] = [
    { label: "Tenants metered", value: totalTenants },
    { label: "Active tenants", value: activeTenants },
    { label: "Quota rules", value: rules.data.length },
    { label: "Over quota", value: Number(s.overQuotaTenants) || 0 },
  ];

  if (usage.loading || rules.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Usage</h2>
        <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
          Metered consumption and quota rules across all tenants.
        </p>
      </div>

      <StatCardRow stats={stats} columns={4} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
        <section>
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Metered metrics</h3>
          {usage.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{usage.error.message}</p>
          ) : usage.data.length === 0 ? (
            <EmptyState title="No metering data" description="The metering endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {usage.data.slice(0, 20).map((m) => (
                <li
                  key={m.meterKey ?? m.metric ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{m.name ?? m.metric ?? m.meterKey}</span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    {m.p95 != null ? `p95 ${m.p95}` : ""}
                    {m.quotaBreaches != null ? ` · ${m.quotaBreaches} breaches` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Quota rules</h3>
          {rules.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{rules.error.message}</p>
          ) : rules.data.length === 0 ? (
            <EmptyState title="No quota rules" description="The quota endpoint returned no rules." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {rules.data.slice(0, 20).map((r) => (
                <li
                  key={r.id ?? r.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{r.name ?? r.key ?? "—"}</span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    {r.defaultLimit != null ? `limit ${r.defaultLimit}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
