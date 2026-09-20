"use client";

import { Plus, Users } from "lucide-react";
import { Badge, Button, Spinner } from "@kannan19302/ui";
import styles from "../entitlement-authority.module.css";
import type { LicensePool } from "@/lib/entitlement-schema";

interface LicensePoolManagerProps {
  pools: LicensePool[];
  loading: boolean;
  onOpenCreatePool: () => void;
  onOpenAllocateSeats: (pool: LicensePool) => void;
}

export function LicensePoolManager({
  pools,
  loading,
  onOpenCreatePool,
  onOpenAllocateSeats,
}: LicensePoolManagerProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
            Seat-Based Capability Pools
          </h3>
          <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Track capacity boundaries, allocation percentages, and assign seat quotas to customer tenants.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCreatePool}
        >
          <Plus size={16} style={{ marginRight: "var(--space-1)" }} />
          Create Seat Pool
        </Button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
          <Spinner size="md" />
        </div>
      ) : (
        <div className={styles.poolsGrid}>
          {pools.map((pool) => {
            const util = pool.utilizationPct || 0;
            const fillColor =
              util >= 90
                ? "var(--color-danger, #ef4444)"
                : util >= 75
                ? "var(--color-warning, #f59e0b)"
                : "var(--color-success, #10b981)";

            return (
              <div key={pool.id} className={styles.poolCard}>
                <div className={styles.poolHeader}>
                  <div>
                    <strong style={{ fontSize: "var(--text-base)" }}>{pool.name}</strong>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
                      Module: <span className={styles.monoBadge}>{pool.moduleCode}</span>
                    </div>
                  </div>
                  <Badge variant={pool.tier === "ENTERPRISE" ? "info" : "default"}>
                    {pool.tier}
                  </Badge>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", margin: "var(--space-2) 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                    <span>Capacity Utilization</span>
                    <strong>{util}% ({pool.allocatedSeats} / {pool.totalSeats} seats)</strong>
                  </div>
                  <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={util} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${Math.min(100, util)}%`,
                        backgroundColor: fillColor,
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    <span>Available: {pool.availableSeats}</span>
                    <span>Allocated: {pool.allocatedSeats}</span>
                  </div>
                </div>

                <div style={{ borderTop: "0.0625rem solid var(--color-border)", paddingTop: "var(--space-3)", display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenAllocateSeats(pool)}
                  >
                    <Users size={14} style={{ marginRight: "var(--space-1)" }} />
                    Allocate Seats
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
