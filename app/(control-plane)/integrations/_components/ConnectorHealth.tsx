"use client";

import { RefreshCw } from "lucide-react";
import { Badge, Button } from "@kannan19302/ui";
import styles from "../integrations.module.css";
import type { ConnectorHealthItem } from "@/lib/integration-schema";

interface ConnectorHealthProps {
  connectors: ConnectorHealthItem[];
  pingingId: string | null;
  onPingConnector: (connId: string) => Promise<void>;
}

export function ConnectorHealth({
  connectors,
  pingingId,
  onPingConnector,
}: ConnectorHealthProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
            Active Enterprise Connectors & Telemetry
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Continuous real-time health checks, latency, error rates, and sync throughput across data bridges.
          </p>
        </div>
      </div>

      <div className={styles.connectorGrid}>
        {connectors.map((conn) => (
          <div key={conn.id} className={styles.connectorCard}>
            <div className={styles.connectorHeader}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>{conn.name}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  Type: {conn.type} • ID: <code className={styles.monoBadge}>{conn.id}</code>
                </div>
              </div>
              <Badge variant={conn.status === "HEALTHY" ? "success" : conn.status === "DEGRADED" ? "warning" : "danger"}>
                {conn.status}
              </Badge>
            </div>

            <div className={styles.metricGrid}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Roundtrip Latency</span>
                <span className={styles.metricValue}>{conn.latencyMs} ms</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Error Rate (24h)</span>
                <span className={styles.metricValue}>{conn.errorRatePct}%</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Throughput</span>
                <span className={styles.metricValue}>{conn.throughputRowsSec} rows/sec</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Synced (24h)</span>
                <span className={styles.metricValue}>{conn.recordsSynced24h.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "var(--space-2)", borderTop: "0.0625rem solid var(--color-border)" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Checked: {new Date(conn.lastHealthCheckAt).toLocaleTimeString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pingingId === conn.id}
                onClick={() => onPingConnector(conn.id)}
              >
                <RefreshCw size={14} style={{ marginRight: "var(--space-1)" }} className={pingingId === conn.id ? "animate-spin" : ""} />
                Ping Connector
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
