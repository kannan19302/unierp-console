"use client";
/**
 * Billing → Usage.
 * Metered consumption across the platform (platform-wide summary and quota
 * limits) plus a per-tenant drill-down read from `/metering/:tenantId/usage`.
 */
import { useMemo, useState } from "react";
import { Activity, Gauge, SlidersHorizontal, Users } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  Select,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface MeterRow {
  meterKey?: string;
  metric?: string;
  name?: string;
  unit?: string;
  usage?: number;
  current?: number;
  p95?: number;
  quotaBreaches?: number;
  periodCount?: number;
}

interface QuotaLimitRow {
  id?: string;
  key?: string;
  name?: string;
  defaultLimit?: number;
  limit?: number;
  unit?: string;
  enabled?: boolean;
  enforced?: boolean;
}

interface TenantRow {
  id?: string;
  name?: string;
  status?: string;
}

interface TenantUsageRow {
  meterKey?: string;
  metric?: string;
  name?: string;
  unit?: string;
  usage?: number;
  used?: number;
  limit?: number;
  quotaBreaches?: number;
}

export default function BillingUsage() {
  const usage = useList<MeterRow>({ path: "/platform/v1/metering/usage-summary" });
  const limits = useList<QuotaLimitRow>({ path: "/platform/v1/metering/quota-limits" });
  const tenants = useList<TenantRow>({ path: "/platform/v1/super-admin/tenants" });
  const [selectedTenant, setSelectedTenant] = useState<string>("");

  const tenantsMemo = useMemo(
    () => tenants.data.filter((t) => t.id != null),
    [tenants.data],
  );

  const stats: StatCardItem[] = [
    { label: "Meters", value: usage.data.length, icon: <Activity size={18} /> },
    { label: "Quota limits", value: limits.data.length, icon: <SlidersHorizontal size={18} /> },
    { label: "Tenants metered", value: tenants.data.length, icon: <Users size={18} /> },
  ];

  return (
    <DomainShell
      domainId="billing"
      title="Billing"
      description="Revenue, plans, subscriptions, invoices and metering across the platform."
      breadcrumb={[{ label: "Billing", href: "/billing" }, { label: "Usage" }]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={3} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Platform usage summary</h3>
            {usage.loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
                <Spinner size="md" />
              </div>
            ) : usage.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {usage.error.message}
              </p>
            ) : usage.data.length === 0 ? (
              <EmptyState title="No metering data" description="The metering summary endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {usage.data.slice(0, 20).map((m) => (
                  <li
                    key={m.meterKey ?? m.metric ?? m.name ?? "?"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{m.name ?? m.metric ?? m.meterKey ?? "—"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {m.unit ?? ""}
                        {m.p95 != null ? ` · p95 ${m.p95}` : ""}
                        {m.quotaBreaches != null ? ` · ${m.quotaBreaches} breaches` : ""}
                      </span>
                      <Badge variant="primary">{m.usage ?? m.current ?? "—"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Quota limits</h3>
            {limits.loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
                <Spinner size="md" />
              </div>
            ) : limits.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {limits.error.message}
              </p>
            ) : limits.data.length === 0 ? (
              <EmptyState title="No quota limits" description="The quota-limits endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {limits.data.slice(0, 20).map((q) => (
                  <li
                    key={q.id ?? q.key ?? q.name ?? "?"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
                      <Gauge size={15} style={{ flexShrink: 0, color: "var(--color-text-muted)" }} />
                      <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {q.name ?? q.key ?? q.id ?? "—"}
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {q.defaultLimit ?? q.limit ?? "—"}
                        {q.unit ? ` ${q.unit}` : ""}
                      </span>
                      <Badge variant={q.enabled === false || q.enforced === false ? "default" : "success"}>
                        {q.enabled === false || q.enforced === false ? "Disabled" : "Enforced"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Per-tenant usage</h3>
          {tenants.loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
              <Spinner size="md" />
            </div>
          ) : tenants.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
              {tenants.error.message}
            </p>
          ) : (
            <>
              <div style={{ marginTop: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <label htmlFor="tenant-usage-select" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Tenant
                </label>
                <Select
                  id="tenant-usage-select"
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  style={{ maxWidth: 360, flex: 1 }}
                >
                  <option value="">Select a tenant…</option>
                  {tenantsMemo.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name ?? t.id}
                    </option>
                  ))}
                </Select>
              </div>
              {selectedTenant ? (
                <TenantUsage tenantId={selectedTenant} />
              ) : (
                <EmptyState
                  title="Pick a tenant"
                  description="Select a customer to see its metered usage for billing."
                />
              )}
            </>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}

function TenantUsage({ tenantId }: { tenantId: string }) {
  const usage = useItem<TenantUsageRow | TenantUsageRow[]>(
    `/platform/v1/metering/${tenantId}/usage`,
  );

  if (usage.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
        <Spinner size="md" />
      </div>
    );
  }
  if (usage.error) {
    return (
      <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
        {usage.error.message}
      </p>
    );
  }

  const rows: TenantUsageRow[] = Array.isArray(usage.data)
    ? (usage.data as TenantUsageRow[])
    : usage.data && typeof usage.data === "object"
      ? [usage.data as TenantUsageRow]
      : [];

  if (rows.length === 0) {
    return (
      <div style={{ marginTop: "var(--space-3)" }}>
        <EmptyState title="No usage recorded" description="The metering endpoint returned no usage for this tenant." />
      </div>
    );
  }

  return (
    <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
      {rows.slice(0, 20).map((row, i) => (
        <li
          key={`${row.meterKey ?? row.metric ?? row.name ?? "m"}-${i}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-3)",
            padding: "var(--space-2) 0",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <span style={{ fontWeight: 500 }}>{row.name ?? row.metric ?? row.meterKey ?? "—"}</span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            {row.usage ?? row.used ?? "—"}
            {row.unit ? ` ${row.unit}` : ""}
            {row.limit != null ? ` / ${row.limit}` : ""}
            {row.quotaBreaches != null ? ` · ${row.quotaBreaches} breaches` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}