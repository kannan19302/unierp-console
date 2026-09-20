"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";
import { FormField } from "./FormField";
import { validateForm, type FieldDef } from "@/lib/form-validation";
export type { FieldDef };
export type FormFieldDef = FieldDef;
import type { z } from "zod";
import styles from "./CrudDrawer.module.css";

export interface CrudDrawerProps {
  open?: boolean;
  isOpen?: boolean;
  title: string;
  description?: string;
  mode?: "create" | "edit" | "view";
  schema?: z.ZodType<any>;
  fields?: FieldDef[];
  initialValues?: Record<string, any>;
  initialData?: Record<string, any>;
  onSubmit?: (values: Record<string, any>) => Promise<void> | void;
  onClose: () => void;
  submitLabel?: string;
  children?: React.ReactNode;
}

export function CrudDrawer({
  open,
  isOpen,
  title,
  description,
  mode = "create",
  schema,
  fields = [],
  initialValues,
  initialData,
  onSubmit,
  onClose,
  submitLabel,
  children,
}: CrudDrawerProps) {
  const actualOpen = open ?? isOpen ?? false;
  const effectiveInitial = initialValues ?? initialData ?? {};
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const prevOpenRef = useRef(false);

  // Initialize form data only when drawer opens
  useEffect(() => {
    if (actualOpen && !prevOpenRef.current) {
      const initial: Record<string, any> = {};
      (fields || []).forEach((field) => {
        initial[field.name] =
          effectiveInitial?.[field.name] ??
          field.defaultValue ??
          (field.type === "checkbox" ? false : "");
      });
      setFormData(initial);
      setErrors({});
      setIsSubmitting(false);

      // Save previously focused element
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    } else if (!actualOpen && prevOpenRef.current && previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus();
    }
    prevOpenRef.current = actualOpen;
  }, [actualOpen, fields, initialValues]);

  // Escape key and focus trap handler
  useEffect(() => {
    if (!actualOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!isSubmitting) {
          onClose();
        }
        return;
      }

      // Focus trap
      if (e.key === "Tab" && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Initial focus into drawer
    const timer = setTimeout(() => {
      if (drawerRef.current) {
        const firstInput = drawerRef.current.querySelector<HTMLElement>(
          "input, select, textarea, button:not([aria-label='Close drawer'])"
        );
        firstInput?.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [actualOpen, isSubmitting, onClose]);

  const handleChange = useCallback((fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !onSubmit) return;

    // Validation
    if (schema) {
      const validation = validateForm(schema, formData);
      if (!validation.valid) {
        setErrors(validation.errors);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        _root: err?.message || "An unexpected error occurred during submission.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultSubmitLabel = mode === "create" ? "Create" : "Save Changes";

  return (
    <>
      <div
        className={`${styles.backdrop} ${actualOpen ? styles.open : ""}`}
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        className={`${styles.drawer} ${actualOpen ? styles.open : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crud-drawer-title"
      >
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 id="crud-drawer-title" className={styles.title}>
              {title}
            </h2>
            <span className={`${styles.badge} ${styles[mode]}`}>{mode}</span>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {children ? (
          <div className={styles.body}>{children}</div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className={styles.body}>
            {errors._root && (
              <div className={styles.rootError} role="alert">
                {errors._root}
              </div>
            )}

            {(fields || []).map((field) => (
              <FormField
                key={field.name}
                label={field.label}
                type={field.type || "text"}
                name={field.name}
                value={formData[field.name]}
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  const val = field.type === "checkbox" ? target.checked : target.value;
                  handleChange(field.name, val);
                }}
                options={field.options}
                placeholder={field.placeholder}
                required={field.required}
                disabled={isSubmitting || field.readOnly}
                error={errors[field.name]}
                helpText={field.helpText}
              />
            ))}

            <div className={styles.footer}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className={styles.spinner} aria-hidden="true" />
                    <span>Saving...</span>
                  </>
                ) : (
                  submitLabel || defaultSubmitLabel
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
