"use client";
/**
 * Security & Compliance → Policies.
 * Enterprise-scale tenant isolation, visual ABAC policy rules editor, and evaluation simulator (EC-8.1).
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Button,
  ForbiddenState,
  StatCardRow,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import {
  Shield,
  Plus,
  Sliders,
  Play,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/use-toast";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import DomainShell from "@/components/domain-shell";
import type { SecurityPolicy, AbacPolicyRule } from "@/lib/security-schema";
import { DEFAULT_ABAC_RULES } from "@/lib/fixtures/security-policies";
import {
  PolicyInventory,
  AbacRuleBuilder,
  EvaluationSimulator,
  PolicyModals,
} from "./_components";
import styles from "./policies.module.css";

export default function SecurityPoliciesPage() {
  const toast = useToast();
  const canAccess = usePermission("pcc.security.view");
  const canManage = usePermission("system.isolation.write");

  const [activeTab, setActiveTab] = useState<"inventory" | "abac-editor" | "simulator">("inventory");

  // Policy Inventory state
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

  // ABAC Rules state (EC-8.1)
  const [abacRules, setAbacRules] = useState<AbacPolicyRule[]>(DEFAULT_ABAC_RULES);
  const [abacModalOpen, setAbacModalOpen] = useState(false);

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
    if (!canAccess) return;
    fetchPolicies();
  }, [canAccess, fetchPolicies]);

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
        toast.success("Policy Created", `Policy "${values.name}" has been registered.`);
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

  const handleToggleStatus = async (policy: SecurityPolicy) => {
    try {
      await api.patch(`/platform/v1/soc/policies/${policy.id}`, { enabled: !policy.enabled });
      toast.info("Policy Status Changed", `Policy "${policy.name}" is now ${!policy.enabled ? "Active" : "Disabled"}.`);
      fetchPolicies();
    } catch (err: any) {
      toast.error("Toggle Failed", err.message || "Could not update policy status.");
    }
  };

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

  const handleAddAbacRule = (rule: AbacPolicyRule) => {
    setAbacRules((prev) => [...prev, rule].sort((a, b) => a.priority - b.priority));
    toast.success("ABAC Rule Registered", `Policy rule "${rule.name}" active at priority ${rule.priority}.`);
  };

  const handleMovePriority = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= abacRules.length) return;
    const reordered = [...abacRules];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    reordered.forEach((r, i) => { r.priority = (i + 1) * 10; });
    setAbacRules([...reordered]);
    toast.info("Priority Updated", "Adjusted rule evaluation precedence.");
  };

  // Stats calculation
  const stats: StatCardItem[] = useMemo(() => {
    const totalCount = total || policies.length;
    const activeCount = policies.filter((p) => p.enabled !== false).length;
    const abacCount = abacRules.length;
    const rlsCount = policies.filter((p) => p.isolationLevel === "ROW_LEVEL_SECURITY").length;

    return [
      { label: "Active Policies", value: activeCount },
      { label: "ABAC Rule Engines", value: abacCount },
      { label: "Total Registered", value: totalCount },
      { label: "RLS Partitions", value: rlsCount },
    ];
  }, [policies, total, abacRules]);

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
      title="Policies & ABAC Engine"
      description="Enterprise tenant isolation strategies, fine-grained Attribute-Based Access Control (ABAC), and policy simulation."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {canManage && (
            <Button variant="primary" size="sm" onClick={() => setAbacModalOpen(true)}>
              <Plus size={14} />
              Add ABAC Rule
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={4} />

        {/* Tab Navigation */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "inventory" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            <Shield size={15} />
            Policy Inventory & Scope
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "abac-editor" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("abac-editor")}
          >
            <Sliders size={15} />
            Visual ABAC Policy Rules (EC-8.1)
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "simulator" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("simulator")}
          >
            <Play size={15} />
            Policy Evaluation Simulator
          </button>
        </div>

        {/* TAB 1: POLICY INVENTORY & SCOPE */}
        {activeTab === "inventory" && (
          <PolicyInventory
            policies={policies}
            total={total}
            page={page}
            pageSize={pageSize}
            loading={loading}
            search={search}
            filters={filters}
            canManage={canManage}
            onPageChange={setPage}
            onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
            onSearchChange={(q) => { setSearch(q); setPage(1); }}
            onFilterChange={(k, v) => { setFilters((prev) => ({ ...prev, [k]: v })); setPage(1); }}
            onOpenCreate={handleOpenCreate}
            onOpenEdit={handleOpenEdit}
            onOpenDelete={handleOpenDelete}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {/* TAB 2: VISUAL ABAC POLICY RULES EDITOR (EC-8.1) */}
        {activeTab === "abac-editor" && (
          <AbacRuleBuilder
            abacRules={abacRules}
            canManage={canManage}
            onMovePriority={handleMovePriority}
            onAddRule={handleAddAbacRule}
            abacModalOpen={abacModalOpen}
            setAbacModalOpen={setAbacModalOpen}
          />
        )}

        {/* TAB 3: POLICY EVALUATION SIMULATOR */}
        {activeTab === "simulator" && (
          <EvaluationSimulator />
        )}

        <PolicyModals
          drawerOpen={drawerOpen}
          drawerMode={drawerMode}
          selectedPolicy={selectedPolicy}
          onSubmitDrawer={handleDrawerSubmit}
          onCloseDrawer={() => setDrawerOpen(false)}
          deleteDialogOpen={deleteDialogOpen}
          policyToDelete={policyToDelete}
          onConfirmDelete={handleConfirmDelete}
          onCloseDelete={() => setDeleteDialogOpen(false)}
        />
      </div>
    </DomainShell>
  );
}