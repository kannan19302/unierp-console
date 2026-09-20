"use client";

import { useState } from "react";
import { Badge, Button, Spinner } from "@kannan19302/ui";
import styles from "../entitlement-authority.module.css";
import type { TenantGrantRow } from "@/lib/entitlement-schema";
import { MODULE_COLUMNS } from "@/lib/fixtures/entitlements";

interface ModuleGrantMatrixProps {
  matrix: TenantGrantRow[];
  loading: boolean;
  onToggleModule: (tenantId: string, moduleCode: string, currentStatus: boolean) => Promise<void>;
  onBulkToggle: (moduleCode: string, enabled: boolean) => Promise<void>;
}

export function ModuleGrantMatrix({
  matrix,
  loading,
  onToggleModule,
  onBulkToggle,
}: ModuleGrantMatrixProps) {
  const [bulkModule, setBulkModule] = useState("ai-copilot");
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  const handleBulk = async (enabled: boolean) => {
    setIsBulkSubmitting(true);
    try {
      await onBulkToggle(bulkModule, enabled);
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
            Interactive Module Grant Matrix
          </h3>
          <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Provision or revoke enterprise capability flags across tenant organizations with real-time propagation.
          </p>
        </div>

        {/* Bulk Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <select
            value={bulkModule}
            onChange={(e) => setBulkModule(e.target.value)}
            style={{
              padding: "var(--space-2)",
              borderRadius: "var(--radius-md)",
              border: "0.0625rem solid var(--color-border)",
              fontSize: "var(--text-sm)",
            }}
            aria-label="Bulk capability selection"
          >
            {MODULE_COLUMNS.map((col) => (
              <option key={col.code} value={col.code}>
                {col.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            disabled={isBulkSubmitting}
            onClick={() => handleBulk(true)}
          >
            Bulk Enable
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isBulkSubmitting}
            onClick={() => handleBulk(false)}
          >
            Bulk Revoke
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
          <Spinner size="md" />
        </div>
      ) : (
        <div className={styles.matrixTableWrapper}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                <th className={styles.matrixTh}>Tenant Organization</th>
                <th className={styles.matrixTh}>Plan Tier</th>
                {MODULE_COLUMNS.map((col) => (
                  <th key={col.code} className={styles.matrixTh}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((tenant) => (
                <tr key={tenant.tenantId}>
                  <td className={styles.matrixTd}>
                    <div style={{ fontWeight: 600 }}>{tenant.tenantName}</div>
                    <div className={styles.monoBadge}>{tenant.tenantId}</div>
                  </td>
                  <td className={styles.matrixTd}>
                    <Badge variant="default">{tenant.planTier}</Badge>
                  </td>
                  {MODULE_COLUMNS.map((col) => {
                    const isEnabled = tenant.modules?.[col.code]?.enabled ?? false;
                    return (
                      <td key={col.code} className={styles.matrixTd}>
                        <button
                          type="button"
                          className={`${styles.matrixToggle} ${isEnabled ? styles.matrixToggleActive : ""}`}
                          onClick={() => onToggleModule(tenant.tenantId, col.code, isEnabled)}
                          aria-label={`Toggle ${col.label} for ${tenant.tenantName}`}
                        >
                          {isEnabled ? "ENABLED" : "DISABLED"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
