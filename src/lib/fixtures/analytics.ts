import type { CustomDashboard, ReportSchedule, AnomalyAlert } from "@/lib/analytics-schema";

export const INITIAL_DASHBOARDS: CustomDashboard[] = [
  {
    id: "dash-exec-revenue",
    name: "Executive Revenue & Churn Radar",
    description: "Core SaaS ARR, MRR, expansion velocity and logo retention metrics.",
    category: "REVENUE",
    isDefault: true,
    widgets: [
      { id: "w-1", title: "Current MRR", type: "KPI_CARD", metric: "MRR", gridSpan: 1 },
      { id: "w-2", title: "Logo Churn Rate", type: "KPI_CARD", metric: "CHURN_RATE", gridSpan: 1 },
      { id: "w-3", title: "Seat Utilization", type: "KPI_CARD", metric: "SEAT_UTILIZATION", gridSpan: 1 },
      { id: "w-4", title: "Active Tenants", type: "KPI_CARD", metric: "ACTIVE_TENANTS", gridSpan: 1 },
      { id: "w-5", title: "12-Month ARR Trajectory ($M)", type: "LINE_CHART", metric: "ARR", gridSpan: 2 },
      { id: "w-6", title: "Cohort Retention Breakdown (%)", type: "BAR_CHART", metric: "RETENTION", gridSpan: 2 },
    ],
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-03-10T12:00:00Z",
  },
  {
    id: "dash-platform-ops",
    name: "Control Plane Fleet Latency & Compute",
    description: "Kubernetes pod telemetry, request latency percentiles, and API throughput.",
    category: "OPERATIONS",
    isDefault: false,
    widgets: [
      { id: "w-7", title: "API p99 Latency (ms)", type: "KPI_CARD", metric: "API_LATENCY", gridSpan: 1 },
      { id: "w-8", title: "HTTP 5xx Error Rate", type: "KPI_CARD", metric: "ERROR_RATE", gridSpan: 1 },
      { id: "w-9", title: "Throughput Distribution", type: "BAR_CHART", metric: "THROUGHPUT", gridSpan: 2 },
      { id: "w-10", title: "Cluster Node Resource Allocation", type: "DATA_TABLE", metric: "K8S_FLEET", gridSpan: 4 },
    ],
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: "2026-03-12T14:30:00Z",
  },
];

export const INITIAL_SCHEDULES: ReportSchedule[] = [
  {
    id: "sched-exec-weekly",
    name: "Weekly Executive SaaS Performance Brief",
    dashboardId: "dash-exec-revenue",
    frequency: "WEEKLY",
    format: "PDF",
    recipients: ["exec-team@unierp.com", "board@unierp.com"],
    status: "ACTIVE",
    lastRunAt: "2026-03-16T08:00:00Z",
    nextRunAt: "2026-03-23T08:00:00Z",
    createdAt: "2026-02-10T09:00:00Z",
  },
  {
    id: "sched-ops-daily-csv",
    name: "Daily Platform Capacity & Ingestion Dump",
    dashboardId: "dash-platform-ops",
    frequency: "DAILY",
    format: "CSV",
    recipients: ["finops@unierp.com", "devops@unierp.com"],
    status: "ACTIVE",
    lastRunAt: "2026-03-20T00:00:00Z",
    nextRunAt: "2026-03-21T00:00:00Z",
    createdAt: "2026-02-18T10:00:00Z",
  },
  {
    id: "sched-compliance-monthly",
    name: "Monthly Tenant Offboarding & Retention Audit",
    frequency: "MONTHLY",
    format: "EXCEL",
    recipients: ["compliance@unierp.com"],
    status: "PAUSED",
    lastRunAt: "2026-03-01T00:00:00Z",
    nextRunAt: "2026-04-01T00:00:00Z",
    createdAt: "2026-01-05T12:00:00Z",
  },
];

export const INITIAL_ANOMALIES: AnomalyAlert[] = [
  {
    id: "alert-1",
    metric: "API_LATENCY",
    severity: "WARNING",
    currentValue: 342,
    expectedThreshold: 150,
    detectedAt: "2026-03-20T14:15:00Z",
    summary: "North America control plane p99 latency elevated to 342ms (threshold: 150ms).",
  },
  {
    id: "alert-2",
    metric: "TOKEN_USAGE",
    severity: "CRITICAL",
    currentValue: 920000,
    expectedThreshold: 750000,
    detectedAt: "2026-03-20T13:40:00Z",
    summary: "Tenant Acme Corp consumed 920,000 tokens (threshold: 750,000 daily limit).",
  },
];

export interface MetricCatalogItem {
  key: string;
  desc: string;
  unit: string;
  cat: string;
}

export const METRIC_CATALOG_ITEMS: MetricCatalogItem[] = [
  { key: "MRR", desc: "Monthly Recurring Revenue normalized across billed subscriptions", unit: "USD", cat: "FINANCIAL" },
  { key: "ARR", desc: "Annual Recurring Revenue Run-Rate", unit: "USD", cat: "FINANCIAL" },
  { key: "CHURN_RATE", desc: "Monthly logo and revenue retention deviation rate", unit: "%", cat: "FINANCIAL" },
  { key: "SEAT_UTILIZATION", desc: "Provisioned active seats divided by subscription allowance", unit: "%", cat: "USAGE" },
  { key: "API_LATENCY", desc: "End-to-end HTTP request latency at the 99th percentile", unit: "ms", cat: "PERFORMANCE" },
  { key: "ERROR_RATE", desc: "Fraction of responses with 5xx status codes over 5m window", unit: "%", cat: "PERFORMANCE" },
];
