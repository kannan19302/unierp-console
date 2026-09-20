import { z } from "zod";
import type { FormFieldDef } from "@/components/CrudDrawer";
import type { FilterConfig } from "@/components/FilterBar";

// ── Compliance Control Schemas & Types ────────────────────────────

export const createControlSchema = z.object({
  code: z
    .string()
    .min(3, "Control code must be at least 3 characters")
    .max(30, "Control code cannot exceed 30 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code must contain uppercase letters, numbers, hyphens or underscores"),
  title: z.string().min(5, "Title must be at least 5 characters").max(120),
  frameworks: z.string().min(2, "At least one framework tag is required (e.g. SOC2,ISO27001)"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  minRecords: z.coerce.number().min(1, "Minimum required records must be at least 1").default(1),
});

export type CreateControlFormData = z.infer<typeof createControlSchema>;

export const editControlSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(120),
  frameworks: z.string().min(2, "Framework tags required (e.g. SOC2,ISO27001)"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export type EditControlFormData = z.infer<typeof editControlSchema>;

export const exportEvidenceSchema = z.object({
  controlCode: z.string().min(2, "Control code is required"),
  auditorQuestion: z.string().min(5, "Auditor inquiry or question is required"),
});

export type ExportEvidenceFormData = z.infer<typeof exportEvidenceSchema>;

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  coveragePct: number;
  status: "COMPLIANT" | "PARTIAL" | "NON_COMPLIANT";
  controls: number;
  controlsPassed: number;
}

export interface ComplianceControl {
  code: string;
  frameworks: string;
  title: string;
  description: string;
  status?: "PASS" | "FAIL" | "NOT_RUN" | null;
  observed?: number;
  finding?: string | null;
  evaluatedAt?: string | null;
}

export interface ExportedEvidence {
  id: string;
  controlCode: string;
  auditorQuestion: string;
  generatedAt: string;
  generatedBy: string;
  contentHash: string;
  recordCount: number;
  artefact?: {
    records: Record<string, unknown>[];
    metadata: {
      generatedAt: string;
      operatorId: string;
      controlCode: string;
      auditorQuestion: string;
    };
  };
}

// ── Filter Configurations ──────────────────────────────────────────

export const controlFilterConfigs: FilterConfig[] = [
  {
    key: "status",
    label: "Evaluation Status",
    options: [
      { label: "All Statuses", value: "" },
      { label: "Passing (Compliant)", value: "PASS" },
      { label: "Failing (Non-Compliant)", value: "FAIL" },
      { label: "Not Evaluated", value: "NOT_RUN" },
    ],
  },
  {
    key: "framework",
    label: "Framework",
    options: [
      { label: "All Frameworks", value: "" },
      { label: "SOC 2 Type II", value: "SOC2" },
      { label: "ISO/IEC 27001", value: "ISO27001" },
      { label: "GDPR Article 32", value: "GDPR" },
      { label: "HIPAA Security", value: "HIPAA" },
      { label: "PCI-DSS v4.0", value: "PCI-DSS" },
    ],
  },
];

export const evidenceFilterConfigs: FilterConfig[] = [
  {
    key: "controlCode",
    label: "Control Code",
    options: [
      { label: "All Controls", value: "" },
      { label: "AUDIT-COMPLETE", value: "AUDIT-COMPLETE" },
      { label: "APPROVAL-TWO-PERSON", value: "APPROVAL-TWO-PERSON" },
      { label: "SEPARATION-OF-DUTIES", value: "SEPARATION-OF-DUTIES" },
      { label: "IMMUTABLE-LEDGER", value: "IMMUTABLE-LEDGER" },
    ],
  },
];

// ── Form Field Definitions for CrudDrawer ──────────────────────────

export const createControlFieldDefs: FormFieldDef[] = [
  {
    name: "code",
    label: "Control Code",
    type: "text",
    placeholder: "e.g. SEC-DATA-01",
    required: true,
    helpText: "Unique identifier (uppercase letters, numbers, hyphens)",
  },
  {
    name: "title",
    label: "Control Title",
    type: "text",
    placeholder: "e.g. Quarterly Disaster Recovery Simulation",
    required: true,
  },
  {
    name: "frameworks",
    label: "Framework Mappings",
    type: "text",
    placeholder: "e.g. SOC2,ISO27001,GDPR",
    required: true,
    helpText: "Comma-separated framework tags",
  },
  {
    name: "description",
    label: "Control Objective / Description",
    type: "textarea",
    placeholder: "Detailed verification procedure and audit expectation...",
    required: true,
  },
  {
    name: "minRecords",
    label: "Min Audit Records Required",
    type: "number",
    placeholder: "1",
    helpText: "Minimum evidence records required on the audit spine to PASS",
  },
];

export const editControlFieldDefs: FormFieldDef[] = [
  {
    name: "title",
    label: "Control Title",
    type: "text",
    placeholder: "Control title",
    required: true,
  },
  {
    name: "frameworks",
    label: "Framework Mappings",
    type: "text",
    placeholder: "e.g. SOC2,ISO27001",
    required: true,
    helpText: "Comma-separated framework tags",
  },
  {
    name: "description",
    label: "Control Objective / Description",
    type: "textarea",
    placeholder: "Detailed verification procedure...",
    required: true,
  },
];
