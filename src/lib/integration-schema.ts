import { z } from "zod";

export const transformFunctionSchema = z.enum([
  "NONE",
  "UPPERCASE",
  "LOWERCASE",
  "FORMAT_DATE",
  "TRIM",
  "PARSE_FLOAT",
]);

export type TransformFunction = z.infer<typeof transformFunctionSchema>;

export const fieldMappingRuleSchema = z.object({
  sourceField: z.string().min(1, "Source field is required"),
  targetField: z.string().min(1, "Target field is required"),
  transform: transformFunctionSchema,
  defaultValue: z.string().optional(),
});

export type FieldMappingRule = z.infer<typeof fieldMappingRuleSchema>;

export const dataMappingSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "Mapping name must be at least 3 characters"),
  connectorId: z.string().min(1, "Connector is required"),
  sourceEntity: z.string().min(1, "Source entity is required"),
  targetEntity: z.string().min(1, "Target entity is required"),
  fieldMappings: z.array(fieldMappingRuleSchema).min(1, "At least one field rule is required"),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DataMappingDefinition = z.infer<typeof dataMappingSchema>;

export const syncScheduleJobSchema = z.object({
  id: z.string(),
  connectorId: z.string(),
  name: z.string().min(3, "Job name is required"),
  direction: z.enum(["ONE_WAY", "BI_DIRECTIONAL"]),
  scheduleCron: z.string().min(5, "Cron expression is required"),
  conflictStrategy: z.enum(["SOURCE_WINS", "TARGET_WINS", "MANUAL_REVIEW"]),
  batchSize: z.number().min(1).max(5000),
  status: z.enum(["ENABLED", "PAUSED", "RUNNING", "FAILED"]),
  lastRunAt: z.string().optional(),
  nextRunAt: z.string(),
});

export type SyncScheduleJob = z.infer<typeof syncScheduleJobSchema>;

export const connectorHealthSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["SALESFORCE", "SHOPIFY", "NETSUITE", "SAP_S4HANA", "POSTGRES_CDC", "WEBHOOK"]),
  status: z.enum(["HEALTHY", "DEGRADED", "FAILED"]),
  latencyMs: z.number(),
  errorRatePct: z.number(),
  throughputRowsSec: z.number(),
  recordsSynced24h: z.number(),
  lastHealthCheckAt: z.string(),
  activeJobsCount: z.number(),
});

export type ConnectorHealthItem = z.infer<typeof connectorHealthSchema>;
