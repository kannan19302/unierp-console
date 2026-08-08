"use client";

import React, { useState } from "react";
import {
  Headphones,
  Clock,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Search,
  MessageSquare,
  Zap,
} from "lucide-react";
import { Button, Card, Badge, StatusBadge, useToast } from "@kannan19302/ui";

interface Ticket {
  id: string;
  tenant: string;
  subject: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  slaTimeLeft: string;
  assignee: string;
}

export default function SupportPage() {
  const { success, warning, info } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: "TICK-402", tenant: "Cyberdyne Systems", subject: "SAML OIDC SSO Assertion signature mismatch on login", priority: "HIGH", status: "OPEN", slaTimeLeft: "1h 42m", assignee: "Support Specialist (Alex)" },
    { id: "TICK-401", tenant: "Umbrella Corp", subject: "Database query timeout on heavy CSV batch export", priority: "MEDIUM", status: "IN_PROGRESS", slaTimeLeft: "4h 10m", assignee: "DB Engineer (Maria)" },
    { id: "TICK-400", tenant: "Stark Industries", subject: "Custom domain CNAME SSL auto-renewal verification", priority: "LOW", status: "OPEN", slaTimeLeft: "18h 00m", assignee: "Unassigned" },
    { id: "TICK-399", tenant: "Acme Corporation", subject: "API Rate limit increase request for Black Friday promo", priority: "HIGH", status: "RESOLVED", slaTimeLeft: "Resolved", assignee: "Platform Admin" },
  ]);

  const handleResolve = (id: string) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: "RESOLVED", slaTimeLeft: "Resolved" } : t)));
    success("Support Ticket Resolved", `Ticket ${id} marked as resolved. Customer notified.`);
  };

  const handleEscalate = (id: string) => {
    warning("Ticket Escalated to PagerDuty", `Dispatched urgent alert for ticket ${id} to L3 On-Call Engineer.`);
  };

  const filteredTickets = tickets.filter(
    (t) => t.tenant.toLowerCase().includes(searchQuery.toLowerCase()) || t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px 0", color: "var(--color-text)" }}>
            Provider Support Desk & SLA Command
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 14 }}>
            Cross-tenant support ticket queue, live SLA countdown timers, canned playbooks & PagerDuty escalation.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" onClick={() => info("Canned Playbook Injected", "Copied SSO troubleshooting response.")}>
            <MessageSquare size={15} style={{ marginRight: 6 }} /> Canned Playbooks
          </Button>
        </div>
      </div>

      {/* SLA Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Open Support Tickets</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#fbbf24", marginTop: 4 }}>3 Tickets</div>
        </div>
        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Average First Response SLA</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#34d399", marginTop: 4 }}>14 Minutes</div>
        </div>
        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Customer CSAT Rating</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#60a5fa", marginTop: 4 }}>4.92 / 5.0</div>
        </div>
        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>SLA Breach Risk</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#34d399", marginTop: 4 }}>0 Breaches</div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "#64748b" }} />
        <input
          type="text"
          placeholder="Search support tickets by tenant or subject line..."
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

      {/* Support Ticket Matrix Table */}
      <div style={{ background: "var(--color-bg-elevated)", borderRadius: 10, border: "1px solid var(--color-border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Ticket ID</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Tenant</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Subject Line</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Priority</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>SLA Timer</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Assignee</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "12px 16px", color: "#60a5fa", fontWeight: 600 }}>{t.id}</td>
                <td style={{ padding: "12px 16px", color: "var(--color-text)", fontWeight: 600 }}>{t.tenant}</td>
                <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>{t.subject}</td>
                <td style={{ padding: "12px 16px" }}>
                  <Badge variant={t.priority === "HIGH" ? "warning" : t.priority === "MEDIUM" ? "info" : "default"}>
                    {t.priority}
                  </Badge>
                </td>
                <td style={{ padding: "12px 16px", color: t.slaTimeLeft === "Resolved" ? "#34d399" : "#fbbf24", fontWeight: 600 }}>
                  <Clock size={13} style={{ verticalAlign: "middle", marginRight: 4 }} /> {t.slaTimeLeft}
                </td>
                <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>{t.assignee}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {t.status !== "RESOLVED" && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => handleResolve(t.id)}>Resolve</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleEscalate(t.id)} style={{ color: "#fca5a5", borderColor: "rgba(239,68,68,0.3)" }}>Escalate</Button>
                      </>
                    )}
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
