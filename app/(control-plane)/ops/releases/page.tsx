"use client";

import { useEffect, useState } from "react";
import { Badge, Button, FormField, Input, Modal, usePermission, useToast } from "@kannan19302/ui";
import { DataWorkspace } from "@kannan19302/ui/shell";
import { RefreshCw, Rocket, RotateCcw } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import { api } from "@/lib/api";
import { useItem } from "@/lib/data";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import type { PipelineResponse, PipelineStage } from "@/lib/ops-schema";
import styles from "./releases.module.css";

interface ReleaseManifest {
  train?: string;
  version?: string;
  releaseTrain?: string;
  deployedAt?: string;
  services?: Record<string, string>;
  migrations?: string[];
  previousManifestVersion?: string;
}

interface ServicePin {
  name: string;
  version: string;
}

interface MigrationRecord {
  name: string;
}

const statusVariant = (status?: string): "success" | "warning" | "danger" | "default" => {
  if (status === "HEALTHY") return "success";
  if (status === "ROLLING_OUT" || status === "DEGRADED") return "warning";
  return "default";
};

const formatTimestamp = (value: unknown): string => {
  if (typeof value !== "string" || !value) return "Not reported";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Invalid timestamp" : date.toLocaleString();
};

export default function OpsReleases() {
  const toast = useToast();
  const canRollback = usePermission("system.release.rollback");
  const canPromote = usePermission("system.release.promote");
  const manifest = useItem<ReleaseManifest>("/platform/v1/releases/manifest");
  const pipeline = useItem<PipelineResponse>("/platform/v1/releases/pipeline");

  useDomainRealtime("release", () => {
    void Promise.all([pipeline.reload(), manifest.reload()]);
  });

  const [canaryWeight, setCanaryWeight] = useState<number | null>(null);
  const [canaryConfirmOpen, setCanaryConfirmOpen] = useState(false);
  const [updatingCanary, setUpdatingCanary] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollingBack, setRollingBack] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteEnv, setPromoteEnv] = useState("canary");
  const [promoteVersion, setPromoteVersion] = useState("");
  const [promotionHealthConfirmed, setPromotionHealthConfirmed] = useState(false);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    if (typeof pipeline.data?.activeCanaryPercent === "number") {
      setCanaryWeight(pipeline.data.activeCanaryPercent);
    }
  }, [pipeline.data?.activeCanaryPercent]);

  useEffect(() => {
    const currentVersion = manifest.data?.version ?? manifest.data?.releaseTrain ?? manifest.data?.train;
    if (currentVersion) setPromoteVersion(currentVersion);
  }, [manifest.data?.releaseTrain, manifest.data?.train, manifest.data?.version]);

  const currentVersion = manifest.data?.version ?? manifest.data?.releaseTrain ?? manifest.data?.train;
  const previousVersion = manifest.data?.previousManifestVersion;
  const stages = pipeline.data?.stages ?? [];
  const servicePins: ServicePin[] = Object.entries(manifest.data?.services ?? {}).map(([name, version]) => ({ name, version }));
  const migrations: MigrationRecord[] = (manifest.data?.migrations ?? []).map((name) => ({ name }));
  const canaryChanged = canaryWeight !== null && canaryWeight !== pipeline.data?.activeCanaryPercent;
  const rollbackReady = Boolean(previousVersion && rollbackReason.trim().length >= 10);
  const promotionReady = Boolean(promoteEnv && promoteVersion.trim() && promotionHealthConfirmed);

  const reloadAll = () => void Promise.all([manifest.reload(), pipeline.reload()]);

  const handleApplyCanary = async () => {
    if (canaryWeight === null) return;
    setUpdatingCanary(true);
    try {
      await api.post("/platform/v1/releases/pipeline/canary-traffic", { percentage: canaryWeight });
      toast.success("Canary allocation updated", `${canaryWeight}% of ingress traffic is assigned to the canary ring.`);
      setCanaryConfirmOpen(false);
      await pipeline.reload();
    } catch {
      toast.error("Canary update failed", "The traffic-allocation command was not accepted.");
    } finally {
      setUpdatingCanary(false);
    }
  };

  const handleRollback = async () => {
    if (!previousVersion || !rollbackReady) return;
    setRollingBack(true);
    try {
      await api.post("/platform/v1/releases/rollback", {
        targetManifestVersion: previousVersion,
        reason: rollbackReason.trim(),
      });
      toast.success("Rollback completed", `The platform manifest was reverted to ${previousVersion}.`);
      setRollbackOpen(false);
      setRollbackReason("");
      await Promise.all([manifest.reload(), pipeline.reload()]);
    } catch {
      toast.error("Rollback failed", "The platform rollback command did not complete.");
    } finally {
      setRollingBack(false);
    }
  };

  const handlePromote = async () => {
    if (!promotionReady) return;
    setPromoting(true);
    try {
      await api.post("/platform/v1/releases/promote", {
        environmentName: promoteEnv,
        targetManifestVersion: promoteVersion.trim(),
        healthy: true,
      });
      toast.success("Promotion completed", `${promoteVersion.trim()} was promoted to ${promoteEnv}.`);
      setPromoteOpen(false);
      setPromotionHealthConfirmed(false);
      await Promise.all([manifest.reload(), pipeline.reload()]);
    } catch {
      toast.error("Promotion failed", "The release promotion command did not complete.");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <DomainShell
      domainId="ops"
      title="Releases"
      description="Manifest evidence, pipeline state and guarded controls for the provider release train."
      actions={
        <div className={styles.headerActions}>
          <Button size="sm" variant="outline" disabled={manifest.loading || pipeline.loading} onClick={reloadAll}>
            <RefreshCw size={14} aria-hidden="true" />Refresh releases
          </Button>
          {canPromote && <Button size="sm" variant="primary" disabled={!currentVersion} onClick={() => setPromoteOpen(true)}><Rocket size={14} aria-hidden="true" />Promote release</Button>}
          {canRollback && <Button size="sm" variant="danger" disabled={!previousVersion} onClick={() => setRollbackOpen(true)}><RotateCcw size={14} aria-hidden="true" />Rollback platform</Button>}
        </div>
      }
    >
      <div className={styles.container}>
        {(manifest.error || pipeline.error) && (
          <div className={styles.sourceErrors} role="alert">
            {manifest.error && <span>Manifest unavailable: {manifest.error.message}</span>}
            {pipeline.error && <span>Pipeline unavailable: {pipeline.error.message}</span>}
          </div>
        )}

        <section className={styles.releaseLedger} aria-label="Release evidence">
          <div><span>Current manifest</span><strong>{manifest.loading || manifest.error ? "Unknown" : currentVersion ?? "Not reported"}</strong></div>
          <div><span>Canary allocation</span><strong>{pipeline.loading || pipeline.error || pipeline.data?.activeCanaryPercent === undefined ? "Unknown" : `${pipeline.data.activeCanaryPercent}%`}</strong></div>
          <div><span>Rollback target</span><strong>{manifest.loading || manifest.error ? "Unknown" : previousVersion ?? "Not reported"}</strong></div>
          <div><span>Stages reported</span><strong>{pipeline.loading || pipeline.error ? "Unknown" : stages.length.toLocaleString()}</strong></div>
        </section>

        <section className={styles.pipelinePanel} aria-labelledby="pipeline-heading">
          <div className={styles.panelHeader}><div><h2 id="pipeline-heading">Pipeline stages</h2><p>Versions and state reported by the release pipeline.</p></div></div>
          <DataWorkspace<PipelineStage>
            data={stages} loading={pipeline.loading} searchable={false} getRowId={(row) => row.stage}
            error={pipeline.error ? <p role="alert" className={styles.inlineError}>{pipeline.error.message}</p> : undefined}
            emptyTitle={pipeline.error ? "Pipeline unavailable" : "No pipeline stages reported"}
            emptyDescription="The release pipeline returned no stage records."
            columns={[
              { key: "label", header: "Stage", render: (_value, row) => <><span className={styles.recordTitle}>{row.label || row.stage}</span><span className={styles.recordDetail}>{row.stage}</span></> },
              { key: "status", header: "Status", render: (value) => <Badge variant={statusVariant(typeof value === "string" ? value : undefined)}>{String(value ?? "UNKNOWN")}</Badge> },
              { key: "version", header: "Version", render: (value) => String(value ?? "Unknown") },
              { key: "trafficWeightPercent", header: "Traffic", align: "right", render: (value) => typeof value === "number" ? `${value}%` : "Not reported" },
              { key: "commitHash", header: "Revision", render: (value) => typeof value === "string" && value ? value.slice(0, 12) : "Not reported" },
              { key: "lastDeployedAt", header: "Last deployed", render: formatTimestamp },
            ]}
          />
        </section>

        <section className={styles.canaryPanel} aria-labelledby="canary-heading">
          <div className={styles.panelHeader}>
            <div><h2 id="canary-heading">Canary traffic allocation</h2><p>Change the provider-estate ingress percentage assigned to the canary ring.</p></div>
            {canPromote && <Button size="sm" variant="outline" disabled={!canaryChanged || updatingCanary} onClick={() => setCanaryConfirmOpen(true)}>Review change</Button>}
          </div>
          <div className={styles.canaryControl}>
            <input type="range" min="0" max="100" step="5" value={canaryWeight ?? 0} onChange={(event) => setCanaryWeight(Number(event.target.value))} disabled={!canPromote || canaryWeight === null} aria-label="Canary traffic percentage" />
            <output>{canaryWeight === null ? "Unknown" : `${canaryWeight}%`}</output>
          </div>
        </section>

        <div className={styles.manifestGrid}>
          <section className={styles.manifestPanel} aria-labelledby="services-heading">
            <div className={styles.panelHeader}><div><h2 id="services-heading">Service pins</h2><p>Versions declared by the current manifest.</p></div></div>
            <DataWorkspace<ServicePin>
              data={servicePins} loading={manifest.loading} searchable={false} getRowId={(row) => row.name}
              error={manifest.error ? <p role="alert" className={styles.inlineError}>{manifest.error.message}</p> : undefined}
              emptyTitle={manifest.error ? "Manifest unavailable" : "No service pins reported"}
              emptyDescription="The current manifest contains no service version pins."
              columns={[{ key: "name", header: "Service" }, { key: "version", header: "Version" }]}
            />
          </section>

          <section className={styles.manifestPanel} aria-labelledby="migrations-heading">
            <div className={styles.panelHeader}><div><h2 id="migrations-heading">Manifest migrations</h2><p>Migration identifiers declared by the current manifest.</p></div></div>
            <DataWorkspace<MigrationRecord>
              data={migrations} loading={manifest.loading} searchable={false} getRowId={(row) => row.name}
              error={manifest.error ? <p role="alert" className={styles.inlineError}>{manifest.error.message}</p> : undefined}
              emptyTitle={manifest.error ? "Manifest unavailable" : "No migrations declared"}
              emptyDescription="The current manifest contains no migration identifiers."
              columns={[{ key: "name", header: "Migration" }, { key: "state", header: "Evidence", render: () => "Declared in manifest" }]}
            />
          </section>
        </div>

        <Modal className={styles.commandModal} open={canaryConfirmOpen} onClose={() => !updatingCanary && setCanaryConfirmOpen(false)} title="Confirm canary allocation">
          <div className={styles.commandDialog}>
            <p>Change provider-estate ingress traffic assigned to the canary ring.</p>
            <dl>
              <div><dt>Current</dt><dd>{pipeline.data?.activeCanaryPercent === undefined ? "Unknown" : `${pipeline.data.activeCanaryPercent}%`}</dd></div>
              <div><dt>Requested</dt><dd>{canaryWeight === null ? "Unknown" : `${canaryWeight}%`}</dd></div>
              <div><dt>Scope</dt><dd>Global provider ingress</dd></div>
            </dl>
            <div className={styles.dialogActions}><Button variant="ghost" onClick={() => setCanaryConfirmOpen(false)} disabled={updatingCanary}>Cancel</Button><Button variant="primary" onClick={() => void handleApplyCanary()} disabled={updatingCanary || canaryWeight === null}>{updatingCanary ? "Updating…" : "Apply allocation"}</Button></div>
          </div>
        </Modal>

        <Modal className={styles.commandModal} open={rollbackOpen} onClose={() => !rollingBack && setRollbackOpen(false)} title="Rollback platform manifest">
          <div className={styles.commandDialog}>
            <p>Revert every provider service pin to the previous manifest. This affects all tenants and requires server-side dual control.</p>
            <dl>
              <div><dt>Current</dt><dd>{currentVersion ?? "Unknown"}</dd></div>
              <div><dt>Target</dt><dd>{previousVersion ?? "Unavailable"}</dd></div>
              <div><dt>Recovery</dt><dd>Forward promotion after the failure is understood</dd></div>
            </dl>
            <FormField label="Rollback reason" required><Input value={rollbackReason} onChange={(event) => setRollbackReason(event.target.value)} placeholder="Describe the measured failure requiring rollback" /></FormField>
            <p className={styles.fieldHint}>Enter at least 10 characters. The reason is included in the platform audit record.</p>
            <div className={styles.dialogActions}><Button variant="ghost" onClick={() => setRollbackOpen(false)} disabled={rollingBack}>Cancel</Button><Button variant="danger" onClick={() => void handleRollback()} disabled={!rollbackReady || rollingBack}>{rollingBack ? "Rolling back…" : "Rollback platform"}</Button></div>
          </div>
        </Modal>

        <Modal className={styles.commandModal} open={promoteOpen} onClose={() => !promoting && setPromoteOpen(false)} title="Promote release manifest">
          <div className={styles.commandDialog}>
            <p>Promote a manifest to the selected environment. The current API requires the caller to supply the external health-gate result.</p>
            <FormField label="Target environment" required>
              <select className={styles.select} value={promoteEnv} onChange={(event) => setPromoteEnv(event.target.value)}>
                <option value="staging">Staging</option><option value="canary">Canary ring</option><option value="production">Production fleet</option>
              </select>
            </FormField>
            <FormField label="Manifest version" required><Input value={promoteVersion} onChange={(event) => setPromoteVersion(event.target.value)} /></FormField>
            <label className={styles.confirmCheck}><input type="checkbox" checked={promotionHealthConfirmed} onChange={(event) => setPromotionHealthConfirmed(event.target.checked)} /><span>I verified the external health gate for this manifest and target.</span></label>
            <div className={styles.dialogActions}><Button variant="ghost" onClick={() => setPromoteOpen(false)} disabled={promoting}>Cancel</Button><Button variant="primary" onClick={() => void handlePromote()} disabled={!promotionReady || promoting}>{promoting ? "Promoting…" : "Promote release"}</Button></div>
          </div>
        </Modal>
      </div>
    </DomainShell>
  );
}
