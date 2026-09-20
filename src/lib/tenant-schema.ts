import { z } from "zod";
import type { FieldDef } from "@/components/CrudDrawer";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED" | "TRIAL" | "OFFBOARDING" | string;
  residencyRegion?: string;
  demoDataLoaded?: boolean;
  userCount?: number;
  orgCount?: number;
  subscription?: {
    planName: string;
    status: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export const createTenantFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  plan: z.string().min(1, "Plan is required"),
  adminEmail: z.string().trim().email("Valid admin email is required"),
  residencyRegion: z.string().default("us-east-1"),
});

export const editTenantFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  plan: z.string().min(1, "Plan is required"),
  status: z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]),
  residencyRegion: z.string().optional(),
});

export type CreateTenantFormData = z.infer<typeof createTenantFormSchema>;
export type EditTenantFormData = z.infer<typeof editTenantFormSchema>;

export const tenantDrawerFields: FieldDef[] = [
  {
    name: "name",
    label: "Tenant Name",
    type: "text",
    required: true,
    placeholder: "Acme Corporation",
  },
  {
    name: "plan",
    label: "Subscription Plan",
    type: "select",
    required: true,
    options: [
      { label: "Startup (Free Tier)", value: "STARTUP" },
      { label: "Growth ($299/mo)", value: "GROWTH" },
      { label: "Enterprise ($999/mo)", value: "ENTERPRISE" },
    ],
  },
  {
    name: "status",
    label: "Lifecycle Status",
    type: "select",
    required: true,
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Suspended", value: "SUSPENDED" },
      { label: "Archived", value: "ARCHIVED" },
    ],
  },
  {
    name: "residencyRegion",
    label: "Data Residency Region",
    type: "select",
    options: [
      { label: "US East (N. Virginia)", value: "us-east-1" },
      { label: "EU Central (Frankfurt)", value: "eu-central-1" },
      { label: "Asia Pacific (Mumbai)", value: "ap-south-1" },
    ],
  },
];
