"use client";
/**
 * Security & Compliance → Secrets.
 * Platform credentials (masked) and enterprise-scale key rotation schedules.
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

interface CredentialField {
  key?: string;
  label?: string;
  value?: string;
  isSet?: boolean;
  sensitive?: boolean;
}

interface CredentialProvider {
  provider?: string;
  label?: string;
  fields?: CredentialField[];
}

interface KeyRotation {
  id?: string;
  name?: string;
  key?: string;
  status?: string;
  lastRotatedAt?: string;
  nextRotationAt?: string;
  region?: string;
}

export default function SecuritySecrets() {
  const credentials = useList<CredentialProvider>({
    path: "/admin/platform-credentials",
  });
  const rotations = useList<KeyRotation>({
    path: "/platform/v1/enterprise-scale/key-rotations",
  });

  const totalFields = credentials.data.reduce(
    (acc, p) => acc + (p.fields ?? []).length,
    0,
  );
  const setFields = credentials.data.reduce(
    (acc, p) => acc + (p.fields ?? []).filter((f) => f.isSet).length,
    0,
  );

  const stats: StatCardItem[] = [
    { label: "Credential providers", value: credentials.data.length },
    { label: "Fields", value: totalFields },
    { label: "Fields set", value: setFields },
    { label: "Key rotations", value: Number(rotations.total) || rotations.data.length },
  ];

  const loading = credentials.loading || rotations.loading;
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="security"
      title="Secrets"
      description="Platform credentials and encryption key rotation schedules."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Platform credentials</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: "var(--space-1) 0 0" }}>
            Providers are masked at rest and in the API response.
          </p>
          {credentials.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {credentials.error.message}
            </p>
          ) : credentials.data.length === 0 ? (
            <div style={{ marginTop: "var(--space-3)" }}>
              <EmptyState title="No platform credentials" description="The platform-credentials endpoint returned no rows." />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
              {credentials.data.map((p) => (
                <div key={p.provider ?? p.label} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>{p.label ?? p.provider}</span>
                    <Badge variant="default">{p.provider ?? "—"}</Badge>
                  </div>
                  <ul style={{ listStyle: "none", margin: "var(--space-2) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                    {(p.fields ?? []).map((f) => (
                      <li key={f.key} style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-1) 0", fontSize: "var(--text-sm)" }}>
                        <span style={{ color: "var(--color-text-secondary)" }}>{f.label ?? f.key}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                          <span style={{ fontFamily: "monospace" }}>{f.sensitive ? "••••••••" : (f.value ?? "—")}</span>
                          <Badge variant={f.isSet ? "success" : "default"}>{f.isSet ? "Set" : "Unset"}</Badge>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Key rotations</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: "var(--space-1) 0 0" }}>
            Enterprise-scale tenant encryption key rotation schedules.
          </p>
          {rotations.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {rotations.error.message}
            </p>
          ) : rotations.data.length === 0 ? (
            <div style={{ marginTop: "var(--space-3)" }}>
              <EmptyState title="No key rotations" description="The key-rotations endpoint returned no rows." />
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {rotations.data.map((r) => (
                <li key={r.id ?? r.name ?? r.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{r.name ?? r.key ?? r.id}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {r.lastRotatedAt ? `last rotated ${r.lastRotatedAt}` : "never rotated"}
                      {r.nextRotationAt ? ` · next ${r.nextRotationAt}` : ""}
                      {r.region ? ` · ${r.region}` : ""}
                    </div>
                  </div>
                  <Badge variant={r.status === "COMPLETED" ? "success" : r.status === "DUE" ? "warning" : "default"}>
                    {r.status ?? "SCHEDULED"}
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