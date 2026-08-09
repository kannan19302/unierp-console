"use client";
/**
 * Integrations → Credentials.
 * Platform-level integration credential providers. This tab requires the
 * `system.security.admin` permission: without it only a note is shown, never
 * any credential data.
 */
import { KeyRound, EyeOff } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface CredentialField {
  key?: string;
  label?: string;
  value?: string;
  isSet?: boolean;
  sensitive?: boolean;
}

interface CredentialProvider {
  provider: string;
  label?: string;
  fields?: CredentialField[];
}

export default function IntegrationsCredentials() {
  const allowed = usePermission("system.security.admin");
  const credentials = useList<CredentialProvider>({
    path: "/admin/platform-credentials",
    disabled: !allowed,
  });

  const setFields = credentials.data.reduce((acc, p) => {
    return acc + (p.fields ?? []).filter((f) => f.isSet).length;
  }, 0);

  const stats: StatCardItem[] = [
    { label: "Providers", value: credentials.data.length, icon: <KeyRound size={18} /> },
    { label: "Configured fields", value: setFields, icon: <EyeOff size={18} /> },
  ];

  if (!allowed) {
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
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Credentials</h2>
          <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
            Platform credential providers. Values are masked on this endpoint.
          </p>
        </div>

        <StatCardRow stats={stats} columns={2} />

        {credentials.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{credentials.error.message}</p>
        ) : credentials.data.length === 0 ? (
          <EmptyState title="No credential providers" description="The platform credentials endpoint returned no providers." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
            {credentials.data.map((p) => (
              <Card key={p.provider} padding="md">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
                    {p.label ?? p.provider}
                  </h3>
                  <Badge variant={(p.fields ?? []).some((f) => f.isSet) ? "success" : "warning"}>
                    {(p.fields ?? []).some((f) => f.isSet) ? "Set" : "Unset"}
                  </Badge>
                </div>
                <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                  {(p.fields ?? []).map((f) => (
                    <li key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                      <span style={{ fontSize: "var(--text-sm)" }}>{f.label ?? f.key}</span>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {f.value ? f.value : f.isSet ? "••••••••" : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DomainShell>
  );
}