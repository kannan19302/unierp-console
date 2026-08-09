"use client";
/**
 * Tenants → Users.
 * Users and roles across tenants, read from the admin directory and roles
 * endpoints.
 */
import { ShieldCheck, UserRound } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";
import { statusVariant } from "../_badge";
import styles from "../tenants.module.css";

interface UserRow {
  id?: string;
  name?: string;
  email?: string;
  status?: string;
  role?: string;
  roles?: string[];
  tenantId?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

interface RoleRow {
  id?: string;
  name?: string;
  description?: string;
  tenantId?: string;
  permissions?: string[];
  isSystem?: boolean;
}

export default function TenantsUsers() {
  const canRead = usePermission("admin.users.read");
  const users = useList<UserRow>({ path: "/admin/users", disabled: !canRead });
  const roles = useList<RoleRow>({ path: "/admin/roles", disabled: !canRead });

  const admins = users.data.filter((u) =>
    (u.roles ?? [u.role]).some((r) => String(r).toUpperCase().includes("ADMIN")),
  ).length;

  const stats: StatCardItem[] = [
    { label: "Users", value: users.total ?? users.data.length, icon: <UserRound size={18} /> },
    { label: "Admins", value: admins || "—", icon: <ShieldCheck size={18} /> },
    { label: "Roles", value: roles.data.length, icon: <ShieldCheck size={18} /> },
  ];

  if (users.loading || roles.loading) {
    return (
      <DomainShell domainId="tenants" title="Tenants · Users" description="Users and roles across tenants.">
        <div className={styles.loadingCenter}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Users"
      description="Users and roles across tenants."
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={3} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <Card padding="md">
            <h3 className={styles.cardTitle}>Users</h3>
            {users.error ? (
              <p className={styles.error}>{users.error.message}</p>
            ) : users.data.length === 0 ? (
              <EmptyState title="No users" description="The users endpoint returned no rows." />
            ) : (
              <ul className={styles.list}>
                {users.data.slice(0, 30).map((u) => (
                  <li
                    key={u.id ?? u.email}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span className={styles.listItemName}>
                      <span style={{ fontWeight: 500, display: "block" }}>
                        {u.name ?? u.email ?? "—"}
                      </span>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                        {u.email ?? "—"}
                        {u.tenantId ? ` · ${u.tenantId}` : ""}
                      </span>
                    </span>
                    <span className={styles.listItemMeta}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {u.role ?? ((u.roles ?? []).join(", ") || "—")}
                      </span>
                      <Badge variant={statusVariant(u.status)}>{u.status ?? "UNKNOWN"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 className={styles.cardTitle}>Roles</h3>
            {roles.error ? (
              <p className={styles.error}>{roles.error.message}</p>
            ) : roles.data.length === 0 ? (
              <EmptyState title="No roles" description="The roles endpoint returned no rows." />
            ) : (
              <ul className={styles.list}>
                {roles.data.slice(0, 30).map((r) => (
                  <li
                    key={r.id ?? r.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span className={styles.listItemName}>
                      <span style={{ fontWeight: 500, display: "block" }}>{r.name ?? "—"}</span>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                        {r.description ?? `permissions ${(r.permissions ?? []).length}`}
                        {r.tenantId ? ` · ${r.tenantId}` : ""}
                      </span>
                    </span>
                    <Badge variant={r.isSystem ? "info" : "default"}>{r.isSystem ? "SYSTEM" : "CUSTOM"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </DomainShell>
  );
}