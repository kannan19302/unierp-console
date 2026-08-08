"use client";

import React, { useState } from "react";
import {
  Puzzle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  ShieldCheck,
  Zap,
  Sliders,
  Search,
  ExternalLink,
  Code,
  FileCode,
  Plus,
} from "lucide-react";
import { Button, Card, Badge, StatusBadge, useToast } from "@kannan19302/ui";

interface ExtensionApp {
  id: string;
  name: string;
  version: string;
  developer: string;
  category: string;
  status: "PUBLISHED" | "PENDING_REVIEW" | "REJECTED";
  installs: number;
  revenueShare: string;
  securityRating: string;
}

export default function MarketplacePage() {
  const { success, warning, error, info } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [apps, setApps] = useState<ExtensionApp[]>([
    { id: "ext-1", name: "Stripe Billing & Invoicing Pro", version: "v2.4.0", developer: "PayTech Labs", category: "Finance", status: "PUBLISHED", installs: 840, revenueShare: "80 / 20", securityRating: "PASS (0 Flaws)" },
    { id: "ext-2", name: "AI Customer Support Assistant", version: "v1.1.2", developer: "CognitiveSoft", category: "AI & Automation", status: "PUBLISHED", installs: 610, revenueShare: "75 / 25", securityRating: "PASS (0 Flaws)" },
    { id: "ext-3", name: "Salesforce CRM Sync Connector", version: "v3.0.1", developer: "CloudIntegrations", category: "Sales & CRM", status: "PENDING_REVIEW", installs: 0, revenueShare: "80 / 20", securityRating: "WARN (1 Soft Warning)" },
    { id: "ext-4", name: "Healthcare EHR Sync Gateway", version: "v1.0.0", developer: "MediData Corp", category: "Healthcare", status: "PUBLISHED", installs: 120, revenueShare: "85 / 15", securityRating: "PASS (0 Flaws)" },
    { id: "ext-5", name: "Malicious Query Tester", version: "v0.9.0", developer: "UntrustedDev", category: "Utilities", status: "REJECTED", installs: 0, revenueShare: "70 / 30", securityRating: "FAIL (Unauthorized Memory Read)" },
  ]);

  const handleApprove = (id: string, name: string) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status: "PUBLISHED" } : a)));
    success("Extension Approved & Published", `"${name}" is now live in the global UniERP Marketplace.`);
  };

  const handleReject = (id: string, name: string) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status: "REJECTED" } : a)));
    warning("Extension Rejected", `"${name}" submission rejected. Feedback sent to publisher.`);
  };

  const handleEmergencyKillswitch = (name: string) => {
    error("Emergency Kill-Switch Triggered", `Revoked access tokens and disabled extension "${name}" globally.`);
  };

  const filteredApps = apps.filter(
    (a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.developer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px 0", color: "var(--color-text)" }}>
            Global Marketplace & Extension Operations
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 14 }}>
            Publisher submissions queue, security static analysis scanner, license generator & emergency kill-switch.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" onClick={() => info("License Key Generated", "Issued partner developer license key.")}>
            <Code size={15} style={{ marginRight: 6 }} /> Generate Developer License Key
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Published Extensions</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-text)", marginTop: 4 }}>{apps.filter(a => a.status === "PUBLISHED").length} Extensions</div>
        </div>
        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Pending Publisher Submissions</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#fbbf24", marginTop: 4 }}>{apps.filter(a => a.status === "PENDING_REVIEW").length} Review Queued</div>
        </div>
        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Active Installations</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#60a5fa", marginTop: 4 }}>{apps.reduce((sum, a) => sum + a.installs, 0).toLocaleString()} Installs</div>
        </div>
        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Provider Revenue Share</span>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#34d399", marginTop: 4 }}>$38,400 / mo</div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "#64748b" }} />
        <input
          type="text"
          placeholder="Search marketplace extensions or developer publishers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px 10px 38px",
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-text)",
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Extensions Catalog Table */}
      <div style={{ background: "var(--color-bg-elevated)", borderRadius: 10, border: "1px solid var(--color-border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Extension App</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Publisher</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Category</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Security Analysis</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Installs</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Status</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApps.map((app) => (
              <tr key={app.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{app.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{app.version}</div>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>{app.developer}</td>
                <td style={{ padding: "12px 16px" }}><Badge variant="default">{app.category}</Badge></td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 12, color: app.securityRating.startsWith("PASS") ? "#34d399" : app.securityRating.startsWith("WARN") ? "#fbbf24" : "#fca5a5" }}>
                    {app.securityRating}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--color-text)" }}>{app.installs}</td>
                <td style={{ padding: "12px 16px" }}>
                  <StatusBadge status={app.status} />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {app.status === "PENDING_REVIEW" ? (
                      <>
                        <Button size="sm" variant="primary" onClick={() => handleApprove(app.id, app.name)}>Approve</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleReject(app.id, app.name)}>Reject</Button>
                      </>
                    ) : app.status === "PUBLISHED" ? (
                      <Button size="sm" variant="secondary" onClick={() => handleEmergencyKillswitch(app.name)} style={{ color: "#fca5a5", borderColor: "rgba(239,68,68,0.3)" }}>
                        Kill-Switch
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
