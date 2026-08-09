"use client";
/**
 * Analytics → Customers.
 * Enterprise and expansion analytics: customer base, data quality, insights
 * and expansion (upsell / downgrade / at-risk) signals.
 */
import { Building2, Users, TrendingUp, ShieldAlert, UserCheck } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { useItem } from "@/lib/data";

interface EnterpriseCustomerRow {
  id?: string;
  name?: string;
  plan?: string;
  status?: string;
  region?: string;
  mrr?: number;
}

interface EnterpriseAnalytics {
  enterpriseCount?: number;
  customerCount?: number;
  totalSubscriptions?: number;
  customers?: EnterpriseCustomerRow[];
  segments?: { name?: string; count?: number; pct?: number }[];
  tables?: { table?: string; completeness?: number; total?: number; complete?: number; issues?: string[] }[];
  overallCompleteness?: number;
  insights?: { id?: string; category?: string; severity?: string; title?: string; detail?: string }[];
  generatedAt?: string;
}

interface ExpansionAnalytics {
  expansionRevenue?: number;
  expansionMrr?: number;
  netRetentionPct?: number;
  grossRetentionPct?: number;
  newCustomers?: number;
  upgraded?: number;
  downgraded?: number;
  churned?: number;
  atRisk?: { name?: string; tenantId?: string; healthScore?: number; mrrAtRisk?: number }[];
  exportJobs?: { id?: string; name?: string; format?: string; schedule?: string; status?: string }[];
  generatedAt?: string;
}

export default function AnalyticsCustomersTab() {
  const enterprise = useItem<EnterpriseAnalytics>("/analytics/enterprise");
  const expansion = useItem<ExpansionAnalytics>("/analytics/expansion");

  const e = enterprise.data ?? ({} as EnterpriseAnalytics);
  const x = expansion.data ?? ({} as ExpansionAnalytics);

  const money = (v?: number): string =>
    v == null || Number.isNaN(v) ? "—" : `$${Math.round(v).toLocaleString()}`;

  const stats: StatCardItem[] = [
    {
      label: "Customers",
      value: e.customerCount ?? (e.customers?.length ?? "—"),
      icon: <Users size={18} />,
    },
    {
      label: "Enterprise accounts",
      value: e.enterpriseCount ?? "—",
      icon: <Building2 size={18} />,
    },
    {
      label: "Expansion revenue",
      value: money(x.expansionRevenue ?? x.expansionMrr),
      icon: <TrendingUp size={18} />,
    },
    {
      label: "Net retention",
      value: x.netRetentionPct != null ? `${x.netRetentionPct}%` : "—",
      icon: <UserCheck size={18} />,
    },
    {
      label: "At-risk accounts",
      value: x.atRisk?.length ?? "—",
      icon: <ShieldAlert size={18} />,
    },
  ];

  if (enterprise.loading || expansion.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="analytics"
      title="Customers"
      description="Enterprise account health, customer quality and expansion signals."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={5} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <section>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Enterprise customer base</h3>
            {enterprise.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                {enterprise.error.message}
              </p>
            ) : !e.customers || e.customers.length === 0 ? (
              <EmptyState title="No customer data" description="The enterprise analytics endpoint returned no customers." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {e.customers.slice(0, 15).map((c) => (
                  <li
                    key={c.id ?? c.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{c.name ?? "—"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {c.plan ?? "—"} · {money(c.mrr)}
                      </span>
                      <Badge
                        variant={
                          c.status === "ACTIVE" ? "success" : c.status === "SUSPENDED" ? "warning" : "default"
                        }
                      >
                        {c.status ?? "UNKNOWN"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Data quality by dataset</h3>
            {enterprise.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                {enterprise.error.message}
              </p>
            ) : !e.tables || e.tables.length === 0 ? (
              <EmptyState title="No data quality metrics" description="The enterprise analytics endpoint returned no dataset health." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {e.tables.map((t, i) => (
                  <li
                    key={t.table ?? `table-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{t.table}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {t.complete ?? t.completeness != null ? `${t.completeness ?? 0}% complete` : `${t.total ?? 0} rows`}
                      </span>
                      <Badge
                        variant={t.completeness == null ? "default" : t.completeness >= 80 ? "success" : "warning"}
                      >
                        {t.completeness != null ? `${t.completeness}%` : "N/A"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Expansion &amp; churn</h3>
            {expansion.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                {expansion.error.message}
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {(
                  [
                    ["New customers", x.newCustomers ?? "—"],
                    ["Upgraded", x.upgraded ?? "—"],
                    ["Downgraded", x.downgraded ?? "—"],
                    ["Churned", x.churned ?? "—"],
                    ["Gross retention", x.grossRetentionPct != null ? `${x.grossRetentionPct}%` : "—"],
                  ] as const
                ).map(([label, value]) => (
                  <li key={label} style={rowStyle}>
                    <span>{label}</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </DomainShell>
  );
}

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "var(--space-3)",
  padding: "var(--space-2) 0",
  borderBottom: "1px solid var(--color-border)",
  fontSize: "var(--text-sm)",
} as const;