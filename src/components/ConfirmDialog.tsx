"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, AlertOctagon } from "lucide-react";
import styles from "./ConfirmDialog.module.css";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  entityName?: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  requireTyping?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  entityName,
  confirmLabel = "Confirm",
  variant = "danger",
  requireTyping = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTypedValue("");
      setIsLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  const isConfirmDisabled =
    isLoading || (requireTyping && entityName ? typedValue.trim() !== entityName.trim() : false);

  const handleConfirm = async () => {
    if (isConfirmDisabled) return;
    setIsLoading(true);
    try {
      await onConfirm();
      onCancel();
    } finally {
      setIsLoading(false);
    }
  };

  const Icon = variant === "danger" ? AlertOctagon : AlertTriangle;

  return (
    <div
      className={`${styles.backdrop} ${open ? styles.open : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div className={styles.dialog}>
        <div className={styles.header}>
          <div className={`${styles.iconWrapper} ${styles[variant]}`}>
            <Icon size={20} />
          </div>
          <div className={styles.headerContent}>
            <h3 id="confirm-dialog-title" className={styles.title}>
              {title}
            </h3>
            <p id="confirm-dialog-desc" className={styles.message}>
              {message}
            </p>
          </div>
        </div>

        {requireTyping && entityName && (
          <div className={styles.typingSection}>
            <div className={styles.typingInstruction}>
              Please type <strong>{entityName}</strong> to confirm:
            </div>
            <input
              type="text"
              className={styles.input}
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={entityName}
              disabled={isLoading}
              autoFocus
            />
          </div>
        )}

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.confirmButton} ${styles[variant]}`}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                <span>Processing...</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
