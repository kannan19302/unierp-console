"use client";
/**
 * Users & Access → Roles.
 * Real role registry for the platform, read from the verified admin roles
 * endpoint. Role name, type (system/custom), permission coverage and member
 * counts are presented directly from the API.
 */
import { ShieldCheck } from "lucide-react";
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

interface RoleRow {
  id?: string;
  name?: string;
  key?: string;
  slug?: string;
  description?: string;
  isSystem?: boolean;
  system?: boolean;
  builtIn?: boolean;
  permissions?: string[];
  privileges?: string[];
  memberCount?: number;
  usersCount?: number;
  userCount?: number;
  status?: string;
  updatedAt?: string;
}

function statusVariant(status?: string): "success" | "warning" | "danger" | "default" {
  const s = String(status ?? "").toUpperCase();
  if (["ACTIVE", "ENABLED"].includes(s)) return "success";
  if (["LOCKED", "DISABLED"].includes(s)) return "danger";
  if (["PENDING", "DRAFT"].includes(s)) return "warning";
  return "default";
}

export default function AccessRoles() {
  const roles = useList<RoleRow>({ path: "/admin/roles" });

  const systemRoles = roles.data.filter((r) => r.isSystem === true || r.system === true || r.builtIn === true).length;
  const permissionAssignments = roles.data.reduce((sum, r) => sum + (r.permissions?.length ?? 0), 0);
  const members = roles.data.reduce((sum, r) => sum + (r.memberCount ?? r.usersCount ?? r.userCount ?? 0), 0);

  const stats: StatCardItem[] = [
    { label: "Roles", value: roles.data.length },
    { label: "System roles", value: systemRoles },
    { label: "Permission assignments", value: permissionAssignments },
    { label: "Role memberships", value: members },
  ];

  if (roles.loading) {
    return (
      <DomainShell domainId="access" title="Roles" description="Role registry and access assignments for the platform.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="access" title="Roles" description="Role registry and access assignments for the platform.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Roles</h3>
          {roles.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{roles.error.message}</p>
          ) : roles.data.length === 0 ? (
            <EmptyState title="No roles" description="The roles endpoint returned no rows." />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--space-3)", fontSize: "var(--text-sm)" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--color-text-secondary)" }}>
                  <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>Role</th>
                  <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>Type</th>
                  <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>Permissions</th>
                  <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>Members</th>
                  <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {roles.data.map((r) => (
                  <tr key={r.id ?? r.key ?? r.name}>
                    <td style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>
                      <div style={{ fontWeight: 500 }}>{r.name ?? r.key ?? r.id}</div>
                      {r.description ? (
                        <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>{r.description}</div>
                      ) : null}
                    </td>
                    <td style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>
                      {r.isSystem === true || r.system === true || r.builtIn === true ? (
                        <Badge variant="info">System</Badge>
                      ) : (
                        <Badge variant="default">Custom</Badge>
                      )}
                    </td>
                    <td style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
                        <ShieldCheck size={14} />
                        {r.permissions?.length ?? r.privileges?.length ?? 0}
                      </span>
                    </td>
                    <td style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>
                      {r.memberCount ?? r.usersCount ?? r.userCount ?? "—"}
                    </td>
                    <td style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)" }}>
                      <Badge variant={statusVariant(r.status)}>{r.status ?? "ACTIVE"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}