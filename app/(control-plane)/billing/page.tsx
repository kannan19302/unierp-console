"use client";

import React, { useState } from "react";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  FileText,
  Percent,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import { Button, Card, Badge, StatusBadge, useToast } from "@kannan19302/ui";

export default function BillingPage() {
  const { success, info } = useToast();
  const [plans, setPlans] = useState([
    { id: "p1", name: "STARTER TIER", price: "$99 / mo", tenants: 420, maxUsers: 10, maxStorage: "50 GB", apiLimit: "1,000 req/min" },
    { id: "p2", name: "BUSINESS TIER", price: "$499 / mo", tenants: 680, maxUsers: 50, maxStorage: "200 GB", apiLimit: "2,500 req/min" },
    { id: "p3", name: "ENTERPRISE TIER", price: "Custom ($2,500+ / mo)", tenants: 148, maxUsers: "Unlimited", maxStorage: "2,000 GB", apiLimit: "10,000 req/min" },
  ]);

  const handleRetryPayment = (invId: string) => {
    success("Payment Charge Retried", `Dispatched Stripe charge retry for invoice ${invId}.`);
  };

  const handleGenerateInvoice = () => {
    info("Custom Enterprise Invoice Generated", "PDF invoice generated and emailed to billing contact.");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px 0", color: "var(--color-text)" }}>
            Revenue Operations & Subscription Billing
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 14 }}>
            MRR/ARR growth metrics, tiered plan builder, metered usage reconciliation & invoice processor.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="primary" onClick={handleGenerateInvoice} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
            <Plus size={16} /> Create Enterprise Quote / Invoice
          </Button>
        </div>
      </div>

      {/* Top Financial Stat Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Monthly Recurring Revenue</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-text)", marginTop: 4 }}>$420,500</div>
          <span style={{ fontSize: 12, color: "#34d399" }}>+14.2% MoM Growth</span>
        </div>

        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Annual Run Rate (ARR)</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-text)", marginTop: 4 }}>$5,046,000</div>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Projected FY2026</span>
        </div>

        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Net Revenue Retention (NRR)</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#34d399", marginTop: 4 }}>128.4%</div>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Expansion vs Churn</span>
        </div>

        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Pending Invoices</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#fbbf24", marginTop: 4 }}>$12,400 (4)</div>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Dunning Retry Queue</span>
        </div>
      </div>

      {/* Tiered Subscription Plan Catalog Builder */}
      <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0", color: "var(--color-text)" }}>Subscription Plan Catalog & Quotas</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {plans.map((p) => (
            <div key={p.id} style={{ padding: 18, borderRadius: 10, backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa" }}>{p.name}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)", margin: "8px 0" }}>{p.price}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 12 }}>{p.tenants} Active Tenants Subscribed</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--color-text-secondary)" }}>
                <div>• Max Seats: {p.maxUsers}</div>
                <div>• Storage Cap: {p.maxStorage}</div>
                <div>• API Speed: {p.apiLimit}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Invoices & Dunning Retry Center */}
      <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0", color: "var(--color-text)" }}>Recent Tenant Invoices & Dunning Status</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>Invoice ID</th>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>Tenant</th>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>Amount</th>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>Billing Period</th>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>Status</th>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[
              { id: "INV-2026-0801", tenant: "Acme Corporation", amount: "$2,500.00", period: "Aug 2026", status: "PAID" },
              { id: "INV-2026-0802", tenant: "Stark Industries", amount: "$4,800.00", period: "Aug 2026", status: "PAID" },
              { id: "INV-2026-0803", tenant: "Cyberdyne Systems", amount: "$99.00", period: "Aug 2026", status: "FAILED_RETRY_1" },
              { id: "INV-2026-0804", tenant: "Wayne Enterprises", amount: "$5,000.00", period: "Aug 2026", status: "PAID" },
            ].map((inv) => (
              <tr key={inv.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "10px 14px", color: "#60a5fa", fontWeight: 600 }}>{inv.id}</td>
                <td style={{ padding: "10px 14px", color: "var(--color-text)" }}>{inv.tenant}</td>
                <td style={{ padding: "10px 14px", color: "var(--color-text)", fontWeight: 600 }}>{inv.amount}</td>
                <td style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>{inv.period}</td>
                <td style={{ padding: "10px 14px" }}>
                  <StatusBadge status={inv.status} />
                </td>
                <td style={{ padding: "10px 14px" }}>
                  {inv.status !== "PAID" ? (
                    <Button size="sm" variant="primary" onClick={() => handleRetryPayment(inv.id)}>
                      Retry Payment
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => info("PDF Downloaded", `Downloaded ${inv.id}.pdf`)}>
                      <Download size={14} /> PDF
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
