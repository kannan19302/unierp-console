"use client";

import { Badge, Button } from "@kannan19302/ui";
import { DataWorkspace } from "@kannan19302/ui/shell";
import { CreditCard, FileText, ReceiptText, RefreshCw, TrendingUp, Users } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import { useItem, useList } from "@/lib/data";
import styles from "../ops/record-workspace.module.css";

interface InvoiceRow { id?: string; number?: string; invoiceNumber?: string; amount?: number; amountTotal?: number; currency?: string; status?: string; issuedAt?: string; dueDate?: string; tenantName?: string; }
const OUTSTANDING = ["OPEN", "SENT", "PENDING", "UNPAID", "PAST_DUE", "OVERDUE"];
const money = (value: unknown, currency?: string) => typeof value === "number" ? `${currency ?? "USD"} ${value.toLocaleString()}` : typeof value === "string" && value ? value : "Unknown";
const statusVariant = (status?: string): "success" | "default" | "warning" | "danger" | "info" => {
  const value = (status ?? "").toUpperCase();
  if (value === "PAID") return "success";
  if (["PAST_DUE", "OVERDUE", "UNPAID"].includes(value)) return "danger";
  if (["OPEN", "SENT", "PENDING"].includes(value)) return "info";
  return "default";
};

export default function BillingOverview() {
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");
  const invoices = useList<InvoiceRow>({ path: "/platform/v1/invoices" });
  const sourceUnknown = summary.loading || invoices.loading || Boolean(summary.error || invoices.error);
  const activeSubs = summary.data?.activeSubscriptions ?? summary.data?.activeSubscriptionCount ?? summary.data?.subscriptionCount;
  const outstanding = invoices.data.filter((invoice) => OUTSTANDING.includes((invoice.status ?? "").toUpperCase())).length;
  const stats = [
    ["MRR", summary.data?.mrr ?? summary.data?.monthlyRecurringRevenue, <TrendingUp key="mrr-icon" size={18} />],
    ["ARR", summary.data?.arr ?? summary.data?.annualRecurringRevenue, <ReceiptText key="arr-icon" size={18} />],
    ["Outstanding invoices", outstanding, <FileText key="outstanding-icon" size={18} />],
    ["Active subscriptions", activeSubs, <Users key="subscriptions-icon" size={18} />],
    ["Invoices issued", invoices.total ?? invoices.data.length, <CreditCard key="issued-icon" size={18} />],
  ] as const;
  return <DomainShell domainId="billing" title="Billing" description="Revenue, plans, subscriptions, invoices and metering across the platform."
    actions={<Button variant="outline" size="sm" disabled={invoices.loading} onClick={() => { void summary.reload(); void invoices.reload(); }}><RefreshCw size={14} aria-hidden="true" />Refresh billing</Button>}>
    <div className={styles.container}>
      <section className={styles.summaryStrip} aria-label="Billing summary">
        {stats.map(([label, value, icon]) => <div className={styles.summaryItem} key={label}><span>{icon}{label}</span><strong>{sourceUnknown ? "Unknown" : label === "MRR" || label === "ARR" ? money(value) : value == null ? "Unknown" : String(value)}</strong></div>)}
      </section>
      <section className={styles.workspacePanel} aria-labelledby="billing-invoices-heading">
        <div className={styles.panelHeader}><div><h2 id="billing-invoices-heading">Invoice register</h2><p>Recent invoices reported by the billing service. Amounts and status are not inferred.</p></div></div>
        <div className={styles.panelBody}><DataWorkspace<InvoiceRow> data={invoices.data} loading={invoices.loading} getRowId={(row, index) => row.id ?? row.number ?? row.invoiceNumber ?? `invoice-${index}`}
          searchPlaceholder="Search invoices…" error={invoices.error ? <p role="alert" className={styles.sourceError}>{invoices.error.message}</p> : undefined}
          emptyTitle={invoices.error ? "Invoice source unavailable" : "No invoices reported"} emptyDescription="No invoice rows were returned by the billing service."
          columns={[
            { key: "number", header: "Invoice", render: (_value, row) => <><span className={styles.recordTitle}>{row.number ?? row.invoiceNumber ?? row.id ?? "Unknown"}</span><span className={styles.recordDetail}>{row.tenantName ?? "Tenant not reported"}</span></> },
            { key: "amount", header: "Amount", render: (_value, row) => money(row.amount ?? row.amountTotal, row.currency) },
            { key: "status", header: "Status", render: (value) => <Badge variant={statusVariant(typeof value === "string" ? value : undefined)}>{String(value ?? "UNKNOWN")}</Badge> },
            { key: "issuedAt", header: "Issued", render: (value) => typeof value === "string" && value ? new Date(value).toLocaleDateString() : "Not reported" },
            { key: "dueDate", header: "Due", render: (value) => typeof value === "string" && value ? new Date(value).toLocaleDateString() : "Not reported" },
          ]}
        /></div>
      </section>
    </div>
  </DomainShell>;
}
