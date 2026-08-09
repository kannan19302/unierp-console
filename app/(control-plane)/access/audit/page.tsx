"use client";
/**
 * Users & Access → Audit.
 * Platform security audit events from the verified /audit/security endpoint,
 * plus a per-user audit trail (/audit/user/:userId) for a selected directory
 * user. All rows are real API data.
 */
import { useState } from "react";
import { FileSearch, ScanSearch } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { useItem, useList } from "@/lib/data";

interface UserRow {
  id?: string;
  name?: string;
  email?: string;
}

interface AuditRow {
  id?: string;
  action?: string;
  event?: string;
  actor?: string;
  target?: string;
  resource?: string;
  severity?: string;
  level?: string;
  ip?: string;
  result?: string;
  createdAt?: string;
  timestamp?: string;
}

function severityVariant(severity?: string, level?: string): "success" | "warning" | "danger" | "info" {
  const s = String(severity ?? level ?? "").toUpperCase();
  if (["CRITICAL", "HIGH", "ERROR"].includes(s)) return "danger";
  if (["MEDIUM", "WARNING", "WARN"].includes(s)) return "warning";
  if (["LOW", "INFO"].includes(s)) return "info";
  if (["SUCCESS", "OK"].includes(s)) return "success";
  return "info";
}

export default function AccessAudit() {
  const audit = useList<AuditRow>({ path: "/audit/security" });
  const users = useList<UserRow>({ path: "/admin/users" });
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const firstUser = users.data[0]?.id;
  const userTrail = useItem<unknown>(selectedUserId ? `/audit/user/${selectedUserId}` : firstUser ? `/audit/user/${firstUser}` : null);

  const rawTrail = userTrail.data;
  const trail: AuditRow[] = Array.isArray(rawTrail)
    ? (rawTrail as AuditRow[])
    : rawTrail && typeof rawTrail === "object"
      ? (Object.values(
          (rawTrail as Record<string, unknown>)["events"] ??
            (rawTrail as Record<string, unknown>)["items"] ??
            (rawTrail as Record<string, unknown>)["activity"] ??
            (rawTrail as Record<string, unknown>)["trail"] ??
            [],
        ) as AuditRow[])
      : [];

  const stats: StatCardItem[] = [
    { label: "Security events", value: audit.data.length, icon: <FileSearch size={18} /> },
    { label: "Critical / high", value: audit.data.filter((a) => severityVariant(a.severity, a.level) === "danger").length, icon: <FileSearch size={18} /> },
    { label: "Warnings", value: audit.data.filter((a) => severityVariant(a.severity, a.level) === "warning").length, icon: <FileSearch size={18} /> },
    { label: "User events", value: trail.length, icon: <ScanSearch size={18} /> },
  ];
  const trailUser = selectedUserId || firstUser || "";

  if (audit.loading || users.loading || userTrail.loading) {
    return (
      <DomainShell domainId="access" title="Audit" description="Security audit trail and per-user activity history.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="access" title="Audit" description="Security audit trail and per-user activity history.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)" }}>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>User audit trail</h3>
            <select
              aria-label="Select a user"
              value={trailUser}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
                fontSize: "var(--text-sm)",
                maxWidth: 280,
              }}
            >
              <option value="">Select a user</option>
              {users.data.map((u) => (
                <option key={u.id ?? u.email} value={u.id ?? u.email}>
                  {u.name ?? u.email ?? u.id}
                </option>
              ))}
            </select>
          </div>
          {users.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>{users.error.message}</p>
          ) : userTrail.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>{userTrail.error.message}</p>
          ) : trail.length === 0 ? (
            <EmptyState title="No user trail" description="No audit events recorded for the selected user." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {trail.slice(0, 30).map((a, i) => (
                <li
                  key={a.id ?? `${a.createdAt ?? a.timestamp}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ fontWeight: 500 }}>{a.action ?? a.event ?? "audit event"}</span>
                    {a.target || a.resource ? (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                        {" "}· {a.target ?? a.resource}
                      </span>
                    ) : null}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    {a.ip ? <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{a.ip}</span> : null}
                    {a.result ? (
                      <Badge variant={a.result === "SUCCESS" || a.result === "ALLOWED" ? "success" : a.result === "DENIED" ? "danger" : "default"}>
                        {a.result}
                      </Badge>
                    ) : null}
                    <Badge variant={severityVariant(a.severity, a.level)}>{a.severity ?? a.level ?? "INFO"}</Badge>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {a.createdAt ?? a.timestamp ?? ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Security audit trail</h3>
          {audit.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{audit.error.message}</p>
          ) : audit.data.length === 0 ? (
            <EmptyState title="No security events" description="The security audit endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {audit.data.slice(0, 30).map((a) => (
                <li
                  key={a.id ?? `${a.actor}-${a.createdAt ?? a.timestamp}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ fontWeight: 500 }}>{a.action ?? a.event ?? "audit event"}</span>
                    {a.actor ? (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}> · {a.actor}</span>
                    ) : null}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <Badge variant={severityVariant(a.severity, a.level)}>{a.severity ?? a.level ?? "INFO"}</Badge>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {a.createdAt ?? a.timestamp ?? ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}