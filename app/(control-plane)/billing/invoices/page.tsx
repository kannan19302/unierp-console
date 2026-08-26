"use client";
/**
 * Billing → Invoices (PCC-06 Enterprise Billing & Revenue Engine).
 * Invoice list plus an expandable per-invoice detail read from
 * `/platform/v1/invoices/:id`, credit notes, and adjustments.
 */
import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Plus, ReceiptText, RefreshCw, SlidersHorizontal } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  Button,
  FormField,
  Input,
  Modal,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import { api } from "@/lib/api";
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
  const toast = useToast();
  const canWriteInvoice = usePermission("system.invoice.write");

  const invoices = useList<InvoiceRow>({ path: "/platform/v1/invoices" });
  const [selected, setSelected] = useState<string | null>(null);

  const [creditNoteOpen, setCreditNoteOpen] = useState(false);
  const [targetInvoiceId, setTargetInvoiceId] = useState("");
  const [targetTenantId, setTargetTenantId] = useState("tnt_prod_01");
  const [creditAmount, setCreditAmount] = useState("50");
  const [creditReason, setCreditReason] = useState("SLA Credit for service degradation");
  const [issuingCredit, setIssuingCredit] = useState(false);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("200");
  const [adjustReason, setAdjustReason] = useState("Negotiated volume discount adjustment");
  const [adjusting, setAdjusting] = useState(false);

  const handleCreateCreditNote = async () => {
    setIssuingCredit(true);
    try {
      await api.post("/platform/v1/invoices/credit-notes", {
        invoiceId: targetInvoiceId,
        tenantId: targetTenantId,
        amount: parseFloat(creditAmount) || 0,
        reason: creditReason,
        actorId: "billing-operator",
      });
      await invoices.reload();
      toast.success("Credit Note Issued", `Issued $${creditAmount} credit note for invoice ${targetInvoiceId}.`);
      setCreditNoteOpen(false);
      setTargetInvoiceId("");
    } catch {
      toast.error("Credit Note Failed", "Failed to create credit note.");
    } finally {
      setIssuingCredit(false);
    }
  };

  const handleAdjustInvoice = async () => {
    if (!selected) return;
    setAdjusting(true);
    try {
      await api.post(`/platform/v1/invoices/${selected}/adjust`, {
        newAmount: parseFloat(adjustAmount) || 0,
        reason: adjustReason,
        actorId: "billing-operator",
      });
      await invoices.reload();
      toast.success("Invoice Adjusted", `Invoice ${selected} amount updated to $${adjustAmount}.`);
      setAdjustOpen(false);
    } catch {
      toast.error("Adjustment Failed", "Failed to adjust invoice.");
    } finally {
      setAdjusting(false);
    }
  };

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
      title="Enterprise Invoices & Settlement"
      description="Multi-tenant invoice registry, credit notes, adjustments, and settlement workflows."
      breadcrumb={[{ label: "Billing", href: "/billing" }, { label: "Invoices" }]}
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => invoices.reload()}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreditNoteOpen(true)}
            disabled={!canWriteInvoice}
          >
            <Plus size={14} />
            Issue Credit Note
          </Button>
        </div>
      }
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
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "var(--space-3)",
                        padding: "var(--space-3) 0",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelected(open ? null : key)}
                        aria-expanded={open}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-2)",
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--color-text)",
                          font: "inherit",
                          flex: 1,
                        }}
                      >
                        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <span style={{ fontWeight: 500 }}>
                          {inv.number ?? inv.invoiceNumber ?? inv.id ?? "—"}
                        </span>
                        {inv.tenantName ? (
                          <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                            · {inv.tenantName}
                          </span>
                        ) : null}
                      </button>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {inv.dueDate ? `due ${inv.dueDate}` : ""}
                        </span>
                        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>
                          {fmtMoney(inv.amount ?? inv.amountTotal)}
                        </span>
                        <Badge variant={invoiceVariant(inv.status)}>{inv.status ?? "UNKNOWN"}</Badge>
                        {canWriteInvoice && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(key);
                              setAdjustOpen(true);
                            }}
                          >
                            <SlidersHorizontal size={12} />
                            Adjust
                          </Button>
                        )}
                      </div>
                    </div>
                    {open ? <InvoiceDetailContainer id={key} /> : null}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      <Modal
        open={creditNoteOpen}
        onClose={() => setCreditNoteOpen(false)}
        title="Issue Commercial Credit Note"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Apply a credit adjustment or SLA reimbursement against a customer account or specific invoice.
          </p>
          <FormField label="Invoice ID / Ref" required>
            <Input
              value={targetInvoiceId}
              onChange={(e) => setTargetInvoiceId(e.target.value)}
              placeholder="e.g. inv_2026_001"
            />
          </FormField>
          <FormField label="Tenant ID" required>
            <Input
              value={targetTenantId}
              onChange={(e) => setTargetTenantId(e.target.value)}
              placeholder="tnt_prod_01"
            />
          </FormField>
          <FormField label="Credit Amount (USD)" required>
            <Input
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              type="number"
              placeholder="50"
            />
          </FormField>
          <FormField label="Reason for Credit" required>
            <Input
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              placeholder="e.g. SLA breach credit compensation"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setCreditNoteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCreditNote}
              disabled={issuingCredit || !targetInvoiceId.trim()}
            >
              {issuingCredit ? "Issuing..." : "Issue Credit Note"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title={`Adjust Invoice ${selected}`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Modify the final billed amount with operator audit justification.
          </p>
          <FormField label="New Total Amount (USD)" required>
            <Input
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              type="number"
              placeholder="200"
            />
          </FormField>
          <FormField label="Adjustment Reason" required>
            <Input
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Operator override for negotiated enterprise terms"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAdjustInvoice}
              disabled={adjusting || !adjustAmount.trim()}
            >
              {adjusting ? "Adjusting..." : "Apply Adjustment"}
            </Button>
          </div>
        </div>
      </Modal>
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