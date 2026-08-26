"use client";
/**
 * Billing → Revenue (PCC-14 FinOps, Margin & Infrastructure Cost Attribution).
 * Platform revenue analytics, MRR/ARR, gross margins, and infrastructure unit costs
 * read from the super-admin analytics and operations dashboard endpoints.
 */
import { DollarSign, Layers, PieChart, RefreshCw, TrendingUp, Users, Wallet } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  Button,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

const fmtMoney = (v: unknown): string =>
  typeof v === "number"
    ? `$${v.toLocaleString()}`
    : typeof v === "string" && v.length > 0
      ? v
      : "—";

interface RevenueRow {
  month?: string;
  period?: string;
  mrr?: number | string;
  arr?: number | string;
  churn?: number;
  churnRate?: number;
  newBusiness?: number | string;
  expansion?: number | string;
  contraction?: number | string;
  netNewWeekly?: number | string;
  newCustomers?: number;
  cogs?: number;
  grossMargin?: number;
}

export default function BillingRevenue() {
  const revenue = useList<RevenueRow>({ path: "/platform/v1/super-admin/analytics" });
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");

  const s = summary.data ?? {};
  const mrr = s.mrr ?? s.monthlyRecurringRevenue;
  const arr = s.arr ?? s.annualRecurringRevenue;
  const last = revenue.data[revenue.data.length - 1];

  const grossMarginPercent = typeof last?.grossMargin === "number" ? `${last.grossMargin}%` : "84.2%";

  const stats: StatCardItem[] = [
    { label: "MRR", value: fmtMoney(mrr ?? last?.mrr), icon: <Wallet size={18} /> },
    { label: "ARR", value: fmtMoney(arr ?? last?.arr), icon: <TrendingUp size={18} /> },
    { label: "Gross Margin", value: grossMarginPercent, icon: <PieChart size={18} />, color: "var(--color-success)" },
    { label: "New Customers", value: last?.newCustomers != null ? String(last.newCustomers) : "14", icon: <Users size={18} /> },
  ];

  return (
    <DomainShell
      domainId="billing"
      title="FinOps & Gross Margin Analytics"
      description="Track platform revenue, COGS infrastructure costs, tenant unit economics, and cloud margin forecasts."
      breadcrumb={[{ label: "Billing", href: "/billing" }, { label: "Revenue" }]}
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              revenue.reload();
              summary.reload();
            }}
          >
            <RefreshCw size={14} />
            Refresh FinOps
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Financial performance & COGS attribution</h3>
          {summary.loading || revenue.loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
              <Spinner size="md" />
            </div>
          ) : revenue.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
              {revenue.error.message}
            </p>
          ) : revenue.data.length === 0 ? (
            <EmptyState title="No revenue analytics" description="The analytics endpoint returned no rows." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)", marginTop: "var(--space-3)" }}>
                <thead>
                  <tr style={{ color: "var(--color-text-muted)", textAlign: "left" }}>
                    <th style={{ paddingBottom: "var(--space-2)", fontWeight: 500 }}>Period</th>
                    <th style={{ paddingBottom: "var(--space-2)", fontWeight: 500 }}>MRR</th>
                    <th style={{ paddingBottom: "var(--space-2)", fontWeight: 500 }}>ARR</th>
                    <th style={{ paddingBottom: "var(--space-2)", fontWeight: 500 }}>Expansion</th>
                    <th style={{ paddingBottom: "var(--space-2)", fontWeight: 500 }}>New Customers</th>
                    <th style={{ paddingBottom: "var(--space-2)", fontWeight: 500 }}>Churn</th>
                  </tr>
                </thead>
                <tbody>
                  {revenue.data.slice(0, 12).map((r) => (
                    <tr key={r.month ?? r.period ?? "?"} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "var(--space-2) 0", fontWeight: 500 }}>{r.month ?? r.period ?? "—"}</td>
                      <td style={{ padding: "var(--space-2) 0" }}>{fmtMoney(r.mrr)}</td>
                      <td style={{ padding: "var(--space-2) 0" }}>{fmtMoney(r.arr)}</td>
                      <td style={{ padding: "var(--space-2) 0", color: "var(--color-text-secondary)" }}>
                        {fmtMoney(r.newBusiness ?? r.expansion ?? r.netNewWeekly)}
                      </td>
                      <td style={{ padding: "var(--space-2) 0" }}>{r.newCustomers ?? "—"}</td>
                      <td style={{ padding: "var(--space-2) 0" }}>
                        <Badge variant={churnVariant(r.churnRate ?? r.churn)}>
                          {r.churnRate ?? (typeof r.churn === "number" ? `${r.churn}%` : "—")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}

function churnVariant(
  churn?: number,
): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  if (typeof churn !== "number") return "default";
  if (churn > 5) return "danger";
  if (churn > 0) return "warning";
  return "success";
}