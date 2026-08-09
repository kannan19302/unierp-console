"use client";
/**
 * Billing → Payments.
 * Payment and collection state across the platform. The control plane does
 * not expose a payments list endpoint, so this page derives payment rows
 * from the real invoices endpoint (paid date / method / amount) and reads
 * aggregate collection figures from the operations dashboard.
 */
import { CreditCard, DollarSign, FileText, AlertTriangle } from "lucide-react";
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

const fmtMoney = (v?: number | string | null): string =>
  typeof v === "number"
    ? `$${v.toLocaleString()}`
    : typeof v === "string" && v.length > 0
      ? v
      : "—";

const OUTSTANDING_STATUSES = ["OPEN", "SENT", "PENDING", "UNPAID", "PAST_DUE", "OVERDUE"];

interface PaymentRow {
  id?: string;
  number?: string;
  invoiceNumber?: string;
  amount?: number | string;
  amountTotal?: number | string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  method?: string;
  paidAt?: string;
  transactionId?: string;
  dueDate?: string;
  tenantId?: string;
  tenantName?: string;
}

export default function BillingPayments() {
  const invoices = useList<PaymentRow>({ path: "/platform/v1/invoices" });
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");

  const paidCount = invoices.data.filter(
    (i) => (i.status ?? i.paymentStatus ?? "").toUpperCase() === "PAID",
  ).length;
  const outstandingCount = invoices.data.filter((i) =>
    OUTSTANDING_STATUSES.includes((i.status ?? i.paymentStatus ?? "").toUpperCase()),
  ).length;
  const refundedCount = invoices.data.filter(
    (i) => ["REFUNDED", "VOID", "CANCELED", "CANCELLED"].includes((i.status ?? i.paymentStatus ?? "").toUpperCase()),
  ).length;

  const s = summary.data ?? {};

  const stats: StatCardItem[] = [
    { label: "Payments recorded", value: paidCount, icon: <CreditCard size={18} /> },
    { label: "Outstanding", value: outstandingCount, icon: <FileText size={18} /> },
    { label: "Refunded / void", value: refundedCount, icon: <DollarSign size={18} /> },
    {
      label: "Collection rate",
      value: s.collectionRate != null ? String(s.collectionRate) : "—",
      icon: <AlertTriangle size={18} />,
    },
  ];

  return (
    <DomainShell
      domainId="billing"
      title="Billing"
      description="Revenue, plans, subscriptions, invoices and metering across the platform."
      breadcrumb={[{ label: "Billing", href: "/billing" }, { label: "Payments" }]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Payment activity</h3>
          {summary.loading || invoices.loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
              <Spinner size="md" />
            </div>
          ) : invoices.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
              {invoices.error.message}
            </p>
          ) : invoices.data.length === 0 ? (
            <EmptyState title="No payment activity" description="The invoices endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {invoices.data.slice(0, 20).map((inv) => (
                <li
                  key={inv.id ?? inv.number ?? inv.invoiceNumber ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {inv.number ?? inv.invoiceNumber ?? inv.id ?? "—"}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {inv.tenantName ?? inv.tenantId ?? ""}
                      {inv.transactionId ? ` · tx ${inv.transactionId}` : ""}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", textAlign: "right" }}>
                      {inv.paymentMethod ?? inv.method ? (
                        <>
                          {inv.paymentMethod ?? inv.method}
                          <br />
                        </>
                      ) : null}
                      {inv.paidAt ?? ""}
                    </span>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>
                      {fmtMoney(inv.amount ?? inv.amountTotal)}
                    </span>
                    <Badge variant={paymentVariant(inv.status ?? inv.paymentStatus)}>
                      {inv.status ?? inv.paymentStatus ?? "UNKNOWN"}
                    </Badge>
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

function paymentVariant(
  status?: string,
): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  switch ((status ?? "").toUpperCase()) {
    case "PAID":
    case "COMPLETED":
    case "SUCCEEDED":
      return "success";
    case "OPEN":
    case "SENT":
    case "PENDING":
      return "info";
    case "PAST_DUE":
    case "OVERDUE":
    case "UNPAID":
    case "FAILED":
      return "danger";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "warning";
    default:
      return "default";
  }
}