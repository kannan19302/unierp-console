import type { AbacPolicyRule } from "@/lib/security-schema";

export const DEFAULT_ABAC_RULES: AbacPolicyRule[] = [
  {
    id: "abac-rule-101",
    name: "SuperAdmin Universal Bypass Clearance",
    description: "Grants unrestricted operational clearance for verified platform super-administrators.",
    effect: "ALLOW",
    priority: 1,
    conditions: [
      { id: "c-1", attribute: "user.role", operator: "equals", value: "SUPER_ADMIN" },
    ],
  },
  {
    id: "abac-rule-102",
    name: "Customer PII Strict Isolation Perimeter",
    description: "Prohibits access to customer PII data stores unless authenticated as Data Protection Officer.",
    effect: "DENY",
    priority: 10,
    conditions: [
      { id: "c-2", attribute: "resource.type", operator: "equals", value: "customer_pii" },
      { id: "c-3", attribute: "user.role", operator: "not_equals", value: "DATA_PROTECTION_OFFICER" },
    ],
  },
  {
    id: "abac-rule-103",
    name: "Off-Hours Destructive Mutation Governance",
    description: "Requires dual-approval break-glass workflow for delete actions outside standard operating hours.",
    effect: "REQUIRE_APPROVAL",
    priority: 20,
    conditions: [
      { id: "c-4", attribute: "time.hour", operator: "in_range", value: "21-07" },
    ],
  },
  {
    id: "abac-rule-104",
    name: "Bring-Your-Own-Key (BYOK) Entitlement Enforcer",
    description: "Denies custom cryptographic key management for non-Enterprise tier subscriptions.",
    effect: "DENY",
    priority: 30,
    conditions: [
      { id: "c-5", attribute: "resource.type", operator: "equals", value: "custom_encryption_key" },
      { id: "c-6", attribute: "tenant.plan", operator: "not_equals", value: "ENTERPRISE" },
    ],
  },
];
