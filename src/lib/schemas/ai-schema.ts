import { z } from "zod";

export const AiCapabilityEnum = z.enum(["chat", "code", "vision", "tools", "json", "embeddings"]);
export type AiCapability = z.infer<typeof AiCapabilityEnum>;

export const AiModelSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  providerName: z.string().optional(),
  modelId: z.string().min(1, "Model ID is required"),
  version: z.string().optional(),
  capabilities: z.array(z.string()).default([]),
  contextWindow: z.number().optional(),
  costPer1kTokens: z.number().optional(),
  status: z.enum(["ACTIVE", "DISABLED", "DEPRECATED"]).default("ACTIVE"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type AiModel = z.infer<typeof AiModelSchema>;

export const GuardrailRuleTypeEnum = z.enum(["KEYWORD", "REGEX", "PII", "TOXICITY"]);
export type GuardrailRuleType = z.infer<typeof GuardrailRuleTypeEnum>;

export const GuardrailActionEnum = z.enum(["BLOCK", "WARN"]);
export type GuardrailAction = z.infer<typeof GuardrailActionEnum>;

export const GuardrailPolicySchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Policy name must be at least 2 characters"),
  ruleType: GuardrailRuleTypeEnum,
  rule: z.record(z.string(), z.unknown()).default({}),
  action: GuardrailActionEnum.default("BLOCK"),
  severity: z.enum(["high", "medium", "low"]).default("high"),
  enabled: z.boolean().default(true),
  description: z.string().optional(),
  createdAt: z.string().optional(),
});
export type GuardrailPolicy = z.infer<typeof GuardrailPolicySchema>;

export const ModelCostMetricSchema = z.object({
  modelId: z.string(),
  provider: z.string(),
  spendUsd: z.number(),
  tokens: z.number(),
  queries: z.number(),
});
export type ModelCostMetric = z.infer<typeof ModelCostMetricSchema>;

export const TenantCostMetricSchema = z.object({
  tenantId: z.string(),
  tenantName: z.string(),
  spendUsd: z.number(),
  queries: z.number(),
});
export type TenantCostMetric = z.infer<typeof TenantCostMetricSchema>;

export const AiTelemetrySchema = z.object({
  period: z.string(),
  totalSpendUsd: z.number(),
  totalQueries: z.number(),
  totalTokens: z.number(),
  costByModel: z.array(ModelCostMetricSchema),
  costByTenant: z.array(TenantCostMetricSchema),
  tokenRateBudget: z.object({
    dailyCap: z.number(),
    consumedToday: z.number(),
    pctUsed: z.number(),
  }),
});
export type AiTelemetry = z.infer<typeof AiTelemetrySchema>;
