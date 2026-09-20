"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@kannan19302/ui";
import styles from "../analytics.module.css";
import type { AnomalyAlert } from "@/lib/analytics-schema";
import { METRIC_CATALOG_ITEMS } from "@/lib/fixtures/analytics";

interface AnalyticsMetricsTabProps {
  activeTab: "overview" | "metrics";
  anomalies: AnomalyAlert[];
}

export default function AnalyticsMetricsTab({
  activeTab,
  anomalies,
}: AnalyticsMetricsTabProps) {
  if (activeTab === "overview") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div className={styles.actionHeader}>
          <div>
            <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
              Real-Time Platform Anomaly Radar
            </h3>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              Continuous machine-learning deviation detection on throughput, token consumption, and latency.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {anomalies.map((alert) => (
            <div key={alert.id} className={styles.alertCard}>
              <AlertTriangle
                size={22}
                color={alert.severity === "CRITICAL" ? "var(--color-danger)" : "var(--color-warning)"}
                style={{ flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                    {alert.metric} Anomaly Detected
                  </span>
                  <Badge variant={alert.severity === "CRITICAL" ? "danger" : "warning"}>
                    {alert.severity}
                  </Badge>
                </div>
                <p style={{ margin: "var(--space-1) 0", fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                  {alert.summary}
                </p>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  Observed: {alert.currentValue.toLocaleString()} vs Threshold: {alert.expectedThreshold.toLocaleString()} • Detected {new Date(alert.detectedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "metrics") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
          Platform Metric Definitions Catalog
        </h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Metric Key</th>
                <th className={styles.th}>Description</th>
                <th className={styles.th}>Unit</th>
                <th className={styles.th}>Category</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_CATALOG_ITEMS.map((m) => (
                <tr key={m.key} className={styles.tr}>
                  <td className={styles.td}><span className={styles.monoBadge}>{m.key}</span></td>
                  <td className={styles.td}>{m.desc}</td>
                  <td className={styles.td}>{m.unit}</td>
                  <td className={styles.td}><Badge variant="default">{m.cat}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
