"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Users,
  Server,
  ShieldCheck,
  Zap,
  Activity,
  AlertOctagon,
  RefreshCw,
  PlusCircle,
  Database,
  Terminal,
  Globe,
  Radio,
  Clock,
  ArrowUpRight,
  Filter,
  Download,
  Sliders,
} from "lucide-react";
import { Button, Card, Badge, StatusBadge, useToast } from "@kannan19302/ui";
import { DEFAULT_TENANTS } from "./lib/data";

export default function OverviewPage() {
  const { toast, info, success, warning } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [incidentMessage, setIncidentMessage] = useState("");
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [canaryTraffic, setCanaryTraffic] = useState(15); // % traffic to canary

  const activeTenantsCount = DEFAULT_TENANTS.filter(t => t.status === "ACTIVE").length;
  const pendingTenantsCount = DEFAULT_TENANTS.filter(t => t.status === "PENDING").length;
  const suspendedTenantsCount = DEFAULT_TENANTS.filter(t => t.status === "SUSPENDED").length;
  const totalTenantsCount = DEFAULT_TENANTS.length;

  const handleQuickAction = (actionName: string) => {
    success(`${actionName} Executed`, "Action triggered successfully in Control Plane.");
  };

  const handleBroadcastAlert = () => {
    if (!incidentMessage.trim()) return;
    setActiveAlert(incidentMessage);
    warning("Outage Alert Broadcasted", `Alert published to all ${totalTenantsCount} tenant dashboards.`);
    setIncidentMessage("");
  };

  const handleClearAlert = () => {
    setActiveAlert(null);
    info("Outage Alert Cleared", "Normal platform operations restored.");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px 0", letterSpacing: "-0.02em", color: "var(--color-text)" }}>
            Provider Command Center
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-secondary)" }}>
            Real-time control plane operations, fleet metrics, tenant health & security governance.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Button
            variant="secondary"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true);
              setTimeout(() => {
                setRefreshing(false);
                info("Metrics Refreshed", "Fleet metrics updated live.");
              }, 600);
            }}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
          >
            <RefreshCw size={15} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Refresh Telemetry
          </Button>

          <Button
            variant="primary"
            onClick={() => handleQuickAction("Tenant Provisioning Wizard")}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
          >
            <PlusCircle size={16} />
            Provision New Tenant
          </Button>
        </div>
      </div>

      {/* Broadcast Alert Bar */}
      {activeAlert ? (
        <div style={{
          padding: 16,
          borderRadius: 10,
          backgroundColor: "rgba(220, 38, 38, 0.2)",
          border: "1px solid rgba(220, 38, 38, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#fca5a5",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertOctagon size={20} color="#ef4444" />
            <div>
              <strong style={{ color: "var(--color-text)", display: "block" }}>Active Broadcast Banner</strong>
              <span style={{ fontSize: 13 }}>{activeAlert}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleClearAlert} style={{ color: "var(--color-text)", borderColor: "var(--color-border)" }}>
            Clear Banner
          </Button>
        </div>
      ) : null}

      {/* Top Stat Row (4 Cards) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>Monthly Recurring Revenue</span>
            <div style={{ padding: 6, borderRadius: 8, backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em" }}>$420,500</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, color: "#34d399" }}>
            <ArrowUpRight size={14} />
            <span>+14.2% vs last month ($368K)</span>
          </div>
        </div>

        <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>Active Platform Tenants</span>
            <div style={{ padding: 6, borderRadius: 8, backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em" }}>{totalTenantsCount}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12 }}>
            <Badge variant="success">{activeTenantsCount} Active</Badge>
            <Badge variant="warning">{pendingTenantsCount} Pending</Badge>
            <Badge variant="danger">{suspendedTenantsCount} Suspended</Badge>
          </div>
        </div>

        <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>Fleet Uptime SLA</span>
            <div style={{ padding: 6, borderRadius: 8, backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#c084fc" }}>
              <Server size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em" }}>99.994%</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, color: "#a7f3d0" }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>0 Unplanned Outages in 30 days</span>
          </div>
        </div>

        <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>API Gateway P99 Latency</span>
            <div style={{ padding: 6, borderRadius: 8, backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
              <Zap size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em" }}>38 ms</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, color: "var(--color-text-secondary)" }}>
            <span>Target: &lt; 100ms (14,200 req/sec)</span>
          </div>
        </div>
      </div>

      {/* Main Grid Section (2 Columns) */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Left Column: Fleet Matrix & Canary Control */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Global Regional Fleet Matrix */}
          <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Globe size={20} color="#60a5fa" />
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--color-text)" }}>Multi-Region Fleet Clusters</h3>
              </div>
              <Badge variant="info">8 Edge Clusters Active</Badge>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {[
                { name: "US-East (N. Virginia)", pods: "48 Pods", status: "Optimal", ping: "12ms", cpu: "28%" },
                { name: "EU-Central (Frankfurt)", pods: "36 Pods", status: "Optimal", ping: "24ms", cpu: "34%" },
                { name: "AP-South (Mumbai)", pods: "32 Pods", status: "Optimal", ping: "18ms", cpu: "42%" },
                { name: "SA-East (São Paulo)", pods: "16 Pods", status: "Degraded", ping: "84ms", cpu: "78%" },
              ].map((reg) => (
                <div key={reg.name} style={{
                  padding: 14,
                  borderRadius: 8,
                  backgroundColor: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid var(--color-border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{reg.name}</span>
                    <StatusBadge status={reg.status === "Optimal" ? "ACTIVE" : "PENDING"} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-secondary)" }}>
                    <span>{reg.pods}</span>
                    <span>Ping: {reg.ping}</span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>
                      <span>CPU Utilization</span>
                      <span>{reg.cpu}</span>
                    </div>
                    <div style={{ width: "100%", height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                      <div style={{
                        width: reg.cpu,
                        height: "100%",
                        backgroundColor: parseInt(reg.cpu) > 70 ? "#f59e0b" : "#3b82f6",
                        borderRadius: 2,
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Canary Release Traffic Controller */}
          <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Sliders size={20} color="#c084fc" />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--color-text)" }}>Canary Traffic Split Controller</h3>
                  <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Route live production traffic between Stable v2.5 and Canary v2.6-rc3</span>
                </div>
              </div>
              <Badge variant="warning">Canary Active ({canaryTraffic}%)</Badge>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)", width: 120 }}>Stable v2.5: {100 - canaryTraffic}%</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={canaryTraffic}
                onChange={(e) => setCanaryTraffic(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: "#a855f7", cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, color: "#c084fc", fontWeight: 600, width: 120 }}>Canary v2.6: {canaryTraffic}%</span>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <Button size="sm" variant="secondary" onClick={() => { setCanaryTraffic(0); handleQuickAction("Canary Traffic Shift to Stable 100%"); }}>
                Rollback to Stable 100%
              </Button>
              <Button size="sm" variant="primary" onClick={() => handleQuickAction(`Canary Traffic Set to ${canaryTraffic}%`)}>
                Apply Traffic Split
              </Button>
            </div>
          </div>

          {/* Provider Real-Time Audit Log Stream */}
          <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Terminal size={20} color="#34d399" />
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--color-text)" }}>Provider Audit Log Stream</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleQuickAction("Audit Log CSV Export")}>
                <Download size={14} style={{ marginRight: 6 }} /> Export Audit Stream
              </Button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { time: "10:42:15 AM", actor: "admin@kannan19302.dev", action: "TENANT_QUOTA_UPDATE", details: "Increased storage cap for tenant acme-corp to 500GB", ip: "192.168.1.45" },
                { time: "10:38:02 AM", actor: "system-autoscale", action: "CLUSTER_POD_SCALE", details: "Scaled US-East node pool from 44 to 48 pods", ip: "10.0.4.12" },
                { time: "10:15:40 AM", actor: "security-audit", action: "MFA_POLICY_ENFORCE", details: "Enforced mandatory TOTP for support staff team", ip: "192.168.1.88" },
                { time: "09:50:11 AM", actor: "billing-worker", action: "INVOICE_GENERATED", details: "Generated monthly invoice #INV-2026-0801 for globex-inc", ip: "10.0.2.1" },
              ].map((log, idx) => (
                <div key={idx} style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  backgroundColor: "rgba(15, 23, 42, 0.5)",
                  fontSize: 12,
                  fontFamily: "monospace",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "var(--color-text-secondary)",
                  borderLeft: "3px solid #3b82f6",
                }}>
                  <div>
                    <span style={{ color: "#64748b", marginRight: 8 }}>[{log.time}]</span>
                    <strong style={{ color: "#60a5fa", marginRight: 8 }}>{log.actor}</strong>
                    <span style={{ color: "#f1f5f9", fontWeight: 600, marginRight: 8 }}>{log.action}</span>
                    <span>{log.details}</span>
                  </div>
                  <span style={{ color: "#475569" }}>{log.ip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Launchpad & Emergency Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Quick Launchpad Actions */}
          <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0", color: "var(--color-text)" }}>Operational Launchpad</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { title: "Purge Global Edge CDN", desc: "Invalidate Cloudflare / Fastly static assets", action: "CDN Flush" },
                { title: "Flush Redis System Cache", desc: "Clear transient session & query caches", action: "Redis Flush" },
                { title: "Trigger On-Demand DB Snapshot", desc: "Create encrypted PITR backup snapshot", action: "DB Snapshot" },
                { title: "Revoke Stale Support Tokens", desc: "Invalidate temporary impersonation keys", action: "Revoke Tokens" },
                { title: "Replay Dead Letter Queue (DLQ)", desc: "Retry 14 failed background webhook events", action: "DLQ Replay" },
              ].map((item) => (
                <div key={item.title} style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{item.desc}</div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => handleQuickAction(item.action)}>
                    Execute
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Broadcast Outage Banner Form */}
          <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px 0", color: "var(--color-text)" }}>Broadcast Platform Alert</h3>
            <p style={{ margin: "0 0 14px 0", fontSize: 12, color: "var(--color-text-secondary)" }}>
              Publish an emergency notification banner across all active tenant portals.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <textarea
                rows={3}
                placeholder="e.g. Scheduled database maintenance starting at 02:00 UTC."
                value={incidentMessage}
                onChange={(e) => setIncidentMessage(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  color: "var(--color-text)",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <Button
                variant="primary"
                onClick={handleBroadcastAlert}
                style={{ width: "100%", background: "#ef4444", fontSize: 13, fontWeight: 600 }}
              >
                Broadcast Alert Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
