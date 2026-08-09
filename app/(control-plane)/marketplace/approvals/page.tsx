"use client";
/**
 * Marketplace → Approvals.
 *
 * The submissions review queue. Lists pending submissions from
 * `/platform/v1/marketplace/submissions` and wires the verified approve /
 * reject actions (`POST /platform/v1/marketplace/:id/approve|reject`).
 */
import { useCallback, useState } from "react";
import { Check, X } from "lucide-react";
import { Card, EmptyState, Spinner, Badge, usePermission } from "@kannan19302/ui";
import { api } from "@/lib/api";
import { useList, useMutation } from "@/lib/data";
import { useSession } from "@/lib/session";
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
  const canApprove = usePermission("admin.platform.update");
  const { session } = useSession();
  const submissions = useList<SubmissionRow>({
    path: "/platform/v1/marketplace/submissions",
    disabled: !canApprove,
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const approve = useMutation(
    useCallback(
      async (id: string) => {
        await api.post(`/platform/v1/marketplace/${id}/approve`, {
          actorId: session?.userId || "SYSTEM",
        });
      },
      [session],
    ),
  );

  const reject = useMutation(
    useCallback(
      async (args: { id: string; reason: string }) => {
        await api.post(`/platform/v1/marketplace/${args.id}/reject`, {
          reason: args.reason,
          actorId: session?.userId || "SYSTEM",
        });
      },
      [session],
    ),
  );

  const runApprove = (id?: string) => {
    if (!id) return;
    setActionError(null);
    void approve.run(id).then(() => submissions.reload());
  };

  const runReject = (id?: string) => {
    if (!id) return;
    const reason = window.prompt("Reason for rejection");
    if (!reason) return;
    setActionError(null);
    void reject.run({ id, reason }).then(() => submissions.reload());
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
      title="Approvals"
      description="Review incoming extension submissions."
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
            {(approve.error || reject.error || actionError) && (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
                {actionError ?? approve.error?.message ?? reject.error?.message}
              </p>
            )}
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
                    <button
                      onClick={() => runApprove(row.id)}
                      disabled={approve.loading || reject.loading}
                      title="Approve"
                      aria-label={`Approve ${row.name ?? row.id ?? "submission"}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "var(--space-1)",
                        padding: "var(--space-1) var(--space-2)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        background: "transparent",
                        color: "var(--color-success)",
                        fontSize: "var(--text-sm)",
                        cursor: "pointer",
                      }}
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => runReject(row.id)}
                      disabled={approve.loading || reject.loading}
                      title="Reject"
                      aria-label={`Reject ${row.name ?? row.id ?? "submission"}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "var(--space-1)",
                        padding: "var(--space-1) var(--space-2)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        background: "transparent",
                        color: "var(--color-danger)",
                        fontSize: "var(--text-sm)",
                        cursor: "pointer",
                      }}
                    >
                      <X size={14} /> Reject
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {reviewed.length > 0 && (
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Previously reviewed
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
    </DomainShell>
  );
}