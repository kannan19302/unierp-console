import { z } from "zod";
import type { FieldDef } from "@/lib/form-validation";

export const amendmentSchema = z.object({
  planId: z.string().min(1, "Plan selection is required"),
  billingPeriod: z.enum(["MONTHLY", "YEARLY"]),
  currency: z.string().default("USD"),
  effectiveDate: z.string().optional(),
});

export type AmendmentInput = z.infer<typeof amendmentSchema>;

export interface SubscriptionItem {
  id: string;
  tenantId: string;
  name?: string;
  tenant?: {
    id: string;
    name: string;
    slug?: string;
  };
  plan?: {
    id: string;
    name: string;
    tier?: string;
    prices?: {
      currency: string;
      monthly: number;
      yearly: number;
    }[];
  };
  planId?: string;
  billingPeriod?: "MONTHLY" | "YEARLY";
  currency?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  renewDate?: string;
  autoRenew?: boolean;
}

export interface RenewalItem {
  id: string;
  tenantId: string;
  tenantName: string;
  planName: string;
  contractValue: number;
  currency: string;
  billingPeriod: string;
  renewalDate: string;
  daysUntilRenewal: number;
  autoRenew: boolean;
  discountPct: number;
  status: "EXPIRING_SOON" | "HEALTHY" | "RENEWED";
}

export interface AmendmentPreview {
  tenantId: string;
  currentPlan: {
    id: string;
    name: string;
    price: number;
    billingPeriod: string;
    currency: string;
  };
  newPlan: {
    id: string;
    name: string;
    price: number;
    billingPeriod: string;
    currency: string;
  };
  periodStart: string;
  periodEnd: string;
  effectiveDate: string;
  proration: {
    creditAmount: number;
    chargeAmount: number;
    netAmount: number;
  };
  differencePerMonth: number;
  status: string;
}

export const amendmentFields: FieldDef[] = [
  {
    name: "planId",
    label: "Target Commercial Plan",
    type: "select",
    options: [
      { label: "Starter Growth ($149/mo)", value: "plan-starter" },
      { label: "Enterprise Platform ($499/mo)", value: "plan-enterprise" },
      { label: "Global Hyper-Scale ($999/mo)", value: "plan-hyperscale" },
    ],
    required: true,
  },
  {
    name: "billingPeriod",
    label: "Billing Frequency",
    type: "select",
    options: [
      { label: "Monthly Recurring", value: "MONTHLY" },
      { label: "Annual Commitment (15% discount)", value: "YEARLY" },
    ],
    required: true,
  },
  {
    name: "currency",
    label: "Settlement Currency",
    type: "select",
    options: [
      { label: "USD ($)", value: "USD" },
      { label: "EUR (€)", value: "EUR" },
      { label: "GBP (£)", value: "GBP" },
    ],
    required: true,
  },
];
