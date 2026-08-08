"use client";

import React, { useState } from "react";
import {
  Activity,
  Zap,
  Database,
  Terminal,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  AlertTriangle,
} from "lucide-react";
import { Button, Card, Badge, StatusBadge, useToast } from "@kannan19302/ui";

export default function TelemetryPage() {
  const { info } = useToast();
  const [tracingId, setTracingId] = useState("");

  const handleLookupTrace = () => {
    if (!tracingId.trim()) return;
    info("Trace Lookup Complete", `Found 14 microservice spans for correlation ID ${tracingId}.`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px 0", color: "var(--color-text)" }}>
            System Telemetry & Operational Metrics
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 14 }}>
            P99/P95 latency heatmaps, distributed trace lookup, database slow query analyzer & stack trace inspector.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" onClick={() => info("Metrics Flushed", "Prometheus exporter cache reset.")}>
            <RefreshCw size={15} style={{ marginRight: 6 }} /> Reset Telemetry Exporter
          </Button>
        </div>
      </div>

      {/* Latency & Throughput Stat Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>API Gateway Throughput</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-text)", marginTop: 4 }}>14,200 req/sec</div>
          <span style={{ fontSize: 12, color: "#34d399" }}>Peak: 18,500 req/sec</span>
        </div>

        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>API P99 Latency</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#34d399", marginTop: 4 }}>38 ms</div>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Target: &lt; 100 ms</span>
        </div>

        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Database P95 Query Time</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#60a5fa", marginTop: 4 }}>8 ms</div>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Postgres Pool Active</span>
        </div>

        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>HTTP 5xx Error Rate</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#34d399", marginTop: 4 }}>0.002%</div>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Optimal Reliability</span>
        </div>
      </div>

      {/* Distributed Trace Lookup Engine */}
      <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px 0", color: "var(--color-text)" }}>Distributed Trace & Correlation ID Explorer</h3>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            type="text"
            placeholder="Enter Correlation ID / Trace ID (e.g. trace-req-9042a-88...)"
            value={tracingId}
            onChange={(e) => setTracingId(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              color: "var(--color-text)",
              fontSize: 13,
              outline: "none",
            }}
          />
          <Button variant="primary" onClick={handleLookupTrace}>
            Inspect Distributed Spans
          </Button>
        </div>
      </div>

      {/* Database Slow Query Analyzer Table */}
      <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0", color: "var(--color-text)" }}>Database Slow Query Analyzer & Index Recommender</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>Avg Execution</th>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>Calls / min</th>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>SQL Query Statement</th>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>Suggested Index Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {[
              { time: "420 ms", calls: 140, sql: "SELECT * FROM audit_logs WHERE tenant_id = $1 ORDER BY created_at DESC", index: "CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, created_at DESC)" },
              { time: "180 ms", calls: 42, sql: "SELECT * FROM invoices WHERE status = 'PENDING' AND due_date < NOW()", index: "CREATE INDEX idx_invoices_status_due ON invoices(status, due_date)" },
            ].map((q, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "10px 14px", color: "#f59e0b", fontWeight: 600 }}>{q.time}</td>
                <td style={{ padding: "10px 14px", color: "var(--color-text)" }}>{q.calls}</td>
                <td style={{ padding: "10px 14px", color: "#60a5fa", fontFamily: "monospace", fontSize: 12 }}>{q.sql}</td>
                <td style={{ padding: "10px 14px", color: "#34d399", fontFamily: "monospace", fontSize: 11 }}>{q.index}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
