import { z } from "zod";
import type { FieldDef } from "./form-validation";

export const developerAppSchema = z.object({
  name: z.string().min(3, "Application name must be at least 3 characters"),
  description: z.string().optional(),
  clientType: z.enum(["CONFIDENTIAL", "PUBLIC"]),
  ownerTenantId: z.string().min(1, "Owner tenant scope is required"),
  redirectUris: z.string().min(3, "At least one redirect URI is required"),
  allowedScopes: z.array(z.string()).min(1, "At least one scope must be selected"),
});

export type DeveloperAppInput = z.infer<typeof developerAppSchema>;

export interface DeveloperApp {
  id: string;
  clientId: string;
  clientSecret?: string;
  name: string;
  description?: string;
  clientType: "CONFIDENTIAL" | "PUBLIC";
  ownerTenantId?: string;
  ownerTenantName?: string;
  redirectUris: string[];
  allowedScopes: string[];
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  createdAt: string;
  updatedAt: string;
}

export const sandboxSchema = z.object({
  name: z.string().min(3, "Sandbox name must be at least 3 characters"),
  tenantId: z.string().min(1, "Target tenant is required"),
  dataPreset: z.enum(["MINIMAL", "FINANCE_SAMPLE", "FULL_ENTERPRISE_ERP"]),
  ttlDays: z.number().min(1, "TTL must be at least 1 day").max(90, "Maximum TTL is 90 days"),
});

export type SandboxInput = z.infer<typeof sandboxSchema>;

export interface SandboxEnvironment {
  id: string;
  name: string;
  tenantId: string;
  tenantName: string;
  dataPreset: "MINIMAL" | "FINANCE_SAMPLE" | "FULL_ENTERPRISE_ERP";
  status: "PROVISIONED" | "INITIALIZING" | "EXPIRED" | "TERMINATED";
  expiresAt: string;
  createdAt: string;
  allocatedStorageMb: number;
  activeConnections: number;
}

export const sdkPackageSchema = z.object({
  name: z.string().min(3, "Package name is required"),
  language: z.enum(["TYPESCRIPT", "PYTHON", "GO", "JAVA", "CSHARP"]),
  version: z.string().regex(/^\d+\.\d+\.\d+/, "SemVer format required (e.g. 1.0.0)"),
  minApiVersion: z.string().optional(),
  releaseNotes: z.string().min(10, "Release notes must be at least 10 characters"),
});

export type SdkPackageInput = z.infer<typeof sdkPackageSchema>;

export interface SdkPackage {
  id: string;
  name: string;
  language: "TYPESCRIPT" | "PYTHON" | "GO" | "JAVA" | "CSHARP";
  latestVersion: string;
  minApiVersion: string;
  downloadCount: number;
  status: "ACTIVE" | "DEPRECATED" | "SUNSET";
  releaseNotes: string;
  releasedAt: string;
  sunsetAt?: string;
}

export const AVAILABLE_SCOPES = [
  { id: "api.read", label: "Read Platform APIs (api.read)", description: "Read-only access to standard business entities" },
  { id: "api.write", label: "Write Platform APIs (api.write)", description: "Create and mutate business records" },
  { id: "crm.read", label: "Read CRM & Accounts (crm.read)", description: "Access contacts, accounts, and opportunities" },
  { id: "crm.write", label: "Manage CRM Data (crm.write)", description: "Create leads and update sales pipeline" },
  { id: "inventory.read", label: "Read Inventory & Warehouses (inventory.read)", description: "Read stock levels and lot tracking" },
  { id: "pos.transact", label: "Point of Sale Transactions (pos.transact)", description: "Execute POS checkouts and payments" },
  { id: "webhooks.manage", label: "Manage Webhook Subscriptions (webhooks.manage)", description: "Subscribe to real-time events" },
];
