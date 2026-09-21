"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CreditCard,
  Plus,
  RefreshCw,
  Server,
} from "lucide-react";
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
  Skeleton,
  usePermission,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { useItem, useList } from "@/lib/data";
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

interface MetricItem {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
}

function numberFromSummary(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function displayAvailability(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return `${value}%`;
  if (typeof value === "string" && value.trim()) return value;
  return "—";
}

export default function OverviewDashboard() {
  const canViewTenants = usePermission("system.tenant.view");
  const tenants = useList<TenantSummary>({
    path: "/platform/v1/super-admin/tenants",
    disabled: !canViewTenants,
  });
  const summary = useItem<Record<string, unknown>>(
    canViewTenants ? "/platform/v1/operations/dashboard" : null,
  );
  const incidents = useList<Incident>({
    path: "/platform/v1/operations/incidents",
    disabled: !canViewTenants,
  });

  if (!canViewTenants) {
    return (
      <DomainShell domainId="overview" title="Provider overview">
        <ForbiddenState />
      </DomainShell>
    );
  }

  const snapshot = summary.data ?? {};
  const reportedTenants = numberFromSummary(snapshot.totalTenants);
  const reportedActive = numberFromSummary(snapshot.activeTenants);
  const activeFromRows = tenants.data.filter((tenant) => tenant.status === "ACTIVE").length;
  const clustersHealthy = numberFromSummary(snapshot.clustersHealthy ?? snapshot.healthyClusters);
  const clustersTotal = numberFromSummary(snapshot.clustersTotal ?? snapshot.totalClusters);
  const monthlyRevenue = numberFromSummary(snapshot.mrr);

  const metrics: MetricItem[] = [
    {
      label: "Tenant estate",
      value: reportedTenants ?? (tenants.loading ? "—" : tenants.data.length),
      detail: tenants.loading ? "Loading tenant inventory" : "Provider-managed tenants",
      icon: <Building2 size={17} aria-hidden="true" />,
    },
    {
      label: "Active tenants",
      value: reportedActive ?? (tenants.loading ? "—" : activeFromRows),
      detail: "Reported active now",
      icon: <Activity size={17} aria-hidden="true" />,
    },
    {
      label: "Cluster health",
      value: clustersTotal !== null ? `${clustersHealthy ?? 0}/${clustersTotal}` : "—",
      detail: clustersTotal === null ? "Telemetry unavailable" : "Healthy clusters",
      icon: <Server size={17} aria-hidden="true" />,
    },
    {
      label: "Monthly recurring revenue",
      value: monthlyRevenue === null ? "—" : `$${monthlyRevenue.toLocaleString()}`,
      detail: monthlyRevenue === null ? "Revenue snapshot unavailable" : "Current reporting period",
      icon: <CreditCard size={17} aria-hidden="true" />,
    },
    {
      label: "Availability",
      value: displayAvailability(snapshot.availability),
      detail: snapshot.availability == null ? "Telemetry unavailable" : "Reported by operations",
      icon: <Activity size={17} aria-hidden="true" />,
    },
  ];

  const reloadAll = () => {
    tenants.reload();
    summary.reload();
    incidents.reload();
  };

  return (
    <DomainShell
      domainId="overview"
      title="Provider overview"
      description="Tenant estate, platform telemetry, revenue and active operational work."
      actions={
        <div className={styles.headerActions}>
          <Button variant="outline" size="sm" onClick={reloadAll}>
            <RefreshCw size={14} aria-hidden="true" />
            Refresh
          </Button>
          <Link href="/tenants/provision" className={styles.actionLink}>
            <Button variant="primary" size="sm">
              <Plus size={14} aria-hidden="true" />
              Provision tenant
            </Button>
          </Link>
        </div>
      }
    >
      <div className={styles.container}>
        <section className={styles.metricStrip} aria-label="Provider estate snapshot">
          {summary.loading ? (
            Array.from({ length: 5 }, (_, index) => (
              <div className={styles.metric} key={index}>
                <Skeleton height={56} />
              </div>
            ))
          ) : (
            metrics.map((metric) => (
              <div className={styles.metric} key={metric.label}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricIcon}>{metric.icon}</span>
                  <span>{metric.label}</span>
                </div>
                <strong>{metric.value}</strong>
                <span className={styles.metricDetail}>{metric.detail}</span>
              </div>
            ))
          )}
        </section>

        {summary.error && (
          <div className={styles.summaryNotice} role="status">
            The operations snapshot is unavailable. Tenant and incident sources are shown independently.
          </div>
        )}

        <div className={styles.workspaceGrid}>
          <section className={styles.primaryPanel} aria-labelledby="tenant-estate-heading">
            <div className={styles.panelHeader}>
              <div>
                <h2 id="tenant-estate-heading">Tenant estate</h2>
                <p>Recently provisioned organizations and their operating region.</p>
              </div>
              <Link href="/tenants/directory">Open directory</Link>
            </div>
            <div className={styles.panelBody}>
              {tenants.loading ? (
                <LoadingState message="Loading tenant estate…" />
              ) : tenants.error ? (
                <ErrorState description={tenants.error.message} onRetry={tenants.reload} />
              ) : tenants.data.length === 0 ? (
                <EmptyState title="No tenants returned" description="Provision a tenant or verify the tenant service connection." />
              ) : (
                <DataTable
                  columns={[
                    { key: "name", header: "Tenant", width: "15.625rem", render: (row: TenantSummary) => row.name ?? row.id },
                    { key: "status", header: "Status", width: "7.5rem", render: (row: TenantSummary) => row.status ?? "Unknown" },
                    { key: "plan", header: "Plan", width: "7.5rem", render: (row: TenantSummary) => row.plan ?? "—" },
                    { key: "region", header: "Region", width: "7.5rem", render: (row: TenantSummary) => row.region ?? "—" },
                  ]}
                  data={tenants.data.slice(0, 8)}
                />
              )}
            </div>
          </section>

          <aside className={styles.sideColumn}>
            <section className={styles.sidePanel} aria-labelledby="incidents-heading">
              <div className={styles.panelHeader}>
                <div>
                  <h2 id="incidents-heading">Operational incidents</h2>
                  <p>Active work requiring operator attention.</p>
                </div>
                <Link href="/ops/incidents">View all</Link>
              </div>
              <div className={styles.panelBody}>
                {incidents.loading ? (
                  <LoadingState message="Checking incident queue…" />
                ) : incidents.error ? (
                  <ErrorState description={incidents.error.message} onRetry={incidents.reload} />
                ) : incidents.data.length === 0 ? (
                  <EmptyState title="No active incidents" description="The incident service returned no active records." />
                ) : (
                  <ul className={styles.incidentList}>
                    {incidents.data.slice(0, 5).map((incident) => (
                      <li key={incident.id}>
                        <AlertTriangle size={16} aria-hidden="true" />
                        <div>
                          <strong>{incident.title ?? incident.summary ?? incident.id}</strong>
                          <span>{incident.status ?? "Status unavailable"}</span>
                        </div>
                        <Badge variant={incident.severity === "CRITICAL" ? "danger" : incident.severity === "HIGH" ? "warning" : "default"}>
                          {incident.severity ?? "Unknown"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className={styles.sidePanel} aria-labelledby="operator-actions-heading">
              <div className={styles.panelHeader}>
                <div>
                  <h2 id="operator-actions-heading">Operator actions</h2>
                  <p>Common provider workflows.</p>
                </div>
              </div>
              <nav className={styles.actionIndex} aria-label="Common provider workflows">
                {quickLinks.map((link) => (
                  <Link key={link.path} href={link.path}>
                    <span>{link.label}</span>
                    <span aria-hidden="true">›</span>
                  </Link>
                ))}
              </nav>
            </section>
          </aside>
        </div>
      </div>
    </DomainShell>
  );
}

const quickLinks = [
  { label: "Provision a tenant", path: "/tenants/provision" },
  { label: "Review marketplace approvals", path: "/marketplace/approvals" },
  { label: "Open security operations", path: "/security/threats" },
  { label: "Review revenue", path: "/billing/revenue" },
  { label: "Inspect platform telemetry", path: "/overview/platform-health" },
];
