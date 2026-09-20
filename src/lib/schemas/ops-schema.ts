import { z } from "zod";
import type { FormFieldDef } from "@/components/CrudDrawer";
import type { FilterConfig } from "@/components/FilterBar";

// ── Incidents Schemas & Types ──────────────────────────────────────────

export const incidentEscalateSchema = z.object({
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL"]),
  note: z.string().optional(),
});
export type IncidentEscalateFormData = z.infer<typeof incidentEscalateSchema>;

export const incidentResolveSchema = z.object({
  rootCause: z.string().min(5, "Root cause must be at least 5 characters"),
  correctiveAction: z.string().min(5, "Corrective action must be at least 5 characters"),
});
export type IncidentResolveFormData = z.infer<typeof incidentResolveSchema>;

export interface IncidentRecord {
  id: string;
  title: string;
  service: string;
  severity: "MINOR" | "MAJOR" | "CRITICAL";
  status: "OPEN" | "INVESTIGATING" | "IDENTIFIED" | "MITIGATED" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  rootCause?: string;
  correctiveAction?: string;
  timeline?: Array<{ timestamp: string; actor: string; event: string }>;
  actualPercent?: number;
  creditAmount?: string;
}

export const incidentFilters: FilterConfig[] = [
  {
    key: "severity",
    label: "Severity",
    options: [
      { label: "All Severities", value: "" },
      { label: "Critical", value: "CRITICAL" },
      { label: "Major", value: "MAJOR" },
      { label: "Minor", value: "MINOR" },
    ],
  },
  {
    key: "status",
    label: "Status",
    options: [
      { label: "All Statuses", value: "" },
      { label: "Open", value: "OPEN" },
      { label: "Investigating", value: "INVESTIGATING" },
      { label: "Identified", value: "IDENTIFIED" },
      { label: "Resolved", value: "RESOLVED" },
      { label: "Closed", value: "CLOSED" },
    ],
  },
];

// ── Runbook Schemas & Types ──────────────────────────────────────────

export const runbookAuthorSchema = z.object({
  name: z.string().min(3, "Runbook name must be at least 3 characters"),
  stepsJson: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }, "Steps must be a non-empty valid JSON array"),
});
export type RunbookAuthorFormData = z.infer<typeof runbookAuthorSchema>;

export const runbookFields: FormFieldDef[] = [
  {
    name: "name",
    label: "Runbook Title",
    type: "text",
    placeholder: "e.g., Drain Kubernetes Node Pool",
    required: true,
  },
  {
    name: "stepsJson",
    label: "Steps Definition (JSON Array)",
    type: "textarea",
    placeholder: `[\\n  {\\n    "resourceId": "k8s-node-01",\\n    "proposedState": { "cordoned": true }\\n  }\\n]`,
    required: true,
  },
];

export interface RunbookRecord {
  id: string;
  name: string;
  version: number;
  status: "DRAFT" | "PUBLISHED";
  steps: Array<{ resourceId: string; proposedState: Record<string, unknown> }>;
  createdAt: string;
}

export const runbookFilters: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "All Statuses", value: "" },
      { label: "Draft", value: "DRAFT" },
      { label: "Published", value: "PUBLISHED" },
    ],
  },
];

// ── Release Pipeline Schemas & Types ──────────────────────────────────

export interface PipelineStage {
  stage: "dev" | "staging" | "canary" | "production";
  label: string;
  version: string;
  status: "HEALTHY" | "DEGRADED" | "ROLLING_OUT" | "IDLE";
  lastDeployedAt: string;
  trafficWeightPercent?: number;
  commitHash?: string;
}

export interface PipelineResponse {
  stages: PipelineStage[];
  activeCanaryPercent: number;
}
