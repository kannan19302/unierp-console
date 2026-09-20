"use client";

import React from "react";
import { Award, Users } from "lucide-react";
import { Card } from "@kannan19302/ui";

export function AdoptionRadar() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))", gap: "var(--space-4)" }}>
      <Card padding="md">
        <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Award size={16} />
          Tenant Onboarding Completion Radar
        </h4>
        <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
            <span>Acme Global Corp</span>
            <strong style={{ color: "var(--color-success)" }}>100% Certified (14 Seats)</strong>
          </li>
          <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
            <span>Globex Industries</span>
            <strong style={{ color: "var(--color-primary)" }}>75% In-Progress (8 Seats)</strong>
          </li>
          <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", fontSize: "var(--text-sm)" }}>
            <span>Soylent Tech</span>
            <span>90% Certified (5 Seats)</span>
          </li>
        </ul>
      </Card>

      <Card padding="md">
        <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Users size={16} />
          Certifications Issued by Track
        </h4>
        <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
            <span>Platform Operator Core</span>
            <strong>842 Certified</strong>
          </li>
          <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
            <span>Tenant Admin Mastery</span>
            <strong>512 Certified</strong>
          </li>
          <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", fontSize: "var(--text-sm)" }}>
            <span>FinOps & Margin Specialist</span>
            <strong>219 Certified</strong>
          </li>
        </ul>
      </Card>
    </div>
  );
}
