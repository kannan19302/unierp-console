"use client";
/**
 * Tenants → Modules (PCC-05 Entitlement & Feature Licensing).
 * Module enablement per tenant, read from the tenant detail endpoint. Pick a
 * tenant to inspect which ERP modules are switched on.
 */
import { useState } from "react";
import { Boxes, RefreshCw, Zap } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";
import TenantSelector from "../_tenant-select";
import { statusVariant } from "../_badge";
import styles from "../tenants.module.css";

interface ModuleRow {
  key?: string;
  code?: string;
  name?: string;
  enabled?: boolean;
  status?: string;
}

interface TenantDetail {
  id?: string;
  name?: string;
  plan?: string;
  status?: string;
  region?: string;
  modules?: ModuleRow[] | Record<string, unknown>;
}

export default function TenantsModules() {
  const toast = useToast();
  const canSyncQuota = usePermission("system.entitlementquota.sync");

  const [tenantId, setTenantId] = useState("");
  const [syncing, setSyncing] = useState(false);

  const { data: detail, loading, error, reload } = useItem<TenantDetail>(
    tenantId ? `/platform/v1/super-admin/tenants/${tenantId}` : null,
  );

  const handleSyncQuota = async () => {
    if (!tenantId) return;
    setSyncing(true);
    try {
      await api.post(`/platform/v1/entitlement-quota/${tenantId}/sync`);
      await reload();
      toast.success("Quota Synced", `Synchronized resource quotas from plan entitlements for tenant ${tenantId}.`);
    } catch {
      toast.error("Sync Failed", "Could not sync resource quotas from plan entitlements.");
    } finally {
      setSyncing(false);
    }
  };

  const moduleList: ModuleRow[] = Array.isArray(detail?.modules)
    ? (detail?.modules as ModuleRow[])
    : [];

  const enabled = moduleList.filter(
    (m) => m.enabled === true || String(m.status ?? "").toUpperCase() === "ENABLED",
  ).length;

  const stats: StatCardItem[] = [
    { label: "Modules", value: moduleList.length || "—", icon: <Boxes size={18} /> },
    { label: "Enabled", value: enabled || "—" },
    { label: "Plan", value: detail?.plan ?? "—" },
  ];

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Entitlements & Modules"
      description="Profit-licensed ERP modules, feature grants, and plan-bound resource quota syncing."
      actions={
        tenantId ? (
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => reload()}
            >
              <RefreshCw size={14} />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSyncQuota}
              disabled={syncing || !canSyncQuota}
            >
              <Zap size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Sync Plan Quotas"}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className={styles.container}>
        <TenantSelector value={tenantId} onChange={setTenantId} />

        {!tenantId ? (
          <EmptyState title="Select a tenant" description="Pick a tenant above to inspect its module enablement." />
        ) : loading ? (
          <div className={styles.loadingCenter}>
            <Spinner size="md" />
          </div>
        ) : error ? (
          <p className={styles.error}>
            {error.message}
          </p>
        ) : moduleList.length === 0 ? (
          <EmptyState title="No module data" description="The tenant detail endpoint returned no module records." />
        ) : (
          <Card padding="md">
            <StatCardRow stats={stats} columns={3} />
            <ul className={styles.list}>
              {moduleList.slice(0, 40).map((m, i) => {
                const active = m.enabled === true || String(m.status ?? "").toUpperCase() === "ENABLED";
                return (
                  <li
                    key={m.key ?? m.code ?? `${m.name ?? "module"}-${i}`}
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
                      {m.name ?? m.code ?? m.key ?? "—"}
                    </span>
                    <Badge variant={active ? "success" : "default"}>
                      {active ? "ENABLED" : (m.status ?? "DISABLED")}
                    </Badge>
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