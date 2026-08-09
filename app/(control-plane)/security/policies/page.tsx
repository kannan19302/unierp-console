"use client";
/**
 * Security & Compliance → Policies.
 * Enterprise-scale tenant isolation policies.
 */
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface IsolationPolicy {
  id?: string;
  name?: string;
  title?: string;
  tenantId?: string;
  isolationLevel?: string;
  mode?: string;
  region?: string;
  enabled?: boolean;
  isActive?: boolean;
  status?: string;
}

export default function SecurityPolicies() {
  const policies = useList<IsolationPolicy>({
    path: "/platform/v1/enterprise-scale/isolation-policies",
  });

  const enabled = policies.data.filter(
    (p) => p.enabled !== false && p.isActive !== false,
  ).length;

  const stats: StatCardItem[] = [
    { label: "Isolation policies", value: Number(policies.total) || policies.data.length },
    { label: "Enabled", value: enabled },
    { label: "Tenant-isolated", value: policies.data.filter((p) => (p.isolationLevel ?? "").toLowerCase().includes("tenant")).length },
    { label: "Regions", value: new Set(policies.data.map((p) => p.region).filter(Boolean)).size },
  ];

  if (policies.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="security"
      title="Policies"
      description="Enterprise-scale tenant isolation policies."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Isolation policies</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: "var(--space-1) 0 0" }}>
            How tenants are isolated on the data plane.
          </p>
          {policies.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {policies.error.message}
            </p>
          ) : policies.data.length === 0 ? (
            <div style={{ marginTop: "var(--space-3)" }}>
              <EmptyState title="No isolation policies" description="The isolation-policies endpoint returned no rows." />
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {policies.data.map((p) => (
                <li key={p.id ?? p.name ?? p.title} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{p.name ?? p.title ?? p.id}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {p.isolationLevel ?? p.mode ?? "Default"} {p.region ? ` · ${p.region}` : ""}
                    </div>
                  </div>
                  <Badge variant={p.enabled === false || p.isActive === false ? "default" : "success"}>
                    {p.enabled === false || p.isActive === false ? "Disabled" : p.status ?? "Enabled"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}