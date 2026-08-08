"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Shield,
  Plus,
  Search,
  Lock,
  Mail,
  Key,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Button, Card, Badge, StatusBadge, useToast } from "@kannan19302/ui";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "SUPPORT_SPECIALIST" | "BILLING_MANAGER" | "SECURITY_AUDITOR";
  mfaStatus: "ENFORCED" | "PENDING";
  lastActive: string;
}

export default function StaffPage() {
  const { success, warning } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [staff, setStaff] = useState<StaffMember[]>([
    { id: "staff-1", name: "Provider Super Admin", email: "admin@kannan19302.dev", role: "SUPER_ADMIN", mfaStatus: "ENFORCED", lastActive: "Just now" },
    { id: "staff-2", name: "Alex Support Lead", email: "alex.support@kannan19302.dev", role: "SUPPORT_SPECIALIST", mfaStatus: "ENFORCED", lastActive: "14 mins ago" },
    { id: "staff-3", name: "Maria Billing Lead", email: "maria.billing@kannan19302.dev", role: "BILLING_MANAGER", mfaStatus: "ENFORCED", lastActive: "1 hour ago" },
    { id: "staff-4", name: "Devon Security Auditor", email: "devon.audit@kannan19302.dev", role: "SECURITY_AUDITOR", mfaStatus: "ENFORCED", lastActive: "3 hours ago" },
  ]);

  const handleInviteStaff = () => {
    success("Provider Staff Invitation Sent", "Secure magic link emailed with hardware MFA setup requirement.");
  };

  const handleRevokeStaff = (name: string) => {
    warning("Staff Member Access Revoked", `Revoked control plane credentials for ${name}.`);
  };

  const filteredStaff = staff.filter(
    (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px 0", color: "var(--color-text)" }}>
            Provider Staff Directory & RBAC Governance
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 14 }}>
            Control plane administrator team, fine-grained RBAC permission matrix & hardware MFA compliance.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="primary" onClick={handleInviteStaff} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
            <Plus size={16} /> Invite Provider Administrator
          </Button>
        </div>
      </div>

      {/* Staff Roster Stat Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Total Provider Staff</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-text)", marginTop: 4 }}>18 Staff Members</div>
        </div>
        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Super Administrators</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#60a5fa", marginTop: 4 }}>3 Super Admins</div>
        </div>
        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>MFA Compliance Rate</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#34d399", marginTop: 4 }}>100% Enforced</div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "#64748b" }} />
        <input
          type="text"
          placeholder="Search staff by name or email..."
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

      {/* Staff Table */}
      <div style={{ background: "var(--color-bg-elevated)", borderRadius: 10, border: "1px solid var(--color-border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Staff Administrator</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Control Plane Role</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>MFA Verification</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Last Session Active</th>
              <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{s.email}</div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Badge variant={s.role === "SUPER_ADMIN" ? "info" : "default"}>{s.role}</Badge>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <StatusBadge status="ACTIVE" />
                </td>
                <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>{s.lastActive}</td>
                <td style={{ padding: "12px 16px" }}>
                  {s.role !== "SUPER_ADMIN" && (
                    <Button size="sm" variant="secondary" onClick={() => handleRevokeStaff(s.name)} style={{ color: "#fca5a5", borderColor: "rgba(239,68,68,0.3)" }}>
                      Revoke Access
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
