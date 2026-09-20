"use client";

import { UserCheck } from "lucide-react";
import { Badge } from "@kannan19302/ui";
import styles from "../marketplace.module.css";
import type { MarketplaceSubmission } from "@/lib/marketplace-schema";
import { STAGES } from "@/lib/fixtures/marketplace";

interface SubmissionPipelineProps {
  submissions: MarketplaceSubmission[];
  selectedSub: MarketplaceSubmission | null;
  onOpenDetail: (sub: MarketplaceSubmission) => void;
}

export function SubmissionPipeline({
  submissions,
  selectedSub,
  onOpenDetail,
}: SubmissionPipelineProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
            Submission Review Pipeline (Kanban)
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Multi-stage governance pipeline: inspect static analysis, verify performance, and approve or reject submissions.
          </p>
        </div>
      </div>

      <div className={styles.pipelineGrid}>
        {STAGES.map((stage) => {
          const stageSubs = submissions.filter((s) => s.stage === stage.key);
          return (
            <div key={stage.key} className={styles.stageColumn}>
              <div className={styles.stageHeader}>
                <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{stage.label}</span>
                <Badge variant={stage.badgeVariant}>{stageSubs.length}</Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {stageSubs.length === 0 ? (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", textAlign: "center", padding: "var(--space-4)" }}>
                    No submissions in {stage.label.toLowerCase()}
                  </div>
                ) : (
                  stageSubs.map((sub) => (
                    <div
                      key={sub.id}
                      className={`${styles.submissionCard} ${selectedSub?.id === sub.id ? styles.submissionCardActive : ""}`}
                      onClick={() => onOpenDetail(sub)}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)" }}>
                        <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{sub.name}</span>
                        <Badge variant="primary">v{sub.version}</Badge>
                      </div>

                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                        By {sub.developerName} • {sub.category}
                      </div>

                      {sub.assignedReviewer ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-xs)", color: "var(--color-primary)" }}>
                          <UserCheck size={12} />
                          Reviewer: {sub.assignedReviewer.name}
                        </div>
                      ) : (
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-warning)" }}>
                          ⚠ Unassigned Reviewer
                        </div>
                      )}

                      {sub.feedbackNotes && (
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontStyle: "italic" }}>
                          &ldquo;{sub.feedbackNotes}&rdquo;
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
