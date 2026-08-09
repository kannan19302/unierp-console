"use client";
/**
 * Tenants → Integrations.
 * Connected integrations per tenant, read from the tenant detail endpoint.
 * Pick a tenant to see its integration connections and statuses.
 */
import { useState } from "react";
import { Plug } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";
import TenantSelector from "../_tenant-select";
import { statusVariant } from "../_badge";
import styles from "../tenants.module.css";

interface IntegrationRow {
  id?: string;
  key?: string;
  name?: string;
  type?: string;
  provider?: string;
  status?: string;
  connected?: boolean;
  lastSyncAt?: string;
}

interface TenantDetail {
  id?: string;
  name?: string;
  plan?: string;
  status?: string;
  integrations?: IntegrationRow[] | null;
}

export default function TenantsIntegrations() {
  const [tenantId, setTenantId] = useState("");
  const { data: detail, loading, error } = useItem<TenantDetail>(
    tenantId ? `/platform/v1/super-admin/tenants/${tenantId}` : null,
  );

  const integrations: IntegrationRow[] = Array.isArray(detail?.integrations)
    ? (detail?.integrations as IntegrationRow[])
    : [];

  const connected = integrations.filter((i) => i.connected === true || String(i.status ?? "").toUpperCase() === "CONNECTED").length;

  const stats: StatCardItem[] = [
    { label: "Integrations", value: integrations.length || "—", icon: <Plug size={18} /> },
    { label: "Connected", value: connected || "—" },
    { label: "Plan", value: detail?.plan ?? "—" },
  ];

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Integrations"
      description="Integrations and connections per tenant."
    >
      <div className={styles.container}>
        <TenantSelector value={tenantId} onChange={setTenantId} />

        {!tenantId ? (
          <EmptyState title="Select a tenant" description="Pick a tenant above to inspect its integrations." />
        ) : loading ? (
          <div className={styles.loadingCenter}>
            <Spinner size="md" />
          </div>
        ) : error ? (
          <p className={styles.error}>
            {error.message}
          </p>
        ) : integrations.length === 0 ? (
          <EmptyState title="No integrations" description="The tenant detail endpoint returned no integration records." />
        ) : (
          <Card padding="md">
            <StatCardRow stats={stats} columns={3} />
            <ul className={styles.list}>
              {integrations.slice(0, 40).map((i, idx) => {
                const isConnected = i.connected === true || String(i.status ?? "").toUpperCase() === "CONNECTED";
                return (
                  <li
                    key={i.id ?? i.key ?? `${i.name ?? "integration"}-${idx}`}
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
                      {i.name ?? i.provider ?? i.key ?? i.type ?? "—"}
                    </span>
                    <span className={styles.listItemMeta}>
                      <span>{i.lastSyncAt ?? ""}</span>
                      <Badge variant={isConnected ? "success" : statusVariant(i.status)}>
                        {i.status ?? (isConnected ? "CONNECTED" : "DISCONNECTED")}
                      </Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </DomainShell>
  );
}