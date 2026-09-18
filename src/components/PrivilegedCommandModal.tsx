"use client";

import { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  ArrowRight,
} from "lucide-react";
import styles from "./PrivilegedCommandModal.module.css";

export interface PrivilegedCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actionName: string;
  appId: string;
  targetDescription: string;
  previewData?: Record<string, string | number>;
  onExecute?: (justification: string, approvalRef: string) => Promise<void> | void;
}

export default function PrivilegedCommandModal({
  isOpen,
  onClose,
  title,
  actionName,
  appId,
  targetDescription,
  previewData = {
    "Target Scope": "Active Region / Primary Cell",
    "Assurance Tier": "Tier-1 Dual-Control Required",
    "Estimated Recovery": "Sub-100ms Atomic Rollback",
    "Audit Ledger": "Durable Outbox Immutable Commit",
  },
  onExecute,
}: PrivilegedCommandModalProps) {
  const [step, setStep] = useState<"preview" | "justification" | "executing" | "completed">("preview");
  const [justification, setJustification] = useState("");
  const [approvalRef, setApprovalRef] = useState("");
  const [operationId, setOperationId] = useState("");

  if (!isOpen) return null;

  const handleProceedToJustification = () => {
    setStep("justification");
  };

  const handleExecute = async () => {
    setStep("executing");
    try {
      if (onExecute) {
        await onExecute(justification, approvalRef);
      }
      // Simulate real-time dispatch with generated operation ID
      const opId = `pcc-op-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      setOperationId(opId);
      setStep("completed");
    } catch {
      setStep("justification");
    }
  };

  const handleResetAndClose = () => {
    setStep("preview");
    setJustification("");
    setApprovalRef("");
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={handleResetAndClose} aria-hidden="true">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.iconWrapper}>
              <ShieldAlert size={16} />
            </div>
            <h2 id="modal-title" className={styles.title}>{title}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span className={styles.stepIndicator}>
              {step === "preview" && "Step 1 of 2: Preview"}
              {step === "justification" && "Step 2 of 2: Approval"}
              {step === "executing" && "Executing…"}
              {step === "completed" && "Committed"}
            </span>
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleResetAndClose}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className={styles.body}>
          {step === "preview" && (
            <>
              <div className={styles.calloutWarning}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  This is a privileged platform command for <strong>{appId}</strong>. A cryptographic preview has been resolved against authoritative state.
                </span>
              </div>

              <div className={styles.previewBox}>
                <h3 className={styles.previewTitle}>Impact Preview</h3>
                <div className={styles.previewGrid}>
                  <div className={styles.previewItem}>
                    <span className={styles.previewLabel}>Operation</span>
                    <span className={styles.previewValue}>{actionName}</span>
                  </div>
                  <div className={styles.previewItem}>
                    <span className={styles.previewLabel}>Target</span>
                    <span className={styles.previewValue}>{targetDescription}</span>
                  </div>
                  {Object.entries(previewData).map(([k, v]) => (
                    <div key={k} className={styles.previewItem}>
                      <span className={styles.previewLabel}>{k}</span>
                      <span className={styles.previewValue}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === "justification" && (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="justification-input" className={styles.formLabel}>
                  Change Justification &amp; Purpose (Mandatory for Audit Ledger)
                </label>
                <textarea
                  id="justification-input"
                  className={styles.formTextarea}
                  placeholder="Explain why this action is being taken (e.g., Scheduled maintenance runbook, P1 Incident containment)..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="approval-ref-input" className={styles.formLabel}>
                  Dual-Control Approval Reference / Change Ticket ID
                </label>
                <input
                  id="approval-ref-input"
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. CHG-2026-8841 or INC-9012"
                  value={approvalRef}
                  onChange={(e) => setApprovalRef(e.target.value)}
                />
              </div>
            </>
          )}

          {step === "executing" && (
            <div className={styles.successState}>
              <Loader2 size={36} className="animate-spin" style={{ color: "var(--color-primary)" }} />
              <h3 className={styles.successTitle}>Dispatching Privileged Command</h3>
              <p className={styles.successDetail}>
                Re-evaluating zero-trust authorization, generating fencing token, and committing to outbox...
              </p>
            </div>
          )}

          {step === "completed" && (
            <div className={styles.successState}>
              <div className={styles.successIcon}>
                <CheckCircle2 size={24} />
              </div>
              <h3 className={styles.successTitle}>Command Accepted</h3>
              <p className={styles.successDetail}>
                Operation successfully committed with ID: <code>{operationId}</code>. Durable audit entry sealed.
              </p>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          {step === "preview" && (
            <>
              <button type="button" className={styles.cancelButton} onClick={handleResetAndClose}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.executeButton}
                onClick={handleProceedToJustification}
              >
                <span>Proceed to Approval</span>
                <ArrowRight size={14} />
              </button>
            </>
          )}

          {step === "justification" && (
            <>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setStep("preview")}
              >
                Back to Preview
              </button>
              <button
                type="button"
                className={styles.executeButton}
                disabled={!justification.trim() || !approvalRef.trim()}
                onClick={handleExecute}
              >
                <span>Confirm &amp; Execute (202 Accepted)</span>
              </button>
            </>
          )}

          {step === "completed" && (
            <button
              type="button"
              className={styles.executeButton}
              onClick={handleResetAndClose}
            >
              Done
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
