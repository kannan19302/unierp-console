"use client";

import { Clock, ShieldCheck } from "lucide-react";
import { Card } from "@kannan19302/ui";

interface SlaDashboardProps {
  adminMetrics: {
    agentsOnline?: number;
    openTickets?: number;
    unassigned?: number;
    avgFirstResponse?: string;
    slaCoverage?: number;
  } | null | undefined;
}

export function SlaDashboard({ adminMetrics }: SlaDashboardProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))", gap: "var(--space-4)" }}>
      <Card padding="md">
        <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Clock size={16} />
          SLA Tier Threshold Matrix
        </h4>
        <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
            <span>Critical Severity (P0)</span>
            <strong style={{ color: "var(--color-danger)" }}>4 Hours SLA</strong>
          </li>
          <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
            <span>High Severity (P1)</span>
            <strong style={{ color: "var(--color-warning)" }}>8 Hours SLA</strong>
          </li>
          <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
            <span>Medium Severity (P2)</span>
            <strong style={{ color: "var(--color-primary)" }}>24 Hours SLA</strong>
          </li>
          <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", fontSize: "var(--text-sm)" }}>
            <span>Low Severity (P3)</span>
            <span>72 Hours SLA</span>
          </li>
        </ul>
      </Card>

      <Card padding="md">
        <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <ShieldCheck size={16} />
          Workforce Health
        </h4>
        <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
            <span>Operators On-Duty</span>
            <strong>{adminMetrics?.agentsOnline ?? 4} Agents</strong>
          </li>
          <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
            <span>Unassigned Inbound</span>
            <strong>{adminMetrics?.unassigned ?? 1} Tickets</strong>
          </li>
          <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", fontSize: "var(--text-sm)" }}>
            <span>Avg Initial Response Time</span>
            <strong>{adminMetrics?.avgFirstResponse ?? "12m 40s"}</strong>
          </li>
        </ul>
      </Card>
    </div>
  );
}
