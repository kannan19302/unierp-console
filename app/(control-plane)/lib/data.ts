export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: "STARTER" | "BUSINESS" | "ENTERPRISE";
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  dbMode: "SHARED" | "DEDICATED";
  region: string;
  storageGb: number;
  maxStorageGb: number;
  apiRateLimit: number;
  adminEmail: string;
  customDomain?: string;
  createdAt: string;
}

export const DEFAULT_TENANTS: Tenant[] = [
  { id: "ten-001", name: "Acme Corporation", slug: "acme", plan: "ENTERPRISE", status: "ACTIVE", dbMode: "DEDICATED", region: "us-east-1", storageGb: 342, maxStorageGb: 500, apiRateLimit: 5000, adminEmail: "admin@acme.com", customDomain: "erp.acme.com", createdAt: "2026-01-15" },
  { id: "ten-002", name: "Stark Industries", slug: "stark", plan: "ENTERPRISE", status: "ACTIVE", dbMode: "DEDICATED", region: "us-east-1", storageGb: 188, maxStorageGb: 1000, apiRateLimit: 10000, adminEmail: "pepper@stark.com", customDomain: "portal.stark.com", createdAt: "2026-02-10" },
  { id: "ten-003", name: "Cyberdyne Systems", slug: "cyberdyne", plan: "STARTER", status: "PENDING", dbMode: "SHARED", region: "ap-south-1", storageGb: 12, maxStorageGb: 50, apiRateLimit: 1000, adminEmail: "miles@cyberdyne.com", createdAt: "2026-03-01" },
  { id: "ten-004", name: "Wayne Enterprises", slug: "wayne", plan: "ENTERPRISE", status: "ACTIVE", dbMode: "DEDICATED", region: "eu-central-1", storageGb: 720, maxStorageGb: 2000, apiRateLimit: 8000, adminEmail: "bruce@wayne.com", customDomain: "cloud.wayne.com", createdAt: "2026-03-12" },
  { id: "ten-005", name: "Umbrella Corp", slug: "umbrella", plan: "BUSINESS", status: "SUSPENDED", dbMode: "SHARED", region: "us-east-1", storageGb: 84, maxStorageGb: 200, apiRateLimit: 2500, adminEmail: "wesker@umbrella.com", createdAt: "2026-04-05" },
  { id: "ten-006", name: "Gekko & Co", slug: "gekko", plan: "BUSINESS", status: "ACTIVE", dbMode: "SHARED", region: "eu-central-1", storageGb: 45, maxStorageGb: 200, apiRateLimit: 2500, adminEmail: "gordon@gekko.com", createdAt: "2026-05-18" },
];
