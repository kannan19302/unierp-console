"use client";

import { RotateCcw, ShieldAlert, Sliders } from "lucide-react";
import { Badge, Button } from "@kannan19302/ui";
import styles from "../marketplace.module.css";
import type { ExtensionVersion } from "@/lib/marketplace-schema";

interface VersionManagerProps {
  selectedAppSlug: string;
  onSelectAppSlug: (slug: string) => void;
  versions: ExtensionVersion[];
  onUpdateRollout: (versionStr: string, percentage: number) => Promise<void>;
  onOpenRollback: () => void;
  onOpenRevoke: () => void;
}

export function VersionManager({
  selectedAppSlug,
  onSelectAppSlug,
  versions,
  onUpdateRollout,
  onOpenRollback,
  onOpenRevoke,
}: VersionManagerProps) {
  const currentAppVersions = versions.filter((v) => v.appSlug === selectedAppSlug);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Select Extension:</span>
          <select
            value={selectedAppSlug}
            onChange={(e) => onSelectAppSlug(e.target.value)}
            className={styles.formSelect}
            style={{ width: "auto" }}
          >
            <option value="hubspot-advanced-crm">HubSpot Cloud CRM (hubspot-advanced-crm)</option>
            <option value="stripe-tax-compliance">Stripe Automatic Global Tax (stripe-tax-compliance)</option>
          </select>
        </div>

        <div className={styles.buttonGroup}>
          <Button variant="outline" onClick={onOpenRollback}>
            <RotateCcw size={16} style={{ marginRight: "var(--space-2)" }} />
            Rollback to Previous Version
          </Button>
          <Button variant="danger" onClick={onOpenRevoke}>
            <ShieldAlert size={16} style={{ marginRight: "var(--space-2)" }} />
            Emergency Revoke Extension (G-20)
          </Button>
        </div>
      </div>

      <div className={styles.versionGrid}>
        {currentAppVersions.map((ver) => (
          <div key={ver.id} className={styles.versionCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <span style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>v{ver.version}</span>
                <Badge variant={ver.status === "ACTIVE" ? "success" : ver.status === "ROLLED_BACK" ? "danger" : "default"}>
                  {ver.status}
                </Badge>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  Released: {new Date(ver.releasedAt).toLocaleDateString()}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>Staged Rollout:</span>
                <span className={styles.monoBadge} style={{ fontWeight: 700 }}>
                  {ver.rolloutPercentage}%
                </span>
              </div>
            </div>

            <p style={{ margin: "var(--space-1) 0", fontSize: "var(--text-sm)" }}>
              {ver.releaseNotes}
            </p>

            <div>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                Changelog Diff:
              </span>
              <pre className={styles.changelogBox}>{ver.changelogDiff}</pre>
            </div>

            {ver.status === "ACTIVE" && (
              <div className={styles.rolloutControl}>
                <Sliders size={16} color="var(--color-primary)" />
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, minWidth: "9rem" }}>
                  Adjust Staged Rollout:
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={ver.rolloutPercentage}
                  onChange={(e) => onUpdateRollout(ver.version, Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, minWidth: "3rem", textAlign: "right" }}>
                  {ver.rolloutPercentage}%
                </span>
              </div>
            )}

            {ver.rollbackReason && (
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", background: "var(--color-bg-danger-subtle, rgba(239, 68, 68, 0.08))", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)" }}>
                Rolled back on {new Date(ver.rolledBackAt!).toLocaleDateString()} • Reason: {ver.rollbackReason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
