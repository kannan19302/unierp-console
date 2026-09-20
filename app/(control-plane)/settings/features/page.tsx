"use client";

import React, { useState, useMemo } from "react";
import {
  Flag,
  ToggleLeft,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Sliders,
  Power,
  RefreshCw,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Modal,
  ConfirmDialog,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList, useItem } from "@/lib/data";
import { api } from "@/lib/api";
import { useToast } from "@/lib/use-toast";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import DomainShell from "@/components/domain-shell";
import { PaginatedTable, type ColumnDef } from "@/components/PaginatedTable";
import { FilterBar } from "@/components/FilterBar";
import { CrudDrawer } from "@/components/CrudDrawer";
import { FormField } from "@/components/FormField";
import {
  type FeatureFlagRecord,
  type ConfigEnvironmentRecord,
  type ConfigDiffResult,
  featureFlagSchema,
  featureFlagFilters,
} from "@/lib/config-schema";
import styles from "./features.module.css";

export default function FeaturesSettingsPage() {
  const toast = useToast();
  const canManage = usePermission("system.flags.admin");

  const [activeTab, setActiveTab] = useState<"flags" | "promotion">("flags");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Feature Flag State
  const flags = useList<FeatureFlagRecord>({
    path: "/platform/v1/flags-metering/feature-flags/rules",
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlagRecord | null>(null);

  // Form State for Drawer
  const [formData, setFormData] = useState({
    flagKey: "",
    name: "",
    description: "",
    percentageRollout: 0,
    userSegments: "",
    environments: "dev, staging, production",
    active: true,
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [flagToDelete, setFlagToDelete] = useState<FeatureFlagRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Config Promotion State
  const environments = useList<ConfigEnvironmentRecord>({
    path: "/platform/v1/flags-metering/config/environments",
  });

  const [sourceEnv, setSourceEnv] = useState("staging");
  const [targetEnv, setTargetEnv] = useState("production");
  const [diffData, setDiffData] = useState<ConfigDiffResult | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [promoteReason, setPromoteReason] = useState("");
  const [promoting, setPromoting] = useState(false);

  // Real-time synchronization
  useDomainRealtime("settings", () => {
    flags.reload();
    environments.reload();
  });

  // Calculate KPIs
  const allFlags = flags.data;
  const activeCount = allFlags.filter((r) => r.active ?? r.enabled).length;
  const rollingOut = allFlags.filter((r) => (r.percentageRollout ?? 0) > 0 && (r.percentageRollout ?? 0) < 100).length;
  const segmented = allFlags.filter((r) => r.userSegments && r.userSegments.length > 0).length;

  const stats: StatCardItem[] = [
    { label: "Active Flags", value: activeCount, icon: <Flag size={18} /> },
    { label: "Progressive Rollouts", value: rollingOut, icon: <TrendingUp size={18} /> },
    { label: "Segment Targeted", value: segmented, icon: <Users size={18} /> },
    { label: "Environments Configured", value: environments.data.length || 3, icon: <ToggleLeft size={18} /> },
  ];

  // Filter and search logic
  const filteredFlags = useMemo(() => {
    return allFlags.filter((f) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesKey = f.flagKey.toLowerCase().includes(q);
        const matchesName = f.name?.toLowerCase().includes(q);
        if (!matchesKey && !matchesName) return false;
      }
      if (activeFilters.status) {
        const on = f.active ?? f.enabled;
        if (activeFilters.status === "ACTIVE" && !on) return false;
        if (activeFilters.status === "OFF" && on) return false;
      }
      if (activeFilters.rollout) {
        const pct = f.percentageRollout ?? 0;
        if (activeFilters.rollout === "100" && pct !== 100) return false;
        if (activeFilters.rollout === "0" && pct !== 0) return false;
        if (activeFilters.rollout === "PARTIAL" && (pct <= 0 || pct >= 100)) return false;
      }
      return true;
    });
  }, [allFlags, searchQuery, activeFilters]);

  // Drawer open handlers
  const handleOpenCreate = () => {
    setDrawerMode("create");
    setSelectedFlag(null);
    setFormData({
      flagKey: "",
      name: "",
      description: "",
      percentageRollout: 0,
      userSegments: "",
      environments: "dev, staging, production",
      active: true,
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (flag: FeatureFlagRecord) => {
    setDrawerMode("edit");
    setSelectedFlag(flag);
    setFormData({
      flagKey: flag.flagKey,
      name: flag.name,
      description: flag.description || "",
      percentageRollout: flag.percentageRollout,
      userSegments: flag.userSegments ? flag.userSegments.join(", ") : "",
      environments: flag.environments ? flag.environments.join(", ") : "dev, staging, production",
      active: flag.active ?? flag.enabled ?? true,
    });
    setDrawerOpen(true);
  };

  // Quick Toggle Handler
  const handleQuickToggle = async (flag: FeatureFlagRecord) => {
    const nextState = !(flag.active ?? flag.enabled);
    try {
      await api.patch(`/platform/v1/flags-metering/feature-flags/rules/${flag.id}`, {
        active: nextState,
        enabled: nextState,
      });
      toast.success(
        nextState ? "Feature Flag Activated" : "Feature Flag Deactivated",
        `Flag "${flag.name}" is now ${nextState ? "ACTIVE" : "OFF"}.`
      );
      await flags.reload();
    } catch {
      toast.error("Toggle Failed", "Could not update flag status.");
    }
  };

  // Form Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedSegments = formData.userSegments
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedEnvs = formData.environments
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (drawerMode === "create") {
        await api.post("/platform/v1/flags-metering/feature-flags/rules", {
          flagKey: formData.flagKey,
          name: formData.name,
          description: formData.description,
          percentageRollout: Number(formData.percentageRollout),
          userSegments: parsedSegments,
          environments: parsedEnvs,
          active: formData.active,
          actorId: "test.agent@unierp.com",
        });
        toast.success("Flag Created", `Feature flag "${formData.name}" registered successfully.`);
      } else if (selectedFlag) {
        await api.patch(`/platform/v1/flags-metering/feature-flags/rules/${selectedFlag.id}`, {
          name: formData.name,
          description: formData.description,
          percentageRollout: Number(formData.percentageRollout),
          userSegments: parsedSegments,
          environments: parsedEnvs,
          active: formData.active,
          actorId: "test.agent@unierp.com",
        });
        toast.success("Flag Updated", `Rollout parameters for "${formData.name}" updated.`);
      }
      setDrawerOpen(false);
      await flags.reload();
    } catch {
      toast.error("Save Failed", "Could not save feature flag configuration.");
    }
  };

  // Delete Handler
  const handleDeleteFlag = async () => {
    if (!flagToDelete) return;
    setDeleting(true);
    try {
      await api.del(`/platform/v1/flags-metering/feature-flags/rules/${flagToDelete.id}`);
      toast.success("Flag Decommissioned", `Feature flag "${flagToDelete.name}" was removed.`);
      setDeleteConfirmOpen(false);
      setFlagToDelete(null);
      await flags.reload();
    } catch {
      toast.error("Deletion Failed", "Could not decommission feature flag.");
    } finally {
      setDeleting(false);
    }
  };

  // Load Diff for Environment Promotion
  const handleLoadDiff = async () => {
    setLoadingDiff(true);
    try {
      const res = await api.get<ConfigDiffResult>(
        `/platform/v1/flags-metering/config/diff?source=${sourceEnv}&target=${targetEnv}`
      );
      setDiffData(res?.data || null);
    } catch {
      toast.error("Diff Error", "Could not compute configuration diff between environments.");
    } finally {
      setLoadingDiff(false);
    }
  };

  // Execute Config Promotion
  const handlePromoteConfig = async () => {
    setPromoting(true);
    try {
      await api.post("/platform/v1/flags-metering/config/promote", {
        source: sourceEnv,
        target: targetEnv,
        reason: promoteReason || "Scheduled configuration promotion",
      });
      toast.success(
        "Config Promoted",
        `Configuration successfully promoted from ${sourceEnv.toUpperCase()} to ${targetEnv.toUpperCase()}.`
      );
      setPromoteModalOpen(false);
      setPromoteReason("");
      await environments.reload();
      if (diffData) await handleLoadDiff();
    } catch {
      toast.error("Promotion Failed", "Could not promote configuration bundle.");
    } finally {
      setPromoting(false);
    }
  };

  // Table Columns Definition
  const columns: ColumnDef<FeatureFlagRecord>[] = [
    {
      key: "flagKey",
      label: "Flag Key & Display Name",
      render: (val: string, row: FeatureFlagRecord) => (
        <div>
          <div style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>
            {row.name ?? val}
          </div>
          <div style={{ fontFamily: "var(--font-family-mono)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
            {val}
          </div>
        </div>
      ),
    },
    {
      key: "percentageRollout",
      label: "Progressive Rollout",
      render: (pct: number) => (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-medium)" }}>
            <span>{pct}%</span>
            <span style={{ color: "var(--color-text-muted)" }}>{pct === 100 ? "GA" : pct === 0 ? "Dark" : "Canary"}</span>
          </div>
          <div className={styles.rolloutBarTrack}>
            <div className={styles.rolloutBarFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: "userSegments",
      label: "Target Segments",
      render: (segments: string[]) => (
        <div className={styles.segmentTags}>
          {segments && segments.length > 0 ? (
            segments.map((s) => (
              <Badge key={s} variant="info" size="sm">
                {s}
              </Badge>
            ))
          ) : (
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>All Tenants</span>
          )}
        </div>
      ),
    },
    {
      key: "environments",
      label: "Environments",
      render: (envs: string[]) => (
        <div className={styles.envPills}>
          {(envs || ["dev", "staging", "production"]).map((env) => (
            <span key={env} className={styles.envPill}>
              {env}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "active",
      label: "Status",
      render: (_: unknown, row: FeatureFlagRecord) => {
        const on = row.active ?? row.enabled;
        return (
          <Badge variant={on ? "success" : "default"}>
            {on ? "ACTIVE" : "OFF"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: FeatureFlagRecord) => {
        const on = row.active ?? row.enabled;
        return (
          <div className={styles.actionRow}>
            {canManage && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleQuickToggle(row)}
                aria-label={`Toggle ${row.name}`}
                title={on ? "Deactivate Flag" : "Activate Flag"}
              >
                <Power size={14} color={on ? "var(--color-success)" : "var(--color-text-muted)"} />
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenEdit(row)}
              aria-label={`Configure ${row.name}`}
              title="Edit Rollout"
            >
              <Sliders size={14} style={{ marginRight: "var(--space-1)" }} />
              Configure
            </Button>

            {canManage && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFlagToDelete(row);
                  setDeleteConfirmOpen(true);
                }}
                aria-label={`Decommission ${row.name}`}
                title="Decommission"
              >
                <Trash2 size={14} color="var(--color-danger)" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DomainShell
      domainId="settings"
      title="Global Configuration & Feature Flags"
      description="Progressive feature rollouts, target cohort segmentation, and multi-environment configuration promotion."
      actions={
        <div className={styles.headerActions}>
          {canManage && activeTab === "flags" && (
            <Button size="sm" variant="primary" onClick={handleOpenCreate}>
              <Plus size={14} style={{ marginRight: "var(--space-1)" }} />
              New Feature Flag
            </Button>
          )}
          {canManage && activeTab === "promotion" && (
            <Button size="sm" variant="primary" onClick={() => setPromoteModalOpen(true)}>
              <ArrowRight size={14} style={{ marginRight: "var(--space-1)" }} />
              Promote Configuration
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => { flags.reload(); environments.reload(); }}>
            <RefreshCw size={14} />
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={4} />

        {/* Tab Navigation */}
        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "flags" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("flags")}
          >
            <Flag size={16} />
            Feature Flags & Rollouts ({allFlags.length})
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "promotion" ? styles.tabButtonActive : ""}`}
            onClick={() => {
              setActiveTab("promotion");
              if (!diffData) handleLoadDiff();
            }}
          >
            <GitCompare size={16} />
            Environment Config Promotion
          </button>
        </div>

        {/* ── TAB 1: Feature Flags ────────────────────────────────────────── */}
        {activeTab === "flags" && (
          <>
            <FilterBar
              searchPlaceholder="Search flags by key or name..."
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={featureFlagFilters}
              activeFilters={activeFilters}
              onFilterChange={(key, val) => setActiveFilters((prev) => ({ ...prev, [key]: val }))}
              onClearAll={() => setActiveFilters({})}
            />

            <PaginatedTable<FeatureFlagRecord>
              columns={columns}
              data={filteredFlags}
              total={filteredFlags.length}
              pageSize={10}
              page={1}
              onPageChange={() => {}}
              loading={flags.loading}
              emptyMessage="No feature flags match the current filters."
            />
          </>
        )}

        {/* ── TAB 2: Config Promotion Pipeline ──────────────────────────── */}
        {activeTab === "promotion" && (
          <>
            {/* Visual Environment Cards */}
            <div className={styles.pipelineGrid}>
              {environments.data.map((env) => (
                <div key={env.id} className={styles.envCard}>
                  <div className={styles.envHeader}>
                    <span className={styles.envTitle}>{env.label}</span>
                    <Badge variant={env.name === "production" ? "danger" : env.name === "staging" ? "warning" : "info"}>
                      {env.name.toUpperCase()}
                    </Badge>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className={styles.envVersion}>{env.version}</span>
                    <Badge variant={env.driftDetected ? "warning" : "success"}>
                      {env.driftDetected ? (
                        <>
                          <AlertTriangle size={12} style={{ marginRight: "var(--space-1)" }} />
                          DRIFT DETECTED
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={12} style={{ marginRight: "var(--space-1)" }} />
                          SYNCED
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className={styles.envMeta}>
                    <span>Keys Managed: {env.configKeysCount}</span>
                    <span>Last Sync: {new Date(env.lastSyncAt).toLocaleString()}</span>
                    {env.lastPromotedBy && <span>Promoted by: {env.lastPromotedBy}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Environment Diff Viewer */}
            <div className={styles.diffSection}>
              <div className={styles.diffHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-semibold)" }}>
                    Configuration Environment Diff
                  </h3>
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                    Inspect variable key discrepancies between deployment boundaries.
                  </div>
                </div>
                <div className={styles.diffControls}>
                  <select
                    value={sourceEnv}
                    onChange={(e) => setSourceEnv(e.target.value)}
                    style={{
                      padding: "var(--space-1) var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                      color: "var(--color-text-primary)",
                      fontSize: "var(--font-size-xs)",
                    }}
                  >
                    <option value="dev">Source: Dev (Sandbox)</option>
                    <option value="staging">Source: Staging (Pre-prod)</option>
                    <option value="production">Source: Production</option>
                  </select>

                  <ArrowRight size={14} color="var(--color-text-muted)" />

                  <select
                    value={targetEnv}
                    onChange={(e) => setTargetEnv(e.target.value)}
                    style={{
                      padding: "var(--space-1) var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                      color: "var(--color-text-primary)",
                      fontSize: "var(--font-size-xs)",
                    }}
                  >
                    <option value="dev">Target: Dev (Sandbox)</option>
                    <option value="staging">Target: Staging (Pre-prod)</option>
                    <option value="production">Target: Production</option>
                  </select>

                  <Button size="sm" variant="outline" onClick={handleLoadDiff} disabled={loadingDiff}>
                    {loadingDiff ? "Analyzing..." : "Compare"}
                  </Button>
                </div>
              </div>

              {diffData && (
                <div style={{ overflowX: "auto" }}>
                  <table className={styles.diffTable}>
                    <thead>
                      <tr>
                        <th>Configuration Key</th>
                        <th>Source ({diffData.source.toUpperCase()})</th>
                        <th>Target ({diffData.target.toUpperCase()})</th>
                        <th>Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diffData.diffs.map((d) => (
                        <tr key={d.key}>
                          <td className={styles.diffKey}>{d.key}</td>
                          <td className={styles.diffVal}>{String(d.sourceValue ?? "—")}</td>
                          <td className={styles.diffVal}>{String(d.targetValue ?? "—")}</td>
                          <td>
                            <Badge
                              variant={
                                d.changeType === "MODIFIED"
                                  ? "warning"
                                  : d.changeType === "ADDED"
                                  ? "success"
                                  : d.changeType === "REMOVED"
                                  ? "danger"
                                  : "default"
                              }
                            >
                              {d.changeType}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Feature Flag Drawer ───────────────────────────────────────── */}
        <CrudDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={drawerMode === "create" ? "Author New Feature Flag" : `Configure — ${formData.name}`}
          description="Progressive rollout weights and target cohort filtering."
        >
          <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <FormField label="Flag Key" required helpText="Uppercase unique identifier used in code">
              <input
                type="text"
                value={formData.flagKey}
                onChange={(e) => setFormData((prev) => ({ ...prev, flagKey: e.target.value.toUpperCase() }))}
                disabled={drawerMode === "edit"}
                placeholder="AI_SMART_LEDGER"
                required
                style={{
                  width: "100%",
                  padding: "var(--space-2)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-family-mono)",
                  fontSize: "var(--font-size-sm)",
                }}
              />
            </FormField>

            <FormField label="Display Name" required>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="AI Smart Ledger Assistant"
                required
                style={{
                  width: "100%",
                  padding: "var(--space-2)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  fontSize: "var(--font-size-sm)",
                }}
              />
            </FormField>

            <FormField label="Operational Description">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Operational purpose, performance profile, and blast radius..."
                style={{
                  width: "100%",
                  padding: "var(--space-2)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  fontSize: "var(--font-size-sm)",
                }}
              />
            </FormField>

            {/* Progressive Rollout Slider */}
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <span style={{ fontWeight: "var(--font-weight-medium)" }}>Rollout Weight:</span>
                <span className={styles.sliderReadout}>{formData.percentageRollout}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.percentageRollout}
                onChange={(e) => setFormData((prev) => ({ ...prev, percentageRollout: Number(e.target.value) }))}
                className={styles.rangeInput}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                <span>0% (Dark)</span>
                <span>50% (Canary)</span>
                <span>100% (GA)</span>
              </div>
            </div>

            <FormField label="Target User Segments (comma separated)" helpText="e.g. BETA_TESTERS, ENTERPRISE_TIER, FINANCE_PRO">
              <input
                type="text"
                value={formData.userSegments}
                onChange={(e) => setFormData((prev) => ({ ...prev, userSegments: e.target.value }))}
                placeholder="BETA_TESTERS, ENTERPRISE_TIER"
                style={{
                  width: "100%",
                  padding: "var(--space-2)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  fontSize: "var(--font-size-sm)",
                }}
              />
            </FormField>

            <FormField label="Target Environments (comma separated)">
              <input
                type="text"
                value={formData.environments}
                onChange={(e) => setFormData((prev) => ({ ...prev, environments: e.target.value }))}
                placeholder="dev, staging, production"
                style={{
                  width: "100%",
                  padding: "var(--space-2)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  fontSize: "var(--font-size-sm)",
                }}
              />
            </FormField>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <input
                type="checkbox"
                id="flag-active-toggle"
                checked={formData.active}
                onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                style={{ accentColor: "var(--color-primary)", width: 16, height: 16 }}
              />
              <label htmlFor="flag-active-toggle" style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)" }}>
                Enable flag upon saving
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
              <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {drawerMode === "create" ? "Create Flag" : "Save Changes"}
              </Button>
            </div>
          </form>
        </CrudDrawer>

        {/* ── Confirm Decommission Dialog ───────────────────────────────── */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteFlag}
          title="Decommission Feature Flag"
          message={`Are you sure you want to delete feature flag "${flagToDelete?.name}" (${flagToDelete?.flagKey})? Active applications reading this flag will fall back to default behavior.`}
          confirmLabel={deleting ? "Deleting..." : "Delete Flag"}
          variant="danger"
        />

        {/* ── Config Promotion Modal ────────────────────────────────────── */}
        <Modal
          open={promoteModalOpen}
          onClose={() => setPromoteModalOpen(false)}
          title={`Promote Configuration: ${sourceEnv.toUpperCase()} → ${targetEnv.toUpperCase()}`}
        >
          <div className={styles.modalContent}>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
              This will overwrite configuration parameters in <strong>{targetEnv.toUpperCase()}</strong> with values from <strong>{sourceEnv.toUpperCase()}</strong>.
              Audit log event and WebSocket broadcast will be triggered across the cluster.
            </p>

            <FormField label="Promotion Reason / Change Ticket" required>
              <input
                type="text"
                value={promoteReason}
                onChange={(e) => setPromoteReason(e.target.value)}
                placeholder="e.g. REL-2026-03-Q1 Release promotion"
                style={{
                  width: "100%",
                  padding: "var(--space-2)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  fontSize: "var(--font-size-sm)",
                }}
              />
            </FormField>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button variant="ghost" onClick={() => setPromoteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handlePromoteConfig} disabled={promoting}>
                {promoting ? "Promoting..." : "Confirm & Promote"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DomainShell>
  );
}