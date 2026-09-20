"use client";

import { useState } from "react";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "@kannan19302/ui";
import styles from "../marketplace.module.css";
import type {
  MarketplaceSubmission,
  ReviewChecklist,
  SubmissionStage,
} from "@/lib/marketplace-schema";

interface MarketplaceModalsProps {
  // Details Modal
  isDetailOpen: boolean;
  selectedSub: MarketplaceSubmission | null;
  onCloseDetail: () => void;
  onToggleChecklist: (itemKey: keyof ReviewChecklist) => void;
  onAssignReviewer: (reviewerId: string, reviewerName: string) => Promise<void>;
  onTransitionStage: (nextStage: SubmissionStage) => Promise<void>;
  onApprove: () => Promise<void>;
  onOpenRejectModal: () => void;

  // Reject Modal
  rejectModalOpen: boolean;
  onCloseRejectModal: () => void;
  onReject: (reason: string) => Promise<void>;

  // Rollback Modal
  rollbackModalOpen: boolean;
  selectedAppSlug: string;
  onCloseRollbackModal: () => void;
  onRollback: (targetVersion: string, reason: string) => Promise<void>;

  // Revoke Modal
  revokeModalOpen: boolean;
  onCloseRevokeModal: () => void;
  onEmergencyRevoke: (reason: string) => Promise<void>;
}

export function MarketplaceModals({
  isDetailOpen,
  selectedSub,
  onCloseDetail,
  onToggleChecklist,
  onAssignReviewer,
  onTransitionStage,
  onApprove,
  onOpenRejectModal,
  rejectModalOpen,
  onCloseRejectModal,
  onReject,
  rollbackModalOpen,
  selectedAppSlug,
  onCloseRollbackModal,
  onRollback,
  revokeModalOpen,
  onCloseRevokeModal,
  onEmergencyRevoke,
}: MarketplaceModalsProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [targetRollbackVersion, setTargetRollbackVersion] = useState("2.0.0");
  const [rollbackReason, setRollbackReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) return;
    await onReject(rejectReason.trim());
    setRejectReason("");
  };

  const handleRollbackSubmit = async () => {
    if (!rollbackReason.trim()) return;
    await onRollback(targetRollbackVersion, rollbackReason.trim());
    setRollbackReason("");
  };

  const handleRevokeSubmit = async () => {
    if (!revokeReason.trim()) return;
    await onEmergencyRevoke(revokeReason.trim());
    setRevokeReason("");
  };

  return (
    <>
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
                onClick={onCloseDetail}
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
                  if (rev) onAssignReviewer(`usr-${rev.toLowerCase()}`, rev);
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
                    onChange={() => onToggleChecklist("securitySastPassed")}
                  />
                  SAST Scan Clean
                </label>
                <label className={styles.checklistItem}>
                  <input
                    type="checkbox"
                    checked={selectedSub.checklist.securityNoCriticalCve}
                    onChange={() => onToggleChecklist("securityNoCriticalCve")}
                  />
                  0 Critical CVEs
                </label>
                <label className={styles.checklistItem}>
                  <input
                    type="checkbox"
                    checked={selectedSub.checklist.securityLeastPrivilege}
                    onChange={() => onToggleChecklist("securityLeastPrivilege")}
                  />
                  Least Privilege Scopes
                </label>
                <label className={styles.checklistItem}>
                  <input
                    type="checkbox"
                    checked={selectedSub.checklist.perfBundleUnder5Mb}
                    onChange={() => onToggleChecklist("perfBundleUnder5Mb")}
                  />
                  Bundle &lt; 5MB
                </label>
                <label className={styles.checklistItem}>
                  <input
                    type="checkbox"
                    checked={selectedSub.checklist.perfColdStartUnder800ms}
                    onChange={() => onToggleChecklist("perfColdStartUnder800ms")}
                  />
                  Cold Start &lt; 800ms
                </label>
                <label className={styles.checklistItem}>
                  <input
                    type="checkbox"
                    checked={selectedSub.checklist.uxDocumentationComplete}
                    onChange={() => onToggleChecklist("uxDocumentationComplete")}
                  />
                  Documentation Complete
                </label>
                <label className={styles.checklistItem}>
                  <input
                    type="checkbox"
                    checked={selectedSub.checklist.uxHighResIcon}
                    onChange={() => onToggleChecklist("uxHighResIcon")}
                  />
                  High-Res Icons (512px)
                </label>
                <label className={styles.checklistItem}>
                  <input
                    type="checkbox"
                    checked={selectedSub.checklist.uxVerifiedContact}
                    onChange={() => onToggleChecklist("uxVerifiedContact")}
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
                  <Button variant="outline" size="sm" onClick={() => onTransitionStage("SECURITY_REVIEW")}>
                    Advance to Security Review
                  </Button>
                )}
                {selectedSub.stage === "SECURITY_REVIEW" && (
                  <Button variant="outline" size="sm" onClick={() => onTransitionStage("FUNCTIONAL_REVIEW")}>
                    Advance to Functional Review
                  </Button>
                )}
                {selectedSub.stage === "FUNCTIONAL_REVIEW" && (
                  <Button variant="primary" size="sm" onClick={onApprove}>
                    <CheckCircle2 size={14} style={{ marginRight: "var(--space-1)" }} />
                    Approve & Sign Listing
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={onOpenRejectModal}>
                  <XCircle size={14} style={{ marginRight: "var(--space-1)" }} />
                  Reject Submission
                </Button>
              </div>
            </div>

            <div className={styles.buttonGroup} style={{ justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={onCloseDetail}>
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
              <Button variant="outline" onClick={onCloseRejectModal}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleRejectSubmit}>
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
              <Button variant="outline" onClick={onCloseRollbackModal}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleRollbackSubmit}>
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
              <Button variant="outline" onClick={onCloseRevokeModal}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleRevokeSubmit}>
                Confirm Emergency Platform Revocation
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
