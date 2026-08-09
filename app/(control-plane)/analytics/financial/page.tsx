"use client";
/**
 * Analytics → Financial.
 * Platform financials: tenant base from the platform analytics endpoint,
 * revenue / churn / LTV health from the SaaS revenue-churn endpoint.
 */
import { DollarSign, TrendingUp, Users, Building2, BadgeDollarSign } from "lucide-react";
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

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "var(--space-2) 0",
  borderBottom: "1px solid var(--color-border)",
};


interface PlatformAnalytics {
  tenantCount?: number;
  activeCount?: number;
  totalRevenue?: number;
  mrr?: number;
  arr?: number;
}

interface RevenueChurnHealth {
  currentMrr?: number;
  newMrr?: number;
  expansionMrr?: number;
  contractionMrr?: number;
  churnedMrr?: number;
  netNewMrr?: number;
  currentArr?: number;
  projectedArrNextYear?: number;
  arrGrowthRatePct?: number;
  nrrPercentage?: number;
  grossRevenueRetentionPct?: number;
  churnProbabilityPct?: number;
  healthScore?: number;
  avgLtv?: number;
  avgCac?: number;
  ltvCacRatio?: number;
  paybackPeriodMonths?: number;
}

export default function AnalyticsFinancialTab() {
  const platform = useItem<PlatformAnalytics>("/platform/v1/super-admin/analytics");
  const health = useItem<RevenueChurnHealth>("/saas/revenue-churn-health");

  const p = platform.data ?? ({} as PlatformAnalytics);
  const h = health.data ?? ({} as RevenueChurnHealth);

  const money = (v?: number): string =>
    v == null || Number.isNaN(v) ? "—" : `$${Math.round(v).toLocaleString()}`;

  const stats: StatCardItem[] = [
    {
      label: "MRR",
      value: money(h.currentMrr ?? p.mrr),
      icon: <DollarSign size={18} />,
      color: "var(--color-primary)",
    },
    {
      label: "ARR",
      value: money(h.currentArr ?? p.arr),
      change: h.arrGrowthRatePct,
      changeLabel: "YoY",
      icon: <TrendingUp size={18} />,
    },
    {
      label: "Net revenue retention",
      value: h.nrrPercentage != null ? `${h.nrrPercentage}%` : "—",
      icon: <BadgeDollarSign size={18} />,
    },
    {
label: "LTV : CAC",
      value: h.ltvCacRatio != null ? String(h.ltvCacRatio) : "—",
      icon: <Users size={18} />,
    },
    {
      label: "Platform tenants",
      value: p.tenantCount ?? "—",
      icon: <Building2 size={18} />,
    },
  ];

  if (platform.loading || health.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="analytics"
      title="Financial"
      description="Platform revenue, retention and economic health of the SaaS book."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={5} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>MRR movement</h3>
            {health.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-3)" }}>
                {health.error.message}
              </p>
            ) : h.currentMrr == null && h.newMrr == null ? (
              <EmptyState title="No revenue data" description="The revenue-churn endpoint returned no MRR breakdown." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {(
                  [
                    ["New MRR", h.newMrr],
                    ["Expansion MRR", h.expansionMrr],
                    ["Contraction MRR", h.contractionMrr],
                    ["Churned MRR", h.churnedMrr],
                    ["Net-new MRR", h.netNewMrr],
                  ] as const
                ).map(([label, value]) => (
                  <li key={label} style={rowStyle}>
                    <span>{label}</span>
                    <span>{money(value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Retention &amp; LTV economics</h3>
            {health.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-3)" }}>
                {health.error.message}
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {(
                  [
                    ["Gross retention", h.grossRevenueRetentionPct != null ? `${h.grossRevenueRetentionPct}%` : "—"],
                    ["Churn probability", h.churnProbabilityPct != null ? `${h.churnProbabilityPct}%` : "—"],
                    ["Avg LTV", money(h.avgLtv)],
                    ["Avg CAC", money(h.avgCac)],
                    ["Payback period", h.paybackPeriodMonths != null ? `${h.paybackPeriodMonths} mo` : "—"],
                  ] as const
                ).map(([label, value]) => (
                  <li key={label} style={rowStyle}>
                    <span>{label}</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Platform footprint</h3>
            {platform.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-3)" }}>
                {platform.error.message}
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {(
                  [
                    ["Total tenants", p.tenantCount ?? "—"],
                    ["Active tenants", p.activeCount ?? "—"],
                    ["Projected ARR", money(h.projectedArrNextYear)],
                    ["Health score", h.healthScore != null ? String(h.healthScore) : "—"],
                  ] as const
                ).map(([label, value]) => (
                  <li key={label} style={rowStyle}>
                    <span>{label}</span>
                    <span>{value}</span>
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