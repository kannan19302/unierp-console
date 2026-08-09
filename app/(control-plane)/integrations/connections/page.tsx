"use client";
/**
 * Integrations → Connections.
 * The ext-gateway connection registry and status summary from the real
 * `/ext-gateway` API, plus the governance-registered third-party connectors.
 */
import Link from "next/link";
import { Cable, Boxes, Server, Wrench } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList, useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface ConnectionStatus {
  total?: number;
  active?: number;
  inactive?: number;
  error?: number;
  expired?: number;
}

interface ConnectionRow {
  id: string;
  name?: string;
  slug?: string;
  provider?: string;
  type?: string;
  status?: string;
  lastTestStatus?: string;
  errorCount?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ConnectorRow {
  id: string;
  name?: string;
  type?: string;
  config?: Record<string, unknown>;
  createdAt?: string;
}

export default function IntegrationsConnections() {
  const status = useItem<ConnectionStatus>("/ext-gateway/connections/status");
  const connections = useList<ConnectionRow>({ path: "/ext-gateway/connections" });
  const connectors = useList<ConnectorRow>({ path: "/builder/governance/connectors" });

  const stats: StatCardItem[] = [
    {
      label: "Connections",
      value: status.data?.total ?? connections.total ?? connections.data.length,
      icon: <Cable size={18} />,
    },
    {
      label: "Active",
      value: status.data?.active ?? connections.data.filter((c) => c.status === "ACTIVE").length,
      icon: <Server size={18} />,
    },
    { label: "Errors", value: status.data?.error ?? "—", icon: <Wrench size={18} /> },
    { label: "Governance connectors", value: connectors.data.length, icon: <Boxes size={18} /> },
  ];

  if (status.loading || connections.loading || connectors.loading) {
    return (
      <DomainShell
        domainId="integrations"
        title="Integrations"
        description="SaaS integrations, connectors, credentials and gateway activity across the platform."
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="integrations"
      title="Integrations"
      description="SaaS integrations, connectors, credentials and gateway activity across the platform."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Connections</h2>
          <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
            Ext-gateway connections, test results and registered third-party connectors.
          </p>
        </div>

        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Gateway connections</h3>
          {connections.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{connections.error.message}</p>
          ) : connections.data.length === 0 ? (
            <EmptyState title="No connections" description="The ext-gateway connections endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {connections.data.slice(0, 20).map((c) => (
                <li
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{c.name ?? c.slug ?? c.id}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {c.provider ?? "—"}
                      {c.lastTestStatus ? ` · last test ${c.lastTestStatus.toLowerCase()}` : ""}
                    </div>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Badge
                      variant={
                        c.status === "ACTIVE"
                          ? "success"
                          : c.status === "ERROR"
                            ? "danger"
                            : c.status === "EXPIRED"
                              ? "warning"
                              : "default"
                      }
                    >
                      {c.status ?? "—"}
                    </Badge>
                    {typeof c.errorCount === "number" && c.errorCount > 0 ? (
                      <Badge variant="danger">{c.errorCount} errors</Badge>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Registered third-party connectors</h3>
          {connectors.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{connectors.error.message}</p>
          ) : connectors.data.length === 0 ? (
            <EmptyState title="No connectors registered" description="The governance connectors endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {connectors.data.map((c) => (
                <li
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{c.name ?? c.id}</span>
                  <Badge variant="info">{c.type ?? "—"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div>
          <Link
            href="/integrations/health"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              color: "var(--color-primary)",
              textDecoration: "none",
              fontSize: "var(--text-sm)",
            }}
          >
            <Server size={14} /> View connection health
          </Link>
        </div>
      </div>
    </DomainShell>
  );
}