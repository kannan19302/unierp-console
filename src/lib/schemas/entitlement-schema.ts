import { z } from "zod";
import type { FieldDef } from "@/lib/form-validation";

export const licensePoolSchema = z.object({
  name: z.string().min(3, "Pool name must be at least 3 characters"),
  moduleCode: z.string().min(2, "Module capability code required"),
  totalSeats: z.number().min(1, "Total seats must be at least 1"),
  tier: z.enum(["STANDARD", "PREMIUM", "ENTERPRISE"]),
});

export type LicensePoolInput = z.infer<typeof licensePoolSchema>;

export interface LicensePool {
  id: string;
  name: string;
  moduleCode: string;
  totalSeats: number;
  allocatedSeats: number;
  availableSeats: number;
  utilizationPct: number;
  tier: "STANDARD" | "PREMIUM" | "ENTERPRISE";
}

export const licensePoolFields: FieldDef[] = [
  {
    name: "name",
    label: "Pool Name",
    type: "text",
    placeholder: "e.g. Supply Chain Barcode Scanner Seats",
    required: true,
  },
  {
    name: "moduleCode",
    label: "Capability / Module Code",
    type: "select",
    options: [
      { label: "Core ERP Standard", value: "core-erp" },
      { label: "AI Autonomous Agents", value: "ai-copilot" },
      { label: "Financial Multi-Currency Ledger", value: "finance-ledger" },
      { label: "CRM & Sales Pipeline", value: "crm-sales" },
      { label: "Inventory & Supply Chain", value: "inventory-scm" },
      { label: "B2B Vendor Portal", value: "b2b-portal" },
    ],
    required: true,
  },
  {
    name: "totalSeats",
    label: "Seat Pool Capacity",
    type: "number",
    placeholder: "500",
    required: true,
  },
  {
    name: "tier",
    label: "Entitlement Tier",
    type: "select",
    options: [
      { label: "Standard", value: "STANDARD" },
      { label: "Premium", value: "PREMIUM" },
      { label: "Enterprise", value: "ENTERPRISE" },
    ],
    required: true,
  },
];

export const offlineLicenseSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID required"),
  tenantName: z.string().min(2, "Tenant name required"),
  maxSeats: z.number().min(1, "Seats must be at least 1"),
  validDays: z.number().min(1, "Valid duration in days required"),
  machineFingerprint: z.string().optional(),
});

export type OfflineLicenseInput = z.infer<typeof offlineLicenseSchema>;

export interface OfflineLicense {
  id: string;
  licenseKey: string;
  tenantId: string;
  tenantName: string;
  allowedModules: string[];
  maxSeats: number;
  issuedAt: string;
  expiresAt: string;
  machineFingerprint?: string;
  signature: string;
}

export const offlineLicenseFields: FieldDef[] = [
  {
    name: "tenantId",
    label: "Target Tenant ID",
    type: "text",
    placeholder: "UUID or tenant identifier",
    required: true,
  },
  {
    name: "tenantName",
    label: "Organization Name",
    type: "text",
    placeholder: "e.g. Acme Defense Air-Gap Cell 01",
    required: true,
  },
  {
    name: "maxSeats",
    label: "Licensed Seats",
    type: "number",
    placeholder: "250",
    required: true,
  },
  {
    name: "validDays",
    label: "Validity Period (Days)",
    type: "number",
    placeholder: "365",
    required: true,
  },
  {
    name: "machineFingerprint",
    label: "Hardware Fingerprint / Machine ID (Optional)",
    type: "text",
    placeholder: "e.g. SHA256:7f83b1657ff1fc53...",
  },
];

export interface TenantGrantRow {
  tenantId: string;
  tenantName: string;
  planTier: string;
  modules: Record<string, { enabled: boolean; effectiveDate?: string }>;
}
