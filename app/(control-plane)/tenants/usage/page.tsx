"use client";
/**
 * Tenants → Usage.
 * Metered consumption for a tenant from the metering endpoint. Pick a
 * tenant to inspect its usage against each meter.
 */
import { useState } from "react";
import { Gauge } from "lucide-react";
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
import TenantSelector from "../_tenant-select";
import styles from "../tenants.module.css";

interface UsageRow {
  id?: string;
  meterKey?: string;
  metric?: string;
  name?: string;
  unit?: string;
  usage?: number;
  quantity?: number;
  consumed?: number;
  period?: string;
  periodStart?: string;
  periodEnd?: string;
  overQuota?: boolean;
}

export default function TenantsUsage() {
  const [tenantId, setTenantId] = useState("");
  const usage = useList<UsageRow>({
    path: `/platform/v1/metering/${tenantId}/usage`,
    disabled: !tenantId,
  });

  const overQuota = usage.data.filter((m) => m.overQuota).length;
  const totalConsumed = usage.data.reduce((sum, m) => sum + Number(m.usage ?? m.quantity ?? 0), 0);

  const stats: StatCardItem[] = [
    { label: "Meters", value: usage.data.length || "—", icon: <Gauge size={18} /> },
    { label: "Over quota", value: overQuota || "—", icon: <Gauge size={18} /> },
    { label: "Consumed (total)", value: totalConsumed ? totalConsumed.toLocaleString() : "—" },
  ];

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Usage"
      description="Metered consumption for a single tenant."
    >
      <div className={styles.container}>
        <TenantSelector value={tenantId} onChange={setTenantId} permission="system.analytics.read" />

        {!tenantId ? (
          <EmptyState title="Select a tenant" description="Pick a tenant above to read its metering usage." />
        ) : usage.loading ? (
          <div className={styles.loadingCenter}>
            <Spinner size="md" />
          </div>
        ) : usage.error ? (
          <p className={styles.error}>
            {usage.error.message}
          </p>
        ) : usage.data.length === 0 ? (
          <EmptyState title="No usage data" description="The metering endpoint returned no rows for this tenant." />
        ) : (
          <Card padding="md">
            <StatCardRow stats={stats} columns={3} />
            <ul className={styles.list}>
              {usage.data.slice(0, 40).map((m) => (
                <li
                  key={m.id ?? m.meterKey ?? m.metric ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span className={styles.listItemName}>
                    {m.name ?? m.metric ?? m.meterKey ?? "—"}
                  </span>
                  <span className={styles.listItemMeta}>
                    <span>
                      {Number(m.usage ?? m.quantity ?? m.consumed ?? 0).toLocaleString()}
                      {m.unit ? ` ${m.unit}` : ""}
                    </span>
                    <span>{m.period ?? m.periodEnd ?? ""}</span>
                    {m.overQuota ? <Badge variant="danger">OVER</Badge> : null}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </DomainShell>
  );
}