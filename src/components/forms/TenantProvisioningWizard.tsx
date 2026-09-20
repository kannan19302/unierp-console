"use client";

import React, { useState } from "react";
import { FormWizard, type WizardStep } from "@kannan19302/ui/form-engine";
import styles from "./TenantProvisioningWizard.module.css";

export interface TenantProvisioningData {
  name: string;
  slug: string;
  contactEmail: string;
  tier: "starter" | "standard" | "enterprise";
  region: string;
  dedicatedDatabase: boolean;
}

export interface TenantProvisioningWizardProps {
  onComplete: (data: TenantProvisioningData) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<TenantProvisioningData>;
}

export function TenantProvisioningWizard({
  onComplete,
  onCancel,
  initialData,
}: TenantProvisioningWizardProps) {
  const [formData, setFormData] = useState<TenantProvisioningData>({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    contactEmail: initialData?.contactEmail || "",
    tier: initialData?.tier || "standard",
    region: initialData?.region || "us-east-1",
    dedicatedDatabase: initialData?.dedicatedDatabase ?? false,
  });

  const steps: WizardStep[] = [
    {
      id: "profile",
      title: "Tenant Profile",
      subtitle: "Identity and contact information",
      validate: () => Boolean(formData.name.trim() && formData.slug.trim()),
      component: (
        <div className={styles.stepContent}>
          <div className={styles.fieldGroup}>
            <label htmlFor="wizard-tenant-name" className={styles.fieldLabel}>
              Organization / Tenant Name
            </label>
            <input
              id="wizard-tenant-name"
              type="text"
              className={styles.fieldInput}
              placeholder="e.g. Acme Global Industries"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                  slug: prev.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                }))
              }
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="wizard-tenant-slug" className={styles.fieldLabel}>
              Identifier / URL Slug
            </label>
            <input
              id="wizard-tenant-slug"
              type="text"
              className={styles.fieldInput}
              placeholder="e.g. acme-global"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="wizard-tenant-email" className={styles.fieldLabel}>
              Primary Admin Contact
            </label>
            <input
              id="wizard-tenant-email"
              type="email"
              className={styles.fieldInput}
              placeholder="admin@acme.com"
              value={formData.contactEmail}
              onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
            />
          </div>
        </div>
      ),
    },
    {
      id: "tier",
      title: "Plan & Quotas",
      subtitle: "Select subscription service tier",
      component: (
        <div className={styles.stepContent}>
          <div className={styles.tierGrid}>
            {(["starter", "standard", "enterprise"] as const).map((t) => (
              <div
                key={t}
                className={`${styles.tierCard} ${formData.tier === t ? styles.tierCardSelected : ""}`}
                onClick={() => setFormData((prev) => ({ ...prev, tier: t }))}
                role="button"
                tabIndex={0}
                aria-pressed={formData.tier === t}
              >
                <div className={styles.tierName}>{t.toUpperCase()}</div>
                <div className={styles.tierDesc}>
                  {t === "starter" && "50 users, shared DB, standard SLA"}
                  {t === "standard" && "500 users, high availability, 99.9% SLA"}
                  {t === "enterprise" && "Unlimited users, dedicated VPC, 99.99% SLA"}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "infrastructure",
      title: "Infrastructure",
      subtitle: "Deployment region and persistence isolation",
      component: (
        <div className={styles.stepContent}>
          <div className={styles.fieldGroup}>
            <label htmlFor="wizard-region" className={styles.fieldLabel}>
              Primary Cloud Region
            </label>
            <select
              id="wizard-region"
              className={styles.fieldInput}
              value={formData.region}
              onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))}
            >
              <option value="us-east-1">US East (N. Virginia)</option>
              <option value="eu-west-1">EU West (Ireland)</option>
              <option value="ap-south-1">Asia Pacific (Mumbai)</option>
              <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <input
                type="checkbox"
                checked={formData.dedicatedDatabase}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dedicatedDatabase: e.target.checked }))
                }
              />
              <span className={styles.fieldLabel}>Provision Dedicated PostgreSQL Cluster</span>
            </label>
          </div>
        </div>
      ),
    },
    {
      id: "review",
      title: "Review & Provision",
      subtitle: "Verify configuration before creation",
      component: (
        <div className={styles.stepContent}>
          <div className={styles.reviewSummary}>
            <div className={styles.reviewRow}>
              <span className={styles.reviewLabel}>Tenant Name</span>
              <span className={styles.reviewValue}>{formData.name || "—"}</span>
            </div>
            <div className={styles.reviewRow}>
              <span className={styles.reviewLabel}>Tenant Slug</span>
              <span className={styles.reviewValue}>{formData.slug || "—"}</span>
            </div>
            <div className={styles.reviewRow}>
              <span className={styles.reviewLabel}>Tier</span>
              <span className={styles.reviewValue}>{formData.tier.toUpperCase()}</span>
            </div>
            <div className={styles.reviewRow}>
              <span className={styles.reviewLabel}>Region</span>
              <span className={styles.reviewValue}>{formData.region}</span>
            </div>
            <div className={styles.reviewRow}>
              <span className={styles.reviewLabel}>Database Isolation</span>
              <span className={styles.reviewValue}>
                {formData.dedicatedDatabase ? "Dedicated Cluster" : "Shared Multi-Tenant"}
              </span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.wizardContainer}>
      <FormWizard
        title="Provision Enterprise Tenant"
        subtitle="Step-by-step orchestrator for multi-tenant deployment"
        steps={steps}
        onComplete={() => onComplete(formData)}
        onCancel={onCancel}
        submitLabel="Provision Tenant"
      />
    </div>
  );
}
