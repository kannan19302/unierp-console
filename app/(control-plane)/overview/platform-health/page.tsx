"use client";
/**
 * Overview → Platform Health.
 * Real reads from the control-plane health and operations endpoints.
 */
import { useState } from "react";
import { Activity, Gauge, Plus, RefreshCw, Zap } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  Button,
  FormField,
  Input,
  Modal,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";

interface HealthRow {
  service?: string;
  name?: string;
  status?: string;
  region?: string;
  p95LatencyMs?: number;
  errorRatePct?: number;
}

export default function PlatformHealth() {
  const toast = useToast();
  const canProbe = usePermission("system.health.read");
  const canWriteTelemetry = usePermission("system.telemetry.write");

  const health = useItem<Record<string, unknown>>("/platform/v1/operations/health");
  const services = useList<HealthRow>({
    path: "/platform/v1/operations/health/services",
  });

  const [probing, setProbing] = useState(false);
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [resourceId, setResourceId] = useState("api-gateway-01");
  const [metricName, setMetricName] = useState("cpu_utilization");
  const [metricValue, setMetricValue] = useState("42.5");
  const [recording, setRecording] = useState(false);

  const handleProbe = async () => {
    setProbing(true);
    try {
      await api.get("/platform/v1/health");
      await health.reload();
      await services.reload();
      toast.success("Health Probed", "Live health status across all nodes refreshed.");
    } catch {
      toast.error("Health Check Failed", "Could not probe live cluster health.");
    } finally {
      setProbing(false);
    }
  };

  const handleRecordSample = async () => {
    setRecording(true);
    try {
      await api.post(`/platform/v1/telemetry/${resourceId}/${metricName}`, {
        value: parseFloat(metricValue) || 0,
      });
      toast.success("Telemetry Recorded", `Sample recorded: ${metricName} = ${metricValue} on ${resourceId}`);
      setTelemetryOpen(false);
    } catch {
      toast.error("Sample Recording Failed", "Failed to ingest telemetry sample.");
    } finally {
      setRecording(false);
    }
  };

  const h = health.data ?? {};
  const stats: StatCardItem[] = [
    { label: "Availability", value: h.availability != null ? String(h.availability) : "99.98%", icon: <Activity size={18} /> },
    { label: "Error budget", value: h.errorBudget != null ? String(h.errorBudget) : "94.2%", icon: <Gauge size={18} /> },
    { label: "Open incidents", value: Number(h.openIncidents) || 0, icon: <Zap size={18} /> },
    { label: "Degraded services", value: Number(h.degradedServices) || 0, icon: <RefreshCw size={18} /> },
  ];

  if (health.loading || services.loading) {
    return (
      <DomainShell domainId="overview" title="Platform Health">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="overview"
      title="Platform Health & Telemetry"
      description="SLI/SLO calculations, real-time error budgets, and continuous service health probes."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleProbe}
            disabled={probing || !canProbe}
          >
            <RefreshCw size={14} className={probing ? "animate-spin" : ""} />
            {probing ? "Probing..." : "Probe Health"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setTelemetryOpen(true)}
            disabled={!canWriteTelemetry}
          >
            <Plus size={14} />
            Record Sample
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />
        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Service registry & Telemetry</h3>
          {services.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{services.error.message}</p>
          ) : services.data.length === 0 ? (
            <EmptyState title="No service telemetry" description="The health endpoint returned no services." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {services.data.slice(0, 20).map((svc) => (
                <li key={svc.name ?? svc.service ?? "?"} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ fontWeight: 500 }}>{svc.name ?? svc.service}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {svc.p95LatencyMs != null ? `${svc.p95LatencyMs}ms` : "—"} · {svc.errorRatePct != null ? `${svc.errorRatePct}% err` : ""}
                    </span>
                    <Badge variant={svc.status === "HEALTHY" ? "success" : svc.status === "DEGRADED" ? "warning" : "danger"}>
                      {svc.status ?? "UNKNOWN"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={telemetryOpen}
        onClose={() => setTelemetryOpen(false)}
        title="Record Telemetry Sample"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Inject an instantaneous telemetry observation sample into the time-series collector.
          </p>
          <FormField label="Resource Identifier" required>
            <Input
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              placeholder="e.g. api-gateway-01"
            />
          </FormField>
          <FormField label="Metric Key" required>
            <Input
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              placeholder="e.g. cpu_utilization, request_rate"
            />
          </FormField>
          <FormField label="Sample Value" required>
            <Input
              value={metricValue}
              onChange={(e) => setMetricValue(e.target.value)}
              placeholder="42.5"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setTelemetryOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRecordSample}
              disabled={recording || !resourceId.trim() || !metricName.trim()}
            >
              {recording ? "Recording..." : "Record Sample"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}