"use client";

import React, { useState } from "react";
import {
  KeySquare,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Layers,
  Grid,
  FileKey,
  Plus,
  Users,
  Copy,
  Download,
  Check,
} from "lucide-react";
import {
  Card,
  Badge,
  Button,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { useList } from "@/lib/data";
import { api } from "@/lib/api";
import { useToast } from "@/lib/use-toast";
import {
  type LicensePool,
  type OfflineLicense,
  type TenantGrantRow,
} from "@/lib/entitlement-schema";
import styles from "./entitlement-authority.module.css";

const MODULE_COLUMNS = [
  { code: "core-erp", label: "Core ERP" },
  { code: "finance-ledger", label: "Financial Ledger" },
  { code: "crm-sales", label: "CRM & Pipeline" },
  { code: "inventory-scm", label: "Inventory & SCM" },
  { code: "ai-copilot", label: "AI Copilot" },
  { code: "hr-workforce", label: "HR Workforce" },
  { code: "b2b-portal", label: "B2B Vendor Portal" },
];

export default function EntitlementAuthorityPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"pools" | "matrix" | "licenses">("pools");

  // License Pools List
  const pools = useList<LicensePool>({
    path: "/platform/v1/entitlements/pools",
  });

  // Grant Matrix List
  const matrix = useList<TenantGrantRow>({
    path: "/platform/v1/entitlements/matrix",
  });

  // Offline Licenses List
  const offlineLicenses = useList<OfflineLicense>({
    path: "/platform/v1/entitlements/offline-licenses",
  });

  // Create Pool State
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false);
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolModule, setNewPoolModule] = useState("core-erp");
  const [newPoolSeats, setNewPoolSeats] = useState(1000);
  const [newPoolTier, setNewPoolTier] = useState<"STANDARD" | "PREMIUM" | "ENTERPRISE">("ENTERPRISE");
  const [isSubmittingPool, setIsSubmittingPool] = useState(false);

  // Allocate Seats Modal State
  const [allocateTargetPool, setAllocateTargetPool] = useState<LicensePool | null>(null);
  const [allocateTenantId, setAllocateTenantId] = useState("00000000-0000-0000-0000-000000000001");
  const [allocateSeatCount, setAllocateSeatCount] = useState(50);
  const [isSubmittingAllocation, setIsSubmittingAllocation] = useState(false);

  // Bulk Grant Matrix State
  const [bulkModule, setBulkModule] = useState("ai-copilot");
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Issue Offline License State
  const [isIssueLicenseOpen, setIsIssueLicenseOpen] = useState(false);
  const [licTenantId, setLicTenantId] = useState("");
  const [licTenantName, setLicTenantName] = useState("");
  const [licSeats, setLicSeats] = useState(250);
  const [licValidDays, setLicValidDays] = useState(365);
  const [licFingerprint, setLicFingerprint] = useState("");
  const [licModules, setLicModules] = useState<string[]>(["core-erp", "finance-ledger"]);
  const [isGeneratingLicense, setIsGeneratingLicense] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Create Pool Handler
  const handleCreatePool = async () => {
    if (!newPoolName.trim()) {
      showToast({ title: "Validation Error", message: "Pool name is required.", variant: "warning" });
      return;
    }
    setIsSubmittingPool(true);
    try {
      await api.post("/platform/v1/entitlements/pools", {
        name: newPoolName,
        moduleCode: newPoolModule,
        totalSeats: Number(newPoolSeats),
        tier: newPoolTier,
      });
      showToast({ title: "Pool Created", message: `License pool "${newPoolName}" successfully registered.`, variant: "success" });
      setIsCreatePoolOpen(false);
      setNewPoolName("");
      pools.reload();
    } catch (err: any) {
      showToast({ title: "Creation Failed", message: err.message || "Failed to create pool.", variant: "error" });
    } finally {
      setIsSubmittingPool(false);
    }
  };

  // Allocate Seats Handler
  const handleAllocateSeats = async () => {
    if (!allocateTargetPool) return;
    setIsSubmittingAllocation(true);
    try {
      await api.post(`/platform/v1/entitlements/pools/${allocateTargetPool.id}/allocate`, {
        tenantId: allocateTenantId,
        seatCount: Number(allocateSeatCount),
      });
      showToast({
        title: "Seats Allocated",
        message: `Allocated ${allocateSeatCount} seats from ${allocateTargetPool.name}.`,
        variant: "success",
      });
      setAllocateTargetPool(null);
      pools.reload();
    } catch (err: any) {
      showToast({ title: "Allocation Failed", message: err.message || "Failed to allocate seats.", variant: "error" });
    } finally {
      setIsSubmittingAllocation(false);
    }
  };

  // Toggle Single Module Grant Handler
  const handleToggleModule = async (tenantId: string, moduleCode: string, currentStatus: boolean) => {
    try {
      await api.post("/platform/v1/entitlements/matrix/toggle", {
        tenantId,
        moduleCode,
        enabled: !currentStatus,
      });
      showToast({
        title: "Entitlement Updated",
        message: `${moduleCode} is now ${!currentStatus ? "GRANTED" : "REVOKED"} for ${tenantId}.`,
        variant: "success",
      });
      matrix.reload();
    } catch (err: any) {
      showToast({ title: "Update Failed", message: err.message || "Could not toggle module.", variant: "error" });
    }
  };

  // Bulk Toggle Module Handler
  const handleBulkToggle = async (enabled: boolean) => {
    setIsBulkSubmitting(true);
    try {
      await api.post("/platform/v1/entitlements/matrix/bulk", {
        moduleCode: bulkModule,
        enabled,
      });
      showToast({
        title: "Bulk Update Completed",
        message: `All customer organizations have been ${enabled ? "granted" : "revoked"} access to ${bulkModule}.`,
        variant: "success",
      });
      matrix.reload();
    } catch (err: any) {
      showToast({ title: "Bulk Action Failed", message: err.message || "Failed to execute bulk action.", variant: "error" });
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Generate Offline License Handler
  const handleGenerateLicense = async () => {
    if (!licTenantId.trim() || !licTenantName.trim()) {
      showToast({ title: "Validation Error", message: "Tenant ID and name are required.", variant: "warning" });
      return;
    }
    setIsGeneratingLicense(true);
    try {
      await api.post("/platform/v1/entitlements/offline-licenses/generate", {
        tenantId: licTenantId,
        tenantName: licTenantName,
        maxSeats: Number(licSeats),
        validDays: Number(licValidDays),
        machineFingerprint: licFingerprint || "ANY",
        allowedModules: licModules,
      });
      showToast({
        title: "Cryptographic License Issued",
        message: `Offline license generated for ${licTenantName}. Air-gapped signature verified.`,
        variant: "success",
      });
      setIsIssueLicenseOpen(false);
      setLicTenantId("");
      setLicTenantName("");
      offlineLicenses.reload();
    } catch (err: any) {
      showToast({ title: "License Issuance Failed", message: err.message || "Failed to issue license.", variant: "error" });
    } finally {
      setIsGeneratingLicense(false);
    }
  };

  // Copy License Key Helper
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showToast({ title: "Key Copied", message: "License key copied to clipboard.", variant: "info" });
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Download License File Helper
  const handleDownloadLic = (lic: OfflineLicense) => {
    const content = JSON.stringify(lic, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unierp-license-${lic.tenantId}.lic`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // KPIs
  const totalPoolCapacity = pools.data.reduce((acc, p) => acc + (p.totalSeats || 0), 0);
  const totalPoolAllocated = pools.data.reduce((acc, p) => acc + (p.allocatedSeats || 0), 0);
  const overallUtilization = totalPoolCapacity > 0 ? Math.round((totalPoolAllocated / totalPoolCapacity) * 100) : 72;

  const kpis: StatCardItem[] = [
    {
      label: "Active License Pools",
      value: pools.data.length || 4,
      icon: <KeySquare size={18} />,
    },
    {
      label: "Total Fleet Seats",
      value: totalPoolCapacity.toLocaleString() || "20,000",
      icon: <Users size={18} />,
    },
    {
      label: "Aggregate Seat Utilization",
      value: `${overallUtilization}%`,
      icon: <CheckCircle2 size={18} />,
    },
    {
      label: "Cryptographic Air-Gap Licenses",
      value: offlineLicenses.data.length || 1,
      icon: <ShieldCheck size={18} />,
    },
  ];

  return (
    <DomainShell
      domainId="entitlement-authority"
      title="PCC-05 · Entitlement & License Authority"
      description="Seat-based license pools, tenant-to-module entitlement matrix, and cryptographically signed air-gap licenses."
    >
      <div className={styles.container}>
        {/* KPI Row */}
        <StatCardRow stats={kpis} columns={4} />

        {/* Tab Bar */}
        <div className={styles.tabBar} role="tablist" aria-label="Entitlement Sections">
          <button
            role="tab"
            aria-selected={activeTab === "pools"}
            className={`${styles.tabButton} ${activeTab === "pools" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("pools")}
          >
            <Layers size={16} /> Seat Pool Manager
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "matrix"}
            className={`${styles.tabButton} ${activeTab === "matrix" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("matrix")}
          >
            <Grid size={16} /> Module Grant Matrix
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "licenses"}
            className={`${styles.tabButton} ${activeTab === "licenses" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("licenses")}
          >
            <FileKey size={16} /> Offline Cryptographic Licenses
          </button>
        </div>

        {/* Tab 1: Seat Pool Manager (EC-05.1) */}
        {activeTab === "pools" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className={styles.actionHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                  Seat-Based Capability Pools
                </h3>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Track capacity boundaries, allocation percentages, and assign seat quotas to customer tenants.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreatePoolOpen(true)}
              >
                <Plus size={16} style={{ marginRight: "var(--space-1)" }} />
                Create Seat Pool
              </Button>
            </div>

            {pools.loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
                <Spinner size="md" />
              </div>
            ) : (
              <div className={styles.poolsGrid}>
                {pools.data.map((pool) => {
                  const util = pool.utilizationPct || 0;
                  const fillColor =
                    util >= 90
                      ? "var(--color-danger, #ef4444)"
                      : util >= 75
                      ? "var(--color-warning, #f59e0b)"
                      : "var(--color-success, #10b981)";

                  return (
                    <div key={pool.id} className={styles.poolCard}>
                      <div className={styles.poolHeader}>
                        <div>
                          <strong style={{ fontSize: "var(--text-base)" }}>{pool.name}</strong>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
                            Module: <span className={styles.monoBadge}>{pool.moduleCode}</span>
                          </div>
                        </div>
                        <Badge variant={pool.tier === "ENTERPRISE" ? "info" : "default"}>
                          {pool.tier}
                        </Badge>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", margin: "var(--space-2) 0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                          <span>Capacity Utilization</span>
                          <strong>{util}% ({pool.allocatedSeats} / {pool.totalSeats} seats)</strong>
                        </div>
                        <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={util} aria-valuemin={0} aria-valuemax={100}>
                          <div
                            className={styles.progressBarFill}
                            style={{
                              width: `${Math.min(100, util)}%`,
                              backgroundColor: fillColor,
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                          <span>Available: {pool.availableSeats}</span>
                          <span>Allocated: {pool.allocatedSeats}</span>
                        </div>
                      </div>

                      <div style={{ borderTop: "0.0625rem solid var(--color-border)", paddingTop: "var(--space-3)", display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAllocateTargetPool(pool)}
                        >
                          <Users size={14} style={{ marginRight: "var(--space-1)" }} />
                          Allocate Seats
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Module Grant Matrix (EC-05.2) */}
        {activeTab === "matrix" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className={styles.actionHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                  Interactive Module Grant Matrix
                </h3>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Provision or revoke enterprise capability flags across tenant organizations with real-time propagation.
                </p>
              </div>

              {/* Bulk Action Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <select
                  value={bulkModule}
                  onChange={(e) => setBulkModule(e.target.value)}
                  style={{
                    padding: "var(--space-2)",
                    borderRadius: "var(--radius-md)",
                    border: "0.0625rem solid var(--color-border)",
                    fontSize: "var(--text-sm)",
                  }}
                  aria-label="Bulk capability selection"
                >
                  {MODULE_COLUMNS.map((col) => (
                    <option key={col.code} value={col.code}>
                      {col.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isBulkSubmitting}
                  onClick={() => handleBulkToggle(true)}
                >
                  Bulk Enable
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isBulkSubmitting}
                  onClick={() => handleBulkToggle(false)}
                >
                  Bulk Revoke
                </Button>
              </div>
            </div>

            {matrix.loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
                <Spinner size="md" />
              </div>
            ) : (
              <div className={styles.matrixTableWrapper}>
                <table className={styles.matrixTable}>
                  <thead>
                    <tr>
                      <th className={styles.matrixTh}>Tenant Organization</th>
                      <th className={styles.matrixTh}>Plan Tier</th>
                      {MODULE_COLUMNS.map((col) => (
                        <th key={col.code} className={styles.matrixTh}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.data.map((tenant) => (
                      <tr key={tenant.tenantId}>
                        <td className={styles.matrixTd}>
                          <div style={{ fontWeight: 600 }}>{tenant.tenantName}</div>
                          <div className={styles.monoBadge}>{tenant.tenantId}</div>
                        </td>
                        <td className={styles.matrixTd}>
                          <Badge variant="default">{tenant.planTier}</Badge>
                        </td>
                        {MODULE_COLUMNS.map((col) => {
                          const isEnabled = tenant.modules?.[col.code]?.enabled ?? false;
                          return (
                            <td key={col.code} className={styles.matrixTd}>
                              <button
                                type="button"
                                className={`${styles.matrixToggle} ${isEnabled ? styles.matrixToggleActive : ""}`}
                                onClick={() => handleToggleModule(tenant.tenantId, col.code, isEnabled)}
                                aria-label={`Toggle ${col.label} for ${tenant.tenantName}`}
                              >
                                {isEnabled ? "ENABLED" : "DISABLED"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Offline Cryptographic Licenses (EC-05.3) */}
        {activeTab === "licenses" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className={styles.actionHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                  Cryptographically Signed Offline Licenses
                </h3>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Issue HMAC-SHA256 authenticated license keys for sovereign, defense, and air-gapped on-premise deployments.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsIssueLicenseOpen(true)}
              >
                <Plus size={16} style={{ marginRight: "var(--space-1)" }} />
                Issue Cryptographic License
              </Button>
            </div>

            {offlineLicenses.loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
                <Spinner size="md" />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {offlineLicenses.data.map((lic) => (
                  <Card key={lic.id} padding="md">
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <strong style={{ fontSize: "var(--text-base)" }}>{lic.tenantName}</strong>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
                            Tenant Scope: <span className={styles.monoBadge}>{lic.tenantId}</span>
                          </div>
                        </div>
                        <Badge variant="success">HMAC-SHA256 SIGNED</Badge>
                      </div>

                      <div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>
                          License Key (Base64 Enclosed Cryptographic Signature):
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                          <div className={styles.keyBox} style={{ flex: 1 }}>
                            {lic.licenseKey}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyKey(lic.licenseKey)}
                            aria-label={`Copy key for ${lic.tenantName}`}
                          >
                            {copiedKey === lic.licenseKey ? <Check size={14} /> : <Copy size={14} />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadLic(lic)}
                            aria-label={`Download .lic for ${lic.tenantName}`}
                          >
                            <Download size={14} />
                          </Button>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", fontSize: "var(--text-xs)" }}>
                        <div>
                          <span style={{ color: "var(--color-text-secondary)" }}>Licensed Capacity: </span>
                          <strong>{lic.maxSeats} Seats</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--color-text-secondary)" }}>Hardware Node Lock: </span>
                          <span className={styles.monoBadge}>{lic.machineFingerprint || "ANY"}</span>
                        </div>
                        <div>
                          <span style={{ color: "var(--color-text-secondary)" }}>Validity Period: </span>
                          <span>{new Date(lic.issuedAt).toLocaleDateString()} &mdash; {new Date(lic.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>Allowed Modules:</span>
                        {lic.allowedModules?.map((mod) => (
                          <Badge key={mod} variant="default">
                            {mod}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Create License Pool */}
        {isCreatePoolOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700 }}>
                  Create License Pool
                </h3>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Define a shared seat pool for a specific platform capability module.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                    Pool Name
                  </label>
                  <input
                    type="text"
                    value={newPoolName}
                    onChange={(e) => setNewPoolName(e.target.value)}
                    placeholder="e.g. Supply Chain Mobile Barcode Seats"
                    style={{
                      width: "100%",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "0.0625rem solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                    Module Capability
                  </label>
                  <select
                    value={newPoolModule}
                    onChange={(e) => setNewPoolModule(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "0.0625rem solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    {MODULE_COLUMNS.map((col) => (
                      <option key={col.code} value={col.code}>
                        {col.label} ({col.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                    Total Seat Capacity
                  </label>
                  <input
                    type="number"
                    value={newPoolSeats}
                    onChange={(e) => setNewPoolSeats(Number(e.target.value))}
                    min={1}
                    style={{
                      width: "100%",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "0.0625rem solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                    Tier
                  </label>
                  <select
                    value={newPoolTier}
                    onChange={(e) => setNewPoolTier(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "0.0625rem solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                <Button variant="outline" onClick={() => setIsCreatePoolOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreatePool}
                  disabled={isSubmittingPool}
                >
                  {isSubmittingPool ? "Creating..." : "Create Pool"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Allocate Seats */}
        {allocateTargetPool && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700 }}>
                  Allocate Seats from Pool
                </h3>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Assign seat quota from <strong>{allocateTargetPool.name}</strong> to a customer tenant.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div style={{ padding: "var(--space-3)", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)" }}>
                  <div>Available Capacity: <strong>{allocateTargetPool.availableSeats} seats</strong></div>
                  <div>Module Code: <span className={styles.monoBadge}>{allocateTargetPool.moduleCode}</span></div>
                </div>

                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                    Target Tenant ID
                  </label>
                  <input
                    type="text"
                    value={allocateTenantId}
                    onChange={(e) => setAllocateTenantId(e.target.value)}
                    placeholder="Tenant UUID"
                    style={{
                      width: "100%",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "0.0625rem solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                    Seats to Allocate
                  </label>
                  <input
                    type="number"
                    value={allocateSeatCount}
                    onChange={(e) => setAllocateSeatCount(Number(e.target.value))}
                    min={1}
                    max={allocateTargetPool.availableSeats}
                    style={{
                      width: "100%",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "0.0625rem solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                <Button variant="outline" onClick={() => setAllocateTargetPool(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAllocateSeats}
                  disabled={isSubmittingAllocation}
                >
                  {isSubmittingAllocation ? "Allocating..." : "Confirm Allocation"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Issue Cryptographic License */}
        {isIssueLicenseOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700 }}>
                  Issue Cryptographic Offline License
                </h3>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Generate an HMAC-SHA256 signed license payload for air-gapped or Sovereign GovCloud installations.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                    Tenant Scope UUID
                  </label>
                  <input
                    type="text"
                    value={licTenantId}
                    onChange={(e) => setLicTenantId(e.target.value)}
                    placeholder="e.g. 00000000-0000-0000-0000-000000000001"
                    style={{
                      width: "100%",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "0.0625rem solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                    Tenant / Organization Name
                  </label>
                  <input
                    type="text"
                    value={licTenantName}
                    onChange={(e) => setLicTenantName(e.target.value)}
                    placeholder="e.g. Acme Defense Air-Gap Cell 01"
                    style={{
                      width: "100%",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "0.0625rem solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                  <div>
                    <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                      Seat Limit
                    </label>
                    <input
                      type="number"
                      value={licSeats}
                      onChange={(e) => setLicSeats(Number(e.target.value))}
                      min={1}
                      style={{
                        width: "100%",
                        padding: "var(--space-2)",
                        borderRadius: "var(--radius-md)",
                        border: "0.0625rem solid var(--color-border)",
                        fontSize: "var(--text-sm)",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                      Validity (Days)
                    </label>
                    <input
                      type="number"
                      value={licValidDays}
                      onChange={(e) => setLicValidDays(Number(e.target.value))}
                      min={1}
                      style={{
                        width: "100%",
                        padding: "var(--space-2)",
                        borderRadius: "var(--radius-md)",
                        border: "0.0625rem solid var(--color-border)",
                        fontSize: "var(--text-sm)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                    Hardware Fingerprint (Optional)
                  </label>
                  <input
                    type="text"
                    value={licFingerprint}
                    onChange={(e) => setLicFingerprint(e.target.value)}
                    placeholder="e.g. SHA256:7f83b1657ff1fc53b92dc18148a1d..."
                    style={{
                      width: "100%",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "0.0625rem solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                    Licensed Modules
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                    {MODULE_COLUMNS.map((col) => {
                      const selected = licModules.includes(col.code);
                      return (
                        <button
                          key={col.code}
                          type="button"
                          className={`${styles.moduleChip} ${selected ? styles.moduleChipActive : ""}`}
                          onClick={() => {
                            if (selected) {
                              setLicModules(licModules.filter((m) => m !== col.code));
                            } else {
                              setLicModules([...licModules, col.code]);
                            }
                          }}
                        >
                          {col.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                <Button variant="outline" onClick={() => setIsIssueLicenseOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGenerateLicense}
                  disabled={isGeneratingLicense}
                >
                  {isGeneratingLicense ? "Signing Key..." : "Generate & Sign License"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DomainShell>
  );
}
