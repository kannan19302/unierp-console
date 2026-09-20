import { z } from "zod";
import type { FieldDef } from "@/components/CrudDrawer";
import type { FilterConfig } from "@/components/FilterBar";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface SecurityPolicy {
  id: string;
  name: string;
  description?: string;
  version: number;
  scopeType: "PLATFORM" | "REGION" | "TENANT" | "RESOURCE";
  scopeId?: string;
  isolationLevel: "ROW_LEVEL_SECURITY" | "SCHEMA_PER_TENANT" | "DATABASE_PER_TENANT" | "CELL_ISOLATED";
  enforcementMode: "BLOCK" | "ALERT" | "DRY_RUN";
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
  overrides?: Array<{
    id: string;
    scopeType: string;
    scopeId?: string;
    reason: string;
    grantedBy: string;
    expiresAt: string;
  }>;
}

export interface SecurityThreat {
  id: string;
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  sourceIp: string;
  targetTenant?: string;
  status: "NEW" | "ACKNOWLEDGED" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
  detectedAt: string;
  assignedTo?: string;
  triageHistory: Array<{
    action: string;
    notes: string;
    by: string;
    at: string;
  }>;
}

// ─── Zod Schemas & Field Definitions ────────────────────────────────────────

export const securityPolicyFormSchema = z.object({
  name: z.string().min(3, "Policy name must be at least 3 characters"),
  description: z.string().optional(),
  scopeType: z.enum(["PLATFORM", "REGION", "TENANT", "RESOURCE"]),
  scopeId: z.string().optional(),
  isolationLevel: z.enum(["ROW_LEVEL_SECURITY", "SCHEMA_PER_TENANT", "DATABASE_PER_TENANT", "CELL_ISOLATED"]),
  enforcementMode: z.enum(["BLOCK", "ALERT", "DRY_RUN"]),
  reason: z.string().min(5, "A justification reason must be specified"),
});

export const securityPolicyDrawerFields: FieldDef[] = [
  {
    name: "name",
    label: "Policy Name",
    type: "text",
    placeholder: "e.g. Cross-Tenant Partition Barrier",
    required: true,
  },
  {
    name: "description",
    label: "Policy Description",
    type: "textarea",
    placeholder: "Explain security intent and isolation criteria...",
    required: true,
  },
  {
    name: "scopeType",
    label: "Scope Hierarchy",
    type: "select",
    options: [
      { label: "Platform-Wide (Default)", value: "PLATFORM" },
      { label: "Regional Boundary", value: "REGION" },
      { label: "Specific Tenant Partition", value: "TENANT" },
      { label: "Single Infrastructure Resource", value: "RESOURCE" },
    ],
    required: true,
  },
  {
    name: "scopeId",
    label: "Target Scope Identifier",
    type: "text",
    placeholder: "Leave blank for PLATFORM or enter region/tenant ID",
  },
  {
    name: "isolationLevel",
    label: "Data Isolation Strategy",
    type: "select",
    options: [
      { label: "PostgreSQL Row-Level Security (RLS)", value: "ROW_LEVEL_SECURITY" },
      { label: "Dedicated Schema per Tenant", value: "SCHEMA_PER_TENANT" },
      { label: "Dedicated Database Instance per Tenant", value: "DATABASE_PER_TENANT" },
      { label: "Air-Gapped Cell Isolation", value: "CELL_ISOLATED" },
    ],
    required: true,
  },
  {
    name: "enforcementMode",
    label: "Enforcement Mode",
    type: "select",
    options: [
      { label: "Block & Terminate (Strict Enforcement)", value: "BLOCK" },
      { label: "Alert & Log to SIEM (Permissive Detection)", value: "ALERT" },
      { label: "Dry Run (Audit Shadow Evaluation)", value: "DRY_RUN" },
    ],
    required: true,
  },
  {
    name: "reason",
    label: "Audit Justification",
    type: "text",
    placeholder: "e.g. SOC2 CC6.1 Logical Separation Compliance Requirement",
    required: true,
  },
];

export const threatTriageFormSchema = z.object({
  action: z.enum(["ACKNOWLEDGE", "INVESTIGATE", "RESOLVE", "CLOSE"]),
  notes: z.string().min(5, "Detailed triage notes are required for compliance audit"),
  assignedTo: z.string().optional(),
});

export const threatTriageDrawerFields: FieldDef[] = [
  {
    name: "action",
    label: "Triage Transition",
    type: "select",
    options: [
      { label: "Acknowledge Alert (Assign to SOC queue)", value: "ACKNOWLEDGE" },
      { label: "Investigate (Begin active forensic triage)", value: "INVESTIGATE" },
      { label: "Resolve (Remediation rules applied)", value: "RESOLVE" },
      { label: "Close (False positive / post-incident verified)", value: "CLOSE" },
    ],
    required: true,
  },
  {
    name: "assignedTo",
    label: "Assigned Security Engineer",
    type: "text",
    placeholder: "e.g. sec-ops-lead@company.internal",
  },
  {
    name: "notes",
    label: "Triage & Remediation Notes",
    type: "textarea",
    placeholder: "Explain diagnostic findings, perimeter actions taken, or root cause...",
    required: true,
  },
];

// ─── Filter Configurations ─────────────────────────────────────────────────

export const securityPolicyFilterConfigs: FilterConfig[] = [
  {
    key: "enforcementMode",
    label: "Enforcement Mode",
    options: [
      { label: "Block", value: "BLOCK" },
      { label: "Alert", value: "ALERT" },
      { label: "Dry Run", value: "DRY_RUN" },
    ],
  },
  {
    key: "scopeType",
    label: "Scope Type",
    options: [
      { label: "Platform", value: "PLATFORM" },
      { label: "Region", value: "REGION" },
      { label: "Tenant", value: "TENANT" },
      { label: "Resource", value: "RESOURCE" },
    ],
  },
];

export const securityThreatFilterConfigs: FilterConfig[] = [
  {
    key: "severity",
    label: "Severity",
    options: [
      { label: "Critical", value: "CRITICAL" },
      { label: "High", value: "HIGH" },
      { label: "Medium", value: "MEDIUM" },
      { label: "Low", value: "LOW" },
    ],
  },
  {
    key: "status",
    label: "Triage Status",
    options: [
      { label: "New", value: "NEW" },
      { label: "Acknowledged", value: "ACKNOWLEDGED" },
      { label: "Investigating", value: "INVESTIGATING" },
      { label: "Resolved", value: "RESOLVED" },
      { label: "Closed", value: "CLOSED" },
    ],
  },
];
