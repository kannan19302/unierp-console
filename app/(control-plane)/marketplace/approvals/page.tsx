"use client";
/**
 * Marketplace → Approvals (PCC-15 Ecosystem App & Extension Marketplace & OCC-21).
 *
 * The submissions review queue. Lists pending submissions from
 * `/platform/v1/marketplace/submissions` and wires the verified approve /
 * reject / emergency revoke actions.
 */
import { useCallback, useState } from "react";
import { AlertOctagon, Check, RefreshCw, X } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  Spinner,
  usePermission,
  useToast,
} from "@kannan19302/ui";
import { api } from "@/lib/api";
import { useList, useMutation } from "@/lib/data";
import { useSession } from "@kannan19302/shared/auth-client/react";
import DomainShell from "@/components/domain-shell";

interface SubmissionRow {
  id?: string;
  name?: string;
  slug?: string;
  status?: string;
  submittedAt?: string;
}

const PENDING_STATUSES = ["PENDING_REVIEW", "PENDING", "IN_REVIEW"];

const STATUS_VARIANT = (s?: string) =>
  s === "APPROVED" || s === "PUBLISHED" || s === "ACTIVE"
    ? "success"
    : s === "PENDING_REVIEW" || s === "PENDING" || s === "IN_REVIEW"
      ? "warning"
      : s === "REJECTED" || s === "FAILED" || s === "DISABLED"
        ? "danger"
        : "default";

export default function MarketplaceApprovalsPage() {
  const toast = useToast();
  const canApprove = usePermission("system.marketplace.write");
  const { claims } = useSession();
  const submissions = useList<SubmissionRow>({
    path: "/platform/v1/marketplace/submissions",
  });

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetSubmission, setTargetSubmission] = useState<SubmissionRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeSlug, setRevokeSlug] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);

  const handleApprove = async (id?: string, name?: string) => {
    if (!id) return;
    try {
      await api.post(`/platform/v1/marketplace/${id}/approve`, {
        actorId: claims?.sub || "operator-reviewer",
      });
      await submissions.reload();
      toast.success("Extension Approved", `Approved extension ${name || id} for platform catalog.`);
    } catch {
      toast.error("Approval Failed", "Failed to approve extension submission.");
    }
  };

  const handleReject = async () => {
    if (!targetSubmission?.id) return;
    setRejecting(true);
    try {
      await api.post(`/platform/v1/marketplace/${targetSubmission.id}/reject`, {
        reason: rejectReason,
        actorId: claims?.sub || "operator-reviewer",
      });
      await submissions.reload();
      toast.success("Extension Rejected", `Rejected extension ${targetSubmission.name || targetSubmission.id}.`);
      setRejectModalOpen(false);
      setTargetSubmission(null);
      setRejectReason("");
    } catch {
      toast.error("Rejection Failed", "Failed to reject extension submission.");
    } finally {
      setRejecting(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeSlug) return;
    setRevoking(true);
    try {
      await api.post(`/platform/v1/marketplace/extensions/${revokeSlug}/emergency-revoke`, {
        reason: revokeReason,
        actorId: claims?.sub || "security-admin",
      });
      await submissions.reload();
      toast.success("Emergency Revocation Issued", `Extension ${revokeSlug} revoked across all tenant runtimes.`);
      setRevokeModalOpen(false);
      setRevokeSlug("");
      setRevokeReason("");
    } catch {
      toast.error("Revocation Failed", "Failed to execute emergency revocation.");
    } finally {
      setRevoking(false);
    }
  };

  if (submissions.loading) {
    return (
      <DomainShell
        domainId="marketplace"
        title="Approvals"
        description="Review incoming extension submissions."
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  const queue = submissions.data.filter((x) =>
    PENDING_STATUSES.includes(String(x.status)),
  );
  const reviewed = submissions.data.filter(
    (x) => !PENDING_STATUSES.includes(String(x.status ?? "")),
  );

  return (
    <DomainShell
      domainId="marketplace"
      title="Marketplace Listing Reviews & Sandboxing"
      description="Review incoming developer extensions, verify security permissions, sign off catalog listings, or execute emergency sandbox revocations."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => submissions.reload()}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRevokeModalOpen(true)}
            disabled={!canApprove}
          >
            <AlertOctagon size={14} />
            Emergency Revoke
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        {submissions.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
            {submissions.error.message}
          </p>
        ) : submissions.data.length === 0 ? (
          <Card padding="md">
            <EmptyState
              title="No submissions to review"
              description="The submissions endpoint returned no rows."
            />
          </Card>
        ) : (
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Review queue ({queue.length})
            </h3>
            <ul
              style={{
                listStyle: "none",
                margin: "var(--space-3) 0 0",
                padding: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {queue.map((row) => (
                <li
                  key={row.id ?? row.name ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-3) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                    <span style={{ fontWeight: 600 }}>{row.name ?? row.id ?? "—"}</span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {row.slug ?? "—"} · {row.submittedAt ?? ""}
                    </span>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <Badge variant={STATUS_VARIANT(row.status)}>{row.status ?? "UNKNOWN"}</Badge>
                    {canApprove && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(row.id, row.name)}
                        >
                          <Check size={14} /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTargetSubmission(row);
                            setRejectModalOpen(true);
                          }}
                        >
                          <X size={14} /> Reject
                        </Button>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {reviewed.length > 0 && (
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Previously reviewed ({reviewed.length})
            </h3>
            <ul
              style={{
                listStyle: "none",
                margin: "var(--space-3) 0 0",
                padding: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {reviewed.map((row) => (
                <li
                  key={row.id ?? row.name ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{row.name ?? row.id ?? "—"}</span>
                  <Badge variant={STATUS_VARIANT(row.status)}>{row.status ?? "UNKNOWN"}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Modal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title={`Reject Submission: ${targetSubmission?.name || targetSubmission?.id}`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Provide feedback explaining why this extension submission failed security, compliance, or quality criteria.
          </p>
          <FormField label="Rejection Reason" required>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Missing required RBAC scopes or excessive permission requests"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReject}
              disabled={rejecting || !rejectReason.trim()}
            >
              {rejecting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        title="Emergency Extension Revocation"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-danger)" }}>
            Warning: This immediately terminates sandbox execution and uninstalls the extension across all tenant clusters.
          </p>
          <FormField label="Extension App Slug" required>
            <Input
              value={revokeSlug}
              onChange={(e) => setRevokeSlug(e.target.value)}
              placeholder="e.g. malicious-webhook-connector"
            />
          </FormField>
          <FormField label="Incident / Justification Reason" required>
            <Input
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g. Critical 0-day vulnerability identified (SEV-1)"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setRevokeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRevoke}
              disabled={revoking || !revokeSlug.trim() || !revokeReason.trim()}
            >
              {revoking ? "Revoking..." : "Execute Emergency Revoke"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}