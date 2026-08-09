"use client";
/**
 * Users & Access → Permissions.
 * Permission grants are derived from the real role registry and access
 * package endpoints. Unique permission keys are grouped by resource scope and
 * shown with the roles that carry them — real data, no mocked rows.
 */
import { ShieldCheck, KeyRound, Package } from "lucide-react";
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
  permissions?: string[];
  privileges?: string[];
}

interface AccessPackageRow {
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  permissions?: string[];
  entitlements?: string[];
}

function statusVariant(status?: string): "success" | "warning" | "danger" | "default" {
  const s = String(status ?? "").toUpperCase();
  if (["ACTIVE", "ENABLED", "PUBLISHED"].includes(s)) return "success";
  if (["DRAFT", "PENDING"].includes(s)) return "warning";
  if (["DISABLED", "ARCHIVED", "RETIRED"].includes(s)) return "danger";
  return "default";
}

export default function AccessPermissions() {
  const roles = useList<RoleRow>({ path: "/admin/roles" });
  const packages = useList<AccessPackageRow>({ path: "/admin/access-packages" });

  const permissionSet = new Map<string, string[]>();
  for (const role of roles.data) {
    const perms = role.permissions ?? role.privileges ?? [];
    for (const p of perms) {
      const holders = permissionSet.get(p) ?? [];
      holders.push(role.name ?? role.key ?? role.id ?? "Unknown");
      permissionSet.set(p, holders);
    }
  }

  const resources = new Map<string, number>();
  for (const p of permissionSet.keys()) {
    const scope = p.split(":")[0] ?? p.split(".")[0] ?? "other";
    resources.set(scope, (resources.get(scope) ?? 0) + 1);
  }
  const packagePermCount = packages.data.reduce((sum, p) => sum + (p.permissions?.length ?? p.entitlements?.length ?? 0), 0);

  const stats: StatCardItem[] = [
    { label: "Unique permissions", value: permissionSet.size, icon: <KeyRound size={18} /> },
    { label: "Resources", value: resources.size, icon: <KeyRound size={18} /> },
    { label: "Roles with grants", value: roles.data.length, icon: <KeyRound size={18} /> },
    { label: "Access packages", value: packages.data.length, icon: <Package size={18} /> },
  ];

  if (roles.loading || packages.loading) {
    return (
      <DomainShell domainId="access" title="Permissions" description="Permission grants across roles and access packages.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="access" title="Permissions" description="Permission grants across roles and access packages.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Permissions by resource
          </h3>
          {roles.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{roles.error.message}</p>
          ) : permissionSet.size === 0 ? (
            <EmptyState title="No permissions" description="The roles endpoint returned no permission grants." />
          ) : (
            [...resources.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([scope, count]) => (
                <div key={scope} style={{ padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>{scope}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{count} permission(s)</span>
                  </div>
                  <ul style={{ listStyle: "none", margin: "var(--space-2) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                    {[...permissionSet.entries()]
                      .filter(([p]) => (p.split(":")[0] ?? p.split(".")[0]) === scope)
                      .slice(0, 10)
                      .map(([p, holders]) => (
                        <li key={p} style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-1-5) 0", fontSize: "var(--text-sm)" }}>
                          <span style={{ color: "var(--color-text)" }}>{p}</span>
                          <span style={{ color: "var(--color-text-secondary)" }}>{holders.length} role(s)</span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Access packages</h3>
          {packages.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{packages.error.message}</p>
          ) : packages.data.length === 0 ? (
            <EmptyState title="No access packages" description="The access-packages endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {packages.data.slice(0, 25).map((p) => (
                <li
                  key={p.id ?? p.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    {p.description ? (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}> — {p.description}</span>
                    ) : null}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {p.permissions?.length ?? p.entitlements?.length ?? 0} permission(s)
                    </span>
                    <Badge variant={statusVariant(p.status)}>{p.status ?? "ACTIVE"}</Badge>
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