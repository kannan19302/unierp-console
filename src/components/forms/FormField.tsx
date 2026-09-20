"use client";

import React, { useId, ReactNode } from "react";
import styles from "./FormField.module.css";

export type FormFieldType =
  | "text"
  | "email"
  | "number"
  | "password"
  | "select"
  | "textarea"
  | "checkbox"
  | "date";

export interface OptionItem {
  label: string;
  value: string | number;
}

export interface FormFieldProps {
  label?: string;
  type?: FormFieldType;
  name?: string;
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  options?: OptionItem[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  id?: string;
  className?: string;
  children?: ReactNode;
}

export function FormField({
  label,
  type = "text",
  name,
  value,
  onChange,
  options = [],
  placeholder,
  required,
  disabled,
  error,
  helpText,
  id: customId,
  className = "",
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const id = customId || (name ? `field-${name}` : generatedId);
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  const ariaDescribedBy = [error ? errorId : null, helpText ? helpId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  // Custom child renderer
  if (children) {
    return (
      <div className={`${styles.fieldContainer} ${className}`}>
        {label && (
          <div className={styles.labelRow}>
            <label htmlFor={id} className={styles.label}>
              {label}
              {required && <span className={styles.requiredAsterisk} aria-hidden="true">*</span>}
            </label>
          </div>
        )}
        {children}
        {error && (
          <div id={errorId} className={styles.errorText} role="alert">
            {error}
          </div>
        )}
        {helpText && !error && (
          <div id={helpId} className={styles.helpText}>
            {helpText}
          </div>
        )}
      </div>
    );
  }

  // Checkbox input
  if (type === "checkbox") {
    return (
      <div className={`${styles.fieldContainer} ${className}`}>
        <label htmlFor={id} className={styles.checkboxContainer}>
          <input
            id={id}
            name={name}
            type="checkbox"
            checked={Boolean(value)}
            onChange={onChange}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={ariaDescribedBy}
            className={styles.checkbox}
          />
          <span className={styles.checkboxLabel}>
            {label}
            {required && <span className={styles.requiredAsterisk} aria-hidden="true">*</span>}
          </span>
        </label>
        {error && (
          <div id={errorId} className={styles.errorText} role="alert">
            {error}
          </div>
        )}
        {helpText && !error && (
          <div id={helpId} className={styles.helpText}>
            {helpText}
          </div>
        )}
      </div>
    );
  }

  // Textarea input
  if (type === "textarea") {
    return (
      <div className={`${styles.fieldContainer} ${className}`}>
        {label && (
          <div className={styles.labelRow}>
            <label htmlFor={id} className={styles.label}>
              {label}
              {required && <span className={styles.requiredAsterisk} aria-hidden="true">*</span>}
            </label>
          </div>
        )}
        <textarea
          id={id}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={ariaDescribedBy}
          className={`${styles.textarea} ${error ? styles.hasError : ""}`}
        />
        {error && (
          <div id={errorId} className={styles.errorText} role="alert">
            {error}
          </div>
        )}
        {helpText && !error && (
          <div id={helpId} className={styles.helpText}>
            {helpText}
          </div>
        )}
      </div>
    );
  }

  // Select input
  if (type === "select") {
    return (
      <div className={`${styles.fieldContainer} ${className}`}>
        {label && (
          <div className={styles.labelRow}>
            <label htmlFor={id} className={styles.label}>
              {label}
              {required && <span className={styles.requiredAsterisk} aria-hidden="true">*</span>}
            </label>
          </div>
        )}
        <select
          id={id}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={ariaDescribedBy}
          className={`${styles.select} ${error ? styles.hasError : ""}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <div id={errorId} className={styles.errorText} role="alert">
            {error}
          </div>
        )}
        {helpText && !error && (
          <div id={helpId} className={styles.helpText}>
            {helpText}
          </div>
        )}
      </div>
    );
  }

  // Standard inputs (text, email, number, password, date)
  return (
    <div className={`${styles.fieldContainer} ${className}`}>
      {label && (
        <div className={styles.labelRow}>
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles.requiredAsterisk} aria-hidden="true">*</span>}
          </label>
        </div>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={ariaDescribedBy}
        className={`${styles.input} ${error ? styles.hasError : ""}`}
      />
      {error && (
        <div id={errorId} className={styles.errorText} role="alert">
          {error}
        </div>
      )}
      {helpText && !error && (
        <div id={helpId} className={styles.helpText}>
          {helpText}
        </div>
      )}
    </div>
  );
}
