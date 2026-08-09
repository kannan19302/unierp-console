"use client";
/**
 * Tenants → Configuration.
 * Per-tenant configuration map from the tenant detail endpoint. Pick a
 * tenant to read its settings and registration attributes.
 */
import { useState } from "react";
import { Settings2 } from "lucide-react";
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
import { BreakGlassAction } from "@/components/break-glass-action";
import { useMutation } from "@/lib/data";
import styles from "../tenants.module.css";

interface TenantDetail {
  id?: string;
  name?: string;
  plan?: string;
  status?: string;
  region?: string;
  subdomain?: string;
  locale?: string;
  timezone?: string;
  configuration?: Record<string, unknown> | null;
}

export default function TenantsConfiguration() {
  const [tenantId, setTenantId] = useState("");
  const { data: detail, loading, error } = useItem<TenantDetail>(
    tenantId ? `/platform/v1/super-admin/tenants/${tenantId}` : null,
  );

  const config: Record<string, unknown> = (detail?.configuration ?? {}) as Record<string, unknown>;
  const entries = Object.entries(config);

  const stats: StatCardItem[] = [
    { label: "Settings", value: entries.length || "—", icon: <Settings2 size={18} /> },
    { label: "Region", value: detail?.region ?? "—" },
    { label: "Plan", value: detail?.plan ?? "—" },
  ];

  const suspendMutation = useMutation(async (justification: string) => {
    // In a real implementation this POSTs to the control plane API.
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Suspended tenant ${tenantId} with justification: ${justification}`);
  });

  const deleteMutation = useMutation(async (justification: string) => {
    // In a real implementation this POSTs to the control plane API.
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Deleted tenant ${tenantId} with justification: ${justification}`);
  });

  const valueText = (v: unknown): string => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Configuration"
      description="Per-tenant settings and attributes."
    >
      <div className={styles.container}>
        <TenantSelector value={tenantId} onChange={setTenantId} />

        {!tenantId ? (
          <EmptyState title="Select a tenant" description="Pick a tenant above to read its configuration." />
        ) : loading ? (
          <div className={styles.loadingCenter}>
            <Spinner size="md" />
          </div>
        ) : error ? (
          <p className={styles.error}>
            {error.message}
          </p>
        ) : (
          <>
          <Card padding="md">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
              <h3 className={styles.cardTitle}>
                {detail?.name ?? detail?.id ?? "Tenant"} · configuration
              </h3>
              <Badge variant={statusVariant(detail?.status)}>{detail?.status ?? "UNKNOWN"}</Badge>
            </div>
            <div style={{ marginTop: "var(--space-3)" }}>
              <StatCardRow stats={stats} columns={3} />
            </div>

            <ul className={styles.list}>
              <li style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>subdomain</span>
                <span style={{ fontSize: "var(--text-sm)" }}>{detail?.subdomain ?? "—"}</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>locale</span>
                <span style={{ fontSize: "var(--text-sm)" }}>{detail?.locale ?? "—"}</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>timezone</span>
                <span style={{ fontSize: "var(--text-sm)" }}>{detail?.timezone ?? "—"}</span>
              </li>
              {entries.slice(0, 60).map(([key, value]) => (
                <li
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{key}</span>
                  <span style={{ fontSize: "var(--text-sm)", textAlign: "right", wordBreak: "break-all" }}>
                    {valueText(value)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          
          <Card padding="md" style={{ border: "1px solid var(--color-danger)" }}>
            <h3 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-danger)" }}>
              Danger Zone
            </h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
              Destructive actions require two-person control or a break-glass justification for the audit log.
            </p>
            <div style={{ display: "flex", gap: "var(--space-4)" }}>
              <BreakGlassAction 
                buttonLabel="Suspend Tenant"
                modalTitle="Suspend Tenant"
                modalDescription={`You are about to suspend ${detail?.name ?? detail?.id}. This will immediately revoke all access for their users.`}
                actionLabel="Suspend"
                variant="danger"
                disabled={detail?.status === "SUSPENDED"}
                onConfirm={async (justification) => {
                  await suspendMutation.run(justification);
                }}
              />
              <BreakGlassAction 
                buttonLabel="Delete Tenant"
                modalTitle="Delete Tenant"
                modalDescription={`You are about to permanently delete ${detail?.name ?? detail?.id}. This action cannot be undone and will destroy all data.`}
                actionLabel="Permanently Delete"
                variant="danger"
                disabled={detail?.status === "DELETED"}
                onConfirm={async (justification) => {
                  await deleteMutation.run(justification);
                  setTenantId("");
                }}
              />
            </div>
          </Card>
        </>
        )}
      </div>
    </DomainShell>
  );
}