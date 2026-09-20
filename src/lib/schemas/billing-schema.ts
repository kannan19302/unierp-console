import { z } from "zod";
import type { FieldDef } from "@/components/CrudDrawer";
import type { FilterConfig } from "@/components/FilterBar";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface PlanPriceTier {
  id?: string;
  currency: string;
  region: string;
  monthly: number;
  yearly: number;
  stripePriceId?: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "ARCHIVED" | "GRANDFATHERED";
  version: number;
  maxUsers: number;
  maxStorage: number;
  maxApiCalls: number;
  isPublic: boolean;
  features: Record<string, boolean>;
  prices: PlanPriceTier[];
  createdAt: string;
  updatedAt?: string;
  tenantCount?: number;
}

export interface BillingSubscription {
  id: string;
  tenantId: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  planId: string;
  plan?: BillingPlan;
  status: "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELLED" | "EXPIRED" | "PAUSED" | "PENDING";
  billingPeriod: "MONTHLY" | "YEARLY";
  currency: string;
  startDate: string;
  endDate?: string | null;
  trialEndsAt?: string | null;
  cancelledAt?: string | null;
  pauseStart?: string | null;
  pauseEnd?: string | null;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillingInvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  type: "PLAN" | "ADDON" | "OVERAGE" | "CREDIT" | "TAX" | "DISCOUNT";
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface BillingInvoice {
  id: string;
  tenantId: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  subscriptionId?: string;
  invoiceNumber: string;
  status: "DRAFT" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED";
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  dueDate?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  lines: BillingInvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Available Modules Catalog for Plans ──────────────────────────────────

export const AVAILABLE_MODULES = [
  { key: "crm", label: "Customer Relationship Management (CRM)" },
  { key: "finance", label: "Core Financials & General Ledger" },
  { key: "inventory", label: "Inventory & Warehouse Operations" },
  { key: "manufacturing", label: "Manufacturing & Work Orders" },
  { key: "hr", label: "Human Resources & Payroll" },
  { key: "supplyChain", label: "Supply Chain & Procurement" },
  { key: "analytics", label: "Advanced BI & Executive Analytics" },
  { key: "compliance", label: "SOC2 / ISO Security Governance" },
];

// ─── Form Schemas & Field Defs ──────────────────────────────────────────────

export const planFormSchema = z.object({
  name: z.string().min(2, "Plan name must be at least 2 characters"),
  description: z.string().optional(),
  maxUsers: z.coerce.number().int().min(1, "Must allow at least 1 user"),
  maxStorage: z.coerce.number().int().min(1, "Storage quota in GB must be at least 1"),
  maxApiCalls: z.coerce.number().int().min(100, "API calls quota must be at least 100"),
  monthlyPrice: z.coerce.number().min(0, "Price cannot be negative"),
  yearlyPrice: z.coerce.number().min(0, "Yearly price cannot be negative"),
  currency: z.string().default("USD"),
  isPublic: z.boolean().default(true),
});

export const planDrawerFields: FieldDef[] = [
  {
    name: "name",
    label: "Plan Name",
    type: "text",
    placeholder: "e.g. Enterprise Plus",
    required: true,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Purpose and packaging tier description",
  },
  {
    name: "monthlyPrice",
    label: "Monthly Price ($)",
    type: "number",
    placeholder: "299",
    required: true,
  },
  {
    name: "yearlyPrice",
    label: "Yearly Price ($)",
    type: "number",
    placeholder: "2990",
    required: true,
  },
  {
    name: "maxUsers",
    label: "User Seats Limit",
    type: "number",
    placeholder: "50",
    required: true,
  },
  {
    name: "maxStorage",
    label: "Storage Limit (GB)",
    type: "number",
    placeholder: "100",
    required: true,
  },
  {
    name: "maxApiCalls",
    label: "Daily API Call Quota",
    type: "number",
    placeholder: "50000",
    required: true,
  },
  {
    name: "isPublic",
    label: "Published to Public Marketplace",
    type: "checkbox",
  },
];

export const subscriptionAmendSchema = z.object({
  planId: z.string().min(1, "Target plan is required"),
  billingPeriod: z.enum(["MONTHLY", "YEARLY"]),
  reason: z.string().min(3, "Amendment reason is required"),
});

export const creditNoteSchema = z.object({
  amount: z.coerce.number().positive("Credit amount must be positive"),
  reason: z.string().min(5, "A justification of at least 5 characters is required"),
});

export const creditNoteDrawerFields: FieldDef[] = [
  {
    name: "amount",
    label: "Credit Amount ($)",
    type: "number",
    placeholder: "50.00",
    required: true,
  },
  {
    name: "reason",
    label: "Justification Reason",
    type: "textarea",
    placeholder: "Explain reason for credit note issuance...",
    required: true,
  },
];

// ─── Filter Configurations ─────────────────────────────────────────────────

export const planFilterConfigs: FilterConfig[] = [
  {
    key: "status",
    label: "Plan Status",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Archived", value: "ARCHIVED" },
      { label: "Grandfathered", value: "GRANDFATHERED" },
    ],
  },
];

export const subscriptionFilterConfigs: FilterConfig[] = [
  {
    key: "status",
    label: "Subscription Status",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Trial", value: "TRIAL" },
      { label: "Past Due", value: "PAST_DUE" },
      { label: "Paused", value: "PAUSED" },
      { label: "Cancelled", value: "CANCELLED" },
    ],
  },
  {
    key: "billingPeriod",
    label: "Billing Cadence",
    options: [
      { label: "Monthly", value: "MONTHLY" },
      { label: "Yearly", value: "YEARLY" },
    ],
  },
];

export const invoiceFilterConfigs: FilterConfig[] = [
  {
    key: "status",
    label: "Invoice Status",
    options: [
      { label: "Paid", value: "PAID" },
      { label: "Pending", value: "PENDING" },
      { label: "Overdue", value: "OVERDUE" },
      { label: "Cancelled", value: "CANCELLED" },
      { label: "Draft", value: "DRAFT" },
    ],
  },
];
