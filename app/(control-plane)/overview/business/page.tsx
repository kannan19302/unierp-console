"use client";
/**
 * Overview → Business.
 * Platform-wide revenue and growth reads: MRR/ARR, plans, subscriptions,
 * tenant mix and revenue analytics from the control-plane API.
 */
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";

interface PlanRow {
  id?: string;
  name?: string;
  status?: string;
  price?: number;
  tenantCount?: number;
}

interface RevenueRow {
  month?: string;
  mrr?: number;
  arr?: number;
  churn?: number;
  newBusiness?: number;
  expansion?: number;
  contraction?: number;
  newCustomers?: number;
  churnRate?: number;
}

export default function OverviewBusiness() {
  const plans = useList<PlanRow>({ path: "/platform/v1/plans" });
  const revenue = useList<RevenueRow>({ path: "/platform/v1/super-admin/analytics" });
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");

  const s = summary.data ?? {};
  const totalTenants = Number(s.totalTenants) || 0;
  const mrr = typeof s.mrr === "number" ? s.mrr : Number(s.mrr) || 0;

  const stats: StatCardItem[] = [
    { label: "MRR", value: `$${mrr.toLocaleString()}` },
    { label: "ARR", value: `$${(mrr * 12).toLocaleString()}` },
    { label: "Tenants", value: totalTenants },
    { label: "Avg / tenant", value: totalTenants ? `$${Math.round(mrr / totalTenants).toLocaleString()}` : "—" },
  ];

  if (plans.loading || revenue.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Business</h2>
        <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
          Revenue, growth and plan mix across the platform.
        </p>
      </div>

      <StatCardRow stats={stats} columns={4} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
        <section>
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Plan mix</h3>
          {plans.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{plans.error.message}</p>
          ) : plans.data.length === 0 ? (
            <EmptyState title="No plans published" description="The plans endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {plans.data.slice(0, 20).map((p) => (
                <li
                  key={p.id ?? p.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{p.name ?? "—"}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {p.tenantCount != null ? `${p.tenantCount} tenants` : ""}
                      {p.price != null ? ` · $${p.price}` : ""}
                    </span>
                    <Badge variant={p.status === "ACTIVE" ? "success" : "default"}>{p.status ?? "UNKNOWN"}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Revenue trend</h3>
          {revenue.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{revenue.error.message}</p>
          ) : revenue.data.length === 0 ? (
            <EmptyState title="No revenue analytics" description="The analytics endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {revenue.data.slice(0, 12).map((r) => (
                <li
                  key={r.month ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{r.month ?? "—"}</span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    {r.newCustomers != null ? `${r.newCustomers} new` : ""}
                    {r.churnRate != null ? ` · ${r.churnRate}% churn` : ""}
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
