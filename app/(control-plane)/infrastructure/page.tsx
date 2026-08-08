"use client";

import React, { useState } from "react";
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  RefreshCw,
  Zap,
  Globe,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Shield,
  Layers,
  Activity,
  Trash2,
} from "lucide-react";
import { Button, Card, Badge, StatusBadge, useToast, Tabs, type TabItem } from "@kannan19302/ui";

export default function InfrastructurePage() {
  const { success, warning, info } = useToast();
  const [redisFlushing, setRedisFlushing] = useState(false);
  const [autoScaleThreshold, setAutoScaleThreshold] = useState(75);
  const [activeTab, setActiveTab] = useState<"clusters" | "databases" | "redis" | "workers" | "cdn">("clusters");

  const handleFailover = (clusterName: string) => {
    warning("Failover Initiated", `Primary DB failover triggered for ${clusterName}. Secondary promoted.`);
  };

  const handleFlushRedis = () => {
    setRedisFlushing(true);
    setTimeout(() => {
      setRedisFlushing(false);
      success("Redis Cache Flushed", "Cleared 1,420,000 transient keys across all clusters.");
    }, 800);
  };

  const handleCdnPurge = () => {
    info("Global CDN Purge Dispatched", "Invalidation requests sent to 280 edge locations.");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px 0", color: "var(--color-text)" }}>
            Platform Infrastructure Fleet
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 14 }}>
            Multi-region cluster node pools, Postgres failover, Redis caching, worker queues & CDN edge.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" onClick={handleCdnPurge} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Globe size={15} /> Purge Global Edge CDN
          </Button>
          <Button variant="primary" onClick={handleFlushRedis} disabled={redisFlushing} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
            <RotateCcw size={15} style={{ animation: redisFlushing ? "spin 1s linear infinite" : "none" }} />
            Flush Redis Cache
          </Button>
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <Tabs
        value={activeTab}
        onChange={(val) => setActiveTab(val as any)}
        variant="pills"
        tabs={[
          { key: "clusters", label: "Multi-Region Kubernetes Clusters", icon: <Server size={16} style={{ marginRight: 6 }}/> },
          { key: "databases", label: "PostgreSQL HA Topology", icon: <Database size={16} style={{ marginRight: 6 }}/> },
          { key: "redis", label: "Redis Distributed Caching", icon: <Zap size={16} style={{ marginRight: 6 }}/> },
          { key: "workers", label: "Background Queue Workers (BullMQ)", icon: <Layers size={16} style={{ marginRight: 6 }}/> },
          { key: "cdn", label: "Edge CDN & WAF Governance", icon: <Shield size={16} style={{ marginRight: 6 }}/> },
        ]}
      />

      {/* Tab Contents */}
      {activeTab === "clusters" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Cluster Auto-scale Config Card */}
          <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--color-text)" }}>HPA Pod Auto-Scaling Threshold</h3>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Scale node pool size dynamically when cluster CPU exceeds target %</span>
              </div>
              <Badge variant="info">Target: {autoScaleThreshold}% CPU</Badge>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Scale Min (16 Pods)</span>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={autoScaleThreshold}
                onChange={(e) => setAutoScaleThreshold(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: "#3b82f6", cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Scale Max (128 Pods)</span>
            </div>
          </div>

          {/* Cluster Roster Matrix */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {[
              { region: "us-east-1 (N. Virginia)", nodes: "12 Nodes", pods: "48 Pods", cpu: "28%", mem: "62%", status: "OPTIMAL" },
              { region: "eu-central-1 (Frankfurt)", nodes: "10 Nodes", pods: "36 Pods", cpu: "34%", mem: "58%", status: "OPTIMAL" },
              { region: "ap-south-1 (Mumbai)", nodes: "8 Nodes", pods: "32 Pods", cpu: "42%", mem: "71%", status: "OPTIMAL" },
              { region: "sa-east-1 (São Paulo)", nodes: "4 Nodes", pods: "16 Pods", cpu: "78%", mem: "84%", status: "HIGH LOAD" },
            ].map((c) => (
              <div key={c.region} style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{c.region}</span>
                  <StatusBadge status={c.status === "OPTIMAL" ? "active" : "pending"} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 12 }}>
                  <span>{c.nodes}</span>
                  <span>{c.pods}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)", marginBottom: 2 }}>
                      <span>CPU Utilization</span>
                      <span>{c.cpu}</span>
                    </div>
                    <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                      <div style={{ width: c.cpu, height: "100%", backgroundColor: parseInt(c.cpu) > 70 ? "#f59e0b" : "#3b82f6", borderRadius: 2 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)", marginBottom: 2 }}>
                      <span>Memory RAM</span>
                      <span>{c.mem}</span>
                    </div>
                    <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                      <div style={{ width: c.mem, height: "100%", backgroundColor: "#10b981", borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "databases" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { name: "pg-cluster-us-primary", mode: "Primary Write Leader", lag: "0 ms", connections: "142 / 500", status: "HEALTHY" },
            { name: "pg-cluster-us-replica-1", mode: "Read Replica (Sync)", lag: "2 ms", connections: "88 / 500", status: "HEALTHY" },
            { name: "pg-cluster-eu-primary", mode: "Primary Write Leader", lag: "0 ms", connections: "110 / 500", status: "HEALTHY" },
          ].map((db) => (
            <div key={db.name} style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, color: "var(--color-text)", fontSize: 14 }}>{db.name}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{db.mode} · Replica Lag: {db.lag} · Pool: {db.connections}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <StatusBadge status="ACTIVE" />
                <Button size="sm" variant="secondary" onClick={() => handleFailover(db.name)}>
                  Trigger Manual Failover
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "redis" && (
        <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--color-text)" }}>Redis Key Space & TTL Inspector</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ padding: 14, backgroundColor: "rgba(15, 23, 42, 0.6)", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Active Cache Keys</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", marginTop: 4 }}>1,420,890</div>
            </div>
            <div style={{ padding: 14, backgroundColor: "rgba(15, 23, 42, 0.6)", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Hit Ratio</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#34d399", marginTop: 4 }}>98.4%</div>
            </div>
            <div style={{ padding: 14, backgroundColor: "rgba(15, 23, 42, 0.6)", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>RAM Memory</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#60a5fa", marginTop: 4 }}>4.2 GB / 16 GB</div>
            </div>
          </div>
          <Button variant="secondary" onClick={handleFlushRedis} style={{ alignSelf: "flex-start" }}>
            Flush All Cache Keys
          </Button>
        </div>
      )}

      {activeTab === "workers" && (
        <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--color-text)" }}>Background Queue Workers</h3>
          {[
            { queue: "email-notifications", active: 24, waiting: 0, failed: 0, status: "IDLE" },
            { queue: "webhook-dispatcher", active: 182, waiting: 14, failed: 2, status: "PROCESSING" },
            { queue: "tenant-backup-exporter", active: 2, waiting: 1, failed: 0, status: "PROCESSING" },
          ].map((q) => (
            <div key={q.queue} style={{ padding: 12, borderRadius: 8, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
              <div>
                <strong style={{ color: "var(--color-text)" }}>{q.queue}</strong>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Active: {q.active} · Waiting: {q.waiting} · Failed: {q.failed}</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => info("DLQ Replayed", `Replaying 2 failed jobs for ${q.queue}`)}>
                Replay DLQ Failed Jobs
              </Button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "cdn" && (
        <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--color-text)" }}>Edge CDN & WAF Security Rules</h3>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
            Manage Cloudflare / Fastly WAF rate limit rules, DDoS mitigation triggers, and static asset invalidations.
          </p>
          <Button variant="primary" onClick={handleCdnPurge} style={{ alignSelf: "flex-start" }}>
            Purge All Edge CDN Assets Now
          </Button>
        </div>
      )}
    </div>
  );
}
