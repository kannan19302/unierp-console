"use client";
/**
 * Tenants → Subscription.
 * Per-tenant subscription record from the subscription endpoint. Pick a
 * tenant to see its plan, billing cycle, seats and add-ons.
 */
import { useState } from "react";
import { CalendarDays, CreditCard, Users } from "lucide-react";
import {
  Badge,
  Card,
  DescriptionList,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";
import TenantSelector from "../_tenant-select";
import { money, statusVariant } from "../_badge";
import styles from "../tenants.module.css";

interface Addon {
  key?: string;
  name?: string;
  price?: number;
  quantity?: number;
}

interface Subscription {
  id?: string;
  tenantId?: string;
  plan?: string;
  planName?: string;
  status?: string;
  billingCycle?: string;
  price?: number;
  pricePerSeat?: number;
  seats?: number;
  seatsProvided?: number;
  seatsUsed?: number;
  startedAt?: string;
  currentPeriodEnd?: string;
  nextRenewalAt?: string;
  addons?: Addon[];
}

export default function TenantsSubscription() {
  const [tenantId, setTenantId] = useState("");
  const { data: sub, loading, error } = useItem<Subscription>(
    tenantId ? `/platform/v1/subscriptions/${tenantId}` : null,
  );

  const seats = Number(sub?.seats ?? sub?.seatsProvided ?? 0);
  const price = Number(sub?.price ?? sub?.pricePerSeat ?? 0);

  const stats: StatCardItem[] = [
    { label: "Plan", value: sub?.plan ?? sub?.planName ?? "—", icon: <CreditCard size={18} /> },
    { label: "Seats", value: seats || "—", icon: <Users size={18} /> },
    {
      label: "Next renewal",
      value: sub?.nextRenewalAt ?? sub?.currentPeriodEnd ?? "—",
      icon: <CalendarDays size={18} />,
    },
  ];

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Subscription"
      description="Plan, billing cycle and capacity per tenant."
    >
      <div className={styles.container}>
        <TenantSelector value={tenantId} onChange={setTenantId} permission="admin.subscription.read" />

        {!tenantId ? (
          <EmptyState title="Select a tenant" description="Pick a tenant above to read its subscription record." />
        ) : loading ? (
          <div className={styles.loadingCenter}>
            <Spinner size="md" />
          </div>
        ) : error ? (
          <p className={styles.error}>
            {error.message}
          </p>
        ) : !sub ? (
          <EmptyState title="No subscription data" description="The subscription endpoint returned no record for this tenant." />
        ) : (
          <>
            <StatCardRow stats={stats} columns={3} />

            <Card padding="md">
              <h3 className={styles.cardTitle}>Subscription</h3>
              <div style={{ marginTop: "var(--space-3)" }}>
                <DescriptionList
                  items={[
                    { label: "Plan", value: sub.plan ?? sub.planName ?? "—" },
                    {
                      label: "Status",
                      value: <Badge variant={statusVariant(sub.status)}>{sub.status ?? "UNKNOWN"}</Badge>,
                    },
                    { label: "Price", value: price ? money(price) : "—" },
                    { label: "Billing cycle", value: sub.billingCycle ?? "—" },
                    { label: "Seats used", value: sub.seatsUsed != null ? String(sub.seatsUsed) : "—" },
                    { label: "Started at", value: sub.startedAt ?? "—" },
                    { label: "Renewal at", value: sub.nextRenewalAt ?? sub.currentPeriodEnd ?? "—" },
                  ]}
                />
              </div>
            </Card>

            <Card padding="md">
              <h3 className={styles.cardTitle}>Add-ons</h3>
              {!sub.addons || sub.addons.length === 0 ? (
                <EmptyState title="No add-ons" description="This tenant has no subscription add-ons." />
              ) : (
                <ul className={styles.list}>
                  {sub.addons.map((a, i) => (
                    <li
                      key={a.key ?? `${a.name ?? "addon"}-${i}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "var(--space-2) 0",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{a.name ?? a.key ?? "—"}</span>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {a.quantity != null ? `${a.quantity} × ` : ""}
                        {a.price != null ? money(a.price) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </DomainShell>
  );
}