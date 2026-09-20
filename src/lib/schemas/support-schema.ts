import { z } from "zod";

export const TicketSeverityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
export type TicketSeverity = z.infer<typeof TicketSeverityEnum>;

export const TicketStatusEnum = z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]);
export type TicketStatus = z.infer<typeof TicketStatusEnum>;

export const TicketMessageSchema = z.object({
  id: z.string(),
  isStaff: z.boolean(),
  senderName: z.string(),
  message: z.string().min(1, "Message content cannot be empty"),
  createdAt: z.string(),
});
export type TicketMessage = z.infer<typeof TicketMessageSchema>;

export const SupportTicketSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  tenantName: z.string().optional(),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  severity: TicketSeverityEnum,
  category: z.string().default("GENERAL"),
  status: TicketStatusEnum.default("OPEN"),
  assignedTo: z.string().optional(),
  slaDueAt: z.string(),
  slaCountdownMinutes: z.number().optional(),
  isBreached: z.boolean().optional(),
  messages: z.array(TicketMessageSchema).default([]),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
});
export type SupportTicket = z.infer<typeof SupportTicketSchema>;

export const DiagnosticScopeEnum = z.enum([
  "READ_ONLY_DATABASE_QUERY",
  "EPHEMERAL_LOG_STREAM",
  "SESSION_REPLAY_VIEW",
  "CONFIGURATION_STATE_INSPECT",
]);
export type DiagnosticScope = z.infer<typeof DiagnosticScopeEnum>;

export const DiagnosticConsentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  tenantName: z.string().optional(),
  scope: DiagnosticScopeEnum,
  reason: z.string().min(5, "Justification reason is required"),
  status: z.enum(["PENDING", "GRANTED", "EXPIRED", "REVOKED"]).default("PENDING"),
  requestedBy: z.string(),
  grantedBy: z.string().optional(),
  expiresAt: z.string(),
  createdAt: z.string(),
});
export type DiagnosticConsent = z.infer<typeof DiagnosticConsentSchema>;
