"use client";
/**
 * Users & Access → Roles.
 * Role registry and access governance for the platform.
 * Supports role creation, editing, deletion, and drill-down into permission matrix.
 */
import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Shield,
  Users,
  Plus,
  RefreshCw,
  ExternalLink,
  Edit2,
  Trash2,
  Lock,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ForbiddenState,
  StatCardRow,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useCrud } from "@/lib/use-crud";
import { useToast } from "@/lib/use-toast";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import { exportToCsv } from "@/lib/export-csv";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";
import { PaginatedTable, type ColumnDef } from "@/components/PaginatedTable";
import { FilterBar } from "@/components/FilterBar";
import { CrudDrawer } from "@/components/CrudDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  type ProviderRole,
  roleFormSchema,
  roleDrawerFields,
  roleFilterConfigs,
} from "@/lib/access-schema";
import styles from "./roles.module.css";

export default function AccessRolesPage() {
  const toast = useToast();
  const canAccess = usePermission("pcc.identity-governance.access");
  const canManageRoles = usePermission("system.role.manage");

  const [editingRole, setEditingRole] = useState<ProviderRole | null>(null);
  const [deletingRole, setDeletingRole] = useState<ProviderRole | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // CRUD Hook handling pagination, sorting, search, optimistic updates, and toasts
  const crud = useCrud<ProviderRole>({
    entityName: "Role",
    defaultPageSize: 25,
    adapter: {
      list: async ({ page, pageSize, sort, dir, filters, search }) => {
        const resp = await api.get<any>("/platform/v1/staff-idp/roles", {
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
        const resp = await api.post<ProviderRole>("/platform/v1/staff-idp/roles", {
          ...data,
          permissions: data.permissions || ["pcc.identity-governance.access"],
        });
        return resp.data;
      },
      update: async (id, data) => {
        const resp = await api.patch<ProviderRole>(`/platform/v1/staff-idp/roles/${id}`, data);
        return resp.data;
      },
      delete: async (id) => {
        await api.del(`/platform/v1/staff-idp/roles/${id}`);
      },
    },
  });

  // Subscribe to real-time domain updates
  useDomainRealtime("access", useCallback(() => crud.reload(), [crud]));

  // Export CSV
  const handleExportCsv = useCallback(() => {
    const rowsToExport = crud.items.filter((item) =>
      selectedIds.length === 0 ? true : selectedIds.includes(item.id)
    );
    exportToCsv(
      [
        { key: "id", label: "Role ID" },
        { key: "name", label: "Role Name" },
        { key: "description", label: "Description" },
        { key: "isSystem", label: "System Role" },
        { key: "principalCount", label: "Assigned Users" },
      ],
      rowsToExport,
      `roles-registry-${new Date().toISOString().split("T")[0]}.csv`
    );
    toast.info("CSV Exported", `Exported ${rowsToExport.length} role record(s).`);
  }, [crud.items, selectedIds, toast]);

  // Statistics
  const systemRoles = useMemo(
    () => crud.items.filter((r) => r.isSystem).length,
    [crud.items]
  );
  const customRoles = useMemo(
    () => crud.items.filter((r) => !r.isSystem).length,
    [crud.items]
  );
  const totalAssignments = useMemo(
    () => crud.items.reduce((sum, r) => sum + (r.principalCount || 0), 0),
    [crud.items]
  );

  const stats: StatCardItem[] = useMemo(
    () => [
      {
        label: "Total Roles",
        value: crud.total,
        icon: <ShieldCheck size={16} />,
      },
      {
        label: "System Roles",
        value: systemRoles,
        icon: <Lock size={16} />,
      },
      {
        label: "Custom Roles",
        value: customRoles,
        icon: <Shield size={16} />,
      },
      {
        label: "Total Assigned Users",
        value: totalAssignments,
        icon: <Users size={16} />,
      },
    ],
    [crud.total, systemRoles, customRoles, totalAssignments]
  );

  // Table Columns
  const columns: ColumnDef<ProviderRole>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Role Name",
        sortable: true,
        render: (_val, row) => (
          <div className={styles.roleCell}>
            <span className={styles.roleName}>{row.name}</span>
            {row.description && <span className={styles.roleDesc}>{row.description}</span>}
          </div>
        ),
      },
      {
        key: "isSystem",
        label: "Type",
        sortable: true,
        render: (_val, row) => (
          <Badge variant={row.isSystem ? "primary" : "default"}>
            {row.isSystem ? "Built-in System" : "Custom"}
          </Badge>
        ),
      },
      {
        key: "permissions",
        label: "Permissions",
        render: (_val, row) => (
          <Badge variant="info">
            {row.permissions ? `${row.permissions.length} privilege(s)` : "0 privileges"}
          </Badge>
        ),
      },
      {
        key: "principalCount",
        label: "Assigned Users",
        sortable: true,
        render: (_val, row) => (
          <span>{row.principalCount ?? 0} operator(s)</span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (_val, row) => (
          <div className={styles.actionButtons}>
            <Link href={`/access/roles/${row.id}`} style={{ textDecoration: "none" }}>
              <button className={styles.actionButton} title="Open Permission Matrix">
                <ExternalLink size={13} />
              </button>
            </Link>

            {canManageRoles && !row.isSystem && (
              <button
                className={styles.actionButton}
                title="Edit Role"
                onClick={() => setEditingRole(row)}
              >
                <Edit2 size={13} />
              </button>
            )}

            {canManageRoles && !row.isSystem && (
              <button
                className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                title="Delete Role"
                onClick={() => setDeletingRole(row)}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ),
      },
    ],
    [canManageRoles]
  );

  if (!canAccess) {
    return (
      <DomainShell domainId="access" title="Roles">
        <ForbiddenState
          title="Access Restricted"
          description="You do not have permission (pcc.identity-governance.access) to view role registries."
        />
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="access"
      title="Roles"
      description="Role registry, permission coverage, and privilege boundaries for the platform."
      actions={
        <div className={styles.actionsGroup}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => crud.reload()}
            disabled={crud.loading}
          >
            <RefreshCw size={14} className={crud.loading ? "animate-spin" : ""} />
            Refresh
          </Button>

          {canManageRoles && (
            <Button size="sm" variant="primary" onClick={() => setIsCreating(true)}>
              <Plus size={14} />
              Create Role
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.container}>
        {/* Metric Statistics */}
        <StatCardRow stats={stats} columns={4} />

        {/* Filter and Search Bar */}
        <FilterBar
          filters={roleFilterConfigs}
          activeFilters={crud.filters}
          onFilterChange={(k, v) => crud.setFilter(k, v)}
          onClearFilter={(k) => crud.setFilter(k, "")}
          onClearAll={() => crud.setFilters({})}
          searchQuery={crud.searchQuery}
          onSearchChange={crud.setSearchQuery}
          searchPlaceholder="Search roles by name or description…"
        />

        {/* Paginated Data Grid */}
        <Card padding="none">
          <PaginatedTable<ProviderRole>
            columns={columns}
            data={crud.items}
            total={crud.total}
            page={crud.page}
            pageSize={crud.pageSize}
            onPageChange={crud.setPage}
            onPageSizeChange={crud.setPageSize}
            sortColumn={crud.sortColumn}
            sortDirection={crud.sortDirection}
            onSortChange={(col, dir) => {
              crud.setSortColumn(col);
              crud.setSortDirection(dir);
            }}
            loading={crud.loading}
            selectedKeys={selectedIds}
            onSelectionChange={(keys) => setSelectedIds(keys.map(String))}
            selectable
            exportable
            onExport={handleExportCsv}
            emptyMessage={
              crud.searchQuery
                ? "No roles matched your search."
                : "No provider roles found."
            }
          />
        </Card>

        {/* Create Role Drawer */}
        {isCreating && (
          <CrudDrawer
            open={isCreating}
            title="Create Provider Role"
            mode="create"
            schema={roleFormSchema}
            fields={roleDrawerFields}
            initialValues={{}}
            onSubmit={async (values) => {
              await crud.handleCreate(values as any);
              setIsCreating(false);
            }}
            onClose={() => setIsCreating(false)}
          />
        )}

        {/* Edit Role Drawer */}
        {editingRole && (
          <CrudDrawer
            open={Boolean(editingRole)}
            title={`Edit Role: ${editingRole.name}`}
            mode="edit"
            schema={roleFormSchema}
            fields={roleDrawerFields}
            initialValues={{
              name: editingRole.name,
              description: editingRole.description || "",
            }}
            onSubmit={async (values) => {
              await crud.handleUpdate(editingRole.id, values);
              setEditingRole(null);
            }}
            onClose={() => setEditingRole(null)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={Boolean(deletingRole)}
          title="Delete Role"
          message={`Are you sure you want to delete the role "${deletingRole?.name}"? Any users assigned to this role must be reassigned first.`}
          variant="danger"
          confirmLabel="Delete Role"
          onConfirm={async () => {
            if (!deletingRole) return;
            await crud.handleDelete(deletingRole.id);
            setDeletingRole(null);
          }}
          onCancel={() => setDeletingRole(null)}
        />
      </div>
    </DomainShell>
  );
}