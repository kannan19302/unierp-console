"use client";
/**
 * Billing → Subscriptions.
 * Subscription state for every tenant, read live from the per-tenant
 * subscription control-plane endpoint (`/subscriptions/:tenantId`).
 */
import { RefreshCw, Users } from "lucide-react";
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

interface TenantRow {
  id?: string;
  name?: string;
  status?: string;
  region?: string;
  plan?: string;
}

interface SubscriptionRow {
  id?: string;
  tenantId?: string;
  planId?: string;
  planName?: string;
  plan?: string;
  status?: string;
  price?: number | string;
  currency?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  periodStart?: string;
  periodEnd?: string;
  nextBillingDate?: string;
  nextBillingAt?: string;
  trialEndsAt?: string;
  seats?: number;
  quantity?: number;
  autoRenew?: boolean;
}

export default function BillingSubscriptions() {
  const tenants = useList<TenantRow>({ path: "/platform/v1/super-admin/tenants" });

  const stats: StatCardItem[] = [
    { label: "Tenants", value: tenants.data.length, icon: <Users size={18} /> },
    { label: "Subscriptions tracked", value: tenants.data.length, icon: <RefreshCw size={18} /> },
  ];

  return (
    <DomainShell
      domainId="billing"
      title="Billing"
      description="Revenue, plans, subscriptions, invoices and metering across the platform."
      breadcrumb={[{ label: "Billing", href: "/billing" }, { label: "Subscriptions" }]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={3} />

        {tenants.loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
            <Spinner size="md" />
          </div>
        ) : tenants.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
            {tenants.error.message}
          </p>
        ) : tenants.data.length === 0 ? (
          <EmptyState title="No tenants" description="The tenant API returned no rows." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
            {tenants.data.map((t) => (
              <TenantSubscription key={t.id ?? t.name ?? "?"} tenant={t} />
            ))}
          </div>
        )}
      </div>
    </DomainShell>
  );
}

function TenantSubscription({ tenant }: { tenant: TenantRow }) {
  if (!tenant.id) return null;
  return (
    <Card padding="md">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>{tenant.name ?? tenant.id}</h3>
        <Badge variant={tenantStatusVariant(tenant.status)}>{tenant.status ?? "UNKNOWN"}</Badge>
      </div>
      <SubscriptionBody tenantId={tenant.id} />
    </Card>
  );
}

function SubscriptionBody({ tenantId }: { tenantId: string }) {
  const sub = useItem<SubscriptionRow>(`/platform/v1/subscriptions/${tenantId}`);

  if (sub.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-6)" }}>
        <Spinner size="md" />
      </div>
    );
  }
  if (sub.error) {
    return (
      <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
        {sub.error.message}
      </p>
    );
  }
  if (!sub.data) {
    return (
      <div style={{ marginTop: "var(--space-3)" }}>
        <EmptyState
          title="No subscription record"
          description="This tenant has no subscription at the control-plane API."
        />
      </div>
    );
  }

  const data = sub.data;
  return (
    <dl style={{ margin: "var(--space-4) 0 0", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)" }}>
        <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Status</dt>
        <dd style={{ margin: 0 }}>
          <Badge variant={subscriptionVariant(data.status)}>{data.status ?? "UNKNOWN"}</Badge>
        </dd>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Plan</dt>
        <dd style={{ margin: 0, fontWeight: 500 }}>{data.planName ?? data.plan ?? "—"}</dd>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Price</dt>
        <dd style={{ margin: 0, fontWeight: 500 }}>{fmtMoney(data.price)}</dd>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Current period</dt>
        <dd style={{ margin: 0 }}>
          {data.currentPeriodStart ?? data.periodStart ?? "—"}
          {data.currentPeriodEnd ?? data.periodEnd ? ` → ${data.currentPeriodEnd ?? data.periodEnd}` : ""}
        </dd>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Next billing</dt>
        <dd style={{ margin: 0 }}>{data.nextBillingDate ?? data.nextBillingAt ?? "—"}</dd>
      </div>
      {data.trialEndsAt ? (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Trial ends</dt>
          <dd style={{ margin: 0 }}>{data.trialEndsAt}</dd>
        </div>
      ) : null}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Seats</dt>
        <dd style={{ margin: 0 }}>{data.seats ?? data.quantity ?? "—"}</dd>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Auto-renew</dt>
        <dd style={{ margin: 0 }}>{data.autoRenew != null ? (data.autoRenew ? "Yes" : "No") : "—"}</dd>
      </div>
    </dl>
  );
}

function tenantStatusVariant(
  status?: string,
): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
      return "success";
    case "TRIAL":
    case "PROVISIONING":
      return "info";
    case "SUSPENDED":
      return "danger";
    case "PAST_DUE":
      return "warning";
    default:
      return "default";
  }
}

function subscriptionVariant(
  status?: string,
): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
      return "success";
    case "TRIALING":
    case "TRIAL":
      return "info";
    case "PAST_DUE":
    case "UNPAID":
      return "danger";
    case "CANCELED":
    case "CANCELLED":
    case "EXPIRED":
      return "default";
    default:
      return "default";
  }
}