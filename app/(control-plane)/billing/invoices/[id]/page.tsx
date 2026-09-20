"use client";
/**
 * Billing → Invoice Detail.
 * Line items inspection, tax/discount calculation breakdown, and credit note issuance.
 */
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Download,
  FileText,
  Plus,
  ReceiptText,
  RefreshCw,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ForbiddenState,
  Spinner,
  usePermission,
} from "@kannan19302/ui";
import { api } from "@/lib/api";
import { useToast } from "@/lib/use-toast";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import { formatDate } from "@/lib/format-date";
import DomainShell from "@/components/domain-shell";
import { CrudDrawer } from "@/components/CrudDrawer";
import {
  type BillingInvoice,
  creditNoteSchema,
  creditNoteDrawerFields,
} from "@/lib/billing-schema";
import styles from "./invoice-detail.module.css";

function statusVariant(status: string): "success" | "warning" | "danger" | "default" | "info" {
  switch (status) {
    case "PAID":
      return "success";
    case "PENDING":
      return "info";
    case "OVERDUE":
      return "danger";
    case "CANCELLED":
    case "REFUNDED":
      return "default";
    default:
      return "default";
  }
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const canAccess = usePermission("pcc.billing.view");
  const canWrite = usePermission("system.invoice.write");

  const [invoice, setInvoice] = useState<BillingInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditNoteOpen, setCreditNoteOpen] = useState(false);

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get<BillingInvoice>(`/platform/v1/invoices/${id}`);
      setInvoice(res.data);
    } catch (err: any) {
      toast.error("Failed to load invoice", err.message || "Invoice details could not be retrieved.");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Real-time updates
  useDomainRealtime("billing", fetchInvoice);

  const handleIssueCreditNote = async (values: Record<string, any>) => {
    if (!invoice) return;
    try {
      await api.post("/platform/v1/invoices/credit-notes", {
        invoiceId: invoice.id,
        amount: Number(values.amount),
        reason: values.reason,
      });
      toast.success("Credit Note Issued", `Applied credit note of $${values.amount} to ${invoice.invoiceNumber}.`);
      setCreditNoteOpen(false);
      fetchInvoice();
    } catch (err: any) {
      toast.error("Issuance Failed", err.message || "Failed to create credit note.");
    }
  };

  if (!canAccess) {
    return (
      <DomainShell domainId="billing" title="Invoice Detail">
        <ForbiddenState
          title="Access Restricted"
          description="You do not have permission (pcc.billing.view) to inspect invoice details."
        />
      </DomainShell>
    );
  }

  if (loading && !invoice) {
    return (
      <DomainShell domainId="billing" title="Invoice Detail">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  if (!invoice) {
    return (
      <DomainShell domainId="billing" title="Invoice Detail">
        <EmptyState
          title="Invoice Not Found"
          description="The requested invoice record could not be found."
          action={
            <Link href="/billing/invoices" style={{ textDecoration: "none" }}>
              <Button variant="outline">Back to Invoices</Button>
            </Link>
          }
        />
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="billing"
      title={`Invoice: ${invoice.invoiceNumber}`}
      description="Itemized charges, settlement status, and financial adjustment trail."
    >
      <div className={styles.container}>
        <div>
          <Link href="/billing/invoices" className={styles.backLink}>
            <ArrowLeft size={14} />
            <span>Back to Invoices Directory</span>
          </Link>
        </div>

        {/* Invoice Header Card */}
        <Card padding="lg">
          <div className={styles.headerCard}>
            <div className={styles.titleArea}>
              <div className={styles.titleRow}>
                <h2 className={styles.title}>{invoice.invoiceNumber}</h2>
                <Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge>
                <Badge variant="default">{invoice.currency}</Badge>
              </div>
              <p className={styles.description}>
                Issued for tenant: <strong>{invoice.tenant?.name || invoice.tenantId}</strong>
              </p>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" size="sm" onClick={fetchInvoice}>
                <RefreshCw size={13} />
                Refresh
              </Button>

              {canWrite && invoice.status !== "CANCELLED" && (
                <Button variant="primary" size="sm" onClick={() => setCreditNoteOpen(true)}>
                  <Plus size={13} />
                  Issue Credit Note
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Two-Column Detail View */}
        <div className={styles.grid}>
          {/* Left Column: Line Items Table */}
          <Card padding="md">
            <h3 style={{ margin: "0 0 var(--space-3) 0", fontSize: "var(--text-base)", fontWeight: 600 }}>
              Billed Line Items
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table className={styles.lineTable}>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines && invoice.lines.length > 0 ? (
                    invoice.lines.map((line) => (
                      <tr key={line.id}>
                        <td>{line.description}</td>
                        <td>
                          <Badge variant="default">{line.type}</Badge>
                        </td>
                        <td style={{ textAlign: "right" }}>{line.quantity}</td>
                        <td style={{ textAlign: "right" }}>${Number(line.unitPrice).toFixed(2)}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          ${Number(line.totalPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--color-text-secondary)", padding: "var(--space-4)" }}>
                        No itemized lines recorded for this invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Right Column: Financial Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <Card padding="md">
              <h3 style={{ margin: "0 0 var(--space-3) 0", fontSize: "var(--text-base)", fontWeight: 600 }}>
                Financial Breakdown
              </h3>
              <div className={styles.totalsList}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>${Number(invoice.subtotal).toFixed(2)}</span>
                </div>
                {Number(invoice.discountAmount) > 0 && (
                  <div className={styles.totalRow} style={{ color: "var(--color-success)" }}>
                    <span>Discounts Applied</span>
                    <span>-${Number(invoice.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <span>Taxes &amp; VAT</span>
                  <span>${Number(invoice.taxAmount).toFixed(2)}</span>
                </div>
                <div className={styles.totalRowFinal}>
                  <span>Total Amount</span>
                  <span>${Number(invoice.totalAmount).toFixed(2)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Amount Paid</span>
                  <span>${Number(invoice.amountPaid).toFixed(2)}</span>
                </div>
                <div className={styles.totalRow} style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                  <span>Balance Due</span>
                  <span>${Number(invoice.amountDue).toFixed(2)}</span>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <h3 style={{ margin: "0 0 var(--space-3) 0", fontSize: "var(--text-base)", fontWeight: 600 }}>
                Payment Timeline
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Created</span>
                  <span>{formatDate(invoice.createdAt)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Due Date</span>
                  <span>{invoice.dueDate ? formatDate(invoice.dueDate) : "Immediate"}</span>
                </div>
                {invoice.paidAt && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Settled At</span>
                    <span>{formatDate(invoice.paidAt)}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Credit Note Drawer */}
        {creditNoteOpen && (
          <CrudDrawer
            open={creditNoteOpen}
            title={`Issue Credit Note: ${invoice.invoiceNumber}`}
            mode="create"
            schema={creditNoteSchema}
            fields={creditNoteDrawerFields}
            initialValues={{ amount: 25, reason: "SLA service outage credit" }}
            onSubmit={handleIssueCreditNote}
            onClose={() => setCreditNoteOpen(false)}
          />
        )}
      </div>
    </DomainShell>
  );
}
