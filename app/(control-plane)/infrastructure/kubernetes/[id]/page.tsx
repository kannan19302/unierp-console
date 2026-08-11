"use client";
/**
 * Infrastructure → Kubernetes → routing detail.
 * M19 — the detail route the exit criterion requires. Changing the weight
 * here goes through propose (compile a plan, request approval) then apply
 * (a different operator decides, the durable job writes the change) —
 * never a direct field edit.
 */
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Badge,
  Input,
  Button,
  ErrorState,
  LoadingState,
  usePermission,
  useToast,
} from "@kannan19302/ui";
import { useItem, useMutation } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";

interface DesiredStateVersionRow {
  version: number;
  state: { weight?: number };
  setAt: string;
}

interface RoutingDetail {
  id: string;
  tenantId: string;
  clusterId: string;
  nodeGroup: string;
  weight: number;
  isDedicated: boolean;
  resourceId: string | null;
  versions: DesiredStateVersionRow[];
}

export default function KubernetesRoutingDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const canUpdate = usePermission("system.clusters.update");

  const detail = useItem<RoutingDetail>(`/platform/v1/kubernetes/routing/${params.id}`);
  const [newWeight, setNewWeight] = useState<string>("");
  const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(null);

  const propose = useMutation(async (weight: number) =>
    api.post("/platform/v1/kubernetes/routing/propose", {
      tenantId: detail.data!.tenantId,
      clusterId: detail.data!.clusterId,
      weight,
    }),
  );
  const apply = useMutation(async () =>
    api.post("/platform/v1/kubernetes/routing/apply", {
      approvalId: pendingApprovalId,
      resourceId: detail.data!.resourceId,
      tenantId: detail.data!.tenantId,
      clusterId: detail.data!.clusterId,
      weight: Number(newWeight),
    }),
  );

  const submitProposal = async () => {
    const weight = Number(newWeight);
    if (!Number.isFinite(weight) || weight < 0) return;
    try {
      const result = (await propose.run(weight)) as { approval: { id: string } };
      setPendingApprovalId(result.approval.id);
      toast.success("Change proposed", "A different operator must approve it before it applies.");
    } catch (e) {
      toast.error("Proposal failed", e instanceof Error ? e.message : String(e));
    }
  };

  const submitApply = async () => {
    try {
      await apply.run(undefined);
      toast.success("Routing weight applied");
      setPendingApprovalId(null);
      setNewWeight("");
      detail.reload();
    } catch (e) {
      toast.error("Apply failed", e instanceof Error ? e.message : String(e));
    }
  };

  if (detail.loading) {
    return (
      <DomainShell domainId="infrastructure" title="Infrastructure · Kubernetes" description="Routing detail">
        <LoadingState message="Loading routing detail..." />
      </DomainShell>
    );
  }
  if (detail.error || !detail.data) {
    return (
      <DomainShell domainId="infrastructure" title="Infrastructure · Kubernetes" description="Routing detail">
        <ErrorState description={detail.error?.message ?? "Not found"} onRetry={detail.reload} />
      </DomainShell>
    );
  }

  const d = detail.data;

  return (
    <DomainShell domainId="infrastructure" title="Infrastructure · Kubernetes" description={`${d.tenantId} on ${d.clusterId}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Button variant="ghost" size="sm" onClick={() => router.push("/infrastructure/kubernetes")}>
          ← Back to routing
        </Button>

        <Card padding="md">
          <h3 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: 600 }}>
            {d.tenantId} → {d.clusterId}
          </h3>
          <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--space-2) var(--space-4)", fontSize: "var(--text-sm)" }}>
            <dt style={{ color: "var(--color-text-secondary)" }}>Node group</dt>
            <dd style={{ margin: 0 }}>{d.nodeGroup}</dd>
            <dt style={{ color: "var(--color-text-secondary)" }}>Current weight</dt>
            <dd style={{ margin: 0 }}>
              <Badge variant={d.weight === 0 ? "danger" : "default"}>{d.weight}</Badge>
            </dd>
            <dt style={{ color: "var(--color-text-secondary)" }}>Dedicated</dt>
            <dd style={{ margin: 0 }}>{d.isDedicated ? "yes" : "no"}</dd>
          </dl>
        </Card>

        {canUpdate && (
          <Card padding="md">
            <h3 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: 600 }}>Change routing weight</h3>
            {!pendingApprovalId ? (
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                <Input type="number" placeholder="New weight" value={newWeight} onChange={(e: any) => setNewWeight(e.target.value)} />
                <Button variant="primary" onClick={submitProposal} disabled={propose.loading || newWeight === ""}>
                  Propose change
                </Button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Proposed weight {newWeight} is pending approval (approval {pendingApprovalId}). A DIFFERENT operator must
                  apply it — this console session may reject its own proposal.
                </p>
                <Button variant="primary" onClick={submitApply} disabled={apply.loading}>
                  Approve and apply
                </Button>
              </div>
            )}
          </Card>
        )}

        <Card padding="md">
          <h3 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: 600 }}>Version history</h3>
          {d.versions.length === 0 ? (
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              No changes have gone through the plan pipeline for this routing pair yet.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {d.versions.map((v) => (
                <li key={v.version} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-1)" }}>
                  <span>v{v.version} — weight {v.state.weight}</span>
                  <span style={{ color: "var(--color-text-muted)" }}>{new Date(v.setAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}
