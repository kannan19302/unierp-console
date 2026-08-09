"use client";
/**
 * TenantSelector — shared tenant picker for the per-tenant sub-tabs.
 * Loads the real tenant registry and drives the `:tenantId` endpoints used
 * by Subscription, Usage, Quotas, Modules, Configuration, Security,
 * Integrations, Data, Structure, Activity and Support.
 */
import { Badge, EmptyState, Spinner, usePermission } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import { statusVariant } from "./_badge";
import styles from "./tenants.module.css";

export interface TenantOption {
  id: string;
  name?: string;
  region?: string;
  status?: string;
}

interface TenantSelectorProps {
  value: string;
  onChange: (id: string) => void;
  permission?: string;
  label?: string;
}

export default function TenantSelector({
  value,
  onChange,
  permission,
  label = "Tenant",
}: TenantSelectorProps) {
  const flag = usePermission(permission ?? "");
  const tenants = useList<TenantOption>({
    path: "/platform/v1/super-admin/tenants",
    disabled: permission ? !flag : false,
  });

  const selected = tenants.data.find((t) => t.id === value) ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <label
        htmlFor="tenant-selector"
        style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-secondary)" }}
      >
        {label}
      </label>
      {tenants.error ? (
        <p className={styles.error}>
          {tenants.error.message}
        </p>
      ) : tenants.loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Spinner size="sm" />
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Loading tenants…
          </span>
        </div>
      ) : tenants.data.length === 0 ? (
        <EmptyState title="No tenants available" description="The tenants endpoint returned no rows." />
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <select
            id="tenant-selector"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-bg-elevated)",
              color: "var(--color-text)",
              fontSize: "var(--text-sm)",
              minWidth: 280,
            }}
          >
            <option value="">Select a tenant…</option>
            {tenants.data.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name ?? t.id}
              </option>
            ))}
          </select>
          {selected ? (
            <>
              <Badge variant={statusVariant(selected.status)}>{selected.status ?? "UNKNOWN"}</Badge>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                {selected.region ?? "—"}
              </span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}