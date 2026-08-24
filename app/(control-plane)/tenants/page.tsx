"use client";
/**
 * Tenants → Overview (landing tab).
 * KPI dashboard for the tenant registry: registry totals, lifecycle status
 * mix, MRR and a rolling list of tenants from the control-plane endpoints.
 */
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CircleOff,
  CreditCard,
  ShieldBan,
} from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ForbiddenState,
  DataTable,
  StatCardRow,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import { useRealtimeData } from "@/lib/use-realtime-data";
import DomainShell from "@/components/domain-shell";
import { money, statusVariant } from "./_badge";
import styles from "./tenants.module.css";

interface TenantRow {
  id: string;
  name?: string;
  region?: string;
  status?: string;
  plan?: string;
  createdAt?: string;
}

interface LifecycleItem {
  id?: string;
  tenantId?: string;
  stage?: string;
  stageLabel?: string;
  status?: string;
  startedAt?: string;
  updatedAt?: string;
  scheduledFor?: string;
}

export default function TenantsOverview() {
  const canView = usePermission("system.tenant.view");
  const tenants = useList<TenantRow>({
    path: "/platform/v1/super-admin/tenants",
    disabled: !canView,
  });
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");

  // Listen to WebSocket events for real-time tenant status changes
  useRealtimeData(["tenant.update", "tenant.create", "tenant.delete"], tenants.reload);

  const firstTenant = tenants.data[0] ?? null;
  const lifecycle = useItem<LifecycleItem>(
    firstTenant ? `/platform/v1/tenants/${firstTenant.id}/lifecycle` : null,
  );

  const s = summary.data ?? {};
  const active = tenants.data.filter((t) => t.status === "ACTIVE").length;
  const suspended = tenants.data.filter((t) => t.status === "SUSPENDED").length;
  const offboarding = tenants.data.filter((t) => t.status === "OFFBOARDING").length;

  const totalTenants = Number(s.totalTenants) || tenants.data.length || 0;

  const stats: StatCardItem[] = [
    { label: "Total tenants", value: totalTenants, icon: <Building2 size={18} /> },
    { label: "Active", value: Number(s.activeTenants) || active, icon: <CheckCircle2 size={18} /> },
    { label: "Suspended", value: Number(s.suspendedTenants) || suspended, icon: <ShieldBan size={18} /> },
    { label: "Offboarding", value: offboarding, icon: <CircleOff size={18} /> },
    { label: "MRR", value: money(s.mrr), icon: <CreditCard size={18} /> },
  ];

  const statusCounts = tenants.data.reduce<Record<string, number>>((acc, t) => {
    const key = t.status ?? "UNKNOWN";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const statusEntries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);

  // Only block on tenants — the critical dataset. Summary degrades gracefully.
  const loading = tenants.loading;

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Overview"
      description="Tenant registry, KPIs and lifecycle at a glance."
    >
      <div className={styles.container}>
        {!canView ? (
          <ForbiddenState />
        ) : loading ? (
          <LoadingState message="Loading tenants..." />
        ) : (
          <>
            <StatCardRow stats={stats} columns={5} />

            <div className={styles.grid}>
              <Card padding="md">
                <h3 className={styles.cardTitle}>Tenant registry</h3>
                {tenants.error ? (
                  <ErrorState description={tenants.error.message} onRetry={tenants.reload} />
                ) : tenants.data.length === 0 ? (
                  <EmptyState title="No tenant data" description="The tenant API returned no rows." />
                ) : (
                  <DataTable
                    columns={[
                      { key: "name", header: "Tenant", width: "250px", render: (row: any) => row.name ?? row.id },
                      { key: "region", header: "Region", width: "120px", render: (row: any) => row.region ?? "—" },
                      { key: "status", header: "Status", width: "150px", render: (row: any) => <Badge variant={statusVariant(row.status)}>{row.status ?? "UNKNOWN"}</Badge> },
                    ]}
                    data={tenants.data.slice(0, 8)}
                  />
                )}
              </Card>

              <Card padding="md">
                <h3 className={styles.cardTitle}>Lifecycle snapshot</h3>
                {statusEntries.length === 0 ? (
                  <EmptyState title="No lifecycle stats" description="The tenant API returned no status counts." />
                ) : (
                  <ul className={styles.list}>
                    {statusEntries.map(([status, count]) => (
                      <li key={status} className={styles.listItem}>
                        <span className={styles.listItemMeta}>
                          <Badge variant={statusVariant(status)}>{status}</Badge>
                        </span>
                        <span style={{ fontWeight: 600 }}>{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {firstTenant ? (
                  <div className={styles.lifecycleContainer}>
                    <p className={styles.lifecycleTitle}>
                      Lifecycle · {firstTenant.name ?? firstTenant.id}
                    </p>
                    {lifecycle.error ? (
                      <ErrorState description={lifecycle.error.message} onRetry={lifecycle.reload} />
                    ) : lifecycle.data ? (
                      <ul className={styles.lifecycleList}>
                        <li className={styles.lifecycleRow}>
                          <span className={styles.lifecycleLabel}>Stage</span>
                          <span className={styles.lifecycleValue}>{lifecycle.data.stageLabel ?? lifecycle.data.stage ?? "—"}</span>
                        </li>
                        <li className={styles.lifecycleRow}>
                          <span className={styles.lifecycleLabel}>Status</span>
                          <Badge variant={statusVariant(lifecycle.data.status)}>{lifecycle.data.status ?? "UNKNOWN"}</Badge>
                        </li>
                        <li className={styles.lifecycleRow}>
                          <span className={styles.lifecycleLabel}>Since</span>
                          <span>{lifecycle.data.startedAt ?? "—"}</span>
                        </li>
                        {lifecycle.data.scheduledFor ? (
                          <li className={styles.lifecycleRow}>
                            <span className={styles.lifecycleLabel}>Next event</span>
                            <span>{lifecycle.data.scheduledFor}</span>
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </Card>

              <Card padding="md">
                <h3 className={styles.cardTitle}>Quick actions</h3>
                <ul className={styles.quickActions}>
                  {links.map((l) => (
                    <li key={l.path}>
                      <a href={l.path} className={styles.quickActionLink}>
                        <ArrowUpRight size={14} /> {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </>
        )}
      </div>
    </DomainShell>
  );
}

const links = [
  { label: "Browse tenant directory", path: "/tenants/directory" },
  { label: "Onboarding funnel & health", path: "/tenants/directory" },
  { label: "Manage users", path: "/tenants/users" },
  { label: "Review subscriptions", path: "/tenants/subscription" },
  { label: "Check quotas", path: "/tenants/quotas" },
  { label: "Review audit activity", path: "/tenants/activity" },
  { label: "Open support tickets", path: "/tenants/support" },
];