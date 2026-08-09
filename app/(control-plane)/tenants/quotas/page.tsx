"use client";
/**
 * Tenants → Quotas.
 * Global quota rules plus per-tenant quota usage. Pick a tenant to see how
 * it stands against each rule.
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
import { statusVariant } from "../_badge";
import styles from "../tenants.module.css";

interface RuleRow {
  id?: string;
  key?: string;
  name?: string;
  defaultLimit?: number;
  enabled?: boolean;
  unit?: string;
}

interface QuotaRow {
  id?: string;
  ruleId?: string;
  ruleKey?: string;
  ruleName?: string;
  key?: string;
  name?: string;
  usage?: number;
  consumed?: number;
  limit?: number;
  threshold?: number;
  unit?: string;
  period?: string;
  breached?: boolean;
  over?: boolean;
}

export default function TenantsQuotas() {
  const [tenantId, setTenantId] = useState("");
  const rules = useList<RuleRow>({ path: "/platform/v1/quotas/rules" });
  const usage = useList<QuotaRow>({
    path: `/platform/v1/quotas/${tenantId}/usage`,
    disabled: !tenantId,
  });

  const enabledRules = rules.data.filter((r) => r.enabled !== false).length;
  const breached = usage.data.filter((q) => q.breached || q.over).length;

  const stats: StatCardItem[] = [
    { label: "Rules", value: rules.data.length, icon: <Gauge size={18} /> },
    { label: "Rules enabled", value: enabledRules },
    { label: "Breached", value: breached || "—" },
  ];

  if (rules.loading) {
    return (
      <DomainShell domainId="tenants" title="Tenants · Quotas" description="Quota rules and per-tenant consumption.">
        <div className={styles.loadingCenter}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Quotas"
      description="Quota rules and per-tenant consumption."
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={3} />

        <Card padding="md">
          <h3 className={styles.cardTitle}>Quota rules</h3>
          {rules.error ? (
            <p className={styles.error}>{rules.error.message}</p>
          ) : rules.data.length === 0 ? (
            <EmptyState title="No quota rules" description="The quota endpoint returned no rules." />
          ) : (
            <ul className={styles.list}>
              {rules.data.slice(0, 30).map((r) => (
                <li
                  key={r.id ?? r.key}
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
                    {r.name ?? r.key ?? "—"}
                  </span>
                  <span className={styles.listItemMeta}>
                    <span>
                      limit {r.defaultLimit != null ? r.defaultLimit.toLocaleString() : "—"}
                      {r.unit ? ` ${r.unit}` : ""}
                    </span>
                    <Badge variant={r.enabled === false ? "warning" : "success"}>
                      {r.enabled === false ? "DISABLED" : "ENABLED"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <section>
          <h3 className={styles.cardTitle}>Tenant consumption</h3>
          <div style={{ marginTop: "var(--space-3)" }}>
            <TenantSelector value={tenantId} onChange={setTenantId} permission="admin.quotas.read" />
          </div>

          {!tenantId ? (
            <div style={{ marginTop: "var(--space-4)" }}>
              <EmptyState title="Select a tenant" description="Pick a tenant above to read its quota usage." />
            </div>
          ) : usage.loading ? (
            <div className={styles.loadingCenter}>
              <Spinner size="md" />
            </div>
          ) : usage.error ? (
            <p className={styles.error}>
              {usage.error.message}
            </p>
          ) : usage.data.length === 0 ? (
            <div style={{ marginTop: "var(--space-4)" }}>
              <EmptyState title="No quota usage" description="The quota usage endpoint returned no rows for this tenant." />
            </div>
          ) : (
            <ul className={styles.list}>
              {usage.data.slice(0, 30).map((q) => {
                const used = Number(q.usage ?? q.consumed ?? 0);
                const limit = Number(q.limit ?? 0);
                const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                const qBreached = q.breached || q.over || (limit > 0 && used > limit);
                return (
                  <li
                    key={q.id ?? q.ruleKey ?? q.ruleName ?? "?"}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-1)",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
                      <span style={{ fontWeight: 500 }}>{q.name ?? q.ruleName ?? q.ruleKey ?? "—"}</span>
                      <span className={styles.listItemMeta}>
                        <span>
                          {used.toLocaleString()} / {limit ? limit.toLocaleString() : "—"}
                        </span>
                        {qBreached ? <Badge variant="danger">BREACHED</Badge> : <Badge variant="success">OK</Badge>}
                      </span>
                    </span>
                    {limit > 0 ? (
                      <div
                        style={{
                          height: "var(--space-1)",
                          borderRadius: "var(--radius-full)",
                          backgroundColor: "var(--color-bg-sunken)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            backgroundColor: qBreached ? "var(--color-danger)" : "var(--color-primary)",
                          }}
                        />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </DomainShell>
  );
}