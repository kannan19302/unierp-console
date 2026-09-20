"use client";

import React from "react";
import styles from "./EmptyStateIllustration.module.css";

export type IllustrationType = "no-data" | "no-search-results" | "no-incidents" | "first-time";

export interface EmptyStateIllustrationProps {
  type?: IllustrationType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  children?: React.ReactNode;
  className?: string;
}

function NoDataIllustration() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" aria-hidden="true">
      <rect x="20" y="24" width="120" height="80" rx="8" fill="var(--surface-2-bg, #f3f4f6)" stroke="var(--surface-2-border, #e5e7eb)" strokeWidth="2" />
      <rect x="20" y="24" width="120" height="24" rx="8" fill="var(--surface-3-bg, #e5e7eb)" />
      <circle cx="36" cy="36" r="4" fill="var(--color-neutral-400, #9ca3af)" />
      <circle cx="48" cy="36" r="4" fill="var(--color-neutral-400, #9ca3af)" />
      <circle cx="60" cy="36" r="4" fill="var(--color-neutral-400, #9ca3af)" />
      <rect x="36" y="60" width="88" height="6" rx="3" fill="var(--surface-3-bg, #e5e7eb)" />
      <rect x="36" y="74" width="60" height="6" rx="3" fill="var(--surface-3-bg, #e5e7eb)" />
      <rect x="36" y="88" width="76" height="6" rx="3" fill="var(--surface-3-bg, #e5e7eb)" />
      <circle cx="80" cy="48" r="16" fill="var(--color-primary-subtle, #eff6ff)" stroke="var(--color-primary, #2563eb)" strokeWidth="2" strokeDasharray="3 3" />
      <path d="M80 43V53M75 48H85" stroke="var(--color-primary, #2563eb)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NoSearchResultsIllustration() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" aria-hidden="true">
      <rect x="28" y="20" width="104" height="84" rx="8" fill="var(--surface-2-bg, #f3f4f6)" stroke="var(--surface-2-border, #e5e7eb)" strokeWidth="2" />
      <rect x="42" y="34" width="76" height="6" rx="3" fill="var(--surface-3-bg, #e5e7eb)" />
      <rect x="42" y="46" width="56" height="6" rx="3" fill="var(--surface-3-bg, #e5e7eb)" />
      <circle cx="92" cy="72" r="22" fill="var(--surface-1-bg, #ffffff)" stroke="var(--color-primary, #2563eb)" strokeWidth="3" />
      <line x1="108" y1="88" x2="126" y2="106" stroke="var(--color-primary, #2563eb)" strokeWidth="4" strokeLinecap="round" />
      <path d="M85 72H99" stroke="var(--color-neutral-400, #9ca3af)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="92" cy="62" r="2" fill="var(--color-neutral-400, #9ca3af)" />
    </svg>
  );
}

function NoIncidentsIllustration() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" aria-hidden="true">
      <circle cx="80" cy="60" r="44" fill="var(--color-success-subtle, #ecfdf5)" stroke="var(--color-success, #10b981)" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="80" cy="60" r="32" fill="var(--surface-1-bg, #ffffff)" stroke="var(--color-success, #10b981)" strokeWidth="2" />
      <path d="M80 40C80 40 92 44 92 56C92 68 80 76 80 76C80 76 68 68 68 56C68 44 80 40 80 40Z" fill="var(--color-success-subtle, #ecfdf5)" stroke="var(--color-success, #10b981)" strokeWidth="2" />
      <path d="M74 57L78 61L86 53" stroke="var(--color-success, #10b981)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FirstTimeIllustration() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" aria-hidden="true">
      <circle cx="80" cy="60" r="46" fill="var(--color-primary-subtle, #eff6ff)" />
      <circle cx="80" cy="60" r="36" fill="var(--surface-1-bg, #ffffff)" stroke="var(--color-primary, #2563eb)" strokeWidth="2" />
      <path d="M80 38L87 50H73L80 38Z" fill="var(--color-primary, #2563eb)" />
      <rect x="75" y="50" width="10" height="22" rx="2" fill="var(--color-primary, #2563eb)" />
      <path d="M72 66L66 74H75L72 66Z" fill="var(--color-primary-dark, #1d4ed8)" />
      <path d="M88 66L94 74H85L88 66Z" fill="var(--color-primary-dark, #1d4ed8)" />
      <circle cx="80" cy="58" r="3" fill="var(--surface-1-bg, #ffffff)" />
      <path d="M78 74L80 79L82 74" stroke="var(--color-warning, #f59e0b)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="48" cy="40" r="2" fill="var(--color-warning, #f59e0b)" />
      <circle cx="112" cy="44" r="3" fill="var(--color-primary, #2563eb)" />
      <circle cx="118" cy="78" r="2" fill="var(--color-success, #10b981)" />
    </svg>
  );
}

const ILLUSTRATIONS: Record<IllustrationType, React.ComponentType> = {
  "no-data": NoDataIllustration,
  "no-search-results": NoSearchResultsIllustration,
  "no-incidents": NoIncidentsIllustration,
  "first-time": FirstTimeIllustration,
};

export function EmptyStateIllustration({
  type = "no-data",
  title,
  description,
  action,
  children,
  className,
}: EmptyStateIllustrationProps) {
  const Illustration = ILLUSTRATIONS[type] || NoDataIllustration;

  return (
    <div className={`${styles.container} ${className ?? ""}`} role="status" aria-label={title}>
      <div className={styles.illustrationWrapper}>
        <Illustration />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <button type="button" className={styles.actionButton} onClick={action.onClick}>
          {action.icon}
          {action.label}
        </button>
      )}
      {children}
    </div>
  );
}

export default EmptyStateIllustration;
