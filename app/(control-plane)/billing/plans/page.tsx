"use client";
/**
 * Billing → Plans (PCC-06 Revenue & Billing).
 * Published tiered pricing plans, entitlements, and lifecycle bounds.
 */
import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Archive,
  Edit2,
  ExternalLink,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Users,
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
  type BillingPlan,
  planFormSchema,
  planDrawerFields,
  planFilterConfigs,
} from "@/lib/billing-schema";
import styles from "./plans.module.css";

function statusVariant(status: string): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "ARCHIVED":
      return "default";
    case "GRANDFATHERED":
      return "warning";
    default:
      return "default";
  }
}

export default function BillingPlansPage() {
  const toast = useToast();
  const canAccess = usePermission("pcc.billing.view");
  const canWrite = usePermission("system.plan.write");

  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null);
  const [archivingPlan, setArchivingPlan] = useState<BillingPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // CRUD hook handling pagination, sorting, search, optimistic updates, and toasts
  const crud = useCrud<BillingPlan>({
    entityName: "Plan",
    defaultPageSize: 25,
    adapter: {
      list: async ({ page, pageSize, sort, dir, filters, search }) => {
        const resp = await api.get<any>("/platform/v1/plans", {
          page,
          pageSize,
          sort,
          dir,
          includeArchived: filters?.status === "ARCHIVED" ? "true" : undefined,
          ...filters,
          search,
        });
        const allItems: BillingPlan[] = Array.isArray(resp.data) ? resp.data : resp.data?.data ?? [];
        // Local filtering if backend returns array
        const filtered = allItems.filter((p) => {
          if (filters?.status && p.status !== filters.status) return false;
          if (search) {
            const s = search.toLowerCase();
            return p.name.toLowerCase().includes(s) || (p.description?.toLowerCase().includes(s));
          }
          return true;
        });
        return { items: filtered, total: filtered.length };
      },
      create: async (data) => {
        const payload = data as any;
        const resp = await api.post<BillingPlan>("/platform/v1/plans", {
          name: payload.name,
          description: payload.description,
          maxUsers: Number(payload.maxUsers),
          maxStorage: Number(payload.maxStorage),
          maxApiCalls: Number(payload.maxApiCalls),
          features: {},
          isPublic: payload.isPublic ?? true,
        });
        // Also set initial price if provided
        if (resp.data?.id && (payload.monthlyPrice || payload.yearlyPrice)) {
          await api.post(`/platform/v1/plans/${resp.data.id}/prices`, {
            prices: [
              {
                currency: payload.currency || "USD",
                region: "global",
                monthly: Number(payload.monthlyPrice) || 0,
                yearly: Number(payload.yearlyPrice) || 0,
              },
            ],
            reason: "Initial plan price configuration",
          }).catch(() => {});
        }
        return resp.data;
      },
      update: async (id, data) => {
        const resp = await api.put<BillingPlan>(`/platform/v1/plans/${id}`, {
          data: {
            name: data.name,
            description: data.description,
            maxUsers: Number(data.maxUsers),
            maxStorage: Number(data.maxStorage),
            maxApiCalls: Number(data.maxApiCalls),
            isPublic: data.isPublic,
          },
          reason: "Updated plan parameters via control plane",
        });
        return resp.data;
      },
      delete: async (id) => {
        await api.del(`/platform/v1/plans/${id}`);
      },
    },
  });

  // Real-time updates
  useDomainRealtime("billing", useCallback(() => crud.reload(), [crud]));

  // CSV Export
  const handleExportCsv = useCallback(() => {
    const rowsToExport = crud.items.filter((item) =>
      selectedIds.length === 0 ? true : selectedIds.includes(item.id)
    );
    exportToCsv(
      [
        { key: "id", label: "Plan ID" },
        { key: "name", label: "Name" },
        { key: "status", label: "Status" },
        { key: "version", label: "Version" },
        { key: "maxUsers", label: "User Limit" },
        { key: "maxStorage", label: "Storage Limit (GB)" },
      ],
      rowsToExport,
      `billing-plans-${new Date().toISOString().split("T")[0]}.csv`
    );
    toast.info("CSV Exported", `Exported ${rowsToExport.length} plan record(s).`);
  }, [crud.items, selectedIds, toast]);

  // Statistics
  const activePlans = useMemo(() => crud.items.filter((p) => p.status === "ACTIVE").length, [crud.items]);
  const archivedPlans = useMemo(() => crud.items.filter((p) => p.status === "ARCHIVED").length, [crud.items]);
  const stats: StatCardItem[] = useMemo(
    () => [
      {
        id: "stat-active",
        label: "Active Plans",
        value: activePlans,
        helperText: "Published to pricing book",
      },
      {
        id: "stat-total",
        label: "Total Definitions",
        value: crud.total,
        helperText: "Across all versions",
      },
      {
        id: "stat-archived",
        label: "Archived Plans",
        value: archivedPlans,
        helperText: "Decommissioned packaging",
      },
    ],
    [activePlans, crud.total, archivedPlans]
  );

  // Table Columns
  const columns: ColumnDef<BillingPlan>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Plan Name",
        sortable: true,
        render: (_val, row) => (
          <div className={styles.planNameCell}>
            <span className={styles.planTitle}>{row.name}</span>
            {row.description && (
              <span className={styles.planDescription} title={row.description}>
                {row.description}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "prices",
        label: "Pricing",
        render: (_val, row) => {
          const primaryPrice = row.prices?.[0];
          if (!primaryPrice) return <span className={styles.pricePeriod}>Unpriced</span>;
          return (
            <div>
              <span className={styles.priceTag}>
                ${primaryPrice.monthly}
                <span className={styles.pricePeriod}>/mo</span>
              </span>
              <span className={styles.pricePeriod}>
                (${primaryPrice.yearly}/yr)
              </span>
            </div>
          );
        },
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
        key: "limits",
        label: "Entitlements",
        render: (_val, row) => (
          <div className={styles.quotaBadges}>
            <Badge variant="default">{row.maxUsers} seats</Badge>
            <Badge variant="default">{row.maxStorage}GB</Badge>
            <Badge variant="default">{(row.maxApiCalls / 1000).toFixed(0)}k API</Badge>
          </div>
        ),
      },
      {
        key: "version",
        label: "Version",
        sortable: true,
        render: (_val, row) => `v${row.version}`,
      },
      {
        key: "actions",
        label: "Actions",
        render: (_val, row) => (
          <div className={styles.actionButtons}>
            <Link href={`/billing/plans/${row.id}`} style={{ textDecoration: "none" }}>
              <button className={styles.actionButton} title="Open Plan Builder">
                <ExternalLink size={13} />
              </button>
            </Link>

            {canWrite && row.status !== "ARCHIVED" && (
              <button
                className={styles.actionButton}
                title="Edit Plan"
                onClick={() => setEditingPlan(row)}
              >
                <Edit2 size={13} />
              </button>
            )}

            {canWrite && row.status !== "ARCHIVED" && (
              <button
                className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                title="Archive Plan"
                onClick={() => setArchivingPlan(row)}
              >
                <Archive size={13} />
              </button>
            )}
          </div>
        ),
      },
    ],
    [canWrite]
  );

  if (!canAccess) {
    return (
      <DomainShell domainId="billing" title="Plans">
        <ForbiddenState
          title="Access Restricted"
          description="You do not have permission (pcc.billing.view) to inspect or modify pricing plans."
        />
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="billing"
      title="Plans"
      description="Published pricing tiers, quotas, packaging definitions, and price books."
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

          {canWrite && (
            <Button size="sm" variant="primary" onClick={() => setIsCreating(true)}>
              <Plus size={14} />
              Create Plan
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.container}>
        {/* Statistics Bar */}
        <StatCardRow stats={stats} columns={3} />

        {/* Filter and Search Bar */}
        <FilterBar
          filters={planFilterConfigs}
          activeFilters={crud.filters}
          searchQuery={crud.searchQuery}
          onFilterChange={crud.setFilter}
          onSearchChange={crud.setSearchQuery}
          onClearAll={() => crud.setFilters({})}
        />

        {/* Paginated Data Grid */}
        <Card padding="none">
          <PaginatedTable<BillingPlan>
            columns={columns}
            data={crud.items}
            loading={crud.loading}
            page={crud.page}
            pageSize={crud.pageSize}
            total={crud.total}
            sortColumn={crud.sortColumn}
            sortDirection={crud.sortDirection}
            onPageChange={crud.setPage}
            onPageSizeChange={crud.setPageSize}
            onSortChange={(col, dir) => {
              crud.setSortColumn(col);
              crud.setSortDirection(dir);
            }}
            selectedKeys={selectedIds}
            onSelectionChange={(keys) => setSelectedIds(keys.map(String))}
            selectable
            exportable
            onExport={handleExportCsv}
            emptyMessage={
              crud.searchQuery || Object.keys(crud.filters).length > 0
                ? "No billing plans match the selected filters."
                : "No billing plans configured."
            }
          />
        </Card>

        {/* Create Plan Drawer */}
        {isCreating && (
          <CrudDrawer
            open={isCreating}
            title="Create Billing Plan"
            mode="create"
            schema={planFormSchema}
            fields={planDrawerFields}
            initialValues={{
              maxUsers: 10,
              maxStorage: 50,
              maxApiCalls: 25000,
              monthlyPrice: 99,
              yearlyPrice: 990,
              currency: "USD",
              isPublic: true,
            }}
            onSubmit={async (values) => {
              await crud.handleCreate(values as any);
              setIsCreating(false);
            }}
            onClose={() => setIsCreating(false)}
          />
        )}

        {/* Edit Plan Drawer */}
        {editingPlan && (
          <CrudDrawer
            open={Boolean(editingPlan)}
            title={`Edit Plan: ${editingPlan.name}`}
            mode="edit"
            schema={planFormSchema}
            fields={planDrawerFields}
            initialValues={{
              name: editingPlan.name,
              description: editingPlan.description || "",
              maxUsers: editingPlan.maxUsers,
              maxStorage: editingPlan.maxStorage,
              maxApiCalls: editingPlan.maxApiCalls,
              monthlyPrice: editingPlan.prices?.[0]?.monthly || 0,
              yearlyPrice: editingPlan.prices?.[0]?.yearly || 0,
              currency: editingPlan.prices?.[0]?.currency || "USD",
              isPublic: editingPlan.isPublic,
            }}
            onSubmit={async (values) => {
              await crud.handleUpdate(editingPlan.id, values);
              setEditingPlan(null);
            }}
            onClose={() => setEditingPlan(null)}
          />
        )}

        {/* Archive Plan Confirm Dialog */}
        <ConfirmDialog
          open={Boolean(archivingPlan)}
          title="Archive Plan"
          message={`Are you sure you want to archive "${archivingPlan?.name}"? Existing subscribers will remain on their current terms, but new subscriptions cannot be provisioned.`}
          variant="warning"
          confirmLabel="Archive Plan"
          onConfirm={async () => {
            if (!archivingPlan) return;
            await crud.handleDelete(archivingPlan.id);
            setArchivingPlan(null);
          }}
          onCancel={() => setArchivingPlan(null)}
        />
      </div>
    </DomainShell>
  );
}