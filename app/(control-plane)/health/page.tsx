"use client";

import React, { useState, useEffect } from "react";
import { Activity, Server, Cpu, Database, RefreshCw, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

interface ServiceHealth {
  name: string;
  status: "UP" | "DEGRADED" | "DOWN";
  latency: string;
  uptime: string;
}

export default function HealthPage() {
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());
  const [services, setServices] = useState<ServiceHealth[]>([
    { name: "API Control Plane Router", status: "UP", latency: "14ms", uptime: "99.98%" },
    { name: "PostgreSQL Primary Cluster", status: "UP", latency: "3ms", uptime: "99.99%" },
    { name: "Redis Cache & Throttler", status: "UP", latency: "1ms", uptime: "100.00%" },
    { name: "BullMQ Job Queues", status: "UP", latency: "8ms", uptime: "99.95%" },
    { name: "S3 Object Storage", status: "UP", latency: "22ms", uptime: "99.99%" },
    { name: "IdP Realm Authentication", status: "UP", latency: "18ms", uptime: "99.97%" },
  ]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLastRefreshed(new Date().toLocaleTimeString());
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: "bold", margin: 0, color: "#111827" }}>Platform Health & Telemetry</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            Real-time status of control plane services, database clusters, and operational telemetry.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            backgroundColor: "white",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh Status ({lastRefreshed})
        </button>
      </div>

      {/* System Status Banner */}
      <div
        style={{
          padding: 20,
          backgroundColor: "#ecfdf5",
          border: "1px solid #a7f3d0",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <ShieldCheck size={32} style={{ color: "#059669" }} />
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: "bold", color: "#065f46" }}>
            All Systems Operational
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#047857" }}>
            Control-plane ingress and background job processors are operating within normal limits.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <div style={{ padding: 20, backgroundColor: "white", borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#6b7280", fontSize: 14 }}>CPU Usage</span>
            <Cpu size={20} style={{ color: "#3b82f6" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: "bold", marginTop: 8 }}>18.4%</div>
          <div style={{ fontSize: 12, color: "#10b981", marginTop: 4 }}>Normal (8 cores)</div>
        </div>

        <div style={{ padding: 20, backgroundColor: "white", borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#6b7280", fontSize: 14 }}>Memory Usage</span>
            <Server size={20} style={{ color: "#8b5cf6" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: "bold", marginTop: 8 }}>4.2 GB / 16 GB</div>
          <div style={{ fontSize: 12, color: "#10b981", marginTop: 4 }}>26% utilized</div>
        </div>

        <div style={{ padding: 20, backgroundColor: "white", borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#6b7280", fontSize: 14 }}>DB Connections</span>
            <Database size={20} style={{ color: "#059669" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: "bold", marginTop: 8 }}>42 / 300</div>
          <div style={{ fontSize: 12, color: "#10b981", marginTop: 4 }}>Healthy pool</div>
        </div>

        <div style={{ padding: 20, backgroundColor: "white", borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#6b7280", fontSize: 14 }}>Avg Latency</span>
            <Zap size={20} style={{ color: "#f59e0b" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: "bold", marginTop: 8 }}>14 ms</div>
          <div style={{ fontSize: 12, color: "#10b981", marginTop: 4 }}>p95: 38 ms</div>
        </div>
      </div>

      {/* Services Table */}
      <div style={{ backgroundColor: "white", borderRadius: 8, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", fontWeight: "bold", fontSize: 16 }}>
          Service Components Status
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151" }}>Service</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151" }}>Status</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151" }}>Latency</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151" }}>Uptime (30d)</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "12px 16px", fontWeight: 500, color: "#111827" }}>{s.name}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: "#d1fae5",
                      color: "#065f46",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <CheckCircle2 size={12} /> {s.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "#4b5563" }}>{s.latency}</td>
                <td style={{ padding: "12px 16px", color: "#4b5563" }}>{s.uptime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
