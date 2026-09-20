"use client";
/**
 * Tenants → Directory.
 * Complete enterprise control-plane tenant management with full CRUD,
 * pagination, filtering, search, sorting, slide-over drawer, and real-time updates.
 */
import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Download,
  Edit2,
  ExternalLink,
  Key,
  MapPin,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ForbiddenState,
  StatCardRow,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useCrud } from "@/lib/use-crud";
import { useToast } from "@/lib/use-toast";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import { formatDate } from "@/lib/format-date";
import { exportToCsv } from "@/lib/export-csv";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";
import { PaginatedTable, type ColumnDef } from "@/components/PaginatedTable";
import { FilterBar, type FilterConfig } from "@/components/FilterBar";
import { CrudDrawer } from "@/components/CrudDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { statusVariant } from "../_badge";
import {
  type Tenant,
  editTenantFormSchema,
  tenantDrawerFields,
  type EditTenantFormData,
} from "@/lib/tenant-schema";
import styles from "./directory.module.css";

const FILTER_DEFS: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Suspended", value: "SUSPENDED" },
      { label: "Archived", value: "ARCHIVED" },
      { label: "Trial", value: "TRIAL" },
    ],
  },
  {
    key: "plan",
    label: "Plan",
    options: [
      { label: "Startup", value: "STARTUP" },
      { label: "Growth", value: "GROWTH" },
      { label: "Enterprise", value: "ENTERPRISE" },
    ],
  },
];

export default function TenantsDirectoryPage() {
  const toast = useToast();
  const canView = usePermission("system.tenant.view");
  const canCreate = usePermission("system.tenant.create");
  const canUpdate = usePermission("system.tenant.update");
  const canDelete = usePermission("system.tenant.delete");
  const canSuspend = usePermission("system.tenant.suspend");
  const canUnsuspend = usePermission("system.tenant.unsuspend");
  const canImpersonate = usePermission("system.tenant.impersonate");

  // State for active drawer/modals
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [suspendingTenant, setSuspendingTenant] = useState<Tenant | null>(null);
  const [unsuspendingTenant, setUnsuspendingTenant] = useState<Tenant | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [acting, setActing] = useState(false);

  // CRUD Hook handling pagination, sorting, search, optimistic updates, and toasts
  const crud = useCrud<Tenant>({
    entityName: "Tenant",
    defaultPageSize: 25,
    adapter: {
      list: async ({ page, pageSize, sort, dir, filters, search }) => {
        const resp = await api.get<any>("/platform/v1/super-admin/tenants", {
          page,
          pageSize,
          sort,
          dir,
          ...filters,
          search,
        });
        const items = Array.isArray(resp.data) ? resp.data : resp.data?.data ?? [];
        const total = resp.data?.total ?? items.length;
        return { items, total };
      },
      create: async (data) => {
        const resp = await api.post<Tenant>("/platform/v1/super-admin/tenants", data);
        return resp.data;
      },
      update: async (id, data) => {
        const resp = await api.patch<Tenant>(`/platform/v1/super-admin/tenants/${id}`, data);
        return resp.data;
      },
      delete: async (id) => {
        await api.del(`/platform/v1/super-admin/tenants/${id}`);
      },
    },
  });

  // Listen to WebSocket events for real-time live updates
  useDomainRealtime("tenants", () => {
    crud.reload();
  });

  // Suspend action
  const handleSuspend = async () => {
    if (!suspendingTenant) return;
    setActing(true);
    try {
      await api.post(`/platform/v1/tenants/${suspendingTenant.id}/suspend`, {
        reason: "Administrative suspension from Provider Control Center",
      });
      toast.success("Tenant Suspended", `Tenant "${suspendingTenant.name}" has been suspended.`);
      setSuspendingTenant(null);
      await crud.reload();
    } catch (err: any) {
      toast.error("Suspension Failed", err.message || "Failed to suspend tenant.");
    } finally {
      setActing(false);
    }
  };

  // Unsuspend action
  const handleUnsuspend = async () => {
    if (!unsuspendingTenant) return;
    setActing(true);
    try {
      await api.post(`/platform/v1/tenants/${unsuspendingTenant.id}/unsuspend`, {
        reason: "Reinstatement from Provider Control Center",
      });
      toast.success("Tenant Reinstated", `Tenant "${unsuspendingTenant.name}" is now active.`);
      setUnsuspendingTenant(null);
      await crud.reload();
    } catch (err: any) {
      toast.error("Reinstatement Failed", err.message || "Failed to reinstate tenant.");
    } finally {
      setActing(false);
    }
  };

  // Impersonate action
  const handleImpersonate = async (tenant: Tenant) => {
    try {
      const resp = await api.post<{ token?: string; redirectUrl?: string }>(
        `/platform/v1/super-admin/tenants/${tenant.id}/impersonate`
      );
      if (resp.data.token) {
        sessionStorage.setItem("impersonation_token", resp.data.token);
        sessionStorage.setItem("impersonated_tenant_name", tenant.name);
        sessionStorage.setItem("impersonated_tenant_id", tenant.id);
      }
      toast.success(
        "Impersonation Granted",
        `Session created for ${tenant.name}. You are now operating under tenant context.`
      );
    } catch (err: any) {
      toast.error("Impersonation Denied", err.message || "Failed to impersonate tenant admin.");
    }
  };

  // Export CSV
  const handleExportCsv = useCallback(() => {
    const rowsToExport = crud.items.filter((item) =>
      selectedIds.length === 0 ? true : selectedIds.includes(item.id)
    );
    exportToCsv(
      [
        { key: "id", label: "Tenant ID" },
        { key: "name", label: "Tenant Name" },
        { key: "slug", label: "Slug" },
        { key: "plan", label: "Plan" },
        { key: "status", label: "Status" },
        { key: "residencyRegion", label: "Region" },
        { key: "orgCount", label: "Organizations" },
        { key: "createdAt", label: "Created At" },
      ],
      rowsToExport,
      `tenants-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    toast.info("CSV Exported", `Exported ${rowsToExport.length} tenant record(s).`);
  }, [crud.items, selectedIds, toast]);

  // Statistics
  const activeCount = useMemo(
    () => crud.items.filter((t) => t.status === "ACTIVE").length,
    [crud.items]
  );
  const suspendedCount = useMemo(
    () => crud.items.filter((t) => t.status === "SUSPENDED").length,
    [crud.items]
  );
  const totalOrgs = useMemo(
    () => crud.items.reduce((sum, t) => sum + (t.orgCount || 0), 0),
    [crud.items]
  );

  const stats: StatCardItem[] = [
    { label: "Total Tenants", value: crud.total, icon: <Building2 size={18} /> },
    { label: "Active", value: activeCount, icon: <ShieldCheck size={18} /> },
    { label: "Suspended", value: suspendedCount, icon: <ShieldBan size={18} /> },
    { label: "Total Orgs", value: totalOrgs, icon: <MapPin size={18} /> },
  ];

  // Table Columns definition
  const columns: ColumnDef<Tenant>[] = [
    {
      key: "name",
      label: "Tenant Name",
      sortable: true,
      render: (_val, row) => (
        <div className={styles.tenantCell}>
          <Link href={`/tenants/directory/${row.id}`} className={styles.rowLink}>
            {row.name}
          </Link>
          <span className={styles.slugText}>{row.slug}</span>
        </div>
      ),
    },
    {
      key: "plan",
      label: "Plan",
      sortable: true,
      render: (_val, row) => <Badge variant="default">{row.plan}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (_val, row) => (
        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
      ),
    },
    {
      key: "residencyRegion",
      label: "Region",
      render: (_val, row) => row.residencyRegion || "us-east-1",
    },
    {
      key: "orgCount",
      label: "Orgs",
      sortable: true,
      render: (_val, row) => row.orgCount ?? 0,
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (_val, row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_val, row) => (
        <div className={styles.actionsGroup}>
          <Link href={`/tenants/directory/${row.id}`} style={{ textDecoration: "none" }}>
            <button className={styles.actionButton} title="View Details">
              <ExternalLink size={13} />
            </button>
          </Link>

          {canUpdate && (
            <button
              className={styles.actionButton}
              title="Edit Tenant"
              onClick={() => setEditingTenant(row)}
            >
              <Edit2 size={13} />
            </button>
          )}

          {row.status === "SUSPENDED" && canUnsuspend && (
            <button
              className={styles.actionButton}
              title="Reactivate Tenant"
              onClick={() => setUnsuspendingTenant(row)}
            >
              <ShieldCheck size={13} />
            </button>
          )}

          {row.status !== "SUSPENDED" && canSuspend && (
            <button
              className={styles.actionButton}
              title="Suspend Tenant"
              onClick={() => setSuspendingTenant(row)}
            >
              <ShieldBan size={13} />
            </button>
          )}

          {canImpersonate && row.status === "ACTIVE" && (
            <button
              className={styles.actionButton}
              title="Impersonate Tenant"
              onClick={() => handleImpersonate(row)}
            >
              <Key size={13} />
            </button>
          )}

          {canDelete && (
            <button
              className={`${styles.actionButton} ${styles.actionButtonDanger}`}
              title="Delete Tenant"
              onClick={() => setDeletingTenant(row)}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (!canView) {
    return (
      <DomainShell domainId="tenants" title="Tenants · Directory">
        <ForbiddenState
          title="Access Restricted"
          description="You do not have permission (system.tenant.view) to view the tenant directory."
        />
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Directory"
      description="Enterprise registry and lifecycle control across all tenants."
      actions={
        <div className={styles.actionsGroup}>
          <Button variant="outline" size="sm" onClick={() => crud.reload()}>
            <RefreshCw size={14} />
            Refresh
          </Button>
          {canCreate && (
            <Link href="/tenants/provision" style={{ textDecoration: "none" }}>
              <Button variant="primary" size="sm">
                <Plus size={14} />
                Provision Tenant
              </Button>
            </Link>
          )}
        </div>
      }
    >
      <div className={styles.container}>
        {/* KPI Summary Cards */}
        <StatCardRow stats={stats} columns={4} />

        {/* Filter and Search Bar with URL Sync */}
        <FilterBar
          filters={FILTER_DEFS}
          activeFilters={crud.filters}
          onFilterChange={(k, v) => crud.setFilter(k, v)}
          onClearFilter={(k) => crud.setFilter(k, "")}
          onClearAll={() => crud.setFilters({})}
          searchQuery={crud.searchQuery}
          onSearchChange={crud.setSearchQuery}
          searchPlaceholder="Search by name, slug, or ID…"
        />

        {/* Paginated Data Grid */}
        <Card padding="none">
          <PaginatedTable<Tenant>
            columns={columns}
            data={crud.items}
            total={crud.total}
            page={crud.page}
            pageSize={crud.pageSize}
            onPageChange={crud.setPage}
            onPageSizeChange={crud.setPageSize}
            sortColumn={crud.sortColumn}
            sortDirection={crud.sortDirection}
            onSortChange={(col, dir) => crud.setSort(col, dir)}
            loading={crud.loading}
            selectedKeys={selectedIds}
            onSelectionChange={(keys) => setSelectedIds(keys.map(String))}
            selectable
            exportable
            onExport={handleExportCsv}
            emptyMessage={
              crud.searchQuery
                ? "No tenants matched your query."
                : "The tenant registry is currently empty."
            }
          />
        </Card>

        {/* Edit Tenant Drawer (480px slide-over) */}
        {editingTenant && (
          <CrudDrawer
            open={Boolean(editingTenant)}
            title={`Edit Tenant: ${editingTenant.name}`}
            mode="edit"
            schema={editTenantFormSchema}
            fields={tenantDrawerFields}
            initialValues={{
              name: editingTenant.name,
              plan: editingTenant.plan,
              status: editingTenant.status as any,
              residencyRegion: editingTenant.residencyRegion || "us-east-1",
            }}
            onSubmit={async (values) => {
              await crud.handleUpdate(editingTenant.id, values);
              setEditingTenant(null);
            }}
            onClose={() => setEditingTenant(null)}
          />
        )}

        {/* Delete Confirmation Dialog with Name Typing Requirement */}
        <ConfirmDialog
          open={Boolean(deletingTenant)}
          title="Delete Tenant"
          message={`Are you sure you want to delete "${deletingTenant?.name}"? This action will archive all tenant resources and revoke active sessions. To confirm, type the tenant name:`}
          entityName={deletingTenant?.name}
          requireTyping
          variant="danger"
          confirmLabel="Delete Tenant"
          onConfirm={async () => {
            if (!deletingTenant) return;
            await crud.handleDelete(deletingTenant.id);
            setDeletingTenant(null);
          }}
          onCancel={() => setDeletingTenant(null)}
        />

        {/* Suspend Confirmation Dialog */}
        <ConfirmDialog
          open={Boolean(suspendingTenant)}
          title="Suspend Tenant"
          message={`Are you sure you want to suspend "${suspendingTenant?.name}"? All users will immediately lose access to their instances.`}
          variant="warning"
          confirmLabel="Suspend Tenant"
          onConfirm={handleSuspend}
          onCancel={() => setSuspendingTenant(null)}
        />

        {/* Unsuspend Confirmation Dialog */}
        <ConfirmDialog
          open={Boolean(unsuspendingTenant)}
          title="Reactivate Tenant"
          message={`Are you sure you want to reinstate "${unsuspendingTenant?.name}"? Standard operations will resume immediately.`}
          variant="warning"
          confirmLabel="Reactivate Tenant"
          onConfirm={handleUnsuspend}
          onCancel={() => setUnsuspendingTenant(null)}
        />
      </div>
    </DomainShell>
  );
}