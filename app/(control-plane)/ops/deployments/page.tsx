"use client";
/**
 * Ops → Deployments.
 * Deployment targets of the current release manifest: auto-deploy gates,
 * human-approval requirements and rollback pointers per environment.
 */
import { CloudUpload, GitBranch } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface DeploymentTarget {
  auto_deploy?: boolean;
  gate?: string;
  requires_human_approval?: boolean;
  rollback_sha?: string | null;
}

export default function OpsDeployments() {
  const manifest = useItem<{
    version?: string;
    releaseTrain?: string;
    train?: string;
    deployment?: Record<string, DeploymentTarget>;
    previousManifestVersion?: string;
  }>("/platform/v1/releases/manifest");

  const m = manifest.data ?? {};
  const deployment = (m.deployment ?? {}) as Record<string, DeploymentTarget>;
  const targets =
    Object.keys(deployment).length > 0 ? Object.entries(deployment) : [];

  const autoCount = targets.filter(
    ([, t]) => t.auto_deploy === true,
  ).length;

  const stats: StatCardItem[] = [
    { label: "Deployment targets", value: targets.length, icon: <CloudUpload size={18} /> },
    { label: "Auto-deploy", value: autoCount, icon: <GitBranch size={18} /> },
    {
      label: "Release version",
      value: m.version ?? m.releaseTrain ?? m.train ?? "—",
      icon: <GitBranch size={18} />,
    },
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
      title="Deployments"
      description="Where the release train is deployed: deploy gates, approvals and rollback pointers."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={3} />
        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Deployment targets
          </h3>
          {manifest.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
              {manifest.error.message}
            </p>
          ) : manifest.data === null || targets.length === 0 ? (
            <EmptyState
              title="No deployment targets"
              description="The release manifest did not declare any deployment targets."
            />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {targets.map(([name, t]) => (
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
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      gate: {t.gate ?? "—"}
                    </span>
                    <Badge variant={t.auto_deploy === true ? "info" : "warning"}>
                      {t.auto_deploy === true ? "auto-deploy" : "manual"}
                    </Badge>
                    {t.requires_human_approval === true && (
                      <Badge variant="danger">human approval required</Badge>
                    )}
                    {t.rollback_sha && (
                      <Badge variant="default">rb: {String(t.rollback_sha).slice(0, 8)}</Badge>
                    )}
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