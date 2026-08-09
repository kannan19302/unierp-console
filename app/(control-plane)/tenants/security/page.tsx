"use client";
/**
 * Tenants → Security.
 * Security posture and settings per tenant, read from the tenant detail
 * endpoint. Pick a tenant to review its security policy map.
 */
import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
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

interface TenantDetail {
  id?: string;
  name?: string;
  plan?: string;
  status?: string;
  region?: string;
  security?: Record<string, unknown> | null;
}

export default function TenantsSecurity() {
  const [tenantId, setTenantId] = useState("");
  const { data: detail, loading, error } = useItem<TenantDetail>(
    tenantId ? `/platform/v1/super-admin/tenants/${tenantId}` : null,
  );

  const security: Record<string, unknown> = (detail?.security ?? {}) as Record<string, unknown>;
  const entries = Object.entries(security);

  const threats = Number(security.threats ?? security.openIncidents ?? 0) || 0;

  const stats: StatCardItem[] = [
    { label: "Policy keys", value: entries.length || "—", icon: <ShieldCheck size={18} /> },
    { label: "Open threats", value: threats || "—", icon: <ShieldCheck size={18} /> },
    { label: "Status", value: detail?.status ?? "—" },
  ];

  const valueText = (v: unknown): string => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "object") return JSON.stringify(v);
    if (typeof v === "boolean") return v ? "enabled" : "disabled";
    return String(v);
  };

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Security"
      description="Tenant security posture and policy settings."
    >
      <div className={styles.container}>
        <TenantSelector value={tenantId} onChange={setTenantId} permission="system.tenant.security" />

        {!tenantId ? (
          <EmptyState title="Select a tenant" description="Pick a tenant above to review its security posture." />
        ) : loading ? (
          <div className={styles.loadingCenter}>
            <Spinner size="md" />
          </div>
        ) : error ? (
          <p className={styles.error}>
            {error.message}
          </p>
        ) : (
          <Card padding="md">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
              <h3 className={styles.cardTitle}>
                <KeyRound size={16} style={{ verticalAlign: "-2px", marginRight: "var(--space-1)" }} />
                {detail?.name ?? detail?.id ?? "Tenant"} · security
              </h3>
              <Badge variant={statusVariant(detail?.status)}>{detail?.status ?? "UNKNOWN"}</Badge>
            </div>
            <div style={{ marginTop: "var(--space-3)" }}>
              <StatCardRow stats={stats} columns={3} />
            </div>

            {entries.length === 0 ? (
              <EmptyState title="No security settings" description="The tenant detail endpoint returned no security policy." />
            ) : (
              <ul className={styles.list}>
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
            )}
          </Card>
        )}
      </div>
    </DomainShell>
  );
}