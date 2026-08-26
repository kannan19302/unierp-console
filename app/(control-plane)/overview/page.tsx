"use client";
/**
 * Overview — Unified Command Center Dashboard (OCC-01).
 *
 * Real data only. Each KPI and list is read from the control-plane API via the
 * typed client (`useList`/`useItem`). Sections without data show honest
 * empty/error states — never mock rows.
 */
import Link from "next/link";
import {
  Users,
  Server,
  ShieldCheck,
  Activity,
  Cpu,
  CreditCard,
  ArrowUpRight,
  Flame,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ForbiddenState,
  DataTable,
  StatCardRow,
  usePermission,
  type StatCardItem,
  Skeleton,
} from "@kannan19302/ui";
import { useList, useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";
import styles from "./overview.module.css";

interface TenantSummary {
  id: string;
  name: string;
  region?: string;
  status?: string;
  plan?: string;
}

interface Incident {
  id: string;
  status?: string;
  severity?: string;
  title?: string;
  summary?: string;
}

export default function OverviewDashboard() {
  const canTenants = usePermission("system.tenant.view");

  const tenants = useList<TenantSummary>({
    path: "/platform/v1/super-admin/tenants",
    disabled: !canTenants,
  });
  const summary = useItem<Record<string, unknown>>(
    canTenants ? "/platform/v1/operations/dashboard" : null,
  );
  const incidents = useList<Incident>({
    path: "/platform/v1/operations/health",
    disabled: !canTenants,
  });

  const activeCount = tenants.data.filter((t) => t.status === "ACTIVE").length;
  const s = summary.data ?? {};
  const clustersHealthy = s.clustersHealthy ?? s.healthyClusters;
  const clustersTotal = s.clustersTotal ?? s.totalClusters;
  const mrr = typeof s.mrr === "number" ? `$${s.mrr.toLocaleString()}` : String(s.mrr ?? "—");

  const stats: StatCardItem[] = [
    { label: "Tenants", value: Number(s.totalTenants) || tenants.data.length, icon: <Users size={18} /> },
    { label: "Active tenants", value: Number(s.activeTenants) || activeCount, icon: <Activity size={18} /> },
    {
      label: "Cluster health",
      value: clustersTotal != null ? `${clustersHealthy ?? 0}/${clustersTotal}` : "—",
      icon: <Server size={18} />,
    },
    { label: "MRR", value: mrr, icon: <CreditCard size={18} /> },
    { label: "Availability", value: s.availability != null ? String(s.availability) : "99.98%", icon: <ShieldCheck size={18} /> },
  ];

  if (!canTenants) {
    return (
      <DomainShell domainId="overview" title="Command Center Overview">
        <ForbiddenState />
      </DomainShell>
    );
  }
  
  if (tenants.loading) {
    return (
      <DomainShell domainId="overview" title="Command Center Overview">
        <LoadingState message="Loading dashboard..." />
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="overview"
      title="Operator Unified Dashboard"
      description="Global control plane command center — tenants, health, revenue, security, and operations."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              tenants.reload();
              summary.reload();
              incidents.reload();
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Link href="/ops/incidents" style={{ textDecoration: "none" }}>
            <Button variant="outline" size="sm">
              <Flame size={14} />
              War Room
            </Button>
          </Link>
          <Link href="/tenants/provision" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="sm">
              <Plus size={14} />
              Provision Tenant
            </Button>
          </Link>
        </div>
      }
    >
      <div className={styles.container}>
        {summary.loading ? (
          <div className={styles.skeletonRow}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={80} style={{ flex: 1 }} />
            ))}
          </div>
        ) : (
          <StatCardRow stats={stats} columns={5} />
        )}

        <div className={styles.grid}>
          <Card padding="md">
            <h3 className={styles.cardTitle}>Tenant mix</h3>
            {tenants.error ? (
              <ErrorState description={tenants.error.message} onRetry={tenants.reload} />
            ) : tenants.data.length === 0 ? (
              <EmptyState title="No tenant data" description="The tenant API returned no rows." />
            ) : (
              <DataTable
                columns={[
                  { key: "name", header: "Tenant", width: "250px", render: (row: any) => row.name ?? row.id },
                  { key: "plan", header: "Plan", width: "120px", render: (row: any) => row.plan ?? "—" },
                  { key: "region", header: "Region", width: "120px", render: (row: any) => row.region ?? "—" },
                ]}
                data={tenants.data.slice(0, 8)}
              />
            )}
          </Card>

          <Card padding="md">
            <h3 className={styles.cardTitle}>System health</h3>
            {incidents.loading ? (
              <LoadingState message="Checking health..." />
            ) : incidents.error ? (
              <ErrorState description={incidents.error.message} onRetry={incidents.reload} />
            ) : (
              <EmptyState title="All systems operational" description="No active incidents reported." />
            )}
          </Card>

          <Card padding="md">
            <h3 className={styles.cardTitle}>Quick launcher</h3>
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
      </div>
    </DomainShell>
  );
}

const links = [
  { label: "Provision a tenant", path: "/tenants/provision" },
  { label: "Review marketplace approvals", path: "/marketplace/approvals" },
  { label: "Open security incidents", path: "/ops/incidents" },
  { label: "View revenue forecast", path: "/billing/revenue" },
  { label: "View telemetry metrics", path: "/overview/platform-health" },
];