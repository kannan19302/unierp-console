"use client";
/**
 * Tenants → Activity.
 * Per-tenant audit trail from the audit endpoint. Pick a tenant to review
 * who did what, when and from where.
 */
import { useState } from "react";
import { FileClock } from "lucide-react";
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

interface AuditRow {
  id?: string;
  actor?: string;
  actorEmail?: string;
  action?: string;
  resource?: string;
  resourceType?: string;
  entity?: string;
  result?: string;
  outcome?: string;
  ip?: string;
  remoteIp?: string;
  createdAt?: string;
  timestamp?: string;
}

export default function TenantsActivity() {
  const [tenantId, setTenantId] = useState("");
  const audit = useList<AuditRow>({
    path: `/platform/v1/super-admin/tenants/${tenantId}/audit-trail`,
    disabled: !tenantId,
  });

  const actors = new Set(audit.data.map((a) => a.actor ?? a.actorEmail ?? "")).size;
  const failed = audit.data.filter(
    (a) => String(a.result ?? a.outcome ?? "").toUpperCase() === "FAILED",
  ).length;

  const stats: StatCardItem[] = [
    { label: "Events", value: (audit.total ?? audit.data.length) || "—", icon: <FileClock size={18} /> },
    { label: "Unique actors", value: actors || "—" },
    { label: "Failed", value: failed || "—" },
  ];

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Activity"
      description="Audit trail per tenant."
    >
      <div className={styles.container}>
        <TenantSelector value={tenantId} onChange={setTenantId} />

        {!tenantId ? (
          <EmptyState title="Select a tenant" description="Pick a tenant above to read its audit trail." />
        ) : audit.loading ? (
          <div className={styles.loadingCenter}>
            <Spinner size="md" />
          </div>
        ) : audit.error ? (
          <p className={styles.error}>
            {audit.error.message}
          </p>
        ) : audit.data.length === 0 ? (
          <EmptyState title="No audit events" description="The audit trail endpoint returned no rows for this tenant." />
        ) : (
          <Card padding="md">
            <StatCardRow stats={stats} columns={3} />
            <ul className={styles.list}>
              {audit.data.slice(0, 40).map((a) => (
                <li
                  key={a.id ?? `${a.actor}-${a.timestamp ?? a.createdAt}`}
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
                    <span style={{ fontWeight: 500, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.action ?? a.resource ?? a.entity ?? "action"}
                    </span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {a.resourceType ?? "resource"}
                      {a.ip ? ` · ${a.ip}` : a.remoteIp ? ` · ${a.remoteIp}` : ""}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {a.actor ?? a.actorEmail ?? "System"}
                      <br />
                      {a.timestamp ?? a.createdAt ?? ""}
                    </span>
                    <Badge variant={statusVariant(a.result ?? a.outcome)}>
                      {a.result ?? a.outcome ?? "UNKNOWN"}
                    </Badge>
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