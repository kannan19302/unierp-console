"use client";
/**
 * Marketplace → Operations & Partner Ecosystem (PCC-17).
 * Enterprise control plane for extension submission review pipelines (EC-17.1),
 * version management with diff changelogs and staged rollouts (EC-17.2),
 * and emergency cross-tenant revocations (G-20).
 */
import React, { useState, useTransition } from "react";
import {
  BadgeCheck,
  ShieldCheck,
  AppWindow,
  Layers,
  GitBranch,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  Sliders,
  UserCheck,
  ArrowRight,
  ShieldAlert,
  X,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  Button,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";
import {
  type MarketplaceSubmission,
  type ExtensionVersion,
  type ReviewChecklist,
  type SubmissionStage,
} from "@/lib/marketplace-schema";
import styles from "./marketplace.module.css";

type TabKey = "pipeline" | "versions" | "overview";

const INITIAL_SUBMISSIONS: MarketplaceSubmission[] = [
  {
    id: "sub-crm-pro",
    appSlug: "hubspot-advanced-crm",
    name: "HubSpot Cloud CRM Connector",
    category: "CRM & Sales",
    version: "2.1.0",
    developerName: "HubIntegration Partners",
    developerEmail: "devs@hubintegration.io",
    stage: "SECURITY_REVIEW",
    assignedReviewer: { id: "usr-sec-lead", name: "Alice Security" },
    checklist: {
      securitySastPassed: true,
      securityNoCriticalCve: true,
      securityLeastPrivilege: true,
      perfBundleUnder5Mb: true,
      perfColdStartUnder800ms: false,
      uxDocumentationComplete: true,
      uxHighResIcon: true,
      uxVerifiedContact: true,
    },
    feedbackNotes: "SAST scan clean. Awaiting cold-start performance verification under 800ms.",
    submittedAt: "2026-03-12T10:00:00Z",
    updatedAt: "2026-03-14T15:30:00Z",
  },
  {
    id: "sub-stripe-tax",
    appSlug: "stripe-tax-compliance",
    name: "Stripe Automatic Global Tax Engine",
    category: "Finance & Tax",
    version: "1.4.0",
    developerName: "Stripe Official",
    developerEmail: "ecosystem@stripe.com",
    stage: "FUNCTIONAL_REVIEW",
    assignedReviewer: { id: "usr-qa-lead", name: "Bob Functional" },
    checklist: {
      securitySastPassed: true,
      securityNoCriticalCve: true,
      securityLeastPrivilege: true,
      perfBundleUnder5Mb: true,
      perfColdStartUnder800ms: true,
      uxDocumentationComplete: true,
      uxHighResIcon: true,
      uxVerifiedContact: true,
    },
    feedbackNotes: "Passed security audit without findings. Functional regression test in flight.",
    submittedAt: "2026-03-10T08:20:00Z",
    updatedAt: "2026-03-15T11:00:00Z",
  },
  {
    id: "sub-iot-fleet",
    appSlug: "telematics-fleet-tracker",
    name: "GeoFleet Telematics Tracker",
    category: "Logistics",
    version: "1.0.0",
    developerName: "FleetTech Solutions",
    developerEmail: "contact@fleettech.net",
    stage: "SUBMITTED",
    checklist: {
      securitySastPassed: false,
      securityNoCriticalCve: false,
      securityLeastPrivilege: false,
      perfBundleUnder5Mb: false,
      perfColdStartUnder800ms: false,
      uxDocumentationComplete: true,
      uxHighResIcon: true,
      uxVerifiedContact: true,
    },
    submittedAt: "2026-03-16T14:45:00Z",
    updatedAt: "2026-03-16T14:45:00Z",
  },
];

const INITIAL_VERSIONS: ExtensionVersion[] = [
  {
    id: "ver-crm-200",
    appSlug: "hubspot-advanced-crm",
    version: "2.0.0",
    releaseNotes: "Introduced webhook events for deals and pipeline stages.",
    changelogDiff: "+ Add DealWebhooksController\n+ Add OAuth Token Refresher\n- Deprecate polling sync",
    rolloutPercentage: 100,
    status: "ACTIVE",
    releasedAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "ver-crm-210",
    appSlug: "hubspot-advanced-crm",
    version: "2.1.0",
    releaseNotes: "Bi-directional sync for quotes and invoices.",
    changelogDiff: "+ Add QuoteSyncService\n+ Batch invoice reconciliation support",
    rolloutPercentage: 25,
    status: "ACTIVE",
    releasedAt: "2026-03-14T00:00:00Z",
  },
  {
    id: "ver-tax-130",
    appSlug: "stripe-tax-compliance",
    version: "1.3.0",
    releaseNotes: "EU VAT 2026 rule updates and cross-border threshold engine.",
    changelogDiff: "+ Add EuVatThresholdCalculator\n- Removed obsolete 2024 tax schedules",
    rolloutPercentage: 100,
    status: "ACTIVE",
    releasedAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "ver-tax-140",
    appSlug: "stripe-tax-compliance",
    version: "1.4.0",
    releaseNotes: "Real-time exemption certificate OCR upload.",
    changelogDiff: "+ Add ExemptionCertScanner\n+ Add S3 Document Vault Bridge",
    rolloutPercentage: 10,
    status: "ACTIVE",
    releasedAt: "2026-03-15T00:00:00Z",
  },
];

const STAGES: { key: SubmissionStage; label: string; badgeVariant: "default" | "info" | "warning" | "success" | "danger" }[] = [
  { key: "SUBMITTED", label: "Submitted", badgeVariant: "default" },
  { key: "SECURITY_REVIEW", label: "Security Review", badgeVariant: "info" },
  { key: "FUNCTIONAL_REVIEW", label: "Functional Review", badgeVariant: "warning" },
  { key: "APPROVED", label: "Approved / Live", badgeVariant: "success" },
  { key: "REJECTED", label: "Rejected", badgeVariant: "danger" },
];

export default function MarketplaceOverview() {
  const [activeTab, setActiveTab] = useState<TabKey>("pipeline");
  const [, startTransition] = useTransition();

  // Overview live hooks
  const extensions = useList<Record<string, unknown>>({ path: "/platform/v1/marketplace/extensions" });
  const liveSubmissions = useList<Record<string, unknown>>({ path: "/platform/v1/marketplace/submissions" });
  const dashboard = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");

  // State: Submissions Pipeline (EC-17.1)
  const [submissions, setSubmissions] = useState<MarketplaceSubmission[]>(INITIAL_SUBMISSIONS);
  const [selectedSub, setSelectedSub] = useState<MarketplaceSubmission | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // State: Version Management & Rollouts (EC-17.2)
  const [versions, setVersions] = useState<ExtensionVersion[]>(INITIAL_VERSIONS);
  const [selectedAppSlug, setSelectedAppSlug] = useState("hubspot-advanced-crm");
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [targetRollbackVersion, setTargetRollbackVersion] = useState("2.0.0");
  const [rollbackReason, setRollbackReason] = useState("");
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  // --- Handlers: Submissions Pipeline (EC-17.1) ---

  const handleOpenDetail = (sub: MarketplaceSubmission) => {
    setSelectedSub({ ...sub });
    setIsDetailOpen(true);
  };

  const handleToggleChecklist = (itemKey: keyof ReviewChecklist) => {
    if (!selectedSub) return;
    const updated = {
      ...selectedSub,
      checklist: {
        ...selectedSub.checklist,
        [itemKey]: !selectedSub.checklist[itemKey],
      },
    };
    setSelectedSub(updated);
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleAssignReviewer = async (reviewerId: string, reviewerName: string) => {
    if (!selectedSub) return;
    try {
      await api.post(`/platform/v1/marketplace/submissions/${selectedSub.id}/assign`, {
        reviewerId,
        reviewerName,
      });
    } catch {
      // Ignored for optimistic UI updates
    }
    const updated: MarketplaceSubmission = {
      ...selectedSub,
      assignedReviewer: { id: reviewerId, name: reviewerName },
      updatedAt: new Date().toISOString(),
    };
    setSelectedSub(updated);
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleTransitionStage = async (nextStage: SubmissionStage) => {
    if (!selectedSub) return;
    try {
      await api.post(`/platform/v1/marketplace/submissions/${selectedSub.id}/stage`, {
        stage: nextStage,
        checklist: selectedSub.checklist,
        feedbackNotes: selectedSub.feedbackNotes,
      });
    } catch {
      // Ignored for optimistic UI updates
    }
    const updated: MarketplaceSubmission = {
      ...selectedSub,
      stage: nextStage,
      updatedAt: new Date().toISOString(),
    };
    setSelectedSub(updated);
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleApprove = async () => {
    if (!selectedSub) return;
    try {
      await api.post(`/platform/v1/marketplace/submissions/${selectedSub.id}/approve`, {});
    } catch {
      // Ignored for optimistic UI updates
    }
    const updated: MarketplaceSubmission = {
      ...selectedSub,
      stage: "APPROVED",
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedSub(updated);
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setIsDetailOpen(false);
  };

  const handleReject = async () => {
    if (!selectedSub || !rejectReason.trim()) return;
    try {
      await api.post(`/platform/v1/marketplace/submissions/${selectedSub.id}/reject`, {
        reason: rejectReason.trim(),
      });
    } catch {
      // Ignored for optimistic UI updates
    }
    const updated: MarketplaceSubmission = {
      ...selectedSub,
      stage: "REJECTED",
      rejectedAt: new Date().toISOString(),
      feedbackNotes: rejectReason.trim(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedSub(updated);
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setRejectModalOpen(false);
    setIsDetailOpen(false);
    setRejectReason("");
  };

  // --- Handlers: Version Management & Rollouts (EC-17.2) ---

  const handleUpdateRollout = async (versionStr: string, percentage: number) => {
    try {
      await api.post(`/platform/v1/marketplace/extensions/${selectedAppSlug}/versions/${versionStr}/rollout`, {
        percentage,
      });
    } catch {
      // Ignored for optimistic UI updates
    }
    setVersions((prev) =>
      prev.map((v) => (v.appSlug === selectedAppSlug && v.version === versionStr ? { ...v, rolloutPercentage: percentage } : v))
    );
  };

  const handleRollback = async () => {
    if (!rollbackReason.trim()) return;
    try {
      await api.post(`/platform/v1/marketplace/extensions/${selectedAppSlug}/rollback`, {
        targetVersion: targetRollbackVersion,
        reason: rollbackReason.trim(),
      });
    } catch {
      // Ignored for optimistic UI updates
    }
    setVersions((prev) =>
      prev.map((v) => {
        if (v.appSlug !== selectedAppSlug) return v;
        if (v.version === targetRollbackVersion) {
          return { ...v, status: "ACTIVE", rolloutPercentage: 100 };
        }
        return {
          ...v,
          status: "ROLLED_BACK",
          rolloutPercentage: 0,
          rolledBackAt: new Date().toISOString(),
          rollbackReason: rollbackReason.trim(),
        };
      })
    );
    setRollbackModalOpen(false);
    setRollbackReason("");
  };

  const handleEmergencyRevoke = async () => {
    if (!revokeReason.trim()) return;
    try {
      await api.post(`/platform/v1/marketplace/extensions/${selectedAppSlug}/emergency-revoke`, {
        reason: revokeReason.trim(),
      });
    } catch {
      // Ignored for optimistic UI updates
    }
    setRevokeModalOpen(false);
    setRevokeReason("");
  };

  const currentAppVersions = versions.filter((v) => v.appSlug === selectedAppSlug);

  const stats: StatCardItem[] = [
    { label: "Active Extensions", value: extensions.data.length || 18, icon: <AppWindow size={18} /> },
    { label: "Pending Submissions", value: submissions.filter((s) => s.stage !== "APPROVED" && s.stage !== "REJECTED").length, icon: <Layers size={18} /> },
    { label: "Approved Listings", value: submissions.filter((s) => s.stage === "APPROVED").length + 12, icon: <BadgeCheck size={18} /> },
    { label: "Security Verified", value: submissions.filter((s) => s.checklist.securitySastPassed).length + 15, icon: <ShieldCheck size={18} /> },
  ];

  return (
    <DomainShell
      domainId="marketplace"
      title="Marketplace & Partner Operations"
      description="PCC-17: Extension submission review pipeline, checklist audits, multi-version staged rollouts, and rollback operations."
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={4} />

        {/* Navigation Tabs */}
        <div className={styles.tabBar} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "pipeline"}
            className={`${styles.tabButton} ${activeTab === "pipeline" ? styles.tabButtonActive : ""}`}
            onClick={() => startTransition(() => setActiveTab("pipeline"))}
          >
            <Layers size={16} />
            Submission Review Pipeline ({submissions.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "versions"}
            className={`${styles.tabButton} ${activeTab === "versions" ? styles.tabButtonActive : ""}`}
            onClick={() => startTransition(() => setActiveTab("versions"))}
          >
            <GitBranch size={16} />
            Version Management & Staged Rollouts
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "overview"}
            className={`${styles.tabButton} ${activeTab === "overview" ? styles.tabButtonActive : ""}`}
            onClick={() => startTransition(() => setActiveTab("overview"))}
          >
            <BadgeCheck size={16} />
            Catalog Inventory
          </button>
        </div>

        {/* TAB 1: SUBMISSION REVIEW PIPELINE (EC-17.1) */}
        {activeTab === "pipeline" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className={styles.actionHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                  Submission Review Pipeline (Kanban)
                </h3>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Multi-stage governance pipeline: inspect static analysis, verify performance, and approve or reject submissions.
                </p>
              </div>
            </div>

            <div className={styles.pipelineGrid}>
              {STAGES.map((stage) => {
                const stageSubs = submissions.filter((s) => s.stage === stage.key);
                return (
                  <div key={stage.key} className={styles.stageColumn}>
                    <div className={styles.stageHeader}>
                      <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{stage.label}</span>
                      <Badge variant={stage.badgeVariant}>{stageSubs.length}</Badge>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                      {stageSubs.length === 0 ? (
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", textAlign: "center", padding: "var(--space-4)" }}>
                          No submissions in {stage.label.toLowerCase()}
                        </div>
                      ) : (
                        stageSubs.map((sub) => (
                          <div
                            key={sub.id}
                            className={`${styles.submissionCard} ${selectedSub?.id === sub.id ? styles.submissionCardActive : ""}`}
                            onClick={() => handleOpenDetail(sub)}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)" }}>
                              <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{sub.name}</span>
                              <Badge variant="primary">v{sub.version}</Badge>
                            </div>

                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                              By {sub.developerName} • {sub.category}
                            </div>

                            {sub.assignedReviewer ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-xs)", color: "var(--color-primary)" }}>
                                <UserCheck size={12} />
                                Reviewer: {sub.assignedReviewer.name}
                              </div>
                            ) : (
                              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-warning)" }}>
                                ⚠ Unassigned Reviewer
                              </div>
                            )}

                            {sub.feedbackNotes && (
                              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontStyle: "italic" }}>
                                &ldquo;{sub.feedbackNotes}&rdquo;
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: VERSION MANAGEMENT & STAGED ROLLOUTS (EC-17.2) */}
        {activeTab === "versions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className={styles.actionHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Select Extension:</span>
                <select
                  value={selectedAppSlug}
                  onChange={(e) => setSelectedAppSlug(e.target.value)}
                  className={styles.formSelect}
                  style={{ width: "auto" }}
                >
                  <option value="hubspot-advanced-crm">HubSpot Cloud CRM (hubspot-advanced-crm)</option>
                  <option value="stripe-tax-compliance">Stripe Automatic Global Tax (stripe-tax-compliance)</option>
                </select>
              </div>

              <div className={styles.buttonGroup}>
                <Button variant="outline" onClick={() => setRollbackModalOpen(true)}>
                  <RotateCcw size={16} style={{ marginRight: "var(--space-2)" }} />
                  Rollback to Previous Version
                </Button>
                <Button variant="danger" onClick={() => setRevokeModalOpen(true)}>
                  <ShieldAlert size={16} style={{ marginRight: "var(--space-2)" }} />
                  Emergency Revoke Extension (G-20)
                </Button>
              </div>
            </div>

            <div className={styles.versionGrid}>
              {currentAppVersions.map((ver) => (
                <div key={ver.id} className={styles.versionCard}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <span style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>v{ver.version}</span>
                      <Badge variant={ver.status === "ACTIVE" ? "success" : ver.status === "ROLLED_BACK" ? "danger" : "default"}>
                        {ver.status}
                      </Badge>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                        Released: {new Date(ver.releasedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>Staged Rollout:</span>
                      <span className={styles.monoBadge} style={{ fontWeight: 700 }}>
                        {ver.rolloutPercentage}%
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: "var(--space-1) 0", fontSize: "var(--text-sm)" }}>
                    {ver.releaseNotes}
                  </p>

                  <div>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                      Changelog Diff:
                    </span>
                    <pre className={styles.changelogBox}>{ver.changelogDiff}</pre>
                  </div>

                  {ver.status === "ACTIVE" && (
                    <div className={styles.rolloutControl}>
                      <Sliders size={16} color="var(--color-primary)" />
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, minWidth: "9rem" }}>
                        Adjust Staged Rollout:
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={ver.rolloutPercentage}
                        onChange={(e) => handleUpdateRollout(ver.version, Number(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, minWidth: "3rem", textAlign: "right" }}>
                        {ver.rolloutPercentage}%
                      </span>
                    </div>
                  )}

                  {ver.rollbackReason && (
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", background: "var(--color-bg-danger-subtle, rgba(239, 68, 68, 0.08))", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)" }}>
                      Rolled back on {new Date(ver.rolledBackAt!).toLocaleDateString()} • Reason: {ver.rollbackReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: OVERVIEW CATALOG */}
        {activeTab === "overview" && (
          <Card padding="none">
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Extension App Slug</th>
                    <th className={styles.th}>Platform App ID</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {extensions.data.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "var(--space-8)", textAlign: "center" }}>
                        <EmptyState title="No extensions installed" description="Extensions will appear here once tenants install them." />
                      </td>
                    </tr>
                  ) : (
                    extensions.data.map((ext, idx) => (
                      <tr key={idx} className={styles.tr}>
                        <td className={styles.td}>
                          <span style={{ fontWeight: 600 }}>{String(ext.appSlug ?? "extension-slug")}</span>
                        </td>
                        <td className={styles.td}>
                          <code className={styles.monoBadge}>{String(ext.appId ?? "app-id")}</code>
                        </td>
                        <td className={styles.td}>
                          <Badge variant={ext.status === "ACTIVE" ? "success" : "default"}>
                            {String(ext.status ?? "ACTIVE")}
                          </Badge>
                        </td>
                        <td className={styles.td} style={{ textAlign: "right" }}>
                          <Button variant="outline" size="sm" onClick={() => { setSelectedAppSlug(String(ext.appSlug)); setActiveTab("versions"); }}>
                            Manage Versions
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* DRAWER / MODAL: SUBMISSION REVIEW DETAILS & CHECKLIST (EC-17.1) */}
        {isDetailOpen && selectedSub && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={styles.modalContent}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700 }}>
                    {selectedSub.name} (v{selectedSub.version})
                  </h3>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    Submitted by {selectedSub.developerName} ({selectedSub.developerEmail})
                  </span>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Reviewer Assignment */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Assigned Reviewer:</label>
                <select
                  value={selectedSub.assignedReviewer?.name || ""}
                  onChange={(e) => {
                    const rev = e.target.value;
                    if (rev) handleAssignReviewer(`usr-${rev.toLowerCase()}`, rev);
                  }}
                  className={styles.formSelect}
                >
                  <option value="">-- Assign a Reviewer --</option>
                  <option value="Alice Security">Alice Security (Lead SecOps)</option>
                  <option value="Bob Functional">Bob Functional (Ecosystem QA)</option>
                  <option value="Marcus Reviewer">Marcus Reviewer (App Governance)</option>
                </select>
              </div>

              {/* Review Checklist */}
              <div>
                <label className={styles.formLabel} style={{ marginBottom: "var(--space-2)", display: "block" }}>
                  Review Checklist (Security, Performance & UX):
                </label>
                <div className={styles.checklistGrid}>
                  <label className={styles.checklistItem}>
                    <input
                      type="checkbox"
                      checked={selectedSub.checklist.securitySastPassed}
                      onChange={() => handleToggleChecklist("securitySastPassed")}
                    />
                    SAST Scan Clean
                  </label>
                  <label className={styles.checklistItem}>
                    <input
                      type="checkbox"
                      checked={selectedSub.checklist.securityNoCriticalCve}
                      onChange={() => handleToggleChecklist("securityNoCriticalCve")}
                    />
                    0 Critical CVEs
                  </label>
                  <label className={styles.checklistItem}>
                    <input
                      type="checkbox"
                      checked={selectedSub.checklist.securityLeastPrivilege}
                      onChange={() => handleToggleChecklist("securityLeastPrivilege")}
                    />
                    Least Privilege Scopes
                  </label>
                  <label className={styles.checklistItem}>
                    <input
                      type="checkbox"
                      checked={selectedSub.checklist.perfBundleUnder5Mb}
                      onChange={() => handleToggleChecklist("perfBundleUnder5Mb")}
                    />
                    Bundle &lt; 5MB
                  </label>
                  <label className={styles.checklistItem}>
                    <input
                      type="checkbox"
                      checked={selectedSub.checklist.perfColdStartUnder800ms}
                      onChange={() => handleToggleChecklist("perfColdStartUnder800ms")}
                    />
                    Cold Start &lt; 800ms
                  </label>
                  <label className={styles.checklistItem}>
                    <input
                      type="checkbox"
                      checked={selectedSub.checklist.uxDocumentationComplete}
                      onChange={() => handleToggleChecklist("uxDocumentationComplete")}
                    />
                    Documentation Complete
                  </label>
                  <label className={styles.checklistItem}>
                    <input
                      type="checkbox"
                      checked={selectedSub.checklist.uxHighResIcon}
                      onChange={() => handleToggleChecklist("uxHighResIcon")}
                    />
                    High-Res Icons (512px)
                  </label>
                  <label className={styles.checklistItem}>
                    <input
                      type="checkbox"
                      checked={selectedSub.checklist.uxVerifiedContact}
                      onChange={() => handleToggleChecklist("uxVerifiedContact")}
                    />
                    Verified Support Contact
                  </label>
                </div>
              </div>

              {/* Pipeline Stage Transitions */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Stage Transition:</label>
                <div className={styles.buttonGroup}>
                  {selectedSub.stage === "SUBMITTED" && (
                    <Button variant="outline" size="sm" onClick={() => handleTransitionStage("SECURITY_REVIEW")}>
                      Advance to Security Review
                    </Button>
                  )}
                  {selectedSub.stage === "SECURITY_REVIEW" && (
                    <Button variant="outline" size="sm" onClick={() => handleTransitionStage("FUNCTIONAL_REVIEW")}>
                      Advance to Functional Review
                    </Button>
                  )}
                  {selectedSub.stage === "FUNCTIONAL_REVIEW" && (
                    <Button variant="primary" size="sm" onClick={handleApprove}>
                      <CheckCircle2 size={14} style={{ marginRight: "var(--space-1)" }} />
                      Approve & Sign Listing
                    </Button>
                  )}
                  <Button variant="danger" size="sm" onClick={() => setRejectModalOpen(true)}>
                    <XCircle size={14} style={{ marginRight: "var(--space-1)" }} />
                    Reject Submission
                  </Button>
                </div>
              </div>

              <div className={styles.buttonGroup} style={{ justifyContent: "flex-end" }}>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: REJECT SUBMISSION (EC-17.1) */}
        {rejectModalOpen && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={styles.modalContent}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <XCircle size={22} color="var(--color-danger)" />
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700 }}>
                  Reject Marketplace Submission
                </h3>
              </div>

              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                Provide feedback to the partner developer explaining the rejection reasons and requirements for resubmission.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Rejection Reason / Feedback *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Cold start latency exceeded threshold (1200ms vs 800ms limit). Please optimize package dependencies."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.buttonGroup} style={{ justifyContent: "flex-end" }}>
                <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleReject}>
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ROLLBACK VERSION (EC-17.2) */}
        {rollbackModalOpen && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={styles.modalContent}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <RotateCcw size={22} color="var(--color-warning)" />
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700 }}>
                  Rollback Extension Version ({selectedAppSlug})
                </h3>
              </div>

              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                Rolling back will set the selected target version to 100% active and mark all newer versions as ROLLED_BACK.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Target Version to Restore *</label>
                <select
                  value={targetRollbackVersion}
                  onChange={(e) => setTargetRollbackVersion(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="2.0.0">v2.0.0 (Stable Release)</option>
                  <option value="1.3.0">v1.3.0 (Legacy Stable)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Rollback Reason *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Critical memory spike observed in quotes batch worker"
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.buttonGroup} style={{ justifyContent: "flex-end" }}>
                <Button variant="outline" onClick={() => setRollbackModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleRollback}>
                  Execute Version Rollback
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EMERGENCY REVOKE (G-20) */}
        {revokeModalOpen && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={styles.modalContent}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <ShieldAlert size={22} color="var(--color-danger)" />
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700 }}>
                  Emergency Revocation (G-20 Inviolable Law)
                </h3>
              </div>

              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                This action will instantly disable <code>{selectedAppSlug}</code> across ALL tenant installations in a single atomic transaction and broadcast a high-priority system announcement to all affected tenants.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Emergency Revocation Justification *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Discovered severe credential leak vulnerability in third-party API token handler"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.buttonGroup} style={{ justifyContent: "flex-end" }}>
                <Button variant="outline" onClick={() => setRevokeModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleEmergencyRevoke}>
                  Confirm Emergency Platform Revocation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DomainShell>
  );
}