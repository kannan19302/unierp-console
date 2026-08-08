"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  FileText,
  Search,
  Download,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  Sliders,
  UserCheck,
  Eye,
  Trash2,
} from "lucide-react";
import { Button, Card, Badge, StatusBadge, useToast } from "@kannan19302/ui";

export default function SecurityPage() {
  const { success, warning, info } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [mfaMandatory, setMfaMandatory] = useState(true);

  const handleRotateKey = (keyName: string) => {
    success("Master KMS Key Rotated", `Rotated key "${keyName}". New version active across all clusters.`);
  };

  const handleRevokeSessions = () => {
    warning("Global Session Revocation Executed", "Terminated all non-whitelisted admin & tenant sessions.");
  };

  const handleExportSoc2Report = () => {
    info("SOC2 Compliance Package Exported", "Generated cryptographically signed PDF audit report.");
  };

  const auditLogs = [
    { id: "log-101", time: "10:48:02 AM", actor: "admin@kannan19302.dev", event: "PROVIDER_MFA_ENFORCE", severity: "HIGH", ip: "192.168.1.45", target: "Platform Staff" },
    { id: "log-102", time: "10:30:14 AM", actor: "support@kannan19302.dev", event: "TENANT_IMPERSONATE", severity: "MEDIUM", ip: "192.168.1.88", target: "acme-corp" },
    { id: "log-103", time: "09:55:40 AM", actor: "system-kms", event: "KMS_MASTER_KEY_ROTATE", severity: "LOW", ip: "10.0.0.1", target: "Vault Engine" },
    { id: "log-104", time: "08:12:19 AM", actor: "unknown-ip-203.0.113.5", event: "BRUTE_FORCE_FLAG", severity: "CRITICAL", ip: "203.0.113.5", target: "Login Gateway" },
  ];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = log.actor.toLowerCase().includes(searchQuery.toLowerCase()) || log.event.toLowerCase().includes(searchQuery.toLowerCase()) || log.ip.includes(searchQuery);
    const matchesSeverity = severityFilter === "ALL" || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px 0", color: "var(--color-text)" }}>
            Security, Audit & Compliance Control Center
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 14 }}>
            Immutable provider audit logs, threat monitoring, KMS key rotation, SOC2 evidence & session revocation.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" onClick={handleExportSoc2Report} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <FileText size={15} /> Export SOC2 / GDPR Audit Report
          </Button>
          <Button variant="primary" onClick={handleRevokeSessions} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "#ef4444" }}>
            <Lock size={15} /> Emergency Global Session Revoke
          </Button>
        </div>
      </div>

      {/* Security Posture Overview (3 Cards) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)", fontSize: 13 }}>
            <span>Security Posture Rating</span>
            <ShieldCheck size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, color: "#34d399" }}>A+ Grade</div>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>0 Critical Threat Vulnerabilities</span>
        </div>

        <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)", fontSize: 13 }}>
            <span>Hardware MFA Enforcement</span>
            <Key size={20} color="#60a5fa" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, color: "var(--color-text)" }}>100% Mandatory</div>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>TOTP / Passkey Required</span>
        </div>

        <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)", fontSize: 13 }}>
            <span>IP Access Control Whitelist</span>
            <Lock size={20} color="#c084fc" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, color: "var(--color-text)" }}>4 CIDR Ranges</div>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Restricted Provider Console CIDRs</span>
        </div>
      </div>

      {/* KMS Keys & MFA Policy Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* KMS Key Rotation Center */}
        <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 14px 0", color: "var(--color-text)" }}>Master KMS Key Rotation Center</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { name: "kms-master-tenant-db-key", version: "v4", status: "ACTIVE" },
              { name: "kms-jwt-session-signing-key", version: "v2", status: "ACTIVE" },
              { name: "kms-s3-storage-envelope-key", version: "v5", status: "ACTIVE" },
            ].map((k) => (
              <div key={k.name} style={{ padding: 12, borderRadius: 8, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{k.name}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Version: {k.version}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => handleRotateKey(k.name)}>
                  Rotate Master Key
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Security Policy Controls */}
        <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 14px 0", color: "var(--color-text)" }}>Control Plane Policy Enforcers</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, backgroundColor: "rgba(15, 23, 42, 0.6)", borderRadius: 8, color: "var(--color-text)", fontSize: 13 }}>
              <div>
                <strong style={{ display: "block" }}>Mandatory TOTP / Hardware MFA</strong>
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Require 2FA for all provider staff accounts</span>
              </div>
              <input type="checkbox" checked={mfaMandatory} onChange={(e) => setMfaMandatory(e.target.checked)} style={{ accentColor: "#3b82f6" }} />
            </label>

            <div style={{ padding: 12, backgroundColor: "rgba(15, 23, 42, 0.6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
              <div>
                <strong style={{ display: "block", color: "var(--color-text)" }}>Session Expiration Policy</strong>
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Force re-authentication after 8 hours of inactivity</span>
              </div>
              <Badge variant="info">8 Hours</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Centralized Immutable Audit Log Query Engine */}
      <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--color-text)" }}>Centralized Immutable Provider Audit Log</h3>
          <Badge variant="success">Audit Trail Cryptographically Signed</Badge>
        </div>

        {/* Audit Search Toolbar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: 10, top: 10, color: "#64748b" }} />
            <input
              type="text"
              placeholder="Filter by actor email, event name, or IP address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                color: "var(--color-text)",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ padding: "8px 12px", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, color: "var(--color-text)", fontSize: 13 }}
          >
            <option value="ALL">All Severities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        {/* Audit Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>Time</th>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>Actor</th>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>Event Action</th>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>Target</th>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>Severity</th>
              <th style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "10px 14px", color: "#64748b" }}>{log.time}</td>
                <td style={{ padding: "10px 14px", color: "#60a5fa", fontWeight: 600 }}>{log.actor}</td>
                <td style={{ padding: "10px 14px", color: "var(--color-text)", fontWeight: 600 }}>{log.event}</td>
                <td style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>{log.target}</td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge variant={log.severity === "CRITICAL" ? "danger" : log.severity === "HIGH" ? "warning" : "info"}>
                    {log.severity}
                  </Badge>
                </td>
                <td style={{ padding: "10px 14px", color: "var(--color-text-secondary)", fontFamily: "monospace" }}>{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
