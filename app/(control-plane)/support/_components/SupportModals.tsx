"use client";

import { useState, useId } from "react";
import {
  Button,
  FormField,
  Input,
  Modal,
} from "@kannan19302/ui";
import styles from "../support.module.css";
import type { SupportTicket, DiagnosticScope } from "@/lib/support-schema";

interface SupportModalsProps {
  // Ticket Modal
  ticketModalOpen: boolean;
  onCloseTicketModal: () => void;
  onCreateTicket: (data: {
    tenantId: string;
    subject: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    category: string;
    description: string;
  }) => Promise<void>;

  // Resolve Modal
  resolveOpen: boolean;
  resolveTarget: SupportTicket | null;
  onCloseResolveModal: () => void;
  onResolveTicket: (ticketId: string, resolution: string) => Promise<void>;

  // Diagnostic Consent Modal
  consentModalOpen: boolean;
  onCloseConsentModal: () => void;
  onRequestConsent: (data: {
    tenantId: string;
    scope: DiagnosticScope;
    reason: string;
  }) => Promise<void>;
}

export function SupportModals({
  ticketModalOpen,
  onCloseTicketModal,
  onCreateTicket,
  resolveOpen,
  resolveTarget,
  onCloseResolveModal,
  onResolveTicket,
  consentModalOpen,
  onCloseConsentModal,
  onRequestConsent,
}: SupportModalsProps) {
  // New ticket state
  const [newTenantId, setNewTenantId] = useState("tenant-acme");
  const [newSubject, setNewSubject] = useState("");
  const [newSeverity, setNewSeverity] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [newCategory, setNewCategory] = useState("INTEGRATION");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Resolve state
  const [resolutionText, setResolutionText] = useState("");
  const [resolving, setResolving] = useState(false);

  // Consent state
  const [consentTenantId, setConsentTenantId] = useState("tenant-acme");
  const [consentScope, setConsentScope] = useState<DiagnosticScope>("SESSION_REPLAY_VIEW");
  const [consentReason, setConsentReason] = useState("");
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);

  const newTenantIdId = useId();
  const newSeverityId = useId();
  const newCategoryId = useId();
  const consentTenantIdId = useId();
  const consentScopeId = useId();

  const handleTicketSubmit = async () => {
    setIsSubmittingTicket(true);
    try {
      await onCreateTicket({
        tenantId: newTenantId,
        subject: newSubject,
        severity: newSeverity,
        category: newCategory,
        description: newDescription,
      });
      setNewSubject("");
      setNewDescription("");
      onCloseTicketModal();
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleResolveSubmit = async () => {
    if (!resolveTarget) return;
    setResolving(true);
    try {
      await onResolveTicket(resolveTarget.id, resolutionText);
      setResolutionText("");
      onCloseResolveModal();
    } finally {
      setResolving(false);
    }
  };

  const handleConsentSubmit = async () => {
    setIsSubmittingConsent(true);
    try {
      await onRequestConsent({
        tenantId: consentTenantId,
        scope: consentScope,
        reason: consentReason,
      });
      setConsentReason("");
      onCloseConsentModal();
    } finally {
      setIsSubmittingConsent(false);
    }
  };

  return (
    <>
      {/* CREATE TICKET MODAL */}
      <Modal
        open={ticketModalOpen}
        onClose={onCloseTicketModal}
        title="Create Support Ticket"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <div className={styles.formGroup}>
            <label htmlFor={newTenantIdId} className={styles.formLabel}>Tenant</label>
            <select
              id={newTenantIdId}
              aria-label="Select tenant"
              className={styles.formSelect}
              value={newTenantId}
              onChange={(e) => setNewTenantId(e.target.value)}
            >
              <option value="tenant-acme">Acme Global Corp</option>
              <option value="tenant-globex">Globex Industries</option>
              <option value="tenant-soylent">Soylent Tech</option>
            </select>
          </div>

          <FormField label="Subject / Summary" required>
            <Input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="e.g. Webhook delivery failure on high throughput"
            />
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div className={styles.formGroup}>
              <label htmlFor={newSeverityId} className={styles.formLabel}>Severity</label>
              <select
                id={newSeverityId}
                aria-label="Select ticket severity"
                className={styles.formSelect}
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW")}
              >
                <option value="CRITICAL">Critical (4h SLA)</option>
                <option value="HIGH">High (8h SLA)</option>
                <option value="MEDIUM">Medium (24h SLA)</option>
                <option value="LOW">Low (72h SLA)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor={newCategoryId} className={styles.formLabel}>Category</label>
              <select
                id={newCategoryId}
                aria-label="Select ticket category"
                className={styles.formSelect}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="INTEGRATION">Integration</option>
                <option value="SECURITY">Security</option>
                <option value="BILLING">Billing</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Initial Message / Description</label>
            <textarea
              className={styles.replyTextarea}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Detailed description of customer issue..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={onCloseTicketModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isSubmittingTicket || !newSubject.trim() || !newDescription.trim()}
              onClick={handleTicketSubmit}
            >
              {isSubmittingTicket ? "Creating..." : "Submit Ticket"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* RESOLVE TICKET MODAL */}
      <Modal
        open={resolveOpen}
        onClose={onCloseResolveModal}
        title={`Resolve Support Ticket: ${resolveTarget?.subject || resolveTarget?.id}`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Provide resolution notes and close the customer inquiry ticket.
          </p>
          <FormField label="Resolution Summary" required>
            <Input
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="e.g. Cleared stuck background job and verified outbox processing."
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={onCloseResolveModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleResolveSubmit}
              disabled={resolving || !resolutionText.trim()}
            >
              {resolving ? "Resolving..." : "Confirm Resolution"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* REQUEST DIAGNOSTIC CONSENT MODAL */}
      <Modal
        open={consentModalOpen}
        onClose={onCloseConsentModal}
        title="Request Delegated Diagnostic Access"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <div className={styles.formGroup}>
            <label htmlFor={consentTenantIdId} className={styles.formLabel}>Target Tenant</label>
            <select
              id={consentTenantIdId}
              aria-label="Select target tenant"
              className={styles.formSelect}
              value={consentTenantId}
              onChange={(e) => setConsentTenantId(e.target.value)}
            >
              <option value="tenant-acme">Acme Global Corp</option>
              <option value="tenant-globex">Globex Industries</option>
              <option value="tenant-soylent">Soylent Tech</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor={consentScopeId} className={styles.formLabel}>Diagnostic Scope</label>
            <select
              id={consentScopeId}
              aria-label="Select diagnostic scope"
              className={styles.formSelect}
              value={consentScope}
              onChange={(e) => setConsentScope(e.target.value as DiagnosticScope)}
            >
              <option value="SESSION_REPLAY_VIEW">Session Replay View (Client Telemetry)</option>
              <option value="EPHEMERAL_LOG_STREAM">Ephemeral Log Stream (Decrypted traces)</option>
              <option value="READ_ONLY_DATABASE_QUERY">Read-Only Database Query (Restricted views)</option>
              <option value="CONFIGURATION_STATE_INSPECT">Configuration State Inspection</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Audit Reason & Justification</label>
            <textarea
              className={styles.replyTextarea}
              value={consentReason}
              onChange={(e) => setConsentReason(e.target.value)}
              placeholder="e.g. Inspect client crash dump during payroll cycle export..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={onCloseConsentModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isSubmittingConsent || !consentReason.trim()}
              onClick={handleConsentSubmit}
            >
              {isSubmittingConsent ? "Submitting..." : "Send Consent Request"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
