"use client";
import { Badge, Button } from "@kannan19302/ui";
import { DataWorkspace } from "@kannan19302/ui/shell";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface ServiceRow {
  service: string;
  name: string;
  status: string;
  region?: string;
  latencyMs?: number;
  p95LatencyMs?: number;
  errorRatePct?: number;
  version?: string;
}

export default function OpsServices() {
  const services = useList<ServiceRow>({ path: "/platform/v1/operations/health/services" });
  return (
    <DomainShell domainId="ops" title="Services" description="Service health and measured telemetry. Missing measurements are unknown."
      actions={<Button variant="outline" size="sm" disabled={services.loading} onClick={() => void services.reload()}>{services.loading ? "Refreshing…" : "Refresh services"}</Button>}>
      <DataWorkspace<ServiceRow>
        data={services.data} loading={services.loading} getRowId={row => row.service}
        searchPlaceholder="Search services, status or region…"
        error={services.error ? <p role="alert">{services.error.message}</p> : undefined}
        emptyTitle={services.error ? "Service telemetry unavailable" : "No measured services"}
        emptyDescription="Refresh after telemetry sources become available."
        columns={[
          { key: "name", header: "Service" },
          { key: "status", header: "Health", render: (_, row) => <Badge variant={row.status === "HEALTHY" ? "success" : row.status === "UNHEALTHY" ? "danger" : "default"}>{row.status || "UNKNOWN"}</Badge> },
          { key: "region", header: "Region", render: value => String(value ?? "Unknown") },
          { key: "latencyMs", header: "Probe latency", align: "right", render: value => typeof value === "number" ? `${value} ms` : "Unknown" },
          { key: "p95LatencyMs", header: "p95 latency", align: "right", render: value => typeof value === "number" ? `${value} ms` : "Unknown" },
          { key: "errorRatePct", header: "Error rate", align: "right", render: value => typeof value === "number" ? `${value}%` : "Unknown" },
          { key: "version", header: "Version", render: value => String(value ?? "Unknown") },
        ]}
      />
    </DomainShell>
  );
}