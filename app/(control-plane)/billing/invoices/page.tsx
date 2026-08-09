"use client";
/**
 * Billing → Invoices.
 * Invoice list plus an expandable per-invoice detail read from
 * `/platform/v1/invoices/:id`.
 */
import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, ReceiptText } from "lucide-react";
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

interface InvoiceRow {
  id?: string;
  number?: string;
  invoiceNumber?: string;
  amount?: number | string;
  amountTotal?: number | string;
  currency?: string;
  status?: string;
  issuedAt?: string;
  dueDate?: string;
  paidAt?: string;
  tenantId?: string;
  tenantName?: string;
}

export default function BillingInvoices() {
  const invoices = useList<InvoiceRow>({ path: "/platform/v1/invoices" });
  const [selected, setSelected] = useState<string | null>(null);

  const paidCount = invoices.data.filter(
    (i) => (i.status ?? "").toUpperCase() === "PAID",
  ).length;
  const openCount = invoices.data.filter(
    (i) => ["OPEN", "SENT", "PENDING", "PAST_DUE", "OVERDUE", "UNPAID"].includes((i.status ?? "").toUpperCase()),
  ).length;

  const stats: StatCardItem[] = [
    { label: "Invoices", value: invoices.total ?? invoices.data.length, icon: <FileText size={18} /> },
    { label: "Paid", value: paidCount, icon: <ReceiptText size={18} /> },
    { label: "Open / outstanding", value: openCount, icon: <ReceiptText size={18} /> },
  ];

  return (
    <DomainShell
      domainId="billing"
      title="Billing"
      description="Revenue, plans, subscriptions, invoices and metering across the platform."
      breadcrumb={[{ label: "Billing", href: "/billing" }, { label: "Invoices" }]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={3} />

        {invoices.loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
            <Spinner size="md" />
          </div>
        ) : invoices.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
            {invoices.error.message}
          </p>
        ) : invoices.data.length === 0 ? (
          <EmptyState title="No invoices" description="The invoices endpoint returned no rows." />
        ) : (
          <Card padding="none">
            <ul style={{ listStyle: "none", margin: 0, padding: "0 var(--space-4)", display: "flex", flexDirection: "column" }}>
              {invoices.data.map((inv) => {
                const key = inv.id ?? inv.number ?? inv.invoiceNumber ?? "?";
                const open = selected === key;
                return (
                  <li key={key} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <button
                      type="button"
                      onClick={() => setSelected(open ? null : key)}
                      aria-expanded={open}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "var(--space-3)",
                        padding: "var(--space-3) 0",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-text)",
                        font: "inherit",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <span style={{ fontWeight: 500 }}>
                          {inv.number ?? inv.invoiceNumber ?? inv.id ?? "—"}
                        </span>
                        {inv.tenantName ? (
                          <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                            · {inv.tenantName}
                          </span>
                        ) : null}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {inv.dueDate ? `due ${inv.dueDate}` : ""}
                        </span>
                        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>
                          {fmtMoney(inv.amount ?? inv.amountTotal)}
                        </span>
                        <Badge variant={invoiceVariant(inv.status)}>{inv.status ?? "UNKNOWN"}</Badge>
                      </span>
                    </button>
                    {open ? <InvoiceDetailContainer id={key} /> : null}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </DomainShell>
  );
}

function InvoiceDetailContainer({ id }: { id: string }) {
  const detail = useItem<InvoiceRow>(`/platform/v1/invoices/${id}`);
  return (
    <div style={{ paddingBottom: "var(--space-3)" }}>
      {detail.loading ? (
        <Spinner size="md" />
      ) : detail.error ? (
        <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
          {detail.error.message}
        </p>
      ) : detail.data ? (
        <dl style={{ margin: 0, fontSize: "var(--text-sm)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)" }}>
          <div>
            <dt style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)" }}>Amount</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{fmtMoney(detail.data.amount ?? detail.data.amountTotal)}</dd>
          </div>
          <div>
            <dt style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)" }}>Currency</dt>
            <dd style={{ margin: 0 }}>{detail.data.currency ?? "—"}</dd>
          </div>
          <div>
            <dt style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)" }}>Issued</dt>
            <dd style={{ margin: 0 }}>{detail.data.issuedAt ?? "—"}</dd>
          </div>
          <div>
            <dt style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)" }}>Due date</dt>
            <dd style={{ margin: 0 }}>{detail.data.dueDate ?? "—"}</dd>
          </div>
          <div>
            <dt style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)" }}>Paid at</dt>
            <dd style={{ margin: 0 }}>{detail.data.paidAt ?? "—"}</dd>
          </div>
          <div>
            <dt style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)" }}>Tenant</dt>
            <dd style={{ margin: 0 }}>{detail.data.tenantName ?? detail.data.tenantId ?? "—"}</dd>
          </div>
        </dl>
      ) : (
        <EmptyState title="No invoice detail" description="The invoice detail endpoint returned nothing." />
      )}
    </div>
  );
}

function invoiceVariant(
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