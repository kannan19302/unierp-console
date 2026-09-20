"use client";

import { Badge } from "@kannan19302/ui";
import styles from "../ai.module.css";
import type { AiTelemetry } from "@/lib/ai-schema";

interface CostTelemetryProps {
  telemetry: AiTelemetry;
}

export function CostTelemetry({ telemetry }: CostTelemetryProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
            Token Consumption & Cost Allocation (EC-21.3)
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Aggregated multi-provider spend, rate limits, and per-model / per-tenant cost attribution.
          </p>
        </div>
      </div>

      {/* Daily Token Rate Budget Progress Card */}
      <div className={styles.budgetCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
              Daily Token Rate Budget Cap
            </span>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              {telemetry.tokenRateBudget.consumedToday.toLocaleString()} / {telemetry.tokenRateBudget.dailyCap.toLocaleString()} tokens consumed today
            </div>
          </div>
          <Badge variant={telemetry.tokenRateBudget.pctUsed > 80 ? "danger" : "info"}>
            {telemetry.tokenRateBudget.pctUsed}% Quota Used
          </Badge>
        </div>
        <div className={styles.budgetBar}>
          <div
            className={styles.budgetFill}
            style={{ width: `${Math.min(telemetry.tokenRateBudget.pctUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* Cost By Model Grid */}
      <div>
        <h4 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: 600 }}>
          Cost Allocation by Foundation Model
        </h4>
        <div className={styles.grid}>
          {telemetry.costByModel.map((item) => (
            <div key={item.modelId} className={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{item.modelId}</span>
                <span className={styles.monoBadge}>{item.provider}</span>
              </div>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-primary)" }}>
                ${item.spendUsd.toFixed(2)}
              </div>
              <div className={styles.metricGrid}>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Tokens Billed</span>
                  <span className={styles.metricValue}>{(item.tokens / 1000000).toFixed(2)}M</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Queries</span>
                  <span className={styles.metricValue}>{item.queries.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost By Tenant Table */}
      <div>
        <h4 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: 600 }}>
          Tenant Spend Attribution (30-Day Window)
        </h4>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Tenant Name</th>
                <th className={styles.th}>Tenant UUID</th>
                <th className={styles.th}>Queries</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Spend (USD)</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.costByTenant.map((tenant) => (
                <tr key={tenant.tenantId} className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 600 }}>
                    {tenant.tenantName}
                  </td>
                  <td className={styles.td}>
                    <span className={styles.monoBadge}>{tenant.tenantId}</span>
                  </td>
                  <td className={styles.td}>{tenant.queries.toLocaleString()}</td>
                  <td className={styles.td} style={{ textAlign: "right", fontWeight: 600, color: "var(--color-primary)" }}>
                    ${tenant.spendUsd.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
