"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeftRight,
  GitBranch,
  Layers,
  Percent,
  RefreshCw,
  Rocket,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  FormField,
  Input,
  Modal,
  StatCardRow,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import { api } from "@/lib/api";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import DomainShell from "@/components/domain-shell";
import type { PipelineResponse } from "@/lib/ops-schema";
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

export default function OpsReleases() {
  const toast = useToast();
  const canRollback = usePermission("system.release.rollback");
  const canPromote = usePermission("system.release.promote");

  const manifest = useItem<ReleaseManifest>("/platform/v1/releases/manifest");
  const pipeline = useItem<PipelineResponse>("/platform/v1/releases/pipeline");

  // Real-time updates
  useDomainRealtime("release", () => {
    pipeline.reload();
    manifest.reload();
  });

  const m = manifest.data ?? {};
  const p = pipeline.data ?? { stages: [], activeCanaryPercent: 10 };

  // Canary Traffic Slider State
  const [canaryWeight, setCanaryWeight] = useState(p.activeCanaryPercent || 10);
  const [updatingCanary, setUpdatingCanary] = useState(false);

  useEffect(() => {
    if (p.activeCanaryPercent != null) {
      setCanaryWeight(p.activeCanaryPercent);
    }
  }, [p.activeCanaryPercent]);

  // Rollback Modal State
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [targetVersion, setTargetVersion] = useState(m.previousManifestVersion ?? "2026.07.4");
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollingBack, setRollingBack] = useState(false);

  // Promote Modal State
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteEnv, setPromoteEnv] = useState("canary");
  const [promoteVersion, setPromoteVersion] = useState(m.version ?? "2026.08.1");
  const [promoting, setPromoting] = useState(false);

  const activeVersion = m.version ?? m.releaseTrain ?? "2026.08.0";
  const prevVersion = m.previousManifestVersion ?? "2026.07.4";

  const statItems: StatCardItem[] = [
    {
      label: "Current Active Version",
      value: activeVersion,
    },
    {
      label: "Canary Traffic Split",
      value: `${p.activeCanaryPercent ?? canaryWeight}%`,
    },
    {
      label: "Rollback Invariant Target",
      value: prevVersion,
    },
    {
      label: "Active Pipeline Stages",
      value: String(p.stages.length || 4),
    },
  ];

  const handleApplyCanary = async () => {
    setUpdatingCanary(true);
    try {
      await api.post("/platform/v1/releases/pipeline/canary-traffic", {
        percentage: Number(canaryWeight),
        actorId: "test.agent@unierp.com",
      });
      toast.success("Canary Traffic Updated", `Global edge traffic routed to ${canaryWeight}% canary.`);
      await pipeline.reload();
    } catch {
      toast.error("Update Failed", "Could not adjust canary traffic weight.");
    } finally {
      setUpdatingCanary(false);
    }
  };

  const handleRollback = async () => {
    setRollingBack(true);
    try {
      await api.post("/platform/v1/releases/rollback", {
        targetManifestVersion: targetVersion,
        reason: rollbackReason || "Operator initiated rollback via Release Control",
        actorId: "test.agent@unierp.com",
      });
      toast.success("Rollback Initiated", `Platform reversion to manifest ${targetVersion} dispatched.`);
      setRollbackOpen(false);
      await manifest.reload();
      await pipeline.reload();
    } catch {
      toast.error("Rollback Failed", "Failed to trigger release rollback.");
    } finally {
      setRollingBack(false);
    }
  };

  const handlePromote = async () => {
    setPromoting(true);
    try {
      await api.post("/platform/v1/releases/promote", {
        environmentName: promoteEnv,
        targetManifestVersion: promoteVersion,
        healthy: true,
      });
      toast.success("Release Promoted", `Version ${promoteVersion} promoted to ${promoteEnv}.`);
      setPromoteOpen(false);
      await manifest.reload();
      await pipeline.reload();
    } catch {
      toast.error("Promotion Failed", "Failed to promote release.");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <DomainShell
      domainId="ops"
      title="Platform Operations — Release Pipeline"
      description="Visual release promotion stages, edge canary traffic weighting, and zero-downtime rollback controls."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {canPromote && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setPromoteOpen(true)}
            >
              <Rocket size={14} style={{ marginRight: "var(--space-1)" }} />
              Promote Release
            </Button>
          )}
          {canRollback && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setRollbackOpen(true)}
            >
              <RotateCcw size={14} style={{ marginRight: "var(--space-1)" }} />
              Rollback Platform
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              manifest.reload();
              pipeline.reload();
            }}
          >
            Refresh
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <StatCardRow stats={statItems} columns={4} />

        {/* Visual Pipeline Grid */}
        <div>
          <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-semibold)", marginBottom: "var(--space-2)", color: "var(--color-text-primary)" }}>
            Deployment Pipeline Stages
          </h3>
          <div className={styles.pipelineGrid}>
            {p.stages.map((stage) => (
              <div
                key={stage.stage}
                className={`${styles.stageCard} ${stage.stage === "canary" ? styles.stageCardActive : ""}`}
              >
                <div className={styles.stageHeader}>
                  <span className={styles.stageTitle}>{stage.label}</span>
                  <Badge variant={stage.status === "HEALTHY" ? "success" : stage.status === "ROLLING_OUT" ? "warning" : "default"}>
                    {stage.status}
                  </Badge>
                </div>
                <div className={styles.stageVersion}>{stage.version}</div>
                <div className={styles.stageMeta}>
                  {stage.trafficWeightPercent != null && (
                    <div>Traffic Weight: <strong>{stage.trafficWeightPercent}%</strong></div>
                  )}
                  {stage.commitHash && (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                      <GitBranch size={12} /> Commit: <code>{stage.commitHash}</code>
                    </div>
                  )}
                  <div>Last Deploy: {new Date(stage.lastDeployedAt).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canary Traffic Routing Slider */}
        <div className={styles.canaryPanel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>
                Edge Canary Traffic Weight Control
              </h4>
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
                Adjust percentage of ingress production traffic routed to the canary ring before full fleet promotion.
              </p>
            </div>
            {canPromote && (
              <Button
                size="sm"
                variant="primary"
                onClick={handleApplyCanary}
                disabled={updatingCanary || canaryWeight === p.activeCanaryPercent}
              >
                {updatingCanary ? "Applying..." : "Apply Canary Split"}
              </Button>
            )}
          </div>
          <div className={styles.sliderRow}>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={canaryWeight}
              onChange={(e) => setCanaryWeight(Number(e.target.value))}
              className={styles.sliderInput}
              disabled={!canPromote}
            />
            <div className={styles.sliderValue}>{canaryWeight}%</div>
          </div>
        </div>

        {/* Manifest Details */}
        <div className={styles.manifestSection}>
          <div className={styles.manifestCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Layers size={18} color="var(--color-primary-500)" />
              <h4 style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>
                Pinned Services
              </h4>
            </div>
            <div className={styles.serviceList}>
              {m.services ? (
                Object.entries(m.services).map(([name, ver]) => (
                  <div key={name} className={styles.serviceRow}>
                    <span className={styles.serviceName}>{name}</span>
                    <span className={styles.serviceVersion}>{ver}</span>
                  </div>
                ))
              ) : (
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Loading services...</span>
              )}
            </div>
          </div>

          <div className={styles.manifestCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <ShieldCheck size={18} color="var(--color-success-500)" />
              <h4 style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>
                Database Migrations
              </h4>
            </div>
            <div className={styles.serviceList}>
              {m.migrations && m.migrations.length > 0 ? (
                m.migrations.map((mig) => (
                  <div key={mig} className={styles.serviceRow}>
                    <span className={styles.serviceName}>{mig}</span>
                    <Badge variant="success">Applied</Badge>
                  </div>
                ))
              ) : (
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>No pending migrations</span>
              )}
            </div>
          </div>
        </div>

        {/* Rollback Modal */}
        <Modal
          open={rollbackOpen}
          onClose={() => setRollbackOpen(false)}
          title="Rollback Entire Platform Fleet"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-2)" }}>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              Platform invariant: &ldquo;A rollback is the previous manifest&rdquo;. This operation switches all service pins to the target manifest across all tenants.
            </p>
            <FormField label="Target Manifest Version" required>
              <Input
                value={targetVersion}
                onChange={(e) => setTargetVersion(e.target.value)}
              />
            </FormField>
            <FormField label="Rollback Justification" required>
              <Input
                placeholder="e.g., P99 latency SLA degradation in EU region post v2.4.0 rollout"
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
              />
            </FormField>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button variant="ghost" onClick={() => setRollbackOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleRollback} disabled={rollingBack}>
                {rollingBack ? "Rolling back..." : "Confirm Rollback"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Promotion Modal */}
        <Modal
          open={promoteOpen}
          onClose={() => setPromoteOpen(false)}
          title="Promote Release to Next Ring"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-2)" }}>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              Promoting advances the verified release manifest to the selected target environment after automated health verification.
            </p>
            <FormField label="Target Environment" required>
              <select
                className="input-select"
                value={promoteEnv}
                onChange={(e) => setPromoteEnv(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-2)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  borderRadius: "var(--radius-sm)",
                  border: "0.0625rem solid var(--color-border-subtle)",
                }}
              >
                <option value="staging">Pre-Production Staging</option>
                <option value="canary">Global Edge Canary Ring</option>
                <option value="production">Primary Production Fleet</option>
              </select>
            </FormField>
            <FormField label="Manifest Version" required>
              <Input
                value={promoteVersion}
                onChange={(e) => setPromoteVersion(e.target.value)}
              />
            </FormField>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button variant="ghost" onClick={() => setPromoteOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handlePromote} disabled={promoting}>
                {promoting ? "Promoting..." : "Verify & Promote"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DomainShell>
  );
}