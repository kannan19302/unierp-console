"use client";

import React, { useState, useMemo } from "react";
import {
  Network,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  Calendar,
  ShieldAlert,
  Server,
  Plus,
  Trash2,
  Edit3,
  Bell,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  Badge,
  Button,
  Spinner,
  StatCardRow,
  EmptyState,
  type StatCardItem,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { PaginatedTable, type ColumnDef } from "@/components/PaginatedTable";
import { FilterBar, type FilterDef } from "@/components/FilterBar";
import { CrudDrawer } from "@/components/CrudDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useList, useItem } from "@/lib/data";
import { api } from "@/lib/api";
import { useToast } from "@/lib/use-toast";
import {
  rateLimitRuleSchema,
  rateLimitFields,
  wafRuleSchema,
  wafFields,
  type RateLimitRule,
  type ApiDeprecation,
  type WafRule,
  type GatewayTrafficStats,
} from "@/lib/api-traffic-schema";
import styles from "./api-traffic.module.css";

interface MultiTenantCluster {
  id: string;
  clusterName: string;
  region: string;
  provider: string;
  status: string;
  maxTenants: number;
  activeTenants: number;
  endpoint: string;
}

export default function ApiTrafficPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"rate-limits" | "deprecations" | "waf" | "clusters">("rate-limits");

  // Rate Limits Data
  const rateLimitsList = useList<RateLimitRule>({
    path: "/platform/v1/cluster-routing-deep/rate-limits",
  });

  // Deprecations Data
  const deprecationsList = useList<ApiDeprecation>({
    path: "/platform/v1/cluster-routing-deep/deprecations",
  });

  // WAF Rules Data
  const wafList = useList<WafRule>({
    path: "/platform/v1/cluster-routing-deep/waf-rules",
  });

  // Clusters Data
  const clustersList = useList<MultiTenantCluster>({
    path: "/platform/v1/cluster-routing-deep/clusters",
  });

  // Stats Data
  const statsItem = useItem<GatewayTrafficStats>(
    "/platform/v1/cluster-routing-deep/traffic-stats"
  );

  // Rate Limit Filter / Search state
  const [ruleSearch, setRuleSearch] = useState("");
  const [ruleTierFilter, setRuleTierFilter] = useState("ALL");
  const [rulePage, setRulePage] = useState(1);

  // Drawers & Modals
  const [isRuleDrawerOpen, setIsRuleDrawerOpen] = useState(false);
  const [ruleDrawerMode, setRuleDrawerMode] = useState<"create" | "edit">("create");
  const [selectedRule, setSelectedRule] = useState<RateLimitRule | null>(null);

  const [isWafDrawerOpen, setIsWafDrawerOpen] = useState(false);

  // Delete Confirm Dialog
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<RateLimitRule | null>(null);
  const [isDeletingRule, setIsDeletingRule] = useState(false);

  // Sunset Notification Dialog
  const [notifyTarget, setNotifyTarget] = useState<ApiDeprecation | null>(null);
  const [isNotifying, setIsNotifying] = useState(false);

  // Filtered Rate Limit Rules
  const filteredRules = useMemo(() => {
    return rateLimitsList.data.filter((r) => {
      const matchSearch =
        !ruleSearch ||
        r.name?.toLowerCase().includes(ruleSearch.toLowerCase()) ||
        r.endpointPath?.toLowerCase().includes(ruleSearch.toLowerCase());
      const matchTier =
        ruleTierFilter === "ALL" || r.clientTier === ruleTierFilter;
      return matchSearch && matchTier;
    });
  }, [rateLimitsList.data, ruleSearch, ruleTierFilter]);

  const pagedRules = useMemo(() => {
    const start = (rulePage - 1) * 10;
    return filteredRules.slice(start, start + 10);
  }, [filteredRules, rulePage]);

  // Rate Limit Handlers
  const handleOpenCreateRule = () => {
    setSelectedRule(null);
    setRuleDrawerMode("create");
    setIsRuleDrawerOpen(true);
  };

  const handleOpenEditRule = (rule: RateLimitRule) => {
    setSelectedRule(rule);
    setRuleDrawerMode("edit");
    setIsRuleDrawerOpen(true);
  };

  const handleSaveRule = async (values: Record<string, any>) => {
    try {
      if (ruleDrawerMode === "create") {
        await api.post("/platform/v1/cluster-routing-deep/rate-limits", {
          ...values,
          limitPerMinute: Number(values.limitPerMinute),
          burstLimit: Number(values.burstLimit),
        });
        showToast({
          title: "Rate Limit Rule Created",
          message: `Policy ${values.name} successfully deployed to API Gateway.`,
          variant: "success",
        });
      } else if (selectedRule) {
        await api.put(`/platform/v1/cluster-routing-deep/rate-limits/${selectedRule.id}`, {
          ...values,
          limitPerMinute: Number(values.limitPerMinute),
          burstLimit: Number(values.burstLimit),
        });
        showToast({
          title: "Rate Limit Rule Updated",
          message: `Policy ${values.name} updated.`,
          variant: "success",
        });
      }
      setIsRuleDrawerOpen(false);
      rateLimitsList.reload();
    } catch (err: any) {
      showToast({
        title: "Operation Failed",
        message: err.message || "Failed to persist rate limit policy.",
        variant: "error",
      });
    }
  };

  const handleDeleteRule = async () => {
    if (!deleteRuleTarget) return;
    setIsDeletingRule(true);
    try {
      await api.del(`/platform/v1/cluster-routing-deep/rate-limits/${deleteRuleTarget.id}`);
      showToast({
        title: "Rule Removed",
        message: `Policy ${deleteRuleTarget.name} deactivated and purged.`,
        variant: "success",
      });
      setDeleteRuleTarget(null);
      rateLimitsList.reload();
    } catch (err: any) {
      showToast({
        title: "Delete Failed",
        message: err.message || "Could not delete rule.",
        variant: "error",
      });
    } finally {
      setIsDeletingRule(false);
    }
  };

  // Deprecation Sunset Notification Handler
  const handleDispatchSunsetNotification = async () => {
    if (!notifyTarget) return;
    setIsNotifying(true);
    try {
      const res = await api.post<{ message: string; recipientsCount: number }>(
        `/platform/v1/cluster-routing-deep/deprecations/${notifyTarget.id}/notify`,
        {}
      );
      showToast({
        title: "Sunset Notice Dispatched",
        message: res.data?.message || (typeof res.data?.recipientsCount === "number" ? `Notified ${res.data.recipientsCount} active consumer applications.` : "Sunset notice dispatched."),
        variant: "success",
      });
      setNotifyTarget(null);
    } catch (err: any) {
      showToast({
        title: "Notification Failed",
        message: err.message || "Could not dispatch deprecation notice.",
        variant: "error",
      });
    } finally {
      setIsNotifying(false);
    }
  };

  // WAF Rule Handler
  const handleSaveWafRule = async (values: Record<string, any>) => {
    try {
      await api.post("/platform/v1/cluster-routing-deep/waf-rules", values);
      showToast({
        title: "WAF Rule Deployed",
        message: `Security rule "${values.name}" activated on edge proxies.`,
        variant: "success",
      });
      setIsWafDrawerOpen(false);
      wafList.reload();
    } catch (err: any) {
      showToast({
        title: "Deployment Failed",
        message: err.message || "Could not deploy WAF rule.",
        variant: "error",
      });
    }
  };

  // KPIs
  const stats = statsItem.data;
  const kpis: StatCardItem[] = [
    {
      label: "Gateway Routes",
      value: statsItem.loading ? "—" : stats?.gatewayRoutes ?? "Unknown",
      icon: <Network size={18} />,
    },
    {
      label: "Global P99 Latency",
      value: statsItem.loading ? "—" : stats?.p99LatencyMs ? `${stats.p99LatencyMs}ms` : "Unknown",
      icon: <Activity size={18} />,
    },
    {
      label: "WAF Filter Rate",
      value: statsItem.loading ? "—" : stats?.wafFilterRate ?? "Unknown",
      icon: <ShieldCheck size={18} />,
    },
    {
      label: "Rate Limit Breaches",
      value: statsItem.loading ? "—" : stats?.rateLimitBreaches ?? "Unknown",
      icon: <AlertTriangle size={18} />,
    },
  ];

  // Rate Limit Columns
  const ruleColumns: ColumnDef<RateLimitRule>[] = [
    {
      key: "endpointPath",
      label: "Endpoint Pattern",
      render: (val: any) => (
        <span className={styles.monoBadge}>{val}</span>
      ),
    },
    {
      key: "name",
      label: "Policy Name",
      render: (val: any, row: RateLimitRule) => (
        <div>
          <div style={{ fontWeight: 600 }}>{val}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Tenant: {row.tenantId || "GLOBAL"}
          </div>
        </div>
      ),
    },
    {
      key: "limitPerMinute",
      label: "Rate Limit",
      render: (val: any, row: RateLimitRule) => (
        <span>
          <strong>{val}</strong> req/min (Burst: {row.burstLimit})
        </span>
      ),
    },
    {
      key: "clientTier",
      label: "Client Tier",
      render: (val: any) => {
        const variant =
          val === "ENTERPRISE"
            ? "primary"
            : val === "PREMIUM"
            ? "info"
            : "default";
        return <Badge variant={variant as any}>{val}</Badge>;
      },
    },
    {
      key: "isActive",
      label: "Status",
      render: (val: any) => (
        <Badge variant={val ? "success" : "danger"}>
          {val ? "ACTIVE" : "DISABLED"}
        </Badge>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_: any, row: RateLimitRule) => (
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEditRule(row)}
            aria-label={`Edit ${row.name}`}
          >
            <Edit3 size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteRuleTarget(row)}
            aria-label={`Delete ${row.name}`}
          >
            <Trash2 size={14} style={{ color: "var(--color-danger)" }} />
          </Button>
        </div>
      ),
    },
  ];

  const ruleFilters: FilterDef[] = [
    {
      key: "tier",
      label: "Client Tier",
      options: [
        { label: "All Tiers", value: "ALL" },
        { label: "Standard", value: "STANDARD" },
        { label: "Premium", value: "PREMIUM" },
        { label: "Enterprise", value: "ENTERPRISE" },
      ],
    },
  ];

  return (
    <DomainShell
      domainId="api-traffic"
      title="PCC-08 · API Traffic Control & Gateway"
      description="Multi-tenant API traffic shaping, rate limit rules, RFC 9745 deprecation timeline, and WAF security policies."
    >
      <div className={styles.container}>
        {/* KPI Row */}
        <StatCardRow stats={kpis} columns={4} />

        {/* Tab Bar */}
        <div className={styles.tabBar} role="tablist" aria-label="API Traffic Sections">
          <button
            role="tab"
            aria-selected={activeTab === "rate-limits"}
            className={`${styles.tabButton} ${activeTab === "rate-limits" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("rate-limits")}
          >
            <Sliders size={16} /> Rate Limit Rules
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "deprecations"}
            className={`${styles.tabButton} ${activeTab === "deprecations" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("deprecations")}
          >
            <Calendar size={16} /> API Deprecation Timeline
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "waf"}
            className={`${styles.tabButton} ${activeTab === "waf" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("waf")}
          >
            <ShieldAlert size={16} /> WAF & Security
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "clusters"}
            className={`${styles.tabButton} ${activeTab === "clusters" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("clusters")}
          >
            <Server size={16} /> Clusters & Routing
          </button>
        </div>

        {/* Tab 1: Rate Limit Rule Builder */}
        {activeTab === "rate-limits" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className={styles.actionHeader}>
              <div style={{ minWidth: "16rem", flex: 1 }}>
                <FilterBar
                  filters={ruleFilters}
                  activeFilters={{ tier: ruleTierFilter }}
                  searchQuery={ruleSearch}
                  onSearchChange={setRuleSearch}
                  onFilterChange={(key, val) => {
                    if (key === "tier") setRuleTierFilter(val);
                  }}
                  onClearAll={() => {
                    setRuleSearch("");
                    setRuleTierFilter("ALL");
                  }}
                />
              </div>
              <Button variant="primary" onClick={handleOpenCreateRule}>
                <Plus size={16} style={{ marginRight: "var(--space-2)" }} />
                Create Rate Limit Rule
              </Button>
            </div>

            <Card padding="none">
              <PaginatedTable<RateLimitRule>
                data={pagedRules}
                columns={ruleColumns}
                keyField="id"
                pageSize={10}
                total={filteredRules.length}
                page={rulePage}
                onPageChange={setRulePage}
                loading={rateLimitsList.loading}
                emptyMessage="No rate limit policies found. Create a rule to protect API endpoints."
              />
            </Card>
          </div>
        )}

        {/* Tab 2: API Deprecation Timeline */}
        {activeTab === "deprecations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className={styles.actionHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                  RFC 9745 / RFC 8594 Deprecation & Sunset Registry
                </h3>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Track active API deprecations, consumer impact, and dispatch automated sunset warnings before breaking removals.
                </p>
              </div>
            </div>

            {deprecationsList.loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
                <Spinner size="md" />
              </div>
            ) : deprecationsList.data.length === 0 ? (
              <EmptyState
                title="No Deprecated Surfaces"
                description="All published API surfaces are active and current."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {deprecationsList.data.map((dep) => (
                  <div key={dep.id} className={styles.timelineCard}>
                    <div className={styles.timelineHeader}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                        <span className={styles.monoBadge}>{dep.pathPrefix}</span>
                        <Badge
                          variant={
                            dep.status === "SUNSET"
                              ? "danger"
                              : dep.status === "SUNSETTING"
                              ? "warning"
                              : "info"
                          }
                        >
                          {dep.status}
                        </Badge>
                      </div>
                      <div className={styles.timelineActions}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNotifyTarget(dep)}
                        >
                          <Bell size={14} style={{ marginRight: "var(--space-2)" }} />
                          Notify Consumers
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(dep.link, "_blank")}
                        >
                          <ExternalLink size={14} style={{ marginRight: "var(--space-2)" }} />
                          Migration Guide
                        </Button>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                      {dep.description || `Legacy endpoint path scheduled for decommissioning.`}
                    </p>

                    <div className={styles.timelineMeta}>
                      <div>
                        <strong>Announced:</strong>{" "}
                        {new Date(dep.deprecatedAt).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Sunset Date:</strong>{" "}
                        {new Date(dep.sunsetAt).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Successor API:</strong>{" "}
                        <span style={{ fontFamily: "var(--font-mono, monospace)" }}>
                          {dep.successor}
                        </span>
                      </div>
                      <div>
                        <strong>Active Callers:</strong> {dep.activeConsumers} apps ({dep.calls30d.toLocaleString()} calls/30d)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: WAF Security Rules */}
        {activeTab === "waf" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className={styles.actionHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                  Edge Web Application Firewall (WAF)
                </h3>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Deep packet inspection, SQLi/XSS prevention, DDoS mitigating rate limiters, and ASN reputation filtering.
                </p>
              </div>
              <Button variant="primary" onClick={() => setIsWafDrawerOpen(true)}>
                <Plus size={16} style={{ marginRight: "var(--space-2)" }} />
                Deploy WAF Rule
              </Button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {wafList.data.map((rule) => (
                <div key={rule.id} className={styles.timelineCard}>
                  <div className={styles.timelineHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <strong>{rule.name}</strong>
                      <Badge
                        variant={
                          rule.action === "BLOCK"
                            ? "danger"
                            : rule.action === "CHALLENGE"
                            ? "warning"
                            : "default"
                        }
                      >
                        ACTION: {rule.action}
                      </Badge>
                      <Badge variant="success">Priority #{rule.priority}</Badge>
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      Matches 24h: <strong>{rule.matches24h ?? 0}</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-mono, monospace)" }}>
                    Rule Pattern: {rule.pattern}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Multi-Tenant Clusters & Routing */}
        {activeTab === "clusters" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className={styles.actionHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                  Multi-Tenant Kubernetes Fleet Routing
                </h3>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Active gateway routing nodes, database clusters, and tenant workload partitions.
                </p>
              </div>
            </div>

            <div className={styles.clusterGrid}>
              {clustersList.data.map((cluster) => {
                const ratio = Math.round((cluster.activeTenants / cluster.maxTenants) * 100);
                return (
                  <div key={cluster.id} className={styles.clusterCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "var(--text-base)" }}>{cluster.clusterName}</strong>
                      <Badge variant="success">{cluster.status}</Badge>
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      Region: <strong>{cluster.region}</strong> | Provider: <strong>{cluster.provider}</strong>
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-mono, monospace)" }}>
                      {cluster.endpoint}
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", marginBottom: "var(--space-1)" }}>
                        <span>Capacity Allocation</span>
                        <span>{cluster.activeTenants} / {cluster.maxTenants} tenants ({ratio}%)</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${Math.min(ratio, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Create/Edit Rate Limit Drawer */}
        <CrudDrawer
          open={isRuleDrawerOpen}
          title={ruleDrawerMode === "create" ? "Create Rate Limit Rule" : "Edit Rate Limit Rule"}
          description="Configure request limits, burst capacities, and client tier scopes."
          mode={ruleDrawerMode}
          schema={rateLimitRuleSchema}
          fields={rateLimitFields}
          initialValues={
            selectedRule
              ? {
                  name: selectedRule.name,
                  endpointPath: selectedRule.endpointPath,
                  limitPerMinute: selectedRule.limitPerMinute,
                  burstLimit: selectedRule.burstLimit,
                  clientTier: selectedRule.clientTier,
                  tenantId: selectedRule.tenantId,
                }
              : {
                  limitPerMinute: 60,
                  burstLimit: 120,
                  clientTier: "STANDARD",
                  tenantId: "GLOBAL",
                }
          }
          onSubmit={handleSaveRule}
          onClose={() => setIsRuleDrawerOpen(false)}
        />

        {/* Deploy WAF Rule Drawer */}
        <CrudDrawer
          open={isWafDrawerOpen}
          title="Deploy WAF Security Rule"
          description="Define regex pattern and proxy enforcement action for perimeter defense."
          mode="create"
          schema={wafRuleSchema}
          fields={wafFields}
          initialValues={{ action: "BLOCK", priority: 5 }}
          onSubmit={handleSaveWafRule}
          onClose={() => setIsWafDrawerOpen(false)}
        />

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          open={Boolean(deleteRuleTarget)}
          title="Deactivate Rate Limit Policy?"
          message={`Are you sure you want to remove the rate limit policy for "${deleteRuleTarget?.endpointPath}"? Traffic to this path will revert to standard platform defaults.`}
          entityName={deleteRuleTarget?.name || ""}
          confirmLabel={isDeletingRule ? "Deactivating..." : "Deactivate Rule"}
          variant="danger"
          onConfirm={handleDeleteRule}
          onCancel={() => setDeleteRuleTarget(null)}
        />

        {/* Sunset Notification Confirm Dialog */}
        <ConfirmDialog
          open={Boolean(notifyTarget)}
          title="Dispatch Sunset Notification?"
          message={`Broadcast RFC 9745 sunset notification for "${notifyTarget?.pathPrefix}" to all ${notifyTarget?.activeConsumers} registered client integrations via email, developer webhook, and dashboard notification banner?`}
          entityName={notifyTarget?.pathPrefix || ""}
          confirmLabel={isNotifying ? "Dispatching..." : "Send Sunset Warning"}
          variant="warning"
          onConfirm={handleDispatchSunsetNotification}
          onCancel={() => setNotifyTarget(null)}
        />
      </div>
    </DomainShell>
  );
}
