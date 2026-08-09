"use client";
/**
 * Ops → Queues.
 *
 * Message queues and their depth / dead-letter picture from the operations
 * API. Real reads with honest loading/error/empty states.
 */
import { Inbox, Layers, MessageSquare, Trash2 } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface QueueRow {
  name?: string;
  pending?: number;
  processing?: number;
  scheduled?: number;
  total?: number;
  deadLetter?: number;
}

function numberOrZero(v: number | undefined): number {
  return Number(v) || 0;
}

export default function OpsQueues() {
  const queues = useList<QueueRow>({ path: "/platform/v1/operations/queues" });

  const pending = queues.data.reduce((acc, q) => acc + numberOrZero(q.pending), 0);
  const processing = queues.data.reduce((acc, q) => acc + numberOrZero(q.processing), 0);
  const deadLetters = queues.data.reduce((acc, q) => acc + numberOrZero(q.deadLetter), 0);

  const stats: StatCardItem[] = [
    { label: "Queues", value: queues.data.length, icon: <Layers size={18} /> },
    { label: "Pending", value: pending, icon: <Inbox size={18} /> },
    { label: "Processing", value: processing, icon: <MessageSquare size={18} /> },
    { label: "Dead letters", value: deadLetters, icon: <Trash2 size={18} /> },
  ];

  if (queues.loading) {
    return (
      <DomainShell domainId="ops" title="Queues">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="ops"
      title="Queues"
      description="Message queues, depth and dead-letter state across the platform."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        {queues.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
            {queues.error.message}
          </p>
        ) : queues.data.length === 0 ? (
          <EmptyState title="No queues" description="The queues endpoint returned no queues." />
        ) : (
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Queues</h3>
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {queues.data.map((q) => {
                const dl = numberOrZero(q.deadLetter);
                return (
                  <li key={q.name ?? "?"} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontWeight: 500 }}>{q.name ?? "—"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        pending {numberOrZero(q.pending)}
                      </span>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        processing {numberOrZero(q.processing)}
                      </span>
                      {dl > 0 ? (
                        <Badge variant="danger">{dl} dead letters</Badge>
                      ) : (
                        <Badge variant="success">NO DEAD LETTERS</Badge>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </DomainShell>
  );
}