"use client";
/**
 * Integrations → Overview.
 * KPI dashboard over the real integration control plane: installed SaaS apps,
 * registered third-party connectors, platform credential providers, gateway
 * connection counts and a recent-connections feed.
 */
import { Blocks, Plug, KeyRound, Cable, Activity, ArrowUpRight } from "lucide-react";
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

interface InstalledApp {
  id: string;
  appSlug?: string | null;
  appName?: string | null;
  status?: string;
  installedAt?: string;
  source?: string;
}

interface GovernanceSummary {
  releases?: number;
  runLogsCount?: number;
  connectorsCount?: number;
  environmentState?: string;
}

interface ConnectorRow {
  id: string;
  name: string;
  type?: string;
}

interface CredentialProvider {
  provider: string;
  label: string;
  fields?: Array<{
    key: string;
    label?: string;
    value?: string;
    isSet?: boolean;
    sensitive?: boolean;
  }>;
}

interface GatewayStatus {
  total?: number;
  active?: number;
  inactive?: number;
  error?: number;
  expired?: number;
}

interface GatewayConnection {
  id: string;
  name?: string;
  slug?: string;
  provider?: string;
  status?: string;
  lastTestStatus?: string;
  createdAt?: string;
}

export default function IntegrationsOverview() {
  const integrations = useList<InstalledApp>({ path: "/saas/integrations" });
  const summary = useItem<GovernanceSummary>("/builder/governance/summary");
  const connectors = useList<ConnectorRow>({ path: "/builder/governance/connectors" });
  const credentials = useList<CredentialProvider>({ path: "/admin/platform-credentials" });
  const connections = useList<GatewayConnection>({ path: "/ext-gateway/connections" });
  const connectionStatus = useItem<GatewayStatus>("/ext-gateway/connections/status");

  const stats: StatCardItem[] = [
    {
      label: "Installed apps",
      value: integrations.total ?? integrations.data.length,
      icon: <Blocks size={18} />,
    },
    {
      label: "Connectors",
      value: summary.data?.connectorsCount ?? connectors.data.length,
      icon: <Plug size={18} />,
    },
    {
      label: "Credential providers",
      value: credentials.data.length,
      icon: <KeyRound size={18} />,
    },
    {
      label: "Gateway connections",
      value: connectionStatus.data?.total ?? connections.data.length,
      icon: <Cable size={18} />,
    },
    {
      label: "Governance state",
      value: summary.data?.environmentState ?? "—",
      icon: <Activity size={18} />,
    },
  ];

  const loading =
    integrations.loading ||
    summary.loading ||
    connectors.loading ||
    credentials.loading ||
    connections.loading ||
    connectionStatus.loading;

  if (loading) {
    return (
      <DomainShell domainId="integrations" title="Integrations" description="SaaS integrations, connectors, credentials and gateway activity across the platform.">
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
        {summary.error && (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
            {summary.error.message}
          </p>
        )}

        <StatCardRow stats={stats} columns={5} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Installed applications</h3>
            {integrations.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {integrations.error.message}
              </p>
            ) : integrations.data.length === 0 ? (
              <EmptyState title="No installed apps" description="The SaaS integrations endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {integrations.data.slice(0, 8).map((app) => (
                  <li
                    key={app.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{app.appName ?? app.appSlug ?? app.id}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {app.source ?? "—"}
                      </span>
                      <Badge
                        variant={
                          app.status === "ACTIVE" ? "success" : app.status === "PENDING" ? "warning" : app.status === "DISABLED" ? "default" : "info"
                        }
                      >
                        {app.status ?? "—"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Registered connectors</h3>
            {connectors.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {connectors.error.message}
              </p>
            ) : connectors.data.length === 0 ? (
              <EmptyState title="No connectors" description="The governance connectors endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {connectors.data.slice(0, 8).map((c) => (
                  <li
                    key={c.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{c.type ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Credential providers</h3>
            {credentials.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {credentials.error.message}
              </p>
            ) : credentials.data.length === 0 ? (
              <EmptyState title="No credential providers" description="The platform credentials endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {credentials.data.slice(0, 8).map((p) => {
                  const anySet = (p.fields ?? []).some((f) => f.isSet);
                  return (
                    <li
                      key={p.provider}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "var(--space-2) 0",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{p.label ?? p.provider}</span>
                      <Badge variant={anySet ? "success" : "warning"}>{anySet ? "Set" : "Unset"}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Recent connections</h3>
            {connections.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {connections.error.message}
              </p>
            ) : connections.data.length === 0 ? (
              <EmptyState title="No gateway connections" description="The ext-gateway endpoint returned no connections." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {connections.data.slice(0, 8).map((c) => (
                  <li
                    key={c.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{c.name ?? c.slug ?? c.id}</span>
                    <Badge
                      variant={
                        c.status === "ACTIVE" ? "success" : c.status === "ERROR" ? "danger" : c.status === "EXPIRED" ? "warning" : "default"
                      }
                    >
                      {c.status ?? "—"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div>
          <a
            href="/integrations/catalog"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              color: "var(--color-primary)",
              textDecoration: "none",
              fontSize: "var(--text-sm)",
            }}
          >
            <ArrowUpRight size={14} /> Open integration catalog
          </a>
        </div>
      </div>
    </DomainShell>
  );
}
