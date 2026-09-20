"use client";
/**
 * Users & Access → Directory.
 * Complete enterprise control-plane workforce management with full CRUD,
 * pagination, filtering, search, sorting, slide-over drawer, and real-time updates.
 */
import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  Shield,
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
import { formatDate } from "@/lib/format-date";
import { exportToCsv } from "@/lib/export-csv";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";
import { PaginatedTable, type ColumnDef } from "@/components/PaginatedTable";
import { FilterBar } from "@/components/FilterBar";
import { CrudDrawer } from "@/components/CrudDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  type StaffPrincipal,
  staffPrincipalFormSchema,
  staffDrawerFields,
  staffFilterConfigs,
} from "@/lib/access-schema";
import styles from "./directory.module.css";

function statusVariant(status: string): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "SUSPENDED":
      return "warning";
    case "DEACTIVATED":
      return "default";
    case "LOCKED":
      return "danger";
    default:
      return "default";
  }
}

export default function AccessDirectoryPage() {
  const toast = useToast();
  const canAccess = usePermission("pcc.identity-governance.access");
  const canCreate = usePermission("system.staff.create");
  const canUpdate = usePermission("system.staff.update");
  const canDelete = usePermission("system.staff.delete");

  const [editingUser, setEditingUser] = useState<StaffPrincipal | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<StaffPrincipal | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // CRUD Hook handling pagination, sorting, search, optimistic updates, and toasts
  const crud = useCrud<StaffPrincipal>({
    entityName: "Staff Operator",
    defaultPageSize: 25,
    adapter: {
      list: async ({ page, pageSize, sort, dir, filters, search }) => {
        const resp = await api.get<any>("/platform/v1/staff-idp/principals", {
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
        const resp = await api.post<StaffPrincipal>("/platform/v1/staff-idp/principals", data);
        return resp.data;
      },
      update: async (id, data) => {
        const resp = await api.patch<StaffPrincipal>(`/platform/v1/staff-idp/principals/${id}`, data);
        return resp.data;
      },
      delete: async (id) => {
        await api.del(`/platform/v1/staff-idp/principals/${id}`);
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
        { key: "id", label: "User ID" },
        { key: "name", label: "Full Name" },
        { key: "email", label: "Email" },
        { key: "status", label: "Status" },
        { key: "mfaEnabled", label: "MFA Enabled" },
        { key: "createdAt", label: "Created At" },
        { key: "lastLoginAt", label: "Last Login" },
      ],
      rowsToExport,
      `staff-directory-${new Date().toISOString().split("T")[0]}.csv`
    );
    toast.info("CSV Exported", `Exported ${rowsToExport.length} staff record(s).`);
  }, [crud.items, selectedIds, toast]);

  // Statistics
  const activeCount = useMemo(
    () => crud.items.filter((u) => u.status === "ACTIVE").length,
    [crud.items]
  );
  const mfaCount = useMemo(
    () => crud.items.filter((u) => u.mfaEnabled).length,
    [crud.items]
  );

  const stats: StatCardItem[] = useMemo(
    () => [
      {
        label: "Total Staff",
        value: crud.total,
        icon: <Users size={16} />,
      },
      {
        label: "Active Operators",
        value: activeCount,
        icon: <UserCheck size={16} />,
      },
      {
        label: "MFA Enforced",
        value: mfaCount,
        icon: <Shield size={16} />,
      },
      {
        label: "Selected Records",
        value: selectedIds.length,
        icon: <Lock size={16} />,
      },
    ],
    [crud.total, activeCount, mfaCount, selectedIds.length]
  );

  // Table Columns
  const columns: ColumnDef<StaffPrincipal>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Operator",
        sortable: true,
        render: (_val, row) => (
          <div className={styles.userCell}>
            <span className={styles.userName}>{row.name}</span>
            <span className={styles.userEmail}>{row.email}</span>
          </div>
        ),
      },
      {
        key: "roles",
        label: "Assigned Roles",
        render: (_val, row) => (
          <div className={styles.roleTags}>
            {row.roles && row.roles.length > 0 ? (
              row.roles.map((r) => (
                <Badge key={r.id} variant="default">
                  {r.name}
                </Badge>
              ))
            ) : (
              <span className={styles.userEmail}>No roles</span>
            )}
          </div>
        ),
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
        key: "mfaEnabled",
        label: "MFA",
        sortable: true,
        render: (_val, row) => (
          <Badge variant={row.mfaEnabled ? "success" : "default"}>
            {row.mfaEnabled ? "Enforced" : "Disabled"}
          </Badge>
        ),
      },
      {
        key: "lastLoginAt",
        label: "Last Login",
        sortable: true,
        render: (_val, row) => (row.lastLoginAt ? formatDate(row.lastLoginAt) : "Never"),
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
          <div className={styles.actionButtons}>
            <Link href={`/access/directory/${row.id}`} style={{ textDecoration: "none" }}>
              <button className={styles.actionButton} title="View Details">
                <ExternalLink size={13} />
              </button>
            </Link>

            {canUpdate && (
              <button
                className={styles.actionButton}
                title="Edit Staff Operator"
                onClick={() => setEditingUser(row)}
              >
                <Edit2 size={13} />
              </button>
            )}

            {canDelete && row.status !== "DEACTIVATED" && (
              <button
                className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                title="Deactivate Operator"
                onClick={() => setDeactivatingUser(row)}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ),
      },
    ],
    [canUpdate, canDelete]
  );

  if (!canAccess) {
    return (
      <DomainShell domainId="access" title="Directory">
        <ForbiddenState
          title="Access Restricted"
          description="You do not have permission (pcc.identity-governance.access) to manage workforce staff accounts."
        />
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="access"
      title="Directory"
      description="Workforce operator registry, role governance, and privilege inspection."
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

          {canCreate && (
            <Button size="sm" variant="primary" onClick={() => setIsCreating(true)}>
              <Plus size={14} />
              Invite Operator
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.container}>
        {/* Metric Statistics */}
        <StatCardRow stats={stats} columns={4} />

        {/* Universal Filter and Search Bar */}
        <FilterBar
          filters={staffFilterConfigs}
          activeFilters={crud.filters}
          onFilterChange={(k, v) => crud.setFilter(k, v)}
          onClearFilter={(k) => crud.setFilter(k, "")}
          onClearAll={() => crud.setFilters({})}
          searchQuery={crud.searchQuery}
          onSearchChange={crud.setSearchQuery}
          searchPlaceholder="Search operators by name or email…"
        />

        {/* Paginated Data Grid */}
        <Card padding="none">
          <PaginatedTable<StaffPrincipal>
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
                ? "No operators matched your search."
                : "No workforce staff accounts registered."
            }
          />
        </Card>

        {/* Create Operator Drawer */}
        {isCreating && (
          <CrudDrawer
            open={isCreating}
            title="Invite Staff Operator"
            mode="create"
            schema={staffPrincipalFormSchema}
            fields={staffDrawerFields}
            initialValues={{ status: "ACTIVE", mfaEnabled: false }}
            onSubmit={async (values) => {
              await crud.handleCreate(values as any);
              setIsCreating(false);
            }}
            onClose={() => setIsCreating(false)}
          />
        )}

        {/* Edit Operator Drawer */}
        {editingUser && (
          <CrudDrawer
            open={Boolean(editingUser)}
            title={`Edit Operator: ${editingUser.name}`}
            mode="edit"
            schema={staffPrincipalFormSchema}
            fields={staffDrawerFields}
            initialValues={{
              email: editingUser.email,
              firstName: editingUser.firstName || "",
              lastName: editingUser.lastName || "",
              status: editingUser.status,
              mfaEnabled: editingUser.mfaEnabled,
            }}
            onSubmit={async (values) => {
              await crud.handleUpdate(editingUser.id, values);
              setEditingUser(null);
            }}
            onClose={() => setEditingUser(null)}
          />
        )}

        {/* Deactivate Confirmation Dialog */}
        <ConfirmDialog
          open={Boolean(deactivatingUser)}
          title="Deactivate Staff Operator"
          message={`Are you sure you want to deactivate "${deactivatingUser?.name}" (${deactivatingUser?.email})? All active operator sessions will be revoked immediately.`}
          variant="danger"
          confirmLabel="Deactivate Operator"
          onConfirm={async () => {
            if (!deactivatingUser) return;
            await crud.handleDelete(deactivatingUser.id);
            setDeactivatingUser(null);
          }}
          onCancel={() => setDeactivatingUser(null)}
        />
      </div>
    </DomainShell>
  );
}