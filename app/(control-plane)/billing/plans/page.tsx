"use client";
/**
 * Billing → Plans.
 * Published billing plans, their pricing, billing cycle and how many
 * tenants are subscribed to each — read from the plans control-plane API.
 */
import { Layers, Package, Users } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

const fmtMoney = (v?: number | string | null): string =>
  typeof v === "number"
    ? `$${v.toLocaleString()}`
    : typeof v === "string" && v.length > 0
      ? v
      : "—";

interface PlanRow {
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  price?: number | string;
  currency?: string;
  billingCycle?: string;
  interval?: string;
  period?: string;
  tenantCount?: number;
  subscribers?: number;
  createdAt?: string;
}

export default function BillingPlans() {
  const plans = useList<PlanRow>({ path: "/platform/v1/plans" });

  const activeCount = plans.data.filter(
    (p) => (p.status ?? "").toUpperCase() === "ACTIVE",
  ).length;
  const subscriberCount = plans.data.reduce(
    (sum, p) => sum + (typeof p.tenantCount === "number" ? p.tenantCount : 0),
    0,
  );

  const stats: StatCardItem[] = [
    { label: "Plans", value: plans.data.length, icon: <Layers size={18} /> },
    { label: "Active plans", value: activeCount, icon: <Package size={18} /> },
    { label: "Subscribed tenants", value: subscriberCount, icon: <Users size={18} /> },
  ];

  return (
    <DomainShell
      domainId="billing"
      title="Billing"
      description="Revenue, plans, subscriptions, invoices and metering across the platform."
      breadcrumb={[{ label: "Billing", href: "/billing" }, { label: "Plans" }]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={3} />

        {plans.loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
            <Spinner size="md" />
          </div>
        ) : plans.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
            {plans.error.message}
          </p>
        ) : plans.data.length === 0 ? (
          <EmptyState title="No plans published" description="The plans endpoint returned no rows." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
            {plans.data.map((p) => (
              <Card key={p.id ?? p.name ?? "?"} padding="md">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
                      {p.name ?? "—"}
                    </h3>
                    {p.description ? (
                      <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {p.description}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={planVariant(p.status)}>{p.status ?? "UNKNOWN"}</Badge>
                </div>
                <div style={{ marginTop: "var(--space-4)", fontSize: "var(--text-xl)", fontWeight: 700 }}>
                  {fmtMoney(p.price)}
                  {p.billingCycle ?? p.interval ?? p.period ? (
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 400, color: "var(--color-text-muted)" }}>
                      {" "}
                      / {p.billingCycle ?? p.interval ?? p.period}
                    </span>
                  ) : null}
                </div>
                <dl style={{ margin: "var(--space-4) 0 0", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Subscribed tenants</dt>
                    <dd style={{ margin: 0, fontWeight: 500 }}>{p.tenantCount ?? p.subscribers ?? "—"}</dd>
                  </div>
                  {p.currency ? (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Currency</dt>
                      <dd style={{ margin: 0, fontWeight: 500 }}>{p.currency}</dd>
                    </div>
                  ) : null}
                  {p.createdAt ? (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Created</dt>
                      <dd style={{ margin: 0, fontWeight: 500 }}>{p.createdAt}</dd>
                    </div>
                  ) : null}
                </dl>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DomainShell>
  );
}

function planVariant(
  status?: string,
): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
    case "PUBLISHED":
      return "success";
    case "DRAFT":
    case "ARCHIVED":
    case "RETIRED":
    case "INACTIVE":
      return "default";
    default:
      return "default";
  }
}