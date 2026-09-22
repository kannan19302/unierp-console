"use client";

import { Badge, Button } from "@kannan19302/ui";
import { DataWorkspace } from "@kannan19302/ui/shell";
import { RefreshCw } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import { useItem, useList } from "@/lib/data";
import styles from "../record-workspace.module.css";

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

interface EnvironmentRow extends ManifestEnvironment {
  name: string;
}

interface ReleaseManifest {
  training?: string;
  train?: string;
  version?: string;
  releaseTrain?: string;
  deployment?: Record<string, ManifestEnvironment>;
}

const count = (value: unknown): string =>
  typeof value === "number" && Number.isFinite(value) ? value.toLocaleString() : "Unknown";

const manifestTrainLabel = (manifest: ReleaseManifest): string => {
  const value = manifest.version ?? manifest.releaseTrain ?? manifest.train;
  return value == null ? "Unknown" : String(value);
};

export default function OpsEnvironments() {
  const manifest = useItem<ReleaseManifest>("/platform/v1/releases/manifest");
  const schema = useList<SchemaRow>({ path: "/platform/v1/operations/db-schema" });
  const environments: EnvironmentRow[] = Object.entries(manifest.data?.deployment ?? {}).map(([name, target]) => ({ name, ...target }));
  const approvalCount = environments.filter((environment) => environment.requires_human_approval === true).length;
  const rowCountMeasured = schema.data.length > 0 && schema.data.every((table) => typeof table.rowCount === "number");
  const totalRows = rowCountMeasured ? schema.data.reduce((total, table) => total + Number(table.rowCount), 0) : undefined;

  const reloadAll = () => void Promise.all([manifest.reload(), schema.reload()]);

  return (
    <DomainShell
      domainId="ops"
      title="Environments"
      description="Declared deployment targets and the database schema reported by the running platform."
      actions={<Button variant="outline" size="sm" disabled={manifest.loading || schema.loading} onClick={reloadAll}><RefreshCw size={14} aria-hidden="true" />Refresh records</Button>}
    >
      <div className={styles.container}>
        <section className={styles.summaryStrip} aria-label="Environment summary">
          <div className={styles.summaryItem}><span>Targets declared</span><strong>{manifest.error || manifest.loading ? "Unknown" : count(environments.length)}</strong></div>
          <div className={styles.summaryItem}><span>Approval-gated</span><strong>{manifest.error || manifest.loading ? "Unknown" : count(approvalCount)}</strong></div>
          <div className={styles.summaryItem}><span>Schema tables</span><strong>{schema.error || schema.loading ? "Unknown" : count(schema.data.length)}</strong></div>
          <div className={styles.summaryItem}><span>Rows reported</span><strong>{count(totalRows)}</strong></div>
        </section>

        <div className={styles.workspaceStack}>
          <section className={styles.workspacePanel} aria-labelledby="environment-targets-heading">
            <div className={styles.panelHeader}>
              <div><h2 id="environment-targets-heading">Environment targets</h2><p>Deployment policy declared by the current release manifest.</p></div>
              <span className={styles.panelMeta}>Manifest {manifestTrainLabel(manifest.data ?? {})}</span>
            </div>
            <div className={styles.panelBody}>
              <DataWorkspace<EnvironmentRow>
                data={environments} loading={manifest.loading} getRowId={(row) => row.name}
                searchPlaceholder="Search environments or gates…"
                error={manifest.error ? <p role="alert" className={styles.sourceError}>{manifest.error.message}</p> : undefined}
                emptyTitle={manifest.error ? "Release manifest unavailable" : "No environment targets declared"}
                emptyDescription="The current release manifest did not declare deployment targets."
                columns={[
                  { key: "name", header: "Environment", render: (value) => <span className={styles.recordTitle}>{String(value)}</span> },
                  { key: "gate", header: "Gate", render: (value) => String(value ?? "Not reported") },
                  { key: "auto_deploy", header: "Deployment", render: (value) => <Badge variant={value === true ? "info" : value === false ? "default" : "default"}>{value === true ? "AUTOMATIC" : value === false ? "MANUAL" : "UNKNOWN"}</Badge> },
                  { key: "requires_human_approval", header: "Approval", render: (value) => <Badge variant={value === true ? "warning" : value === false ? "default" : "default"}>{value === true ? "REQUIRED" : value === false ? "NOT REQUIRED" : "UNKNOWN"}</Badge> },
                  { key: "rollback_sha", header: "Rollback revision", render: (value) => typeof value === "string" && value ? value.slice(0, 12) : "Not reported" },
                ]}
              />
            </div>
          </section>

          <section className={styles.workspacePanel} aria-labelledby="schema-records-heading">
            <div className={styles.panelHeader}><div><h2 id="schema-records-heading">Database schema</h2><p>Tables visible to the operations schema inventory.</p></div></div>
            <div className={styles.panelBody}>
              <DataWorkspace<SchemaRow>
                data={schema.data} loading={schema.loading} getRowId={(row, index) => row.tableName ?? `table-${index}`}
                searchPlaceholder="Search schema tables…"
                error={schema.error ? <p role="alert" className={styles.sourceError}>{schema.error.message}</p> : undefined}
                emptyTitle={schema.error ? "Schema inventory unavailable" : "No schema tables reported"}
                emptyDescription="Refresh after the schema inventory source becomes available."
                columns={[
                  { key: "tableName", header: "Table", render: (value) => <span className={styles.recordTitle}>{String(value ?? "Unnamed table")}</span> },
                  { key: "rowCount", header: "Rows", align: "right", render: count },
                  { key: "status", header: "Status", render: (value) => <Badge variant={value === "ACTIVE" ? "success" : "default"}>{String(value ?? "UNKNOWN")}</Badge> },
                ]}
              />
            </div>
          </section>
        </div>
      </div>
    </DomainShell>
  );
}
