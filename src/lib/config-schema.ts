import { z } from "zod";
import type { FormFieldDef } from "@/components/CrudDrawer";
import type { FilterConfig } from "@/components/FilterBar";

// ── Feature Flag Schemas & Types ─────────────────────────────────────

export const featureFlagSchema = z.object({
  flagKey: z
    .string()
    .min(3, "Flag key must be at least 3 characters")
    .regex(/^[A-Z0-9_]+$/, "Flag key must be uppercase alphanumeric with underscores"),
  name: z.string().min(2, "Flag display name is required"),
  description: z.string().optional(),
  percentageRollout: z.coerce.number().min(0).max(100).default(0),
  userSegments: z.string().optional(), // Comma-separated in form, parsed to array
  environments: z.string().optional(),
  active: z.boolean().default(true),
  scheduleStart: z.string().optional(),
  scheduleEnd: z.string().optional(),
});

export type FeatureFlagFormData = z.infer<typeof featureFlagSchema>;

export interface FeatureFlagRecord {
  id: string;
  flagKey: string;
  name: string;
  description?: string;
  percentageRollout: number;
  userSegments: string[];
  environments: string[];
  active: boolean;
  enabled?: boolean;
  scheduleStart?: string;
  scheduleEnd?: string;
  createdAt: string;
  updatedAt?: string;
}

export const featureFlagFilters: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "All Statuses", value: "" },
      { label: "Active", value: "ACTIVE" },
      { label: "Disabled", value: "OFF" },
    ],
  },
  {
    key: "rollout",
    label: "Rollout Scope",
    options: [
      { label: "All Rollouts", value: "" },
      { label: "100% (GA)", value: "100" },
      { label: "Partial (<100%)", value: "PARTIAL" },
      { label: "0% (Dark)", value: "0" },
    ],
  },
];

export const featureFlagFields: FormFieldDef[] = [
  {
    name: "flagKey",
    label: "Flag Key (e.g. AI_LEDGER_COPILOT)",
    type: "text",
    placeholder: "FEATURE_NAME_V2",
    required: true,
    helpText: "Uppercase identifier used in code and SDK lookups.",
  },
  {
    name: "name",
    label: "Display Name",
    type: "text",
    placeholder: "AI Ledger Copilot",
    required: true,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Detailed operational scope and safety invariants for this flag...",
  },
  {
    name: "percentageRollout",
    label: "Rollout Percentage (0 - 100%)",
    type: "number",
    placeholder: "0",
    helpText: "Percentage of tenant traffic randomly exposed to the enabled variant.",
  },
  {
    name: "userSegments",
    label: "Target Segments (comma separated)",
    type: "text",
    placeholder: "BETA_TESTERS, ENTERPRISE_TIER, FINANCE_PRO",
    helpText: "Cohorts of users or tenants receiving priority evaluation.",
  },
  {
    name: "environments",
    label: "Target Environments (comma separated)",
    type: "text",
    placeholder: "dev, staging, production",
  },
  {
    name: "active",
    label: "Active / Enabled State",
    type: "checkbox",
  },
];

// ── Configuration Environment & Promotion Types ──────────────────────

export interface ConfigEnvironmentRecord {
  id: string;
  name: "dev" | "staging" | "production";
  label: string;
  version: string;
  configKeysCount: number;
  driftDetected: boolean;
  lastSyncAt: string;
  lastPromotedBy?: string;
  settings: Record<string, string | number | boolean>;
}

export interface ConfigDiffItem {
  key: string;
  sourceValue: any;
  targetValue: any;
  changeType: "ADDED" | "MODIFIED" | "REMOVED" | "UNCHANGED";
}

export interface ConfigDiffResult {
  source: string;
  target: string;
  diffs: ConfigDiffItem[];
  totalChanges: number;
}
