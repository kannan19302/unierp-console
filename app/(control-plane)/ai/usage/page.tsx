"use client";
/**
 * AI Platform → Usage.
 * AI usage from the operations dashboard summary. No standalone AI usage
 * endpoint is exposed, so this reads the usage fields the dashboard returns.
 */
import { Activity, Cpu, Zap, Layers } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, type StatCardItem } from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

function num(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
}

export default function AiUsagePage() {
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");
  const s = summary.data ?? {};

  const { aiRequests, aiTokens, aiLatencyMs, aiModels, aiLatency } = s;
  const requests = num(aiRequests);
  const tokens = num(aiTokens);
  const latency = num(aiLatencyMs ?? aiLatency);
  const activeModels = num(aiModels);

  const stats: StatCardItem[] = [
    { label: "AI requests", value: requests !== undefined ? requests.toLocaleString() : "—", icon: <Activity size={18} /> },
    { label: "Tokens processed", value: tokens !== undefined ? tokens.toLocaleString() : "—", icon: <Zap size={18} /> },
    { label: "Avg latency (ms)", value: latency !== undefined ? latency.toLocaleString() : "—", icon: <Cpu size={18} /> },
    { label: "Active models", value: activeModels !== undefined ? activeModels.toLocaleString() : "—", icon: <Layers size={18} /> },
  ];

  return (
    <DomainShell
      domainId="ai"
      title="Usage"
      description="Provider-side AI consumption across the platform."
    >
      {summary.loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <StatCardRow stats={stats} columns={4} />
          <Card padding="md">
            {summary.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {summary.error.message}
              </p>
            ) : requests === undefined && tokens === undefined ? (
              <EmptyState
                title="No usage reported"
                description="The operations dashboard summary returned no AI usage fields."
              />
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  margin: "var(--space-2) 0 0",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                {[
                  { label: "Requests", value: requests },
                  { label: "Tokens", value: tokens },
                  { label: "Latency (ms)", value: latency },
                  { label: "Active models", value: activeModels },
                ]
                  .filter((r) => r.value !== undefined)
                  .map((r) => (
                    <li
                      key={r.label}
                      style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}
                    >
                      <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                        {r.label}
                      </span>
                      <span style={{ fontWeight: 500 }}>{r.value?.toLocaleString()}</span>
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