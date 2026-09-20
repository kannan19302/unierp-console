"use client";

/**
 * Integrations → Credentials.
 * Platform-level integration credential providers and email routing console.
 * Requires `system.security.admin` or `admin.setting.read` to view,
 * and `admin.setting.update` or `system.security.admin` to edit.
 */
import { KeyRound, EyeOff, Sliders } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";
import { CredentialEditCard, type CredentialProvider } from "./credential-edit-card";
import { EmailProviderSelector } from "./email-provider-selector";

export default function IntegrationsCredentials() {
  const allowedView = usePermission("system.security.admin");
  const canEdit = usePermission("admin.setting.update") || allowedView;

  const credentials = useList<CredentialProvider>({
    path: "/admin/platform-credentials",
    disabled: !allowedView,
  });

  const setFields = credentials.data.reduce((acc, p) => {
    return acc + (p.fields ?? []).filter((f) => f.isSet).length;
  }, 0);

  const stats: StatCardItem[] = [
    { label: "Credential Providers", value: credentials.data.length, icon: <KeyRound size={18} /> },
    { label: "Configured Secrets & Keys", value: setFields, icon: <EyeOff size={18} /> },
    { label: "Delivery Channels", value: "Multi-Cloud Active", icon: <Sliders size={18} /> },
  ];

  if (!allowedView) {
    return (
      <DomainShell
        domainId="integrations"
        title="Integrations"
        description="SaaS integrations, connectors, credentials and gateway activity across the platform."
      >
        <Card padding="md">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <EyeOff size={18} />
            <div>
              <div style={{ fontWeight: 600 }}>No permission</div>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: "var(--space-1) 0 0" }}>
                The Credentials tab requires the <code>system.security.admin</code> permission.
              </p>
            </div>
          </div>
        </Card>
      </DomainShell>
    );
  }

  if (credentials.loading) {
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
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>
            Platform Credentials & Outbound Integrations
          </h2>
          <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
            Configure and manage production API credentials, email delivery providers, payment gateways, and sovereign cloud keys.
          </p>
        </div>

        <StatCardRow stats={stats} columns={3} />

        {/* Dedicated Email Provider Selection & Test Console */}
        <EmailProviderSelector
          providers={credentials.data}
          canEdit={canEdit}
          onUpdated={() => credentials.reload()}
        />

        <div>
          <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 var(--space-3) 0" }}>
            Integration Providers & Secrets
          </h3>

          {credentials.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
              {credentials.error.message}
            </p>
          ) : credentials.data.length === 0 ? (
            <EmptyState
              title="No credential providers"
              description="The platform credentials endpoint returned no providers."
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "var(--space-4)",
              }}
            >
              {credentials.data
                .filter((p) => p.provider !== "email-config")
                .map((p) => (
                  <CredentialEditCard
                    key={p.provider}
                    provider={p}
                    canEdit={canEdit}
                    onSaved={() => credentials.reload()}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </DomainShell>
  );
}