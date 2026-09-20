"use client";
import React, { useState } from "react";
import { Button, Modal, FormField, Input, type ButtonProps } from "@kannan19302/ui";

export interface BreakGlassActionProps {
  buttonLabel: React.ReactNode;
  modalTitle?: string;
  modalDescription?: React.ReactNode;
  actionLabel?: string;
  variant?: ButtonProps["variant"];
  disabled?: boolean;
  minimumJustificationLength?: number;
  onConfirm: (justification: string) => Promise<void> | void;
}

/**
 * C04: Break Glass UI for destructive actions.
 * Prompts the user for a justification (e.g. JIRA ticket) before allowing the action.
 * This ensures compliance and provides an audit trail for destructive operations.
 */
export function BreakGlassAction({
  buttonLabel,
  modalTitle = "Action requires justification",
  modalDescription = "This is a privileged or destructive action. Please provide a justification or ticket number for the audit log.",
  actionLabel = "Confirm Action",
  variant = "danger",
  disabled,
  minimumJustificationLength = 10,
  onConfirm
}: BreakGlassActionProps) {
  const [open, setOpen] = useState(false);
  const [justification, setJustification] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (justification.trim().length < minimumJustificationLength) {
      setError(`Justification must be at least ${minimumJustificationLength} characters.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await onConfirm(justification);
      setOpen(false);
      setJustification("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
    setJustification("");
    setError(null);
  };

  return (
    <>
      <Button variant={variant} disabled={disabled} onClick={() => setOpen(true)}>
        {buttonLabel}
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        title={modalTitle}
        description={modalDescription}
        footer={
          <div style={{ display: "flex", gap: "var(--space-2)", width: "100%", justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant={variant} onClick={handleConfirm} disabled={loading || justification.trim().length < minimumJustificationLength}>
              {loading ? "Processing..." : actionLabel}
            </Button>
          </div>
        }
      >
        <div style={{ marginTop: "var(--space-4)" }}>
          <FormField label="Audit Justification" required error={error}>
            <Input
              value={justification}
              onChange={(e) => {
                setJustification(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. TICK-1234, Requested by user"
              minLength={minimumJustificationLength}
              autoFocus
              disabled={loading}
            />
          </FormField>
        </div>
      </Modal>
    </>
  );
}
