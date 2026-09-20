import { z } from "zod";
import type { FormFieldDef } from "@/components/CrudDrawer";
import type { FilterConfig } from "@/components/FilterBar";

// ── Certificate Lifecycle Schemas & Types ────────────────────────────

export const certificateIssueSchema = z.object({
  domainId: z.string().min(3, "Domain name is required (e.g. app.acme.com)"),
  tenantId: z.string().min(1, "Tenant ID is required"),
  provider: z.enum(["letsencrypt", "zerossl", "internal_ca"]).default("letsencrypt"),
  autoRotateDaysBefore: z.coerce.number().min(1).max(90).default(30),
});

export type CertificateIssueFormData = z.infer<typeof certificateIssueSchema>;

export const scheduleRotationSchema = z.object({
  autoRotateDaysBefore: z.coerce
    .number()
    .min(1, "Must be at least 1 day before expiry")
    .max(90, "Cannot exceed 90 days")
    .default(30),
});

export type ScheduleRotationFormData = z.infer<typeof scheduleRotationSchema>;

export interface CertificateRecord {
  id: string;
  tenantId: string;
  domainId: string;
  provider: string;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "REVOKED";
  notBefore: string;
  notAfter: string;
  daysRemaining: number;
  autoRotateDaysBefore: number;
  autoRotateScheduled: boolean;
  serialNumber: string;
  issuer: string;
  subject: string;
  algorithm?: string;
}

export interface CertificateChainNode {
  level: "ROOT" | "INTERMEDIATE" | "LEAF";
  subject: string;
  issuer: string;
  fingerprintSha256: string;
  validUntil: string;
  isTrusted: boolean;
  keyAlgorithm: string;
  serialNumber: string;
}

export interface CertificateChainResponse {
  certificateId: string;
  domain: string;
  chain: CertificateChainNode[];
  allTrusted: boolean;
  leafStatus: string;
}

export const certificateFilters: FilterConfig[] = [
  {
    key: "status",
    label: "Lifecycle State",
    options: [
      { label: "All States", value: "" },
      { label: "Active", value: "ACTIVE" },
      { label: "Expiring Soon (<30d)", value: "EXPIRING_SOON" },
      { label: "Expired", value: "EXPIRED" },
      { label: "Revoked", value: "REVOKED" },
    ],
  },
  {
    key: "provider",
    label: "CA Provider",
    options: [
      { label: "All Providers", value: "" },
      { label: "Let's Encrypt", value: "letsencrypt" },
      { label: "ZeroSSL", value: "zerossl" },
      { label: "Internal CA", value: "internal_ca" },
    ],
  },
];

export const certificateIssueFormFields: FormFieldDef[] = [
  {
    name: "domainId",
    label: "Domain Name (FQDN)",
    type: "text",
    placeholder: "e.g. portal.acme.com",
    required: true,
    helpText: "Fully qualified domain name bound to this TLS certificate",
  },
  {
    name: "tenantId",
    label: "Tenant Scope",
    type: "text",
    placeholder: "e.g. 00000000-0000-0000-0000-000000000001",
    required: true,
    defaultValue: "00000000-0000-0000-0000-000000000001",
  },
  {
    name: "provider",
    label: "Certificate Authority Provider",
    type: "select",
    options: [
      { label: "Let's Encrypt ACME", value: "letsencrypt" },
      { label: "ZeroSSL Enterprise", value: "zerossl" },
      { label: "UniERP Internal Vault CA", value: "internal_ca" },
    ],
    defaultValue: "letsencrypt",
  },
  {
    name: "autoRotateDaysBefore",
    label: "Auto-Rotate Window (Days Before Expiry)",
    type: "number",
    defaultValue: 30,
    helpText: "Automatically reissue and swap certificate N days before expiration",
  },
];

// ── Dynamic Secret Lease Schemas & Types ─────────────────────────────

export const secretLeaseSchema = z.object({
  secretKey: z.string().min(3, "Secret key / path is required"),
  clientIdentity: z.string().min(2, "Client identity / service name is required"),
  ttlSeconds: z.coerce.number().min(60, "Minimum TTL is 60 seconds").max(86400, "Maximum TTL is 24 hours").default(3600),
});

export type SecretLeaseFormData = z.infer<typeof secretLeaseSchema>;

export interface SecretLeaseRecord {
  id: string;
  leaseId: string;
  secretKey: string;
  clientIdentity: string;
  issuedAt: string;
  expiresAt: string;
  ttlSeconds: number;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  revokedAt?: string;
  revocationReason?: string;
}

export const secretLeaseFilters: FilterConfig[] = [
  {
    key: "status",
    label: "Lease Status",
    options: [
      { label: "All Leases", value: "" },
      { label: "Active", value: "ACTIVE" },
      { label: "Revoked", value: "REVOKED" },
      { label: "Expired", value: "EXPIRED" },
    ],
  },
];

export const secretLeaseFormFields: FormFieldDef[] = [
  {
    name: "secretKey",
    label: "Secret Key / Vault Path",
    type: "text",
    placeholder: "e.g. database/creds/billing-readwrite",
    required: true,
    helpText: "Path to dynamic secret engine in HashiCorp Vault or HSM",
  },
  {
    name: "clientIdentity",
    label: "Client Identity / Workload",
    type: "text",
    placeholder: "e.g. srv-worker-invoice-processor-prod",
    required: true,
    helpText: "Authenticated SPIFFE ID or microservice workload identity",
  },
  {
    name: "ttlSeconds",
    label: "Time-To-Live (Seconds)",
    type: "number",
    defaultValue: 3600,
    helpText: "Lease valid duration: minimum 60s, maximum 86400s (24 hours)",
  },
];
