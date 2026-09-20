import { z } from "zod";
import type { FieldDef } from "@/components/CrudDrawer";
import type { FilterConfig } from "@/components/FilterBar";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface StaffRoleRef {
  id: string;
  name: string;
  permissions?: string[];
}

export interface StaffPrincipal {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "LOCKED";
  mfaEnabled: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  activeSessionCount?: number;
  roles: StaffRoleRef[];
}

export interface ProviderRole {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  principalCount: number;
  permissions: string[];
  users?: Array<{
    id: string;
    email: string;
    name: string;
    status: string;
  }>;
}

export interface StaffSession {
  id: string;
  userId: string;
  device?: string;
  browser?: string;
  ipAddress?: string;
  location?: string;
  isActive: boolean;
  startedAt?: string;
  lastActivityAt?: string;
  expiresAt?: string;
  platform?: string;
  appVersion?: string;
  user?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

// ─── Permission Catalog by Domain ───────────────────────────────────────────

export interface PermissionGroup {
  domain: string;
  domainName: string;
  permissions: Array<{
    key: string;
    label: string;
    description: string;
  }>;
}

export const PERMISSION_CATALOG: PermissionGroup[] = [
  {
    domain: "pcc.tenants",
    domainName: "Tenant & Lifecycle Management (PCC-18)",
    permissions: [
      { key: "system.tenant.view", label: "View Tenants", description: "View tenant registry, details, and telemetry" },
      { key: "system.tenant.create", label: "Provision Tenant", description: "Create and spin up new tenant environments" },
      { key: "system.tenant.update", label: "Modify Tenant", description: "Update tenant configurations and plans" },
      { key: "system.tenant.delete", label: "Delete/Archive Tenant", description: "Archive tenant and decommission resources" },
      { key: "system.tenant.suspend", label: "Suspend Tenant", description: "Freeze tenant access immediately" },
      { key: "system.tenant.unsuspend", label: "Reinstate Tenant", description: "Restore suspended tenant access" },
      { key: "system.tenant.impersonate", label: "Impersonate Admin", description: "Execute privileged tenant impersonation session" },
    ],
  },
  {
    domain: "pcc.identity-governance",
    domainName: "Identity Governance & Access (PCC-03)",
    permissions: [
      { key: "pcc.identity-governance.access", label: "Access IAM Console", description: "Access staff directory, roles, and sessions" },
      { key: "system.staff.create", label: "Create Staff User", description: "Invite and create internal provider operators" },
      { key: "system.staff.update", label: "Update Staff User", description: "Modify operator status and role assignments" },
      { key: "system.staff.delete", label: "Deactivate Staff User", description: "Deactivate staff operator account" },
      { key: "system.role.manage", label: "Manage Roles", description: "Create and edit provider access roles and permissions" },
      { key: "system.session.revoke", label: "Revoke Sessions", description: "Terminate active operator sessions" },
    ],
  },
  {
    domain: "pcc.billing",
    domainName: "Revenue & Billing (PCC-06)",
    permissions: [
      { key: "pcc.billing.view", label: "View Invoices & Plans", description: "Inspect customer subscriptions and pricing" },
      { key: "pcc.billing.manage", label: "Manage Plans & Pricing", description: "Create and update tiered pricing models" },
      { key: "pcc.billing.invoicing", label: "Process Billing Runs", description: "Generate invoices and manage payment retries" },
    ],
  },
  {
    domain: "pcc.security",
    domainName: "Security Operations & Vault (PCC-07)",
    permissions: [
      { key: "pcc.security.view", label: "View Security Telemetry", description: "Monitor security incidents and audit events" },
      { key: "pcc.security.certificates", label: "Manage TLS Certificates", description: "Upload, renew, and rotate certificates" },
      { key: "pcc.security.vault", label: "Manage Platform Vault", description: "Configure API keys and encryption secrets" },
    ],
  },
  {
    domain: "pcc.operations",
    domainName: "Fleet & Cluster Operations (PCC-19/20)",
    permissions: [
      { key: "pcc.operations.view", label: "View Fleet Status", description: "Monitor Kubernetes clusters and pods" },
      { key: "pcc.operations.deploy", label: "Execute Rollouts", description: "Trigger rolling canary upgrades and migrations" },
      { key: "pcc.operations.runbooks", label: "Execute Runbooks", description: "Run automated operational remediation runbooks" },
    ],
  },
];

// ─── Zod Schemas ────────────────────────────────────────────────────────────

export const staffPrincipalFormSchema = z.object({
  email: z.string().trim().email("Enter a valid operator email address"),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  status: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED", "LOCKED"]).default("ACTIVE"),
  mfaEnabled: z.boolean().default(false),
});

export const roleFormSchema = z.object({
  name: z.string().trim().min(2, "Role name must have at least 2 characters"),
  description: z.string().trim().max(500).optional(),
});

// ─── CrudDrawer Field Definitions ───────────────────────────────────────────

export const staffDrawerFields: FieldDef[] = [
  {
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "operator@unierp.com",
    required: true,
  },
  {
    name: "firstName",
    label: "First Name",
    type: "text",
    placeholder: "Jane",
    required: true,
  },
  {
    name: "lastName",
    label: "Last Name",
    type: "text",
    placeholder: "Doe",
    required: true,
  },
  {
    name: "status",
    label: "Account Status",
    type: "select",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Suspended", value: "SUSPENDED" },
      { label: "Deactivated", value: "DEACTIVATED" },
      { label: "Locked", value: "LOCKED" },
    ],
    defaultValue: "ACTIVE",
    required: true,
  },
  {
    name: "mfaEnabled",
    label: "Require Multi-Factor Authentication (MFA)",
    type: "checkbox",
    defaultValue: false,
  },
];

export const roleDrawerFields: FieldDef[] = [
  {
    name: "name",
    label: "Role Name",
    type: "text",
    placeholder: "e.g. Infrastructure Engineer",
    required: true,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Describe the responsibilities and scope of this role...",
  },
];

// ─── Filter Configurations ──────────────────────────────────────────────────

export const staffFilterConfigs: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "All Statuses", value: "" },
      { label: "Active", value: "ACTIVE" },
      { label: "Suspended", value: "SUSPENDED" },
      { label: "Deactivated", value: "DEACTIVATED" },
      { label: "Locked", value: "LOCKED" },
    ],
  },
];

export const roleFilterConfigs: FilterConfig[] = [
  {
    key: "type",
    label: "Role Type",
    options: [
      { label: "All Roles", value: "" },
      { label: "Built-in System Roles", value: "system" },
      { label: "Custom Tenant Roles", value: "custom" },
    ],
  },
];
