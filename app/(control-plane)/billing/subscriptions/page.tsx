"use client";
/**
 * Billing → Subscriptions (PCC-06 Revenue & Billing).
 * Customer subscriptions, lifecycle state transitions (trial → active → past_due → cancelled),
 * mid-cycle plan amendments, and cancellation workflows.
 */
import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  CreditCard,
  Edit2,
  ExternalLink,
  Pause,
  Play,
  RefreshCw,
  Slash,
  XCircle,
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
import { CrudDrawer, type FieldDef } from "@/components/CrudDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  type BillingSubscription,
  subscriptionAmendSchema,
  subscriptionFilterConfigs,
} from "@/lib/billing-schema";
import styles from "./subscriptions.module.css";

function statusVariant(status: string): "success" | "warning" | "danger" | "default" | "info" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "TRIAL":
      return "info";
    case "PAST_DUE":
      return "danger";
    case "PAUSED":
      return "warning";
    case "CANCELLED":
    case "EXPIRED":
      return "default";
    default:
      return "default";
  }
}

export default function SubscriptionsPage() {
  const toast = useToast();
  const canAccess = usePermission("pcc.billing.view");
  const canManage = usePermission("system.subscription.write");

  const [amendingSub, setAmendingSub] = useState<BillingSubscription | null>(null);
  const [cancellingSub, setCancellingSub] = useState<BillingSubscription | null>(null);
  const [pausingSub, setPausingSub] = useState<BillingSubscription | null>(null);
  const [resumingSub, setResumingSub] = useState<BillingSubscription | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // CRUD hook handling pagination, sorting, search, optimistic updates, and toasts
  const crud = useCrud<BillingSubscription>({
    entityName: "Subscription",
    defaultPageSize: 25,
    adapter: {
      list: async ({ page, pageSize, sort, dir, filters, search }) => {
        const resp = await api.get<any>("/platform/v1/subscriptions", {
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
        return data as BillingSubscription;
      },
      update: async (id, data) => {
        // Handled by specific transition endpoints
        return data as BillingSubscription;
      },
      delete: async (id) => {
        // Handled by cancel endpoint
      },
    },
  });

  // Real-time updates
  useDomainRealtime("billing", useCallback(() => crud.reload(), [crud]));

  // Handle plan amendment
  const handleAmendSubscription = async (values: Record<string, any>) => {
    if (!amendingSub) return;
    try {
      await api.put(`/platform/v1/subscriptions/${amendingSub.tenantId}/transition`, {
        planId: values.planId,
        billingPeriod: values.billingPeriod,
        prorate: true,
      });
      toast.success("Subscription Amended", `Updated terms for tenant ${amendingSub.tenant?.name || amendingSub.tenantId}.`);
      setAmendingSub(null);
      crud.reload();
    } catch (err: any) {
      toast.error("Amendment Failed", err.message || "Failed to amend subscription.");
    }
  };

  // Handle cancellation
  const handleConfirmCancel = async () => {
    if (!cancellingSub) return;
    try {
      await api.post(`/platform/v1/subscriptions/${cancellingSub.tenantId}/cancel`, {});
      toast.success("Subscription Cancelled", `Terminated subscription for tenant ${cancellingSub.tenant?.name || cancellingSub.tenantId}.`);
      setCancellingSub(null);
      crud.reload();
    } catch (err: any) {
      toast.error("Cancellation Failed", err.message || "Failed to cancel subscription.");
    }
  };

  // Handle pause
  const handleConfirmPause = async () => {
    if (!pausingSub) return;
    try {
      await api.post(`/platform/v1/subscriptions/${pausingSub.tenantId}/pause`, {});
      toast.success("Subscription Paused", `Paused billing for ${pausingSub.tenant?.name || pausingSub.tenantId}.`);
      setPausingSub(null);
      crud.reload();
    } catch (err: any) {
      toast.error("Pause Failed", err.message || "Failed to pause subscription.");
    }
  };

  // Handle resume
  const handleConfirmResume = async () => {
    if (!resumingSub) return;
    try {
      await api.post(`/platform/v1/subscriptions/${resumingSub.tenantId}/resume`, {});
      toast.success("Subscription Resumed", `Restored active billing for ${resumingSub.tenant?.name || resumingSub.tenantId}.`);
      setResumingSub(null);
      crud.reload();
    } catch (err: any) {
      toast.error("Resume Failed", err.message || "Failed to resume subscription.");
    }
  };

  // Export CSV
  const handleExportCsv = useCallback(() => {
    const rowsToExport = crud.items.filter((item) =>
      selectedIds.length === 0 ? true : selectedIds.includes(item.id)
    );
    exportToCsv(
      [
        { key: "id", label: "Subscription ID" },
        { key: "tenantId", label: "Tenant ID" },
        { key: "status", label: "Status" },
        { key: "billingPeriod", label: "Billing Cadence" },
        { key: "startDate", label: "Start Date" },
        { key: "endDate", label: "Renewal Date" },
      ],
      rowsToExport,
      `subscriptions-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    toast.info("CSV Exported", `Exported ${rowsToExport.length} subscription record(s).`);
  }, [crud.items, selectedIds, toast]);

  // Statistics
  const activeCount = useMemo(() => crud.items.filter((s) => s.status === "ACTIVE").length, [crud.items]);
  const pastDueCount = useMemo(() => crud.items.filter((s) => s.status === "PAST_DUE").length, [crud.items]);
  const stats: StatCardItem[] = useMemo(
    () => [
      {
        id: "stat-active",
        label: "Active Subscriptions",
        value: activeCount,
        helperText: "Generating recurring revenue",
      },
      {
        id: "stat-total",
        label: "Total Accounts",
        value: crud.total,
        helperText: "Across all tenants",
      },
      {
        id: "stat-past-due",
        label: "Past Due",
        value: pastDueCount,
        helperText: "Requires payment remediation",
      },
    ],
    [activeCount, crud.total, pastDueCount]
  );

  // Table Columns
  const columns: ColumnDef<BillingSubscription>[] = useMemo(
    () => [
      {
        key: "tenant",
        label: "Tenant Partition",
        sortable: true,
        render: (_val, row) => (
          <div className={styles.tenantCell}>
            <span className={styles.tenantName}>{row.tenant?.name || row.tenantId}</span>
            <span className={styles.tenantSlug}>
              {row.tenant?.slug ? `@${row.tenant.slug}` : row.tenantId.slice(0, 12)}
            </span>
          </div>
        ),
      },
      {
        key: "plan",
        label: "Active Plan",
        render: (_val, row) => (
          <Badge variant="primary">
            {row.plan?.name || "Enterprise Tier"}
          </Badge>
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
        key: "billingPeriod",
        label: "Cadence",
        sortable: true,
        render: (_val, row) => (
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 500 }}>
            {row.billingPeriod} ({row.currency})
          </span>
        ),
      },
      {
        key: "startDate",
        label: "Started",
        sortable: true,
        render: (_val, row) => formatDate(row.startDate),
      },
      {
        key: "endDate",
        label: "Renewal / End",
        sortable: true,
        render: (_val, row) => (row.endDate ? formatDate(row.endDate) : "Perpetual"),
      },
      {
        key: "actions",
        label: "Actions",
        render: (_val, row) => (
          <div className={styles.actionButtons}>
            <Link href={`/tenants/directory/${row.tenantId}`} style={{ textDecoration: "none" }}>
              <button className={styles.actionButton} title="View Tenant Overview">
                <ExternalLink size={13} />
              </button>
            </Link>

            {canManage && row.status !== "CANCELLED" && (
              <button
                className={styles.actionButton}
                title="Amend Subscription Plan"
                onClick={() => setAmendingSub(row)}
              >
                <Edit2 size={13} />
              </button>
            )}

            {canManage && row.status === "ACTIVE" && (
              <button
                className={styles.actionButton}
                title="Pause Subscription"
                onClick={() => setPausingSub(row)}
              >
                <Pause size={13} />
              </button>
            )}

            {canManage && row.status === "PAUSED" && (
              <button
                className={styles.actionButton}
                title="Resume Subscription"
                onClick={() => setResumingSub(row)}
              >
                <Play size={13} />
              </button>
            )}

            {canManage && row.status !== "CANCELLED" && (
              <button
                className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                title="Cancel Subscription"
                onClick={() => setCancellingSub(row)}
              >
                <XCircle size={13} />
              </button>
            )}
          </div>
        ),
      },
    ],
    [canManage]
  );

  const amendDrawerFields: FieldDef[] = useMemo(
    () => [
      {
        name: "planId",
        label: "Target Plan",
        type: "text",
        placeholder: "Enter plan ID (e.g. plan-enterprise)",
        required: true,
      },
      {
        name: "billingPeriod",
        label: "Billing Cadence",
        type: "select",
        options: [
          { label: "Monthly", value: "MONTHLY" },
          { label: "Yearly", value: "YEARLY" },
        ],
        required: true,
      },
      {
        name: "reason",
        label: "Amendment Reason",
        type: "textarea",
        placeholder: "Commercial rationale for tier upgrade or downgrade",
        required: true,
      },
    ],
    []
  );

  if (!canAccess) {
    return (
      <DomainShell domainId="billing" title="Subscriptions">
        <ForbiddenState
          title="Access Restricted"
          description="You do not have permission (pcc.billing.view) to view tenant subscriptions."
        />
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="billing"
      title="Subscriptions"
      description="Active tenant subscriptions, recurring billing contracts, plan transitions, and cancellations."
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
        </div>
      }
    >
      <div className={styles.container}>
        {/* Statistics Row */}
        <StatCardRow stats={stats} columns={3} />

        {/* Filter and Search Bar */}
        <FilterBar
          filters={subscriptionFilterConfigs}
          activeFilters={crud.filters}
          searchQuery={crud.searchQuery}
          onFilterChange={crud.setFilter}
          onSearchChange={crud.setSearchQuery}
          onClearAll={() => crud.setFilters({})}
        />

        {/* Paginated Data Grid */}
        <Card padding="none">
          <PaginatedTable<BillingSubscription>
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
            emptyMessage="No customer subscriptions found."
          />
        </Card>

        {/* Amend Subscription Drawer */}
        {amendingSub && (
          <CrudDrawer
            open={Boolean(amendingSub)}
            title={`Amend Subscription: ${amendingSub.tenant?.name || amendingSub.tenantId}`}
            mode="edit"
            schema={subscriptionAmendSchema}
            fields={amendDrawerFields}
            initialValues={{
              planId: amendingSub.planId,
              billingPeriod: amendingSub.billingPeriod,
              reason: "Mid-cycle commercial tier adjustment",
            }}
            onSubmit={handleAmendSubscription}
            onClose={() => setAmendingSub(null)}
          />
        )}

        {/* Cancel Confirm Dialog */}
        <ConfirmDialog
          open={Boolean(cancellingSub)}
          title="Cancel Subscription"
          message={`Are you sure you want to cancel the subscription for "${cancellingSub?.tenant?.name || cancellingSub?.tenantId}"? This will cease recurring billing immediately.`}
          variant="danger"
          confirmLabel="Cancel Subscription"
          onConfirm={handleConfirmCancel}
          onCancel={() => setCancellingSub(null)}
        />

        {/* Pause Confirm Dialog */}
        <ConfirmDialog
          open={Boolean(pausingSub)}
          title="Pause Subscription"
          message={`Temporarily freeze recurring billing for "${pausingSub?.tenant?.name || pausingSub?.tenantId}"?`}
          variant="warning"
          confirmLabel="Pause Subscription"
          onConfirm={handleConfirmPause}
          onCancel={() => setPausingSub(null)}
        />

        {/* Resume Confirm Dialog */}
        <ConfirmDialog
          open={Boolean(resumingSub)}
          title="Resume Subscription"
          message={`Restore active recurring billing for "${resumingSub?.tenant?.name || resumingSub?.tenantId}"?`}
          variant="warning"
          confirmLabel="Resume Subscription"
          onConfirm={handleConfirmResume}
          onCancel={() => setResumingSub(null)}
        />
      </div>
    </DomainShell>
  );
}