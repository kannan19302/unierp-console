"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";
import styles from "./onboarding.module.css";

export interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}

const DEFAULT_STEPS: ChecklistStep[] = [
  {
    id: "org-profile",
    title: "Complete Organization Profile",
    description: "Verify your legal entity credentials, timezone, and operator governance contacts.",
    href: "/settings",
    actionLabel: "Configure Profile",
  },
  {
    id: "first-tenant",
    title: "Provision First Enterprise Tenant",
    description: "Launch an enterprise workspace with isolated PostgreSQL schemas and storage quotas.",
    href: "/tenants/provision",
    actionLabel: "Provision Tenant",
  },
  {
    id: "connect-idp",
    title: "Connect Enterprise Identity Provider",
    description: "Set up OIDC / SAML SSO with mandatory multi-factor authentication for operators.",
    href: "/access/idp",
    actionLabel: "Setup IdP",
  },
  {
    id: "billing-plan",
    title: "Establish Billing & Revenue Engine",
    description: "Configure subscription tiers, consumption meters, and tax nexus settlement rules.",
    href: "/billing/plans",
    actionLabel: "Configure Plans",
  },
  {
    id: "security-team",
    title: "Configure ABAC Security Policies",
    description: "Establish fine-grained ABAC directives, isolation boundaries, and incident runbooks.",
    href: "/security/policies",
    actionLabel: "Define Policies",
  },
];

export function SetupChecklist() {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    "org-profile": true,
  });

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("unierp_setup_checklist_dismissed");
      if (dismissed === "true") {
        setIsDismissed(true);
      }
      const savedSteps = localStorage.getItem("unierp_setup_checklist_steps");
      if (savedSteps) {
        setCompletedSteps(JSON.parse(savedSteps));
      }
    } catch {}
  }, []);

  const toggleStep = (id: string) => {
    setCompletedSteps((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("unierp_setup_checklist_steps", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem("unierp_setup_checklist_dismissed", "true");
    } catch {}
  };

  if (isDismissed) return null;

  const totalSteps = DEFAULT_STEPS.length;
  const completedCount = DEFAULT_STEPS.filter((s) => completedSteps[s.id]).length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  return (
    <section
      className={styles.checklistCard}
      aria-label="Platform Setup Checklist"
      role="region"
    >
      <div className={styles.checklistHeader}>
        <div className={styles.checklistTitleGroup}>
          <h2 className={styles.checklistTitle}>Platform Onboarding Checklist</h2>
          <p className={styles.checklistSubtitle}>
            Complete these critical setup tasks to prepare your UniERP Provider Control Center for production.
          </p>
        </div>
        <button
          type="button"
          className={styles.dismissButton}
          onClick={handleDismiss}
          aria-label="Dismiss setup checklist"
          title="Dismiss checklist"
        >
          <X size={18} />
        </button>
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressLabelRow}>
          <span>
            {completedCount} of {totalSteps} steps completed
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className={styles.progressBarBg} role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <ul className={styles.stepsList} role="list">
        {DEFAULT_STEPS.map((step) => {
          const isDone = !!completedSteps[step.id];
          return (
            <li
              key={step.id}
              className={`${styles.stepItem} ${isDone ? styles.stepCompleted : ""}`}
            >
              <div className={styles.stepLeft}>
                <button
                  type="button"
                  className={`${styles.stepCheckbox} ${isDone ? styles.stepCheckboxChecked : ""}`}
                  onClick={() => toggleStep(step.id)}
                  aria-label={isDone ? `Mark ${step.title} incomplete` : `Mark ${step.title} complete`}
                  aria-pressed={isDone}
                >
                  {isDone && <Check size={12} strokeWidth={3} />}
                </button>
                <div className={styles.stepContent}>
                  <p className={`${styles.stepTitle} ${isDone ? styles.stepTitleDone : ""}`}>
                    {step.title}
                  </p>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              </div>

              <Link
                href={step.href}
                className={styles.stepActionBtn}
                aria-label={`${step.actionLabel} for ${step.title}`}
              >
                <span>{step.actionLabel}</span>
                <ArrowRight size={12} />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default SetupChecklist;
