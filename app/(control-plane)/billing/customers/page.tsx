"use client";
/**
 * Billing → Customers.
 * Every tenant is a billing customer. This page reads the real tenant
 * registry and surfaces whom the platform bills.
 */
import { Building2, Users, Globe, AlertTriangle } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface TenantRow {
  id?: string;
  name?: string;
  status?: string;
  region?: string;
  plan?: string;
  email?: string;
  contactEmail?: string;
  createdAt?: string;
}

export default function BillingCustomers() {
  const canView = usePermission("system.tenant.view");
  const tenants = useList<TenantRow>({
    path: "/platform/v1/super-admin/tenants",
    disabled: !canView,
  });

  const activeCount = tenants.data.filter(
    (t) => (t.status ?? "").toUpperCase() === "ACTIVE",
  ).length;
  const suspendedCount = tenants.data.filter(
    (t) => (t.status ?? "").toUpperCase() === "SUSPENDED",
  ).length;
  const trialCount = tenants.data.filter(
    (t) => ["TRIAL", "PROVISIONING"].includes((t.status ?? "").toUpperCase()),
  ).length;

  const stats: StatCardItem[] = [
    { label: "Customers", value: tenants.data.length, icon: <Users size={18} /> },
    { label: "Active", value: activeCount, icon: <Building2 size={18} /> },
    { label: "Trial / provisioning", value: trialCount, icon: <Globe size={18} /> },
    { label: "Suspended", value: suspendedCount, icon: <AlertTriangle size={18} /> },
  ];

  return (
    <DomainShell
      domainId="billing"
      title="Billing"
      description="Revenue, plans, subscriptions, invoices and metering across the platform."
      breadcrumb={[{ label: "Billing", href: "/billing" }, { label: "Customers" }]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        {!canView ? (
          <EmptyState
            title="Access required"
            description="You need the system.tenant.view permission to list billing customers."
          />
        ) : tenants.loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
            <Spinner size="md" />
          </div>
        ) : tenants.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
            {tenants.error.message}
          </p>
        ) : tenants.data.length === 0 ? (
          <EmptyState title="No customers" description="The tenant API returned no rows." />
        ) : (
          <Card padding="none">
            <ul style={{ listStyle: "none", margin: 0, padding: "0 var(--space-4)", display: "flex", flexDirection: "column" }}>
              {tenants.data.map((t) => (
                <li
                  key={t.id ?? t.name ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-3) 0",
                    borderBottom: "1px solid var(--color-border)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 200 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--color-primary-light, rgba(59,130,246,0.12))",
                        flexShrink: 0,
                        fontSize: "var(--text-sm)",
                        fontWeight: 700,
                        color: "var(--color-primary)",
                      }}
                    >
                      {(t.name ?? t.id ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.name ?? "—"}
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        {t.id ?? ""}
                        {t.email ?? t.contactEmail ? ` · ${t.email ?? t.contactEmail}` : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {t.plan ?? "—"}
                      {t.region ? ` · ${t.region}` : ""}
                    </span>
                    <Badge variant={tenantVariant(t.status)}>{t.status ?? "UNKNOWN"}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </DomainShell>
  );
}

function tenantVariant(
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