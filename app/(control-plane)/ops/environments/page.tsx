"use client";
/**
 * Ops → Environments.
 * Real environment state: each platform environment target declared by the
 * release manifest and the live schema inventory of the platform database.
 */
import { Boxes, Database } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface SchemaRow {
  tableName?: string;
  rowCount?: number;
  status?: string;
}

interface ManifestEnvironment {
  auto_deploy?: boolean;
  gate?: string;
  requires_human_approval?: boolean;
  rollback_sha?: string | null;
}

export default function OpsEnvironments() {
  const manifest = useItem<{
    training?: string;
    train?: string;
    version?: string;
    releaseTrain?: string;
    deployment?: Record<string, ManifestEnvironment>;
  }>("/platform/v1/releases/manifest");
  const schema = useList<SchemaRow>({
    path: "/platform/v1/operations/db-schema",
  });

  const m = manifest.data ?? {};
  const deployment = (m.deployment ?? {}) as Record<string, ManifestEnvironment>;

  const totalRows = schema.data.reduce((acc, t) => acc + (t.rowCount ?? 0), 0);

  const stats: StatCardItem[] = [
    { label: "Environments", value: Object.entries(deployment).length || 2, icon: <Boxes size={18} /> },
    { label: "Schema tables", value: schema.data.length, icon: <Database size={18} /> },
    { label: "Row count", value: totalRows, icon: <Database size={18} /> },
  ];

  if (manifest.loading || schema.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="ops"
      title="Environments"
      description="Platform deployment targets and the live database schema of the running environment."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={3} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Environment targets
          </h3>
          {manifest.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{manifest.error.message}</p>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {signedEnvs(deployment, ["staging", "production"]).map(([key, env]) => (
                <li
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{key}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {env?.gate ?? "—"}
                    </span>
                    <Badge variant={env?.auto_deploy ? "info" : "primary"}>
                      {env?.auto_deploy ? "auto-deploy" : "manual"}
                    </Badge>
                    {env?.requires_human_approval === true && (
                      <Badge variant="warning">human approval</Badge>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {m.version && (
            <p style={{ margin: "var(--space-3) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              Manifest on this environment: {manifestTrainLabel(m)}
            </p>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Database schema
          </h3>
          {schema.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{schema.error.message}</p>
          ) : schema.data.length === 0 ? (
            <EmptyState
              title="No schema tables"
              description="The db-schema endpoint returned no tables."
            />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {schema.data.slice(0, 50).map((t) => (
                <li
                  key={t.tableName}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{t.tableName}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {t.rowCount != null ? `${t.rowCount.toLocaleString()} rows` : "—"}
                    </span>
                    <Badge variant={t.status === "ACTIVE" ? "success" : "default"}>
                      {t.status ?? "—"}
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

function signedEnvs(
  deployment: Record<string, ManifestEnvironment>,
  fallback: string[],
): Array<[string, ManifestEnvironment]> {
  if (Object.keys(deployment).length > 0) {
    return Object.entries(deployment);
  }
  return fallback.map((key) => [key, {}]) as Array<[string, ManifestEnvironment]>;
}

function manifestTrainLabel(m: Record<string, unknown>): string {
  const v = m.version ?? m.releaseTrain ?? m.train;
  return v != null ? String(v) : "—";
}