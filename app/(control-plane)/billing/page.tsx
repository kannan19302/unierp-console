"use client";
/**
 * Billing → Overview.
 * Billing KPI dashboard: MRR/ARR, outstanding invoices and active
 * subscriptions, plus a recent-invoices list. Real control-plane data only.
 */
import { CreditCard, FileText, ReceiptText, TrendingUp, Users } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
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

const OUTSTANDING_STATUSES = ["OPEN", "SENT", "PENDING", "UNPAID", "PAST_DUE", "OVERDUE"];

interface InvoiceRow {
  id?: string;
  number?: string;
  invoiceNumber?: string;
  amount?: number;
  amountTotal?: number;
  currency?: string;
  status?: string;
  issuedAt?: string;
  dueDate?: string;
  tenantId?: string;
  tenantName?: string;
}

export default function BillingOverview() {
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");
  const invoices = useList<InvoiceRow>({ path: "/platform/v1/invoices" });

  const s = summary.data ?? {};
  const outstanding = invoices.data.filter((i) =>
    OUTSTANDING_STATUSES.includes((i.status ?? "").toUpperCase()),
  ).length;

  const activeSubs =
    s.activeSubscriptions ?? s.activeSubscriptionCount ?? s.subscriptionCount ?? s.totalSubscriptions ?? null;

  const stats: StatCardItem[] = [
    { label: "MRR", value: fmtMoney(s.mrr ?? s.monthlyRecurringRevenue), icon: <TrendingUp size={18} /> },
    { label: "ARR", value: fmtMoney(s.arr ?? s.annualRecurringRevenue), icon: <ReceiptText size={18} /> },
    { label: "Outstanding invoices", value: outstanding, icon: <FileText size={18} /> },
    {
      label: "Active subscriptions",
      value: activeSubs != null ? String(activeSubs) : "—",
      icon: <Users size={18} />,
    },
    { label: "Invoices issued", value: invoices.total ?? invoices.data.length, icon: <CreditCard size={18} /> },
  ];

  return (
    <DomainShell
      domainId="billing"
      title="Billing"
      description="Revenue, plans, subscriptions, invoices and metering across the platform."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={5} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Recent invoices</h3>
          {summary.loading || invoices.loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
              <Spinner size="md" />
            </div>
          ) : invoices.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
              {invoices.error.message}
            </p>
          ) : invoices.data.length === 0 ? (
            <EmptyState title="No invoices" description="The invoices endpoint returned no rows." />
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
              {invoices.data.slice(0, 10).map((inv) => (
                <li
                  key={inv.id ?? inv.number ?? inv.invoiceNumber ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                    gap: "var(--space-3)",
                  }}
                >
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
<span style={{ fontWeight: 500 }}>
                      {inv.number ?? inv.invoiceNumber ?? inv.id ?? "—"}
                    </span>
                    {inv.tenantName ? (
                      <span style={{ color: "var(--color-text-muted)", marginLeft: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                        · {inv.tenantName}
                      </span>
                    ) : null}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {fmtMoney(inv.amount ?? inv.amountTotal)}
                    </span>
                    <Badge variant={statusVariant(inv.status)}>{inv.status ?? "UNKNOWN"}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}

function statusVariant(
  status?: string,
): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  switch ((status ?? "").toUpperCase()) {
    case "PAID":
      return "success";
    case "OPEN":
    case "SENT":
    case "PENDING":
      return "info";
    case "PAST_DUE":
    case "OVERDUE":
    case "UNPAID":
      return "danger";
    default:
      return "default";
  }
}