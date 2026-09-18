"use client";
import { Badge, Button } from "@kannan19302/ui";
import { DataWorkspace } from "@kannan19302/ui/shell";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface QueueRow {
  name: string;
  pending?: number;
  processing?: number;
  scheduled?: number;
  total?: number;
  deadLetter?: number;
  status?: string;
}
const count = (value: unknown) => typeof value === "number" ? value.toLocaleString() : "Unknown";

export default function OpsQueues() {
  const queues = useList<QueueRow>({ path: "/platform/v1/operations/queues" });
  return (
    <DomainShell domainId="ops" title="Queues" description="Queue depth, running work and failures reported by operational sources."
      actions={<Button variant="outline" size="sm" disabled={queues.loading} onClick={() => void queues.reload()}>{queues.loading ? "Refreshing…" : "Refresh queues"}</Button>}>
      <DataWorkspace<QueueRow> data={queues.data} loading={queues.loading} getRowId={row => row.name}
        searchPlaceholder="Search queues…"
        error={queues.error ? <p role="alert">{queues.error.message}</p> : undefined}
        emptyTitle={queues.error ? "Queue telemetry unavailable" : "No queues reported"}
        emptyDescription="Refresh after queue telemetry becomes available."
        columns={[
          { key: "name", header: "Queue" },
          { key: "status", header: "Telemetry", render: value => <Badge variant={value === "ACTIVE" ? "success" : "default"}>{String(value ?? "UNKNOWN")}</Badge> },
          { key: "pending", header: "Waiting", align: "right", render: count },
          { key: "processing", header: "Running", align: "right", render: count },
          { key: "scheduled", header: "Scheduled", align: "right", render: count },
          { key: "deadLetter", header: "Failed", align: "right", render: count },
          { key: "total", header: "Total", align: "right", render: count },
        ]}
      />
    </DomainShell>
  );
}