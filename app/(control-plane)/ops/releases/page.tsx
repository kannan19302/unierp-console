"use client";
/**
 * Ops → Releases.
 * The current release manifest: release train, component pins, deployment
 * gates and rollback strategy from the real /platform/v1/releases/manifest.
 */
import { useState } from "react";
import { ArrowLeftRight, PackageOpen, RefreshCw, Rocket, RotateCcw, ShieldCheck } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  FormField,
  Input,
  Modal,
  Spinner,
  StatCardRow,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";

interface ManifestComponent {
  name: string;
  version?: string;
  autoDeploy?: boolean;
  gate?: string;
}

interface ReleaseManifest {
  train?: string;
  version?: string;
  releaseTrain?: string;
  deployedAt?: string;
  pinnedAt?: string;
  components?: Record<string, unknown>;
  services?: Record<string, unknown>;
  migrations?: string[];
  previousManifestVersion?: string;
  deployment?: Record<string, Record<string, unknown>>;
  rollback_policy?: Record<string, unknown>;
}

export default function OpsReleases() {
  const toast = useToast();
  const canRollback = usePermission("system.release.rollback");
  const canPromote = usePermission("system.release.promote");

  const manifest = useItem<ReleaseManifest>("/platform/v1/releases/manifest");
  const m = manifest.data ?? {};

  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [targetVersion, setTargetVersion] = useState(m.previousManifestVersion ?? "v1.0.0");
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollingBack, setRollingBack] = useState(false);

  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteEnv, setPromoteEnv] = useState("staging");
  const [promoteVersion, setPromoteVersion] = useState(m.version ?? "v1.1.0");
  const [promoting, setPromoting] = useState(false);

  const version = String(m.version ?? m.train ?? m.releaseTrain ?? "—");
  const deployedAt = m.deployedAt ?? m.pinnedAt ?? "—";

  const componentEntry = Object.entries(m.components ?? m.services ?? {});
  const migrations = Array.isArray(m.migrations) ? m.migrations : [];
  const previousVersion = String(m.previousManifestVersion ?? "—");

  const handleRollback = async () => {
    setRollingBack(true);
    try {
      await api.post("/platform/v1/releases/rollback", {
        targetManifestVersion: targetVersion,
        reason: rollbackReason || "Manual rollback initiated via Operator Console",
      });
      await manifest.reload();
      toast.success("Rollback Dispatched", `Platform reverting to manifest ${targetVersion}.`);
      setRollbackOpen(false);
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
      await manifest.reload();
      toast.success("Release Promoted", `Version ${promoteVersion} promoted to ${promoteEnv}.`);
      setPromoteOpen(false);
    } catch {
      toast.error("Promotion Failed", "Failed to promote release version.");
    } finally {
      setPromoting(false);
    }
  };

  const stats: StatCardItem[] = [
    { label: "Release version", value: version, icon: <Rocket size={18} /> },
    { label: "Pinned components", value: componentEntry.length, icon: <PackageOpen size={18} /> },
    { label: "Migrations", value: migrations.length, icon: <PackageOpen size={18} /> },
  ];

  if (manifest.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="ops"
      title="Releases"
      description="The pinned release train — every component version in the current manifest."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => manifest.reload()}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPromoteOpen(true)}
            disabled={!canPromote}
          >
            <ArrowLeftRight size={14} />
            Promote
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setTargetVersion(m.previousManifestVersion ?? "v1.0.0");
              setRollbackOpen(true);
            }}
            disabled={!canRollback}
          >
            <RotateCcw size={14} />
            Rollback
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={3} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Current manifest
            </h3>
            {manifest.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
                {manifest.error.message}
              </p>
            ) : manifest.data === null ? (
              <EmptyState
                title="No release manifest"
                description="The manifest endpoint returned no data."
              />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {componentEntry.slice(0, 20).map(([name, ver]) => (
                  <li
                    key={name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{name}</span>
                    <Badge variant="primary">{typeof ver === "string" ? ver : JSON.stringify(ver)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Deployment & migrations
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
              {migrations.length > 0 ? (
                <div>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Applied migrations</p>
                  <ul style={{ listStyle: "none", margin: "var(--space-2) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                    {migrations.map((mig) => (
                      <li key={mig} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                        <ShieldCheck size={14} color="var(--color-success)" /> {mig}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <EmptyState title="No migrations" description="The manifest carries no migration list." />
              )}
              <div>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600 }}>
                  Deployed at {deployedAt}
                </p>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Previous version: {previousVersion}
                </p>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Rollback strategy: {rollbackStrategy(m.rollback_policy)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={rollbackOpen}
        onClose={() => setRollbackOpen(false)}
        title="Platform Release Rollback"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-danger)" }}>
            Warning: This triggers a platform-wide release rollback across all active tenants and nodes.
          </p>
          <FormField label="Target Manifest Version">
            <Input
              value={targetVersion}
              onChange={(e) => setTargetVersion(e.target.value)}
              placeholder="e.g. v1.0.0"
            />
          </FormField>
          <FormField label="Reason for Rollback">
            <Input
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              placeholder="e.g. Critical regression observed in billing outbox"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setRollbackOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRollback}
              disabled={rollingBack || !targetVersion.trim()}
            >
              {rollingBack ? "Rolling back..." : "Confirm Rollback"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        title="Promote Release Version"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Promote the current release manifest to a target deployment ring/environment.
          </p>
          <FormField label="Target Environment">
            <Input
              value={promoteEnv}
              onChange={(e) => setPromoteEnv(e.target.value)}
              placeholder="e.g. staging, canary, production"
            />
          </FormField>
          <FormField label="Target Manifest Version">
            <Input
              value={promoteVersion}
              onChange={(e) => setPromoteVersion(e.target.value)}
              placeholder="e.g. v1.1.0"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setPromoteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePromote}
              disabled={promoting || !promoteEnv.trim() || !promoteVersion.trim()}
            >
              {promoting ? "Promoting..." : "Confirm Promotion"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}

function rollbackStrategy(policy: Record<string, unknown> | undefined): string {
  if (!policy) return "previous-manifest";
  return String(policy.strategy ?? "previous-manifest");
}