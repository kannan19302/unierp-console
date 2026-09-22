"use client";

import { Badge, Button } from "@kannan19302/ui";
import { DataWorkspace } from "@kannan19302/ui/shell";
import { RefreshCw } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import { useItem } from "@/lib/data";
import styles from "../record-workspace.module.css";

interface DeploymentTarget {
  auto_deploy?: boolean;
  gate?: string;
  requires_human_approval?: boolean;
  rollback_sha?: string | null;
}

interface DeploymentRow extends DeploymentTarget {
  name: string;
}

interface ReleaseManifest {
  version?: string;
  releaseTrain?: string;
  train?: string;
  deployment?: Record<string, DeploymentTarget>;
  previousManifestVersion?: string;
}

const count = (value: unknown): string => typeof value === "number" ? value.toLocaleString() : "Unknown";

export default function OpsDeployments() {
  const manifest = useItem<ReleaseManifest>("/platform/v1/releases/manifest");
  const targets: DeploymentRow[] = Object.entries(manifest.data?.deployment ?? {}).map(([name, target]) => ({ name, ...target }));
  const autoCount = targets.filter((target) => target.auto_deploy === true).length;
  const approvalCount = targets.filter((target) => target.requires_human_approval === true).length;
  const version = manifest.data?.version ?? manifest.data?.releaseTrain ?? manifest.data?.train;

  return (
    <DomainShell
      domainId="ops"
      title="Deployments"
      description="Release targets, approval gates and rollback references declared by the release manifest."
      actions={<Button variant="outline" size="sm" disabled={manifest.loading} onClick={() => void manifest.reload()}><RefreshCw size={14} aria-hidden="true" />Refresh manifest</Button>}
    >
      <div className={styles.container}>
        <section className={styles.summaryStrip} aria-label="Deployment summary">
          <div className={styles.summaryItem}><span>Targets declared</span><strong>{manifest.error || manifest.loading ? "Unknown" : count(targets.length)}</strong></div>
          <div className={styles.summaryItem}><span>Automatic</span><strong>{manifest.error || manifest.loading ? "Unknown" : count(autoCount)}</strong></div>
          <div className={styles.summaryItem}><span>Approval-gated</span><strong>{manifest.error || manifest.loading ? "Unknown" : count(approvalCount)}</strong></div>
          <div className={styles.summaryItem}><span>Release version</span><strong>{manifest.error || manifest.loading ? "Unknown" : String(version ?? "Not reported")}</strong></div>
        </section>

        <section className={styles.workspacePanel} aria-labelledby="deployment-targets-heading">
          <div className={styles.panelHeader}>
            <div><h2 id="deployment-targets-heading">Deployment targets</h2><p>Policy and recovery reference for each environment.</p></div>
            {manifest.data?.previousManifestVersion && <span className={styles.panelMeta}>Previous {manifest.data.previousManifestVersion}</span>}
          </div>
          <div className={styles.panelBody}>
            <DataWorkspace<DeploymentRow>
              data={targets} loading={manifest.loading} getRowId={(row) => row.name}
              searchPlaceholder="Search targets or gates…"
              error={manifest.error ? <p role="alert" className={styles.sourceError}>{manifest.error.message}</p> : undefined}
              emptyTitle={manifest.error ? "Release manifest unavailable" : "No deployment targets declared"}
              emptyDescription="The current release manifest did not declare deployment targets."
              columns={[
                { key: "name", header: "Environment", render: (value) => <span className={styles.recordTitle}>{String(value)}</span> },
                { key: "gate", header: "Gate", render: (value) => String(value ?? "Not reported") },
                { key: "auto_deploy", header: "Deployment", render: (value) => <Badge variant={value === true ? "info" : "default"}>{value === true ? "AUTOMATIC" : value === false ? "MANUAL" : "UNKNOWN"}</Badge> },
                { key: "requires_human_approval", header: "Approval", render: (value) => <Badge variant={value === true ? "warning" : "default"}>{value === true ? "REQUIRED" : value === false ? "NOT REQUIRED" : "UNKNOWN"}</Badge> },
                { key: "rollback_sha", header: "Rollback revision", render: (value) => typeof value === "string" && value ? value.slice(0, 12) : "Not reported" },
              ]}
            />
          </div>
        </section>
      </div>
    </DomainShell>
  );
}
