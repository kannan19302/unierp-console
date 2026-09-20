import { z } from "zod";

export const WidgetTypeEnum = z.enum(["KPI_CARD", "LINE_CHART", "BAR_CHART", "DATA_TABLE"]);
export type WidgetType = z.infer<typeof WidgetTypeEnum>;

export const DashboardWidgetSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Widget title is required"),
  type: WidgetTypeEnum,
  metric: z.string().min(1, "Metric identifier is required"),
  dimension: z.string().optional(),
  gridSpan: z.number().min(1).max(4).default(1),
  config: z.record(z.string(), z.unknown()).optional(),
});
export type DashboardWidget = z.infer<typeof DashboardWidgetSchema>;

export const CustomDashboardSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Dashboard name must be at least 2 characters"),
  description: z.string().optional(),
  category: z.enum(["REVENUE", "OPERATIONS", "SECURITY", "USAGE"]).default("REVENUE"),
  isDefault: z.boolean().optional(),
  widgets: z.array(DashboardWidgetSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type CustomDashboard = z.infer<typeof CustomDashboardSchema>;

export const ReportFrequencyEnum = z.enum(["DAILY", "WEEKLY", "MONTHLY"]);
export type ReportFrequency = z.infer<typeof ReportFrequencyEnum>;

export const ReportFormatEnum = z.enum(["PDF", "CSV", "EXCEL"]);
export type ReportFormat = z.infer<typeof ReportFormatEnum>;

export const ReportScheduleSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Schedule name is required"),
  dashboardId: z.string().optional(),
  frequency: ReportFrequencyEnum,
  format: ReportFormatEnum,
  recipients: z.array(z.string().email("Invalid email format")),
  status: z.enum(["ACTIVE", "PAUSED"]).default("ACTIVE"),
  lastRunAt: z.string().optional(),
  nextRunAt: z.string(),
  createdAt: z.string().optional(),
});
export type ReportSchedule = z.infer<typeof ReportScheduleSchema>;

export const AnomalyAlertSchema = z.object({
  id: z.string(),
  metric: z.string(),
  severity: z.enum(["CRITICAL", "WARNING", "INFO"]),
  currentValue: z.number(),
  expectedThreshold: z.number(),
  detectedAt: z.string(),
  summary: z.string(),
});
export type AnomalyAlert = z.infer<typeof AnomalyAlertSchema>;
