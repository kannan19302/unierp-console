"use client";
/**
 * Tenants → Directory → [id] Detail Page.
 * Deep entity view with sub-tabs for Overview, Organizations, Subscription, and Audit Trail.
 * Includes lifecycle actions (Edit via CrudDrawer, Suspend, Reactivate, Delete, Impersonate).
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  ExternalLink,
  Globe,
  Key,
  Layers,
  Package,
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ForbiddenState,
  Spinner,
  StatCardRow,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { api } from "@/lib/api";
import { useToast } from "@/lib/use-toast";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { exportToCsv } from "@/lib/export-csv";
import DomainShell from "@/components/domain-shell";
import { CrudDrawer } from "@/components/CrudDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { statusVariant } from "../../_badge";
import {
  type Tenant,
  editTenantFormSchema,
  tenantDrawerFields,
  type EditTenantFormData,
} from "@/lib/tenant-schema";
import styles from "./detail.module.css";

interface TenantDetailResponse extends Tenant {
  metrics?: {
    userCount: number;
    errorsLast24h: number;
    healthStatus: "HEALTHY" | "DEGRADED" | "CRITICAL";
  };
  organizations?: Array<{
    id: string;
    name: string;
    currency: string;
    timezone: string;
    createdAt: string;
  }>;
  auditLogs?: Array<{
    id: string;
    action: string;
    actorId?: string;
    targetId?: string;
    details?: any;
    createdAt: string;
  }>;
  apps?: string[];
}

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const tenantId = params?.id;

  const canView = usePermission("system.tenant.view");
  const canUpdate = usePermission("system.tenant.update");
  const canDelete = usePermission("system.tenant.delete");
  const canSuspend = usePermission("system.tenant.suspend");
  const canUnsuspend = usePermission("system.tenant.unsuspend");
  const canImpersonate = usePermission("system.tenant.impersonate");

  const [tenant, setTenant] = useState<TenantDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "orgs" | "subscription" | "audit">("overview");

  // Dialog & drawer states
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [isUnsuspending, setIsUnsuspending] = useState(false);
  const [mutating, setMutating] = useState(false);

  const fetchTenant = useCallback(async () => {
    if (!tenantId || !canView) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get<TenantDetailResponse>(`/platform/v1/super-admin/tenants/${tenantId}`);
      setTenant(resp.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load tenant details.");
    } finally {
      setLoading(false);
    }
  }, [tenantId, canView]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  // Live WebSocket refresh
  useDomainRealtime("tenants", () => {
    fetchTenant();
  });

  // Edit Submit
  const handleEditSubmit = async (values: Record<string, any>) => {
    if (!tenantId) return;
    setMutating(true);
    try {
      await api.patch(`/platform/v1/super-admin/tenants/${tenantId}`, values);
      toast.success("Tenant Updated", `Tenant "${values.name}" updated successfully.`);
      setIsEditing(false);
      await fetchTenant();
    } catch (err: any) {
      toast.error("Update Failed", err?.message || "Could not update tenant.");
    } finally {
      setMutating(false);
    }
  };

  // Suspend
  const handleSuspend = async () => {
    if (!tenantId || !tenant) return;
    setMutating(true);
    try {
      await api.post(`/platform/v1/tenants/${tenantId}/suspend`, {
        reason: "Administrative suspension from tenant detail page",
      });
      toast.success("Tenant Suspended", `Tenant "${tenant.name}" has been suspended.`);
      setIsSuspending(false);
      await fetchTenant();
    } catch (err: any) {
      toast.error("Suspension Failed", err?.message || "Could not suspend tenant.");
    } finally {
      setMutating(false);
    }
  };

  // Unsuspend
  const handleUnsuspend = async () => {
    if (!tenantId || !tenant) return;
    setMutating(true);
    try {
      await api.post(`/platform/v1/tenants/${tenantId}/unsuspend`, {
        reason: "Reinstatement from tenant detail page",
      });
      toast.success("Tenant Reinstated", `Tenant "${tenant.name}" is now active.`);
      setIsUnsuspending(false);
      await fetchTenant();
    } catch (err: any) {
      toast.error("Reinstatement Failed", err?.message || "Could not reinstate tenant.");
    } finally {
      setMutating(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!tenantId) return;
    setMutating(true);
    try {
      await api.del(`/platform/v1/super-admin/tenants/${tenantId}`);
      toast.success("Tenant Deleted", `Tenant "${tenant?.name}" was permanently removed.`);
      setIsDeleting(false);
      router.push("/tenants/directory");
    } catch (err: any) {
      toast.error("Deletion Failed", err?.message || "Could not delete tenant.");
    } finally {
      setMutating(false);
    }
  };

  // Impersonate
  const handleImpersonate = async () => {
    if (!tenantId || !tenant) return;
    try {
      const resp = await api.post<{ token?: string }>(
        `/platform/v1/super-admin/tenants/${tenantId}/impersonate`
      );
      if (resp.data.token) {
        sessionStorage.setItem("impersonation_token", resp.data.token);
        sessionStorage.setItem("impersonated_tenant_name", tenant.name);
        sessionStorage.setItem("impersonated_tenant_id", tenant.id);
      }
      toast.success(
        "Impersonation Granted",
        `Session active for ${tenant.name}. You are operating under tenant admin privileges.`
      );
    } catch (err: any) {
      toast.error("Impersonation Denied", err?.message || "Impersonation request failed.");
    }
  };

  // Export audit trail
  const handleExportAudit = () => {
    if (!tenant?.auditLogs || tenant.auditLogs.length === 0) {
      toast.info("No Audit Logs", "There are no audit logs available to export.");
      return;
    }
    exportToCsv(
      [
        { key: "id", label: "Event ID" },
        { key: "action", label: "Action" },
        { key: "actorId", label: "Actor ID" },
        { key: "createdAt", label: "Timestamp" },
      ],
      tenant.auditLogs,
      `tenant-${tenant.slug}-audit-${new Date().toISOString().split("T")[0]}.csv`
    );
    toast.success("Audit Exported", "Audit trail CSV generated and downloaded.");
  };

  if (!canView) {
    return (
      <DomainShell domainId="tenants" title="Tenant Detail">
        <ForbiddenState
          title="Access Restricted"
          description="You do not have permission (system.tenant.view) to inspect tenant details."
        />
      </DomainShell>
    );
  }

  if (loading) {
    return (
      <DomainShell domainId="tenants" title="Loading Tenant...">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-16)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  if (error || !tenant) {
    return (
      <DomainShell domainId="tenants" title="Tenant Not Found">
        <EmptyState
          title="Tenant not found"
          description={error || "The requested tenant does not exist or has been deleted."}
          action={
            <Link href="/tenants/directory" style={{ textDecoration: "none" }}>
              <Button variant="primary" size="sm">
                <ArrowLeft size={14} /> Back to Tenant Directory
              </Button>
            </Link>
          }
        />
      </DomainShell>
    );
  }

  const stats: StatCardItem[] = [
    {
      label: "Health Status",
      value: tenant.metrics?.healthStatus || "HEALTHY",
      icon: <CheckCircle2 size={18} />,
    },
    {
      label: "Total Users",
      value: tenant.metrics?.userCount ?? 0,
      icon: <Users size={18} />,
    },
    {
      label: "Organizations",
      value: tenant.organizations?.length ?? tenant.orgCount ?? 1,
      icon: <Building2 size={18} />,
    },
    {
      label: "Errors (24h)",
      value: tenant.metrics?.errorsLast24h ?? 0,
      icon: <ShieldAlert size={18} />,
    },
  ];

  return (
    <DomainShell
      domainId="tenants"
      title={`Tenants · ${tenant.name}`}
      description="Full lifecycle inspection, configuration, and audit trail."
    >
      <div className={styles.container}>
        {/* Navigation Breadcrumb */}
        <div>
          <Link href="/tenants/directory" className={styles.backLink}>
            <ArrowLeft size={14} />
            <span>Back to Tenant Directory</span>
          </Link>
        </div>

        {/* Entity Header Banner Card */}
        <Card padding="lg">
          <div className={styles.headerCard}>
            <div className={styles.titleArea}>
              <div className={styles.titleRow}>
                <h2 className={styles.title}>{tenant.name}</h2>
                <Badge variant={statusVariant(tenant.status)}>{tenant.status}</Badge>
                <Badge variant="default">{tenant.plan}</Badge>
                {tenant.demoDataLoaded && <Badge variant="info">Demo Data</Badge>}
              </div>
              <p className={styles.subtitle}>
                ID: {tenant.id} &bull; Slug: {tenant.slug} &bull; Region: {tenant.residencyRegion || "us-east-1"}
              </p>
            </div>

            {/* Quick Actions */}
            <div className={styles.actionsBar}>
              {canUpdate && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 size={14} />
                  <span>Edit Tenant</span>
                </Button>
              )}

              {canImpersonate && tenant.status === "ACTIVE" && (
                <Button variant="secondary" size="sm" onClick={handleImpersonate}>
                  <Key size={14} />
                  <span>Impersonate</span>
                </Button>
              )}

              {tenant.status === "SUSPENDED" && canUnsuspend && (
                <Button variant="outline" size="sm" onClick={() => setIsUnsuspending(true)}>
                  <ShieldCheck size={14} />
                  <span>Reactivate</span>
                </Button>
              )}

              {tenant.status !== "SUSPENDED" && canSuspend && (
                <Button variant="outline" size="sm" onClick={() => setIsSuspending(true)}>
                  <ShieldBan size={14} />
                  <span>Suspend</span>
                </Button>
              )}

              {canDelete && (
                <Button variant="danger" size="sm" onClick={() => setIsDeleting(true)}>
                  <Trash2 size={14} />
                  <span>Delete</span>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* KPI Metrics */}
        <StatCardRow stats={stats} columns={4} />

        {/* Tab Navigation */}
        <div className={styles.tabsBar}>
          <button
            className={`${styles.tabButton} ${activeTab === "overview" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview & Apps
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "orgs" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("orgs")}
          >
            Organizations ({tenant.organizations?.length ?? 1})
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "subscription" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("subscription")}
          >
            Subscription & Entitlements
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "audit" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("audit")}
          >
            Audit Trail
          </button>
        </div>

        {/* Tab Content: Overview */}
        {activeTab === "overview" && (
          <div className={styles.gridTwoCol}>
            <Card padding="md">
              <h3 style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-base)", fontWeight: 600 }}>
                Tenant Metadata
              </h3>
              <ul className={styles.metaList}>
                <li className={styles.metaRow}>
                  <span className={styles.metaLabel}>Created Date</span>
                  <span className={styles.metaValue}>{formatDateTime(tenant.createdAt)}</span>
                </li>
                <li className={styles.metaRow}>
                  <span className={styles.metaLabel}>Residency Region</span>
                  <span className={styles.metaValue}>{tenant.residencyRegion || "us-east-1"}</span>
                </li>
                <li className={styles.metaRow}>
                  <span className={styles.metaLabel}>Tenant Slug</span>
                  <span className={styles.metaValue} style={{ fontFamily: "monospace" }}>
                    {tenant.slug}
                  </span>
                </li>
                <li className={styles.metaRow}>
                  <span className={styles.metaLabel}>Demo Data Loaded</span>
                  <span className={styles.metaValue}>{tenant.demoDataLoaded ? "Yes" : "No"}</span>
                </li>
              </ul>
            </Card>

            <Card padding="md">
              <h3 style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-base)", fontWeight: 600 }}>
                Installed Business Applications
              </h3>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Modules enabled for this tenant instance across the UniERP ecosystem.
              </p>
              <div className={styles.appsGrid}>
                {(tenant.apps || ["Core CRM", "Inventory", "Finance", "HR"]).map((app) => (
                  <div key={app} className={styles.appChip}>
                    <Package size={14} style={{ color: "var(--color-brand-primary)" }} />
                    <span>{app}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Tab Content: Organizations */}
        {activeTab === "orgs" && (
          <Card padding="md">
            <h3 style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-base)", fontWeight: 600 }}>
              Tenant Organizations
            </h3>
            {(!tenant.organizations || tenant.organizations.length === 0) ? (
              <EmptyState title="No Organizations" description="This tenant has no registered organizations." />
            ) : (
              <table className={styles.auditTable}>
                <thead>
                  <tr>
                    <th className={styles.auditTh}>Organization Name</th>
                    <th className={styles.auditTh}>Currency</th>
                    <th className={styles.auditTh}>Timezone</th>
                    <th className={styles.auditTh}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.organizations.map((org) => (
                    <tr key={org.id}>
                      <td className={styles.auditTd} style={{ fontWeight: 600 }}>
                        {org.name}
                      </td>
                      <td className={styles.auditTd}>{org.currency}</td>
                      <td className={styles.auditTd}>{org.timezone}</td>
                      <td className={styles.auditTd}>{formatDate(org.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {/* Tab Content: Subscription */}
        {activeTab === "subscription" && (
          <Card padding="md">
            <h3 style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-base)", fontWeight: 600 }}>
              Subscription & Plan Entitlements
            </h3>
            <ul className={styles.metaList}>
              <li className={styles.metaRow}>
                <span className={styles.metaLabel}>Current Plan</span>
                <Badge variant="default">{tenant.subscription?.planName || tenant.plan}</Badge>
              </li>
              <li className={styles.metaRow}>
                <span className={styles.metaLabel}>Billing Status</span>
                <Badge variant="success">{tenant.subscription?.status || "ACTIVE"}</Badge>
              </li>
              <li className={styles.metaRow}>
                <span className={styles.metaLabel}>Max Storage Quota</span>
                <span className={styles.metaValue}>100 GB</span>
              </li>
              <li className={styles.metaRow}>
                <span className={styles.metaLabel}>Max API Requests</span>
                <span className={styles.metaValue}>100,000 / day</span>
              </li>
            </ul>
          </Card>
        )}

        {/* Tab Content: Audit Trail */}
        {activeTab === "audit" && (
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
                  Recent Control-Plane Audit Events
                </h3>
                <p style={{ margin: "var(--space-0-5) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  Immutable audit records captured for actions involving this tenant.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportAudit}>
                <Download size={14} />
                <span>Export Audit CSV</span>
              </Button>
            </div>

            {(!tenant.auditLogs || tenant.auditLogs.length === 0) ? (
              <EmptyState title="No Audit Records" description="No recent audit events logged for this tenant." />
            ) : (
              <table className={styles.auditTable}>
                <thead>
                  <tr>
                    <th className={styles.auditTh}>Action</th>
                    <th className={styles.auditTh}>Actor</th>
                    <th className={styles.auditTh}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className={styles.auditTd} style={{ fontFamily: "monospace", fontWeight: 600 }}>
                        {log.action}
                      </td>
                      <td className={styles.auditTd}>{log.actorId || "system"}</td>
                      <td className={styles.auditTd}>{formatDateTime(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {/* Edit Drawer */}
        <CrudDrawer
          open={isEditing}
          title={`Edit Tenant: ${tenant.name}`}
          mode="edit"
          schema={editTenantFormSchema}
          fields={tenantDrawerFields}
          initialValues={{
            name: tenant.name,
            plan: tenant.plan,
            status: tenant.status as any,
            residencyRegion: tenant.residencyRegion || "us-east-1",
          }}
          onSubmit={handleEditSubmit}
          onClose={() => setIsEditing(false)}
        />

        {/* Delete Dialog */}
        <ConfirmDialog
          open={isDeleting}
          title="Delete Tenant"
          message={`Are you sure you want to delete "${tenant.name}"? This action archives all tenant data and revokes access. To confirm, type the tenant name:`}
          entityName={tenant.name}
          requireTyping
          variant="danger"
          confirmLabel="Delete Tenant"
          onConfirm={handleDelete}
          onCancel={() => setIsDeleting(false)}
        />

        {/* Suspend Dialog */}
        <ConfirmDialog
          open={isSuspending}
          title="Suspend Tenant"
          message={`Are you sure you want to suspend "${tenant.name}"? Active users will be logged out immediately.`}
          variant="warning"
          confirmLabel="Suspend Tenant"
          onConfirm={handleSuspend}
          onCancel={() => setIsSuspending(false)}
        />

        {/* Unsuspend Dialog */}
        <ConfirmDialog
          open={isUnsuspending}
          title="Reactivate Tenant"
          message={`Reactivate "${tenant.name}"? Users will be allowed to log in again immediately.`}
          variant="warning"
          confirmLabel="Reactivate Tenant"
          onConfirm={handleUnsuspend}
          onCancel={() => setIsUnsuspending(false)}
        />
      </div>
    </DomainShell>
  );
}
