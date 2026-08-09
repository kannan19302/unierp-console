/**
 * Shared badge / formatting helpers for the Tenants domain sub-tabs.
 * Keeps status rendering consistent and restricted to the allowed variants.
 */
import type { BadgeProps } from "@kannan19302/ui";

export type BadgeVariant = NonNullable<BadgeProps["variant"]>;

const SUCCESS = new Set([
  "ACTIVE",
  "ENABLED",
  "COMPLETED",
  "SUCCESS",
  "ONLINE",
  "READY",
  "HEALTHY",
  "SYNCED",
  "APPROVED",
  "DELIVERED",
  "PAID",
  "CURRENT",
  "RESOLVED",
]);
const INFO = new Set([
  "PROVISIONING",
  "PENDING",
  "RUNNING",
  "IN_PROGRESS",
  "PROCESSING",
  "QUEUED",
  "PARTIAL",
  "REVIEW",
  "OPEN",
  "INVITED",
]);
const WARNING = new Set([
  "SUSPENDED",
  "DISABLED",
  "DEGRADED",
  "WARNING",
  "EXPIRED",
  "CANCELLED",
  "OVER_LIMIT",
  "PAUSED",
  "DRAFT",
  "DELINQUENT",
  "CLOSED",
]);
const DANGER = new Set([
  "OFFBOARDING",
  "FAILED",
  "FAILED_EXTERNAL",
  "ERROR",
  "BREACHED",
  "TERMINATED",
  "CRITICAL",
  "QUARANTINED",
  "REJECTED",
]);

export function statusVariant(status?: string): BadgeVariant {
  const s = (status ?? "").toUpperCase();
  if (SUCCESS.has(s)) return "success";
  if (INFO.has(s)) return "info";
  if (WARNING.has(s)) return "warning";
  if (DANGER.has(s)) return "danger";
  return "default";
}

export function priorityVariant(priority?: string): BadgeVariant {
  const p = (priority ?? "").toUpperCase();
  if (p === "P1" || p === "CRITICAL" || p === "URGENT" || p === "HIGH") return "danger";
  if (p === "P2" || p === "MEDIUM" || p === "NORMAL" || p === "P3") return "warning";
  return "default";
}

export function fmt(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n.toLocaleString() : "—";
}

export function money(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}