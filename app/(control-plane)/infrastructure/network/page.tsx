"use client";
/**
 * Infrastructure → Network.
 * Enterprise-scale isolation policies governing network and storage
 * separation per tenant. Real data from the enterprise-scale isolation
 * policies endpoint.
 */
import { Network, ShieldCheck, Lock } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface IsolationPolicy {
  id?: string;
  name?: string;
  policy?: string;
  tenant?: string;
  mode?: string;
  networkIsolation?: string;
  storageIsolation?: string;
  region?: string;
  status?: string;
  enabled?: boolean;
}

export default function InfrastructureNetwork() {
  const policies = useList<IsolationPolicy>({
    path: "/platform/v1/enterprise-scale/isolation-policies",
  });

  const networkIsolated = policies.data.filter(
    (p) => p.networkIsolation === "ENABLED" || p.networkIsolation === "ON" || p.enabled,
  ).length;
  const enforced = policies.data.filter(
    (p) => p.status === "ACTIVE" || p.status === "ENABLED" || p.enabled,
  ).length;

  const stats: StatCardItem[] = [
    { label: "Policies", value: policies.data.length, icon: <ShieldCheck size={18} /> },
    { label: "Network isolated", value: networkIsolated, icon: <Network size={18} /> },
    { label: "Enforced", value: enforced, icon: <Lock size={18} /> },
    { label: "Isolation modes", value: new Set(policies.data.map((p) => p.mode).filter(Boolean)).size || "—", icon: <Lock size={18} /> },
  ];

  if (policies.loading) {
    return (
      <DomainShell domainId="infrastructure" title="Network" description="Network and storage isolation policies across enterprise tenants.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="infrastructure" title="Network" description="Network and storage isolation policies across enterprise tenants.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Isolation policies</h3>
          {policies.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {policies.error.message}
            </p>
          ) : policies.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No isolation policies" description="The isolation-policies endpoint returned no rows." />
            </div>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: "var(--space-3) 0 0",
                padding: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {policies.data.slice(0, 30).map((p) => (
                <li
                  key={p.id ?? p.name ?? p.policy ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{p.name ?? p.policy ?? "—"}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {p.tenant ? ` · ${p.tenant}` : ""}
                      {p.mode ? ` · ${p.mode}` : ""}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {p.networkIsolation ? `net ${p.networkIsolation}` : ""}
                      {p.storageIsolation ? ` · storage ${p.storageIsolation}` : ""}
                    </span>
                    <Badge
                      variant={
                        p.status === "ACTIVE" || p.status === "ENABLED" || p.enabled
                          ? "success"
                          : p.status === "PENDING" || p.status === "DRAFT"
                            ? "warning"
                            : p.status === "DISABLED" || p.status === "INACTIVE"
                              ? "default"
                              : "info"
                      }
                    >
                      {p.status ?? (p.enabled ? "ENABLED" : "UNKNOWN")}
                    </Badge>
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