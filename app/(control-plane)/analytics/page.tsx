"use client";
/**
 * Analytics → Overview.
 * KPI dashboard fed by the analytics aggregate, SaaS usage summary, the
 * reporting catalog and the operations dashboard summary.
 */
import { DollarSign, TrendingDown, Users, FileText, Activity } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { useItem, useList } from "@/lib/data";

interface OverviewAnalytics {
  overview?: {
    totalTenants?: number;
    activeTenants?: number;
    totalSubscriptions?: number;
    newTenantsThisMonth?: number;
    totalRevenue?: number;
    mrr?: number;
    arr?: number;
    growth?: number;
  };
  revenue?: {
    totalRevenue?: number;
    totalInvoices?: number;
    averageInvoiceValue?: number;
  };
  churn?: {
    churnedCount?: number;
    newCount?: number;
    churnRate?: number;
    newSubs?: number;
    netChange?: number;
  };
  growth?: {
    totalNew?: number;
  };
  planDistribution?: {
    total?: number;
    details?: { plan?: string; count?: number; pct?: number }[];
  };
}

interface UsageSummary {
  plan?: string;
  overQuota?: boolean;
  users?: { current?: number; limit?: number; pct?: number };
  storage?: { current?: number; limit?: number; pct?: number };
  metrics?: { metric?: string; current?: number; limit?: number; pct?: number }[];
}

interface ReportRow {
  id?: string;
  name?: string;
  description?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AnalyticsOverviewTab() {
  const analytics = useItem<OverviewAnalytics>("/analytics");
  const usage = useItem<UsageSummary>("/saas/usage");
  const reports = useList<ReportRow>({ path: "/reporting" });

  const a = analytics.data ?? ({} as OverviewAnalytics);
  const u = usage.data;
  const planDetails = a.planDistribution?.details ?? [];

  const money = (v?: number): string =>
    v == null || Number.isNaN(v) ? "—" : `$${Math.round(v).toLocaleString()}`;

  const stats: StatCardItem[] = [
    {
      label: "MRR",
      value: money(a.overview?.mrr ?? a.revenue?.totalRevenue),
      change: a.overview?.growth,
      changeLabel: "tenant growth",
      icon: <DollarSign size={18} />,
      color: "var(--color-primary)",
    },
    {
      label: "Churn rate",
      value: a.churn?.churnRate != null ? `${a.churn.churnRate}%` : "—",
      icon: <TrendingDown size={18} />,
      color: "var(--color-danger)",
    },
    {
      label: "Seat utilization",
      value:
        u?.users?.current != null
          ? `${u.users.current} / ${u.users.limit ?? "—"}`
          : "—",
      icon: <Users size={18} />,
    },
    {
      label: "Reports",
      value: reports.data.length > 0 ? reports.data.length : reports.total ?? "—",
      icon: <FileText size={18} />,
    },
    {
      label: "Active tenants",
      value: a.overview?.activeTenants ?? "—",
      icon: <Activity size={18} />,
    },
  ];

  if (analytics.loading || usage.loading || reports.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="analytics"
      title="Overview"
      description="Revenue, churn, usage and reporting across the platform."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={5} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Revenue &amp; churn</h3>
            {analytics.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-3)" }}>
                {analytics.error.message}
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                <li style={rowStyle}>
                  <span>Total revenue</span>
                  <span>{money(a.revenue?.totalRevenue ?? a.overview?.totalRevenue)}</span>
                </li>
                <li style={rowStyle}>
                  <span>Paid invoices</span>
                  <span>{a.revenue?.totalInvoices ?? "—"}</span>
                </li>
                <li style={rowStyle}>
                  <span>Avg invoice value</span>
                  <span>{money(a.revenue?.averageInvoiceValue)}</span>
                </li>
                <li style={rowStyle}>
                  <span>Churned customers</span>
                  <span>{a.churn?.churnedCount ?? "—"}</span>
                </li>
                <li style={rowStyle}>
                  <span>Net change</span>
                  <span>{a.churn?.netChange ?? "—"}</span>
                </li>
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Platform base</h3>
            {analytics.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-3)" }}>
                {analytics.error.message}
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                <li style={rowStyle}><span>Total tenants</span><span>{a.overview?.totalTenants ?? "—"}</span></li>
                <li style={rowStyle}><span>Active tenants</span><span>{a.overview?.activeTenants ?? "—"}</span></li>
                <li style={rowStyle}><span>Active subscriptions</span><span>{a.overview?.totalSubscriptions ?? "—"}</span></li>
                <li style={rowStyle}><span>New tenants (30d)</span><span>{a.overview?.newTenantsThisMonth ?? "—"}</span></li>
              </ul>
            )}
            <h4 style={{ margin: "var(--space-4) 0 0", fontSize: "var(--text-sm)", fontWeight: 600 }}>Plan distribution</h4>
            {analytics.error ? null : planDetails.length === 0 ? (
              <EmptyState title="No plan distribution" description="The analytics endpoint returned no plan breakdown." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-2) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {planDetails.slice(0, 6).map((d, i) => (
                  <li key={d.plan ?? `plan-${i}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "var(--text-sm)" }}>{d.plan}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {d.count ?? 0} · {d.pct ?? 0}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Recent reports</h3>
            {reports.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-3)" }}>
                {reports.error.message}
              </p>
            ) : reports.data.length === 0 ? (
              <EmptyState title="No reports yet" description="The reporting API returned no saved reports." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {reports.data.slice(0, 7).map((r) => (
                  <li key={r.id ?? r.name} style={rowStyle}>
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.name ?? "—"}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <Badge variant={r.type === "SQL" ? "info" : "primary"}>{r.type ?? "BUILDER"}</Badge>
                      <FileText size={14} style={{ color: "var(--color-text-muted)" }} />
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

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "var(--space-3)",
  padding: "var(--space-2) 0",
  borderBottom: "1px solid var(--color-border)",
  fontSize: "var(--text-sm)",
} as const;