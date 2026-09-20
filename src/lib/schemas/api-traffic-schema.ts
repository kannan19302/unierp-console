import { z } from "zod";
import type { FieldDef } from "@/lib/form-validation";

export const rateLimitRuleSchema = z.object({
  name: z.string().min(3, "Rule name must be at least 3 characters"),
  endpointPath: z.string().min(2, "Endpoint pattern is required (e.g. /api/v1/*)"),
  limitPerMinute: z.number().min(1, "Must allow at least 1 request/min"),
  burstLimit: z.number().min(1, "Burst limit must be at least 1"),
  clientTier: z.enum(["STANDARD", "PREMIUM", "ENTERPRISE", "INTERNAL"]),
  tenantId: z.string().default("GLOBAL"),
  isActive: z.boolean().default(true),
});

export type RateLimitRule = z.infer<typeof rateLimitRuleSchema> & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
};

export const rateLimitFields: FieldDef[] = [
  {
    name: "name",
    label: "Rule Name",
    type: "text",
    placeholder: "e.g. Public API Rate Limit",
    required: true,
  },
  {
    name: "endpointPath",
    label: "Endpoint Pattern",
    type: "text",
    placeholder: "e.g. /api/v1/sales/*",
    required: true,
  },
  {
    name: "limitPerMinute",
    label: "Rate Limit (Requests / Minute)",
    type: "number",
    placeholder: "60",
    required: true,
  },
  {
    name: "burstLimit",
    label: "Burst Capacity",
    type: "number",
    placeholder: "120",
    required: true,
  },
  {
    name: "clientTier",
    label: "Client Tier Scope",
    type: "select",
    options: [
      { label: "Standard Tier", value: "STANDARD" },
      { label: "Premium Tier", value: "PREMIUM" },
      { label: "Enterprise Tier", value: "ENTERPRISE" },
      { label: "Internal Infrastructure", value: "INTERNAL" },
    ],
    required: true,
  },
  {
    name: "tenantId",
    label: "Tenant Scope Override",
    type: "text",
    placeholder: "GLOBAL or specific tenant UUID",
    defaultValue: "GLOBAL",
    required: true,
  },
];

export const wafRuleSchema = z.object({
  name: z.string().min(3, "WAF rule name required"),
  action: z.enum(["BLOCK", "CHALLENGE", "LOG"]),
  pattern: z.string().min(3, "Inspection pattern or expression required"),
  priority: z.number().min(1, "Priority must be at least 1"),
  enabled: z.boolean().default(true),
});

export type WafRule = z.infer<typeof wafRuleSchema> & {
  id: string;
  matches24h?: number;
};

export const wafFields: FieldDef[] = [
  {
    name: "name",
    label: "WAF Rule Name",
    type: "text",
    placeholder: "e.g. SQL Injection Detection",
    required: true,
  },
  {
    name: "action",
    label: "Inspection Action",
    type: "select",
    options: [
      { label: "BLOCK (403 Forbidden)", value: "BLOCK" },
      { label: "CHALLENGE (Managed JS/CAPTCHA)", value: "CHALLENGE" },
      { label: "LOG (Audit Telemetry Only)", value: "LOG" },
    ],
    required: true,
  },
  {
    name: "pattern",
    label: "Detection Pattern / Signature",
    type: "text",
    placeholder: "e.g. regex:(<script|onerror=)",
    required: true,
  },
  {
    name: "priority",
    label: "Evaluation Order Priority",
    type: "number",
    placeholder: "1",
    required: true,
  },
];

export interface ApiDeprecation {
  id: string;
  pathPrefix: string;
  deprecatedAt: string;
  sunsetAt: string;
  successor: string;
  link: string;
  activeConsumers: number;
  calls30d: number;
  status: "ANNOUNCED" | "SUNSETTING" | "SUNSET";
  description?: string;
}

export interface GatewayTrafficStats {
  gatewayRoutes: number;
  p99LatencyMs: number;
  wafFilterRate: string;
  rateLimitBreaches: number;
  activeClusters: number;
  requestsPerSec: number;
  blockedAttacks24h: number;
  healthStatus: string;
}
