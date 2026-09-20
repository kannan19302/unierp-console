"use client";
/**
 * Security & Compliance → Policies.
 * Enterprise-scale tenant isolation and security policies directory.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Badge,
  Button,
  Card,
  ForbiddenState,
  StatCardRow,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Power,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/use-toast";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import DomainShell from "@/components/domain-shell";
import { PaginatedTable, type ColumnDef } from "@/components/PaginatedTable";
import { FilterBar } from "@/components/FilterBar";
import { CrudDrawer } from "@/components/CrudDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  type SecurityPolicy,
  securityPolicyFormSchema,
  securityPolicyDrawerFields,
  securityPolicyFilterConfigs,
} from "@/lib/security-schema";
import styles from "./policies.module.css";

export default function SecurityPoliciesPage() {
  const toast = useToast();
  const canAccess = usePermission("pcc.security.view");
  const canManage = usePermission("system.isolation.write");

  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<SecurityPolicy | null>(null);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (search) params.set("search", search);
      if (filters.enforcementMode) params.set("enforcementMode", filters.enforcementMode);
      if (filters.scopeType) params.set("scopeType", filters.scopeType);

      const res = await api.get<{ data: SecurityPolicy[]; total: number }>(
        `/platform/v1/soc/policies?${params.toString()}`
      );
      setPolicies(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      toast.error("Failed to load security policies", err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, filters, toast]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  useDomainRealtime("security", fetchPolicies);

  // Drawer actions
  const handleOpenCreate = () => {
    setSelectedPolicy(null);
    setDrawerMode("create");
    setDrawerOpen(true);
  };

  const handleOpenEdit = (policy: SecurityPolicy) => {
    setSelectedPolicy(policy);
    setDrawerMode("edit");
    setDrawerOpen(true);
  };

  const handleDrawerSubmit = async (values: any) => {
    try {
      if (drawerMode === "create") {
        await api.post("/platform/v1/soc/policies", values);
        toast.success("Policy Created", `Policy "${values.name}" has been registered and activated.`);
      } else if (selectedPolicy) {
        await api.patch(`/platform/v1/soc/policies/${selectedPolicy.id}`, values);
        toast.success("Policy Updated", `Policy "${selectedPolicy.name}" has been modified.`);
      }
      setDrawerOpen(false);
      fetchPolicies();
    } catch (err: any) {
      toast.error("Operation Failed", err.message || "Could not save policy.");
      throw err;
    }
  };

  // Toggle enable/disable
  const handleToggleStatus = async (policy: SecurityPolicy) => {
    try {
      const nextState = !policy.enabled;
      await api.patch(`/platform/v1/soc/policies/${policy.id}`, {
        enabled: nextState,
      });
      toast.info(
        "Policy Status Changed",
        `Policy "${policy.name}" is now ${nextState ? "Active" : "Disabled"}.`
      );
      fetchPolicies();
    } catch (err: any) {
      toast.error("Toggle Failed", err.message || "Could not update policy status.");
    }
  };

  // Delete action
  const handleOpenDelete = (policy: SecurityPolicy) => {
    setPolicyToDelete(policy);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!policyToDelete) return;
    try {
      await api.del(`/platform/v1/soc/policies/${policyToDelete.id}`);
      toast.success("Policy Deleted", `Security policy "${policyToDelete.name}" was removed.`);
      setDeleteDialogOpen(false);
      setPolicyToDelete(null);
      fetchPolicies();
    } catch (err: any) {
      toast.error("Delete Failed", err.message || "Failed to remove policy.");
    }
  };

  // Stats calculation
  const stats: StatCardItem[] = useMemo(() => {
    const totalCount = total || policies.length;
    const activeCount = policies.filter((p) => p.enabled !== false).length;
    const strictBlockCount = policies.filter((p) => p.enforcementMode === "BLOCK").length;
    const rlsCount = policies.filter((p) => p.isolationLevel === "ROW_LEVEL_SECURITY").length;

    return [
      { label: "Active Policies", value: activeCount },
      { label: "Total Registered", value: totalCount },
      { label: "Strict Block Rules", value: strictBlockCount },
      { label: "RLS Partitions", value: rlsCount },
    ];
  }, [policies, total]);

  const columns: ColumnDef<SecurityPolicy>[] = [
    {
      key: "name",
      label: "Policy Name & Directive",
      render: (_, row: SecurityPolicy) => (
        <div className={styles.policyCell}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Shield size={14} color="var(--color-primary)" />
            <span className={styles.policyName}>{row.name}</span>
            <Badge variant="info">v{row.version || 1}</Badge>
          </div>
          {row.description && (
            <span className={styles.policyDesc}>{row.description}</span>
          )}
        </div>
      ),
    },
    {
      key: "scopeType",
      label: "Scope Hierarchy",
      render: (_, row: SecurityPolicy) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <Badge variant="default">{row.scopeType}</Badge>
          {row.scopeId && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              ID: {row.scopeId}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "isolationLevel",
      label: "Isolation Strategy",
      render: (_, row: SecurityPolicy) => {
        const isRls = row.isolationLevel === "ROW_LEVEL_SECURITY";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
            {isRls ? (
              <Lock size={13} color="var(--color-success)" />
            ) : (
              <ShieldCheck size={13} color="var(--color-info)" />
            )}
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 500 }}>
              {row.isolationLevel.replace(/_/g, " ")}
            </span>
          </div>
        );
      },
    },
    {
      key: "enforcementMode",
      label: "Enforcement Mode",
      render: (_, row: SecurityPolicy) => {
        const variant =
          row.enforcementMode === "BLOCK"
            ? "danger"
            : row.enforcementMode === "ALERT"
            ? "warning"
            : "default";
        return <Badge variant={variant}>{row.enforcementMode}</Badge>;
      },
    },
    {
      key: "enabled",
      label: "Status",
      render: (_, row: SecurityPolicy) => {
        const isEnabled = row.enabled !== false;
        return (
          <button
            className={`${styles.toggleButton} ${
              isEnabled ? styles.toggleActive : styles.toggleDisabled
            }`}
            onClick={() => handleToggleStatus(row)}
            title={isEnabled ? "Click to disable" : "Click to enable"}
          >
            <Power size={11} />
            <span>{isEnabled ? "ACTIVE" : "DISABLED"}</span>
          </button>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row: SecurityPolicy) => (
        <div style={{ display: "flex", gap: "var(--space-1)", justifyContent: "flex-end" }}>
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEdit(row)}
              title="Edit Policy"
            >
              <Edit2 size={13} />
            </Button>
          )}
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenDelete(row)}
              title="Delete Policy"
            >
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (!canAccess) {
    return (
      <DomainShell domainId="security" title="Policies">
        <ForbiddenState
          title="Access Restricted"
          description="You lack the required security permission (pcc.security.view) to inspect or administer isolation policies."
        />
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="security"
      title="Policies"
      description="Enterprise tenant isolation strategies, database RLS rules, and perimeter barriers."
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className={styles.tableToolbar}>
              <div className={styles.titleArea}>
                <h3 className={styles.pageTitle}>Platform Isolation Policies</h3>
                <p className={styles.pageSubtitle}>
                  Multi-tenant boundaries, Row-Level Security rules, and scope-based isolation levels.
                </p>
              </div>
              {canManage && (
                <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                  <Plus size={14} />
                  Register Policy
                </Button>
              )}
            </div>

            <FilterBar
              filters={securityPolicyFilterConfigs}
              activeFilters={filters}
              searchQuery={search}
              searchPlaceholder="Search policies by name, description, or scope..."
              onFilterChange={(key: string, value: string) => {
                setFilters((prev) => ({ ...prev, [key]: value }));
                setPage(1);
              }}
              onSearchChange={(q: string) => {
                setSearch(q);
                setPage(1);
              }}
              onClearAll={() => {
                setFilters({});
                setSearch("");
                setPage(1);
              }}
            />

            <PaginatedTable<SecurityPolicy>
              columns={columns}
              data={policies}
              loading={loading}
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              emptyMessage="No isolation policies matched your search criteria."
            />
          </div>
        </Card>
      </div>

      {/* Policy Create / Edit Drawer */}
      <CrudDrawer
        open={drawerOpen}
        title={drawerMode === "create" ? "Register Security Policy" : `Edit Policy: ${selectedPolicy?.name}`}
        mode={drawerMode}
        schema={securityPolicyFormSchema}
        fields={securityPolicyDrawerFields}
        initialValues={
          selectedPolicy
            ? {
                name: selectedPolicy.name,
                description: selectedPolicy.description || "",
                scopeType: selectedPolicy.scopeType,
                scopeId: selectedPolicy.scopeId || "",
                isolationLevel: selectedPolicy.isolationLevel,
                enforcementMode: selectedPolicy.enforcementMode,
                reason: selectedPolicy.overrides?.[0]?.reason || "Operational requirement",
              }
            : {
                scopeType: "PLATFORM",
                isolationLevel: "ROW_LEVEL_SECURITY",
                enforcementMode: "BLOCK",
                reason: "",
              }
        }
        onSubmit={handleDrawerSubmit}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Security Policy"
        message={`Are you sure you want to delete policy "${policyToDelete?.name}"? Deleting this policy removes associated isolation constraints and audit rules.`}
        entityName={policyToDelete?.name || ""}
        confirmLabel="Delete Policy"
        variant="danger"
        requireTyping={false}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setPolicyToDelete(null);
        }}
      />
    </DomainShell>
  );
}