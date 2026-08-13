"use client";
/**
 * AI Platform → Evaluation.
 * Model evaluation suites and their runs across bound providers.
 */
import { FlaskConical, CheckCircle2, XCircle, PlayCircle } from "lucide-react";
import { Card, EmptyState, Spinner, Badge, StatCardRow, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

type BadgeVariant = "success" | "default" | "primary" | "warning" | "danger" | "info";

interface SuiteRow {
  id?: string;
  name?: string;
  description?: string;
  cases?: number;
  _count?: { cases?: number };
  createdAt?: string;
}

interface RunRow {
  id?: string;
  suiteId?: string;
  suiteName?: string;
  providerId?: string;
  providerName?: string;
  status?: string;
  passed?: number;
  total?: number;
  createdAt?: string;
}

function statusVariant(s?: string): BadgeVariant {
  const v = (s ?? "").toUpperCase();
  if (["PASSED", "SUCCESS", "COMPLETED", "PASS"].includes(v)) return "success";
  if (["FAILED", "ERROR", "BLOCKED"].includes(v)) return "danger";
  if (["RUNNING", "PENDING", "QUEUED"].includes(v)) return "warning";
  return "default";
}

export default function AiEvaluationPage() {
  const suites = useList<SuiteRow>({ path: "/platform/v1/ai/eval-suites" });
  const runs = useList<RunRow>({ path: "/platform/v1/ai/eval-runs" });

  const caseTotal = suites.data.reduce(
    (acc, s) => acc + (s.cases ?? s._count?.cases ?? 0),
    0,
  );
  const passed = runs.data.filter((r) => statusVariant(r.status) === "success").length;

  const stats: StatCardItem[] = [
    { label: "Eval suites", value: suites.total ?? suites.data.length, icon: <FlaskConical size={18} /> },
    { label: "Cases", value: caseTotal || "—", icon: <CheckCircle2 size={18} /> },
    { label: "Runs passed", value: passed || "—", icon: <PlayCircle size={18} /> },
  ];

  return (
    <DomainShell
      domainId="ai"
      title="Evaluation"
      description="Model evaluation suites and run outcomes per provider."
    >
      {suites.loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <StatCardRow stats={stats} columns={3} />

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Suites</h3>
            {suites.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {suites.error.message}
              </p>
            ) : suites.data.length === 0 ? (
              <div style={{ marginTop: "var(--space-3)" }}>
                <EmptyState title="No eval suites" description="No evaluation suites have been created yet." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {suites.data.map((s) => (
                  <li
                    key={s.id ?? s.name ?? "row"}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
                      <FlaskConical size={16} style={{ flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 500 }}>{s.name ?? s.id ?? "Unnamed suite"}</span>
                        <span style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {s.description ?? "—"}
                        </span>
                      </span>
                    </span>
                    <span style={{ flexShrink: 0 }}>
                      <Badge variant="info">{s.cases ?? s._count?.cases ?? 0} cases</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Runs</h3>
            {runs.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {runs.error.message}
              </p>
            ) : runs.data.length === 0 ? (
              <div style={{ marginTop: "var(--space-3)" }}>
                <EmptyState title="No eval runs" description="No evaluation suite has been run yet." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {runs.data.map((r) => (
                  <li
                    key={r.id ?? "row"}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
                      {statusVariant(r.status) === "success" ? (
                        <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                      ) : statusVariant(r.status) === "danger" ? (
                        <XCircle size={16} style={{ flexShrink: 0 }} />
                      ) : (
                        <PlayCircle size={16} style={{ flexShrink: 0 }} />
                      )}
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 500 }}>{r.suiteName ?? r.suiteId ?? r.id ?? "Unnamed run"}</span>
                        <span style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {[r.providerName ?? r.providerId, typeof r.passed === "number" && typeof r.total === "number" ? `${r.passed}/${r.total}` : null]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </span>
                    </span>
                    <span style={{ flexShrink: 0 }}>
                      <Badge variant={statusVariant(r.status)}>{r.status ?? "unknown"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </DomainShell>
  );
}