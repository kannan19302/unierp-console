"use client";
/**
 * Users & Access — domain landing.
 * KPI dashboard for the platform identity & access posture plus the most
 * recent provider-side security audit events, all read from verified
 * control-plane endpoints. Real data only.
 */
import {
  Users,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";
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
  status?: string;
}

interface GroupRow {
  id?: string;
  name?: string;
}

interface AuditRow {
  id?: string;
  action?: string;
  event?: string;
  actor?: string;
  severity?: string;
  level?: string;
  createdAt?: string;
  timestamp?: string;
}

function statusVariant(status?: string): "success" | "warning" | "danger" | "default" {
  const s = String(status ?? "").toUpperCase();
  if (["ACTIVE", "ENABLED"].includes(s)) return "success";
  if (["LOCKED", "DISABLED", "SUSPENDED", "REVOKED"].includes(s)) return "danger";
  if (["PENDING", "INVITED", "EXPIRING"].includes(s)) return "warning";
  return "default";
}

export default function AccessLanding() {
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");
  const users = useList<UserRow>({ path: "/admin/users" });
  const roles = useList<Record<string, unknown>>({ path: "/admin/roles" });
  const groups = useList<GroupRow>({ path: "/admin/groups" });
  const audit = useList<AuditRow>({ path: "/audit/security" });

  const s = summary.data ?? {};
  const num = (key: string): number | undefined => {
    const v = s[key];
    return typeof v === "number" ? v : undefined;
  };
  const dashUsers = num("totalUsers") ?? num("usersTotal");
  const dashActive = num("activeUsers") ?? num("usersActive");
  const activeCount = users.data.filter((u) => statusVariant(u.status) === "success").length;

  const stats: StatCardItem[] = [
    { label: "Users", value: dashUsers ?? users.data.length, icon: <Users size={18} /> },
    { label: "Active users", value: dashActive ?? activeCount, icon: <UserCheck size={18} /> },
    { label: "Roles", value: roles.data.length, icon: <ShieldCheck size={18} /> },
    { label: "Groups", value: groups.data.length, icon: <Users size={18} /> },
    { label: "Security events", value: audit.data.length, icon: <ShieldAlert size={18} /> },
  ];

  if (users.loading || roles.loading || groups.loading || audit.loading) {
    return (
      <DomainShell domainId="access" title="Users & Access" description="Directory, roles, permissions, authentication and audit for the platform.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="access"
      title="Users & Access"
      description="Directory, roles, permissions, authentication and audit for the platform."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={5} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Recent audit activity</h3>
            {audit.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{audit.error.message}</p>
            ) : audit.data.length === 0 ? (
              <EmptyState title="No audit events" description="The security audit endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {audit.data.slice(0, 15).map((a) => (
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
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <Badge variant={a.severity === "CRITICAL" ? "danger" : a.severity === "HIGH" ? "warning" : "info"}>
                        {a.severity ?? a.level ?? "INFO"}
                      </Badge>
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
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Identity snapshot</h3>
            {users.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{users.error.message}</p>
            ) : users.data.length === 0 ? (
              <EmptyState title="No users" description="The users endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {users.data.slice(0, 10).map((u) => (
                  <li
                    key={u.id ?? u.email}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{u.name ?? u.email ?? u.id}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{u.email ?? ""}</span>
                      <Badge variant={statusVariant(u.status)}>{u.status ?? "UNKNOWN"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Manage access</h3>
          <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {links.map((l) => (
              <li key={l.path}>
                <a
                  href={l.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    color: "var(--color-primary)",
                    textDecoration: "none",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  <ArrowUpRight size={14} /> {l.label}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </DomainShell>
  );
}

const links = [
  { label: "Manage the user directory", path: "/access/directory" },
  { label: "Review roles", path: "/access/roles" },
  { label: "Inspect permission grants", path: "/access/permissions" },
  { label: "Configure authentication & SSO", path: "/access/authentication" },
  { label: "Open the audit trail", path: "/access/audit" },
];
