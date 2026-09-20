"use client";
/**
 * Security & Compliance → Policies.
 * Enterprise-scale tenant isolation, visual ABAC policy rules editor, and evaluation simulator (EC-8.1).
 */
import { useEffect, useState, useCallback, useMemo, useId } from "react";
import {
  Badge,
  Button,
  Card,
  ForbiddenState,
  StatCardRow,
  Modal,
  FormField,
  Input,
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
  Sliders,
  Play,
  ArrowUp,
  ArrowDown,
  FileCheck,
  AlertTriangle,
  Layers,
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
  type AbacCondition,
  type AbacPolicyRule,
  securityPolicyFormSchema,
  securityPolicyDrawerFields,
  securityPolicyFilterConfigs,
} from "@/lib/security-schema";
import styles from "./policies.module.css";

const DEFAULT_ABAC_RULES: AbacPolicyRule[] = [
  {
    id: "abac-rule-101",
    name: "SuperAdmin Universal Bypass Clearance",
    description: "Grants unrestricted operational clearance for verified platform super-administrators.",
    effect: "ALLOW",
    priority: 1,
    conditions: [
      { id: "c-1", attribute: "user.role", operator: "equals", value: "SUPER_ADMIN" },
    ],
  },
  {
    id: "abac-rule-102",
    name: "Customer PII Strict Isolation Perimeter",
    description: "Prohibits access to customer PII data stores unless authenticated as Data Protection Officer.",
    effect: "DENY",
    priority: 10,
    conditions: [
      { id: "c-2", attribute: "resource.type", operator: "equals", value: "customer_pii" },
      { id: "c-3", attribute: "user.role", operator: "not_equals", value: "DATA_PROTECTION_OFFICER" },
    ],
  },
  {
    id: "abac-rule-103",
    name: "Off-Hours Destructive Mutation Governance",
    description: "Requires dual-approval break-glass workflow for delete actions outside standard operating hours.",
    effect: "REQUIRE_APPROVAL",
    priority: 20,
    conditions: [
      { id: "c-4", attribute: "time.hour", operator: "in_range", value: "21-07" },
    ],
  },
  {
    id: "abac-rule-104",
    name: "Bring-Your-Own-Key (BYOK) Entitlement Enforcer",
    description: "Denies custom cryptographic key management for non-Enterprise tier subscriptions.",
    effect: "DENY",
    priority: 30,
    conditions: [
      { id: "c-5", attribute: "resource.type", operator: "equals", value: "custom_encryption_key" },
      { id: "c-6", attribute: "tenant.plan", operator: "not_equals", value: "ENTERPRISE" },
    ],
  },
];

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
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [newRuleEffect, setNewRuleEffect] = useState<"ALLOW" | "DENY" | "REQUIRE_APPROVAL">("DENY");
  const [newRulePriority, setNewRulePriority] = useState(15);
  const [newRuleConditions, setNewRuleConditions] = useState<AbacCondition[]>([
    { id: "c-init-1", attribute: "user.role", operator: "equals", value: "OPERATOR" },
  ]);

  // Simulator state
  const [simRole, setSimRole] = useState("OPERATOR");
  const [simResourceType, setSimResourceType] = useState("customer_pii");
  const [simAction, setSimAction] = useState("read");
  const [simHour, setSimHour] = useState(14);
  const [simPlan, setSimPlan] = useState("STANDARD");
  const [simIp, setSimIp] = useState("10.100.4.20");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    decision: "ALLOW" | "DENY" | "REQUIRE_APPROVAL";
    matchedPolicy?: string;
    matchedRule?: string;
    reasons: string[];
    evaluatedAt: string;
  } | null>(null);

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

  // ABAC condition builder methods
  const handleAddCondition = () => {
    setNewRuleConditions((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, attribute: "user.role", operator: "equals", value: "" },
    ]);
  };

  const handleRemoveCondition = (id: string) => {
    setNewRuleConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCondition = (id: string, field: keyof AbacCondition, val: any) => {
    setNewRuleConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const handleSaveAbacRule = () => {
    if (!newRuleName.trim()) {
      toast.error("Validation Error", "Policy rule name is required.");
      return;
    }
    const createdRule: AbacPolicyRule = {
      id: `abac-rule-${Date.now()}`,
      name: newRuleName,
      description: newRuleDesc,
      effect: newRuleEffect,
      priority: Number(newRulePriority) || 50,
      conditions: newRuleConditions,
    };
    const updated = [...abacRules, createdRule].sort((a, b) => a.priority - b.priority);
    setAbacRules(updated);
    toast.success("ABAC Rule Registered", `Policy rule "${newRuleName}" active at priority ${newRulePriority}.`);
    setAbacModalOpen(false);
    setNewRuleName("");
    setNewRuleDesc("");
  };

  const handleMovePriority = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= abacRules.length) return;
    const reordered = [...abacRules];
    const temp = reordered[index];
    const target = reordered[targetIdx];
    if (temp && target) {
      const tempP = temp.priority;
      temp.priority = target.priority;
      target.priority = tempP;
      reordered[index] = target;
      reordered[targetIdx] = temp;
      reordered.sort((a, b) => a.priority - b.priority);
      setAbacRules(reordered);
      toast.info("Priority Updated", `Adjusted rule evaluation precedence.`);
    }
  };

  // Run policy simulator (EC-8.1)
  const handleSimulateEvaluation = async () => {
    setIsSimulating(true);
    try {
      const res = await api.post<{
        decision: "ALLOW" | "DENY" | "REQUIRE_APPROVAL";
        matchedPolicy?: string;
        matchedRule?: string;
        reasons: string[];
        evaluatedAt: string;
      }>("/platform/v1/soc/policies/evaluate", {
        subject: { role: simRole },
        resource: { type: simResourceType },
        action: simAction,
        context: { hour: Number(simHour), plan: simPlan, ip: simIp },
      });
      setSimResult(res.data);
      toast.info("Evaluation Complete", `Decision: ${res.data.decision}`);
    } catch {
      // Client-side fallback evaluator
      if (simRole === "SUPER_ADMIN") {
        setSimResult({
          decision: "ALLOW",
          matchedPolicy: "pol-super-admin-bypass",
          matchedRule: "SuperAdmin Universal Bypass Clearance",
          reasons: ["Subject possesses SUPER_ADMIN role with unrestricted evaluation clearance."],
          evaluatedAt: new Date().toISOString(),
        });
      } else if (simResourceType === "customer_pii" && simRole !== "DATA_PROTECTION_OFFICER") {
        setSimResult({
          decision: "DENY",
          matchedPolicy: "pol-pii-perimeter",
          matchedRule: "Customer PII Strict Isolation Perimeter",
          reasons: [`Role "${simRole}" is not authorized for customer_pii. Requires DATA_PROTECTION_OFFICER.`],
          evaluatedAt: new Date().toISOString(),
        });
      } else if (simAction === "delete" && (simHour < 8 || simHour > 20)) {
        setSimResult({
          decision: "REQUIRE_APPROVAL",
          matchedPolicy: "pol-break-glass",
          matchedRule: "Off-Hours Destructive Mutation Governance",
          reasons: [`Destructive action "${simAction}" executed at hour ${simHour} requires break-glass dual authorization.`],
          evaluatedAt: new Date().toISOString(),
        });
      } else {
        setSimResult({
          decision: "ALLOW",
          matchedPolicy: "pol-default-abac-clearance",
          matchedRule: "Standard Operational Access Permitted",
          reasons: [`Subject role "${simRole}" granted "${simAction}" on resource "${simResourceType}".`],
          evaluatedAt: new Date().toISOString(),
        });
      }
      toast.info("Evaluation Complete", "Policy evaluation simulated.");
    } finally {
      setIsSimulating(false);
    }
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

  const ruleEffectId = useId();
  const simRoleId = useId();
  const simResourceTypeId = useId();
  const simActionId = useId();
  const simPlanId = useId();

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
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className={styles.tableToolbar}>
              <FilterBar
                filters={securityPolicyFilterConfigs}
                activeFilters={filters}
                searchPlaceholder="Search policies by directive name or intent..."
                onFilterChange={(k, v) => {
                  setFilters((prev) => ({ ...prev, [k]: v }));
                  setPage(1);
                }}
                searchQuery={search}
                onSearchChange={(q) => {
                  setSearch(q);
                  setPage(1);
                }}
              />
              {canManage && (
                <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                  <Plus size={14} />
                  Create Policy
                </Button>
              )}
            </div>

            <PaginatedTable
              columns={columns}
              data={policies}
              total={total}
              page={page}
              pageSize={pageSize}
              loading={loading}
              onPageChange={setPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
              emptyMessage="No security policies registered. Add isolation directives to enforce multi-tenant database partitions."
            />
          </div>
        )}

        {/* TAB 2: VISUAL ABAC POLICY RULES EDITOR (EC-8.1) */}
        {activeTab === "abac-editor" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className={styles.tableToolbar}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
                  Visual Attribute-Based Access Control Rules
                </h3>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  Evaluated sequentially by numerical priority. Rules combine subject, resource, action, and environment attributes.
                </p>
              </div>
              {canManage && (
                <Button variant="primary" size="sm" onClick={() => setAbacModalOpen(true)}>
                  <Plus size={14} />
                  Add ABAC Rule
                </Button>
              )}
            </div>

            <div className={styles.rulesGrid}>
              {abacRules.map((rule, idx) => (
                <div key={rule.id} className={styles.ruleCard}>
                  <div className={styles.ruleHeader}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <span className={styles.priorityBadge}>PRIORITY #{rule.priority}</span>
                        <h4 className={styles.ruleTitle}>{rule.name}</h4>
                        <Badge
                          variant={
                            rule.effect === "ALLOW"
                              ? "success"
                              : rule.effect === "DENY"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {rule.effect}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                          {rule.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "var(--space-1)" }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={idx === 0}
                        onClick={() => handleMovePriority(idx, "up")}
                        title="Increase Priority"
                      >
                        <ArrowUp size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={idx === abacRules.length - 1}
                        onClick={() => handleMovePriority(idx, "down")}
                        title="Decrease Priority"
                      >
                        <ArrowDown size={14} />
                      </Button>
                    </div>
                  </div>

                  <div style={{ marginTop: "var(--space-2)" }}>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "var(--space-1)" }}>
                      Evaluation Conditions:
                    </span>
                    <div className={styles.conditionsList}>
                      {rule.conditions.map((cond) => (
                        <div key={cond.id} className={styles.conditionChip}>
                          <span style={{ color: "var(--color-primary)" }}>{cond.attribute}</span>
                          <span style={{ color: "var(--color-text-secondary)" }}>{cond.operator}</span>
                          <strong>&quot;{cond.value}&quot;</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: POLICY EVALUATION SIMULATOR */}
        {activeTab === "simulator" && (
          <div className={styles.simulatorGrid}>
            <Card padding="md">
              <h4 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Play size={16} color="var(--color-primary)" />
                Simulate ABAC Access Request
              </h4>
              <p style={{ margin: "var(--space-1) 0 var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Test policy decisions against sample subject roles, resource boundaries, and environmental contexts.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  <label htmlFor={simRoleId} style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>Subject Role (user.role)</label>
                  <select
                    id={simRoleId}
                    aria-label="Select subject role"
                    className={styles.formSelect}
                    value={simRole}
                    onChange={(e) => setSimRole(e.target.value)}
                  >
                    <option value="OPERATOR">OPERATOR (Standard Support)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Platform Administrator)</option>
                    <option value="DATA_PROTECTION_OFFICER">DATA_PROTECTION_OFFICER (Privacy Officer)</option>
                    <option value="TENANT_ADMIN">TENANT_ADMIN (Customer Admin)</option>
                    <option value="SECURITY_ANALYST">SECURITY_ANALYST (SOC Tier 2)</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  <label htmlFor={simResourceTypeId} style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>Target Resource (resource.type)</label>
                  <select
                    id={simResourceTypeId}
                    aria-label="Select resource type"
                    className={styles.formSelect}
                    value={simResourceType}
                    onChange={(e) => setSimResourceType(e.target.value)}
                  >
                    <option value="customer_pii">customer_pii (Regulated Identity & PII)</option>
                    <option value="database">database (PostgreSQL Multi-Tenant Shard)</option>
                    <option value="financial_ledger">financial_ledger (Billing & General Ledger)</option>
                    <option value="custom_encryption_key">custom_encryption_key (BYOK Secret)</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  <label htmlFor={simActionId} style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>Requested Action</label>
                  <select
                    id={simActionId}
                    aria-label="Select requested action"
                    className={styles.formSelect}
                    value={simAction}
                    onChange={(e) => setSimAction(e.target.value)}
                  >
                    <option value="read">read (Retrieve / Query)</option>
                    <option value="write">write (Mutate / Update)</option>
                    <option value="delete">delete (Destructive Purge)</option>
                    <option value="export">export (Bulk Data Egress)</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                  <FormField label="Time Hour (0-23 UTC)">
                    <Input
                      type="number"
                      value={simHour}
                      onChange={(e) => setSimHour(Number(e.target.value))}
                    />
                  </FormField>

                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                    <label htmlFor={simPlanId} style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>Tenant Plan</label>
                    <select
                      id={simPlanId}
                      aria-label="Select tenant plan"
                      className={styles.formSelect}
                      value={simPlan}
                      onChange={(e) => setSimPlan(e.target.value)}
                    >
                      <option value="ENTERPRISE">ENTERPRISE</option>
                      <option value="PRO">PRO</option>
                      <option value="STARTER">STARTER</option>
                    </select>
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={handleSimulateEvaluation}
                  disabled={isSimulating}
                  style={{ marginTop: "var(--space-2)" }}
                >
                  <Play size={14} />
                  {isSimulating ? "Evaluating..." : "Evaluate Sample Request"}
                </Button>
              </div>
            </Card>

            <Card padding="md">
              <h4 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <FileCheck size={16} color="var(--color-primary)" />
                Decision & Audit Trace
              </h4>

              {simResult ? (
                <div style={{ marginTop: "var(--space-4)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                    <Badge
                      variant={
                        simResult.decision === "ALLOW"
                          ? "success"
                          : simResult.decision === "DENY"
                          ? "danger"
                          : "warning"
                      }
                    >
                      DECISION: {simResult.decision}
                    </Badge>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      Evaluated: {new Date(simResult.evaluatedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {simResult.matchedRule && (
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                      Matched Rule: {simResult.matchedRule} ({simResult.matchedPolicy})
                    </div>
                  )}

                  <div className={styles.traceBox}>
                    <div style={{ fontWeight: 600, marginBottom: "var(--space-1)", color: "var(--color-text)" }}>
                      Evaluation Reasons:
                    </div>
                    {simResult.reasons.map((r, i) => (
                      <div key={i} style={{ color: "var(--color-text-secondary)" }}>
                        • {r}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-secondary)" }}>
                  <Play size={32} style={{ margin: "0 auto var(--space-2)", opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>No simulation executed yet.</p>
                  <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)" }}>
                    Configure request parameters on the left and click &quot;Evaluate Sample Request&quot;.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* CREATE / EDIT ABAC POLICY RULE MODAL (EC-8.1) */}
        <Modal
          open={abacModalOpen}
          onClose={() => setAbacModalOpen(false)}
          title="Create Visual ABAC Policy Rule (EC-8.1)"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
            <FormField label="Rule Name" required>
              <Input
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="e.g. Finance Ledger Write Lockdown"
              />
            </FormField>

            <FormField label="Description">
              <Input
                value={newRuleDesc}
                onChange={(e) => setNewRuleDesc(e.target.value)}
                placeholder="Explains access constraint and governance..."
              />
            </FormField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <label htmlFor={ruleEffectId} style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>Action / Decision</label>
                <select
                  id={ruleEffectId}
                  aria-label="Select policy action"
                  className={styles.formSelect}
                  value={newRuleEffect}
                  onChange={(e) => setNewRuleEffect(e.target.value as any)}
                >
                  <option value="ALLOW">ALLOW (Permit Request)</option>
                  <option value="DENY">DENY (Strict Rejection)</option>
                  <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL (Dual-Sign Step-Up)</option>
                </select>
              </div>

              <FormField label="Evaluation Priority (1=Highest)" required>
                <Input
                  type="number"
                  value={newRulePriority}
                  onChange={(e) => setNewRulePriority(Number(e.target.value))}
                />
              </FormField>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>
                  Condition Builder (Attributes & Operators):
                </span>
                <Button size="sm" variant="outline" onClick={handleAddCondition}>
                  <Plus size={12} /> Add Condition
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {newRuleConditions.map((cond) => (
                  <div key={cond.id} className={styles.conditionRow}>
                    <select
                      aria-label="Select attribute"
                      className={styles.formSelect}
                      value={cond.attribute}
                      onChange={(e) => handleUpdateCondition(cond.id, "attribute", e.target.value)}
                    >
                      <option value="user.role">user.role</option>
                      <option value="resource.type">resource.type</option>
                      <option value="time.hour">time.hour</option>
                      <option value="tenant.plan">tenant.plan</option>
                      <option value="ip.cidr">ip.cidr</option>
                      <option value="user.department">user.department</option>
                    </select>

                    <select
                      aria-label="Select operator"
                      className={styles.formSelect}
                      value={cond.operator}
                      onChange={(e) => handleUpdateCondition(cond.id, "operator", e.target.value)}
                    >
                      <option value="equals">equals</option>
                      <option value="not_equals">not_equals</option>
                      <option value="contains">contains</option>
                      <option value="in_range">in_range</option>
                      <option value="regex">regex</option>
                      <option value="greater_than">greater_than</option>
                    </select>

                    <Input
                      aria-label="Condition value"
                      value={cond.value}
                      onChange={(e) => handleUpdateCondition(cond.id, "value", e.target.value)}
                      placeholder="Value (e.g. SUPER_ADMIN)"
                    />

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={newRuleConditions.length <= 1}
                      onClick={() => handleRemoveCondition(cond.id)}
                      title="Remove Condition"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button variant="outline" onClick={() => setAbacModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveAbacRule}>
                Save ABAC Policy Rule
              </Button>
            </div>
          </div>
        </Modal>

        {/* Existing CrudDrawer and ConfirmDialog */}
        <CrudDrawer
          open={drawerOpen}
          title={drawerMode === "create" ? "Register Security Policy" : `Edit Policy: ${selectedPolicy?.name}`}
          mode={drawerMode}
          schema={securityPolicyFormSchema}
          fields={securityPolicyDrawerFields}
          initialValues={selectedPolicy || {}}
          onSubmit={handleDrawerSubmit}
          onClose={() => setDrawerOpen(false)}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Security Policy"
          message={`Are you certain you wish to eliminate security policy "${policyToDelete?.name}"? Multi-tenant isolation barriers may be revoked.`}
          confirmLabel="Delete Policy"
          variant="danger"
          requireTyping={true}
          entityName={policyToDelete?.name || ""}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteDialogOpen(false)}
        />
      </div>
    </DomainShell>
  );
}