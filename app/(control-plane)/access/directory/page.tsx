"use client";
/**
 * Users & Access → Directory.
 * Real user and group directory for the platform, read from the verified
 * admin users and groups endpoints.
 */
import { Users, UserCheck, UserX } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { useList } from "@/lib/data";

interface UserRow {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  status?: string;
  state?: string;
  role?: string;
  roles?: string[];
  lastLogin?: string;
  createdAt?: string;
}

interface GroupRow {
  id?: string;
  name?: string;
  description?: string;
  memberCount?: number;
  members?: unknown[];
  type?: string;
}

function statusVariant(status?: string): "success" | "warning" | "danger" | "default" | "info" {
  const s = String(status ?? "").toUpperCase();
  if (["ACTIVE", "ENABLED", "ACTIVE_"].includes(s)) return "success";
  if (["LOCKED", "DISABLED", "SUSPENDED", "DEACTIVATED", "REVOKED"].includes(s)) return "danger";
  if (["PENDING", "INVITED", "AWAITING_ACTIVATION"].includes(s)) return "warning";
  if (["SYSTEM", "SCIM", "API"].includes(s)) return "info";
  return "default";
}

export default function AccessDirectory() {
  const users = useList<UserRow>({ path: "/admin/users" });
  const groups = useList<GroupRow>({ path: "/admin/groups" });

  const active = users.data.filter((u) => statusVariant(u.status) === "success").length;
  const locked = users.data.filter((u) => statusVariant(u.status) === "danger").length;

  const stats: StatCardItem[] = [
    { label: "Users", value: users.data.length, icon: <Users size={18} /> },
    { label: "Active users", value: active, icon: <UserCheck size={18} /> },
    { label: "Locked / disabled", value: locked, icon: <UserX size={18} /> },
    { label: "Groups", value: groups.data.length, icon: <Users size={18} /> },
  ];

  if (users.loading || groups.loading) {
    return (
      <DomainShell domainId="access" title="Directory" description="User and group directory for the platform.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="access" title="Directory" description="User and group directory for the platform.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Users</h3>
          {users.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{users.error.message}</p>
          ) : users.data.length === 0 ? (
            <EmptyState title="No users" description="The users endpoint returned no rows." />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--space-3)", fontSize: "var(--text-sm)" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--color-text-secondary)" }}>
                  <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>User</th>
                  <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>Role</th>
                  <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>Status</th>
                  <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>Last login</th>
                </tr>
              </thead>
              <tbody>
                {users.data.slice(0, 60).map((u) => (
                  <tr key={u.id ?? u.email}>
                    <td style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>
                      <div style={{ fontWeight: 500 }}>{u.name ?? u.fullName ?? u.email ?? u.id}</div>
                      {u.email ? (
                        <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>{u.email}</div>
                      ) : null}
                    </td>
                    <td style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>
                      {u.role ?? u.roles?.join(", ") ?? "—"}
                    </td>
                    <td style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>
                      <Badge variant={statusVariant(u.status ?? u.state)}>{u.status ?? u.state ?? "UNKNOWN"}</Badge>
                    </td>
                    <td style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>{u.lastLogin ?? "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Groups</h3>
          {groups.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{groups.error.message}</p>
          ) : groups.data.length === 0 ? (
            <EmptyState title="No groups" description="The groups endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {groups.data.slice(0, 40).map((g) => (
                <li
                  key={g.id ?? g.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{g.name}</span>
                    {g.description ? (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}> — {g.description}</span>
                    ) : null}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    {g.type ? (
                      <Badge variant="info">{g.type}</Badge>
                    ) : null}
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {g.memberCount != null ? `${g.memberCount} members` : "—"}
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