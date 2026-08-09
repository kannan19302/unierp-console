"use client";
/**
 * Tenants → Support.
 * Support tickets filtered by tenant from the support endpoint. Pick a
 * tenant to see its open and historical tickets.
 */
import { useState } from "react";
import { LifeBuoy } from "lucide-react";
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
import { priorityVariant, statusVariant } from "../_badge";
import styles from "../tenants.module.css";

interface TicketRow {
  id?: string;
  subject?: string;
  title?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function TenantsSupport() {
  const [tenantId, setTenantId] = useState("");
  const tickets = useList<TicketRow>({
    path: `/platform/v1/support/${tenantId}/tickets`,
    disabled: !tenantId,
  });

  const open = tickets.data.filter(
    (t) => String(t.status ?? "").toUpperCase() !== "CLOSED" &&
      String(t.status ?? "").toUpperCase() !== "RESOLVED",
  ).length;
  const high = tickets.data.filter(
    (t) => ["P1", "P2", "CRITICAL", "HIGH", "URGENT"].includes(String(t.priority ?? "").toUpperCase()),
  ).length;

  const stats: StatCardItem[] = [
    { label: "Tickets", value: (tickets.total ?? tickets.data.length) || "—", icon: <LifeBuoy size={18} /> },
    { label: "Open", value: open || "—" },
    { label: "High priority", value: high || "—" },
  ];

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Support"
      description="Support tickets per tenant."
    >
      <div className={styles.container}>
        <TenantSelector value={tenantId} onChange={setTenantId} />

        {!tenantId ? (
          <EmptyState title="Select a tenant" description="Pick a tenant above to read its support tickets." />
        ) : tickets.loading ? (
          <div className={styles.loadingCenter}>
            <Spinner size="md" />
          </div>
        ) : tickets.error ? (
          <p className={styles.error}>
            {tickets.error.message}
          </p>
        ) : tickets.data.length === 0 ? (
          <EmptyState title="No support tickets" description="The support endpoint returned no tickets for this tenant." />
        ) : (
          <Card padding="md">
            <StatCardRow stats={stats} columns={3} />
            <ul className={styles.list}>
              {tickets.data.slice(0, 40).map((t) => (
                <li
                  key={t.id ?? `${t.subject ?? "ticket"}-${t.createdAt ?? ""}`}
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
                      {t.subject ?? t.title ?? "—"}
                    </span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {t.category ?? "general"}
                      {t.assignee ? ` · ${t.assignee}` : ""}
                    </span>
                  </span>
                  <span className={styles.listItemMeta}>
                    <Badge variant={priorityVariant(t.priority)}>{t.priority ?? "NORMAL"}</Badge>
                    <Badge variant={statusVariant(t.status)}>{t.status ?? "UNKNOWN"}</Badge>
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