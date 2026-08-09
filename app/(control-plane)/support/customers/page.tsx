"use client";
/**
 * Support → Customers.
 * Tenants surfaced as support customers, read from the super-admin tenant
 * directory.
 */
import { Users, Building2, MapPin, CreditCard } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface CustomerRow {
  id: string;
  name?: string;
  status?: string;
  plan?: string;
  region?: string;
  tier?: string;
  createdAt?: string;
  domain?: string;
}

function fmtDate(v?: string): string {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString();
}

function customerVariant(status?: string): "success" | "warning" | "danger" | "info" | "default" {
  const st = (status ?? "").toUpperCase();
  if (["ACTIVE", "LIVE", "OPERATIONAL"].includes(st)) return "success";
  if (["TRIALING", "TRIAL", "PAUSED", "SUSPENDED"].includes(st)) return "warning";
  if (["TERMINATED", "DELETED", "BANNED", "DISABLED"].includes(st)) return "danger";
  if (["PROVISIONING", "PENDING", "ONBOARDING"].includes(st)) return "info";
  return "default";
}

export default function SupportCustomers() {
  const customers = useList<CustomerRow>({ path: "/platform/v1/super-admin/tenants" });

  const total = customers.total ?? customers.data.length;
  const active = customers.data.filter((c) =>
    ["ACTIVE", "LIVE", "OPERATIONAL"].includes((c.status ?? "").toUpperCase()),
  ).length;

  const stats: StatCardItem[] = [
    { label: "Customers", value: total, icon: <Users size={18} />, loading: customers.loading },
    { label: "Active", value: active, icon: <Building2 size={18} />, loading: customers.loading },
    { label: "Trial / suspended", value: customers.data.length - active, loading: customers.loading },
    { label: "Regions", value: new Set(customers.data.map((c) => c.region).filter(Boolean)).size },
  ];

  return (
    <DomainShell
      domainId="support"
      title="Customers"
      description="Every tenant as a support customer."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />
        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Customer directory</h3>
          {customers.loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-10)" }}>
              <Spinner size="md" />
            </div>
          ) : customers.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{customers.error.message}</p>
          ) : customers.data.length === 0 ? (
            <EmptyState title="No customers" description="The tenant directory returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {customers.data.map((c) => (
                <li
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-3) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 600 }}>{c.name ?? c.id}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
                        <MapPin size={12} /> {c.region ?? "—"}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
                        <CreditCard size={12} /> {c.plan ?? c.tier ?? "—"}
                      </span>
                      <span>{c.domain ?? "—"}</span>
                      <span>since {fmtDate(c.createdAt)}</span>
                    </span>
                  </span>
                  <Badge variant={customerVariant(c.status)}>{c.status ?? "UNKNOWN"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}