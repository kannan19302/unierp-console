import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Building2,
  UserCog,
  CreditCard,
  Puzzle,
  Code2,
  Blocks,
  ServerCog,
  Server,
  ShieldCheck,
  LifeBuoy,
  PackageOpen,
  Globe,
  Settings,
  Activity,
  Shield,
  Users,
  KeyRound,
  KeySquare,
  Network,
  Scale,
  Radar,
  Smartphone,
  Monitor,
  BookOpen,
  Brain,
  Layers,
  LayoutGrid,
} from "lucide-react";
import type { AppManifest, AppClusterId } from "./types";

// ── the registry ────────────────────────────────────────────────────────────

const _apps: AppManifest[] = [];

export const NAV_ITEMS: AppManifest[] = _apps;

/** Register (or replace, if the id already exists) an app's manifest. */
export function registerApp(manifest: AppManifest): void {
  const idx = _apps.findIndex((a) => a.id === manifest.id);
  if (idx >= 0) _apps[idx] = manifest;
  else _apps.push(manifest);
}

/** Remove a previously registered app. No-op if the id was never registered. */
export function unregisterApp(id: string): void {
  const idx = _apps.findIndex((a) => a.id === id);
  if (idx >= 0) _apps.splice(idx, 1);
}

/** Every `permission` string declared anywhere across every registered app. */
export function getAllDeclaredPermissions(): string[] {
  const perms = new Set<string>();
  for (const app of _apps) {
    if (app.permission) perms.add(app.permission);
    for (const tab of app.tabs) {
      if (tab.permission) perms.add(tab.permission);
      for (const sub of tab.subTabs ?? []) {
        if (sub.permission) perms.add(sub.permission);
      }
    }
  }
  return [...perms].sort();
}

/** Test-only: clears every registration. Never call this from app code. */
export function __resetAppRegistryForTests(): void {
  _apps.length = 0;
}

// ── the console's applications ──────────────────────────────────────────────

// Central Command Center Overview
registerApp({
  id: "overview",
  appId: "OCC-01",
  clusterId: "platform",
  clusterName: "Platform & Infrastructure OS",
  label: "Overview",
  description: "Unified Command Center KPI dashboard and cross-estate health summary.",
  icon: LayoutDashboard,
  base: "/overview",
  permission: "platform.overview.read",
  tabs: [
    { key: "dashboard", label: "Dashboard", path: "/overview", permission: "platform.overview.read" },
    { key: "platform-health", label: "Platform Health", path: "/overview/platform-health", permission: "system.health.read" },
    { key: "business", label: "Business", path: "/overview/business", permission: "system.analytics.read" },
    { key: "usage", label: "Usage", path: "/overview/usage", permission: "system.analytics.read" },
    { key: "operations", label: "Operations", path: "/overview/operations", permission: "system.health.read" },
    { key: "security", label: "Security", path: "/overview/security", permission: "platform.overview.read" },
    { key: "activity", label: "Activity", path: "/overview/activity", permission: "platform.overview.read" },
  ],
  searchKeywords: ["overview", "dashboard", "kpi", "command center", "metrics"],
});

// PCC-01: Platform Operations Center
registerApp({
  id: "ops",
  appId: "PCC-01",
  clusterId: "platform",
  clusterName: "Platform & Infrastructure OS",
  label: "Platform Operations",
  description: "Platform services, canary releases, background jobs, queues, runbooks, and incident command.",
  icon: ServerCog,
  base: "/ops",
  canonicalPath: "/operations",
  permission: "pcc.operations.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/ops" },
    { key: "services", label: "Services", path: "/ops/services" },
    { key: "environments", label: "Environments", path: "/ops/environments" },
    { key: "releases", label: "Releases", path: "/ops/releases" },
    { key: "deployments", label: "Deployments", path: "/ops/deployments" },
    { key: "jobs", label: "Jobs", path: "/ops/jobs" },
    { key: "queues", label: "Queues", path: "/ops/queues" },
    { key: "workflows", label: "Workflows", path: "/ops/workflows" },
    { key: "automation", label: "Automation", path: "/ops/automation" },
    { key: "incidents", label: "Incidents", path: "/ops/incidents" },
    { key: "maintenance", label: "Maintenance", path: "/ops/maintenance" },
  ],
  searchKeywords: ["operations", "ops", "canary", "releases", "incidents", "queues", "jobs"],
  resourceKinds: ["platform-service", "provider-incident", "platform-change", "platform-release", "maintenance-window", "runbook-execution", "platform-job", "platform-queue"],
});

// PCC-02: Platform Security Center
registerApp({
  id: "security",
  appId: "PCC-02",
  clusterId: "security",
  clusterName: "Trust, Security & Compliance",
  label: "Platform Security",
  description: "Security posture, CVE vulnerability triage, break-glass dual-control, and encryption audits.",
  icon: ShieldCheck,
  base: "/security",
  canonicalPath: "/security-center",
  permission: "pcc.security.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/security" },
    { key: "threats", label: "Threats", path: "/security/threats" },
    { key: "policies", label: "Policies", path: "/security/policies" },
    { key: "identity", label: "Identity", path: "/security/identity" },
    { key: "secrets", label: "Secrets", path: "/security/secrets" },
    { key: "privacy", label: "Privacy", path: "/security/privacy" },
    { key: "compliance", label: "Compliance", path: "/security/compliance" },
    { key: "controls", label: "Controls", path: "/security/compliance/controls" },
    { key: "audit", label: "Audit", path: "/security/audit" },
  ],
  searchKeywords: ["security", "vulnerabilities", "posture", "break-glass", "cve", "policies"],
  resourceKinds: ["provider-security-policy", "platform-vulnerability", "security-exception", "privileged-access-review", "break-glass-activation", "encryption-posture"],
});

// PCC-03: Organization Identity Governance
registerApp({
  id: "access",
  appId: "PCC-03",
  clusterId: "security",
  clusterName: "Trust, Security & Compliance",
  label: "Identity Governance",
  description: "Provider workforce IAM, roles, access reviews, service principals, and support delegation.",
  icon: UserCog,
  base: "/access",
  canonicalPath: "/identity-governance",
  permission: "pcc.identity-governance.access",
  tabs: [
    { key: "directory", label: "Directory", path: "/access/directory" },
    { key: "roles", label: "Roles", path: "/access/roles" },
    { key: "permissions", label: "Permissions", path: "/access/permissions" },
    { key: "authentication", label: "Authentication", path: "/access/authentication" },
    { key: "sessions", label: "Sessions", path: "/access/sessions" },
    { key: "governance", label: "Governance", path: "/access/governance" },
    { key: "audit", label: "Audit", path: "/access/audit" },
  ],
  searchKeywords: ["identity", "iam", "roles", "users", "delegation", "workforce", "service principals"],
  resourceKinds: ["provider-workforce-member", "provider-role", "provider-access-package", "provider-access-review", "provider-service-principal", "support-access-delegation"],
});

// PCC-04: Subscription Operations
registerApp({
  id: "subscription-operations",
  appId: "PCC-04",
  clusterId: "tenancy",
  clusterName: "Tenancy, Commercial & Revenue",
  label: "Subscription Operations",
  description: "Commercial tiers, customer subscriptions, amendments, renewals, and enterprise contracts.",
  icon: CreditCard,
  base: "/subscription-operations",
  canonicalPath: "/subscription-operations",
  permission: "pcc.subscriptions.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/subscription-operations" },
    { key: "plans", label: "Plans", path: "/billing/plans" },
    { key: "subscriptions", label: "Subscriptions", path: "/billing/subscriptions" },
    { key: "amendments", label: "Amendments", path: "/subscription-operations#amendments" },
    { key: "renewals", label: "Renewals", path: "/subscription-operations#renewals" },
    { key: "contracts", label: "Contracts", path: "/subscription-operations#contracts" },
  ],
  searchKeywords: ["plans", "subscriptions", "amendments", "renewals", "contracts", "commercial"],
  resourceKinds: ["commercial-plan", "commercial-offer", "customer-subscription", "subscription-amendment", "subscription-renewal", "subscription-migration", "commercial-contract"],
});

// PCC-05: Entitlement & License Authority
registerApp({
  id: "entitlement-authority",
  appId: "PCC-05",
  clusterId: "tenancy",
  clusterName: "Tenancy, Commercial & Revenue",
  label: "Entitlements & Licenses",
  description: "Tenant capability grants, module provisioning flags, offline licenses, and seat pools.",
  icon: KeySquare,
  base: "/entitlement-authority",
  canonicalPath: "/entitlement-authority",
  permission: "pcc.entitlements.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/entitlement-authority" },
    { key: "modules", label: "Module Grants", path: "/tenants/modules" },
    { key: "pools", label: "License Pools", path: "/entitlement-authority#pools" },
    { key: "offline", label: "Offline Licenses", path: "/entitlement-authority#offline" },
    { key: "reconciliation", label: "Reconciliation", path: "/entitlement-authority#reconciliation" },
  ],
  searchKeywords: ["entitlements", "licenses", "grants", "seats", "offline licenses", "modules"],
  resourceKinds: ["entitlement-definition", "organization-entitlement-grant", "license-pool", "license-policy", "offline-license", "entitlement-reconciliation"],
});

// PCC-06: Revenue & Billing Operations
registerApp({
  id: "billing",
  appId: "PCC-06",
  clusterId: "tenancy",
  clusterName: "Tenancy, Commercial & Revenue",
  label: "Revenue & Billing",
  description: "Usage rating, invoice generation, payment gateways, credit notes, and financial reconciliation.",
  icon: CreditCard,
  base: "/billing",
  canonicalPath: "/revenue-billing",
  permission: "pcc.billing.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/billing" },
    { key: "plans", label: "Plans", path: "/billing/plans" },
    { key: "subscriptions", label: "Subscriptions", path: "/billing/subscriptions" },
    { key: "customers", label: "Customers", path: "/billing/customers" },
    { key: "invoices", label: "Invoices", path: "/billing/invoices" },
    { key: "payments", label: "Payments", path: "/billing/payments" },
    { key: "usage", label: "Usage", path: "/billing/usage" },
    { key: "revenue", label: "Revenue", path: "/billing/revenue" },
    { key: "configuration", label: "Configuration", path: "/billing/configuration" },
  ],
  searchKeywords: ["billing", "invoices", "payments", "revenue", "charges", "credit notes"],
  resourceKinds: ["provider-billing-account", "price-book", "rated-charge", "provider-invoice", "provider-payment", "credit-note", "revenue-schedule", "marketplace-payout", "financial-reconciliation"],
});

// PCC-07: Key & Secrets Authority
registerApp({
  id: "keys-secrets",
  appId: "PCC-07",
  clusterId: "security",
  clusterName: "Trust, Security & Compliance",
  label: "Keys & Secrets",
  description: "Platform KMS master keys, mTLS certificate lifecycles, HSM bindings, and zero-trust rotation.",
  icon: KeyRound,
  base: "/keys-secrets",
  canonicalPath: "/keys-secrets",
  permission: "pcc.secrets.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/keys-secrets" },
    { key: "secrets", label: "Secret References", path: "/security/secrets" },
    { key: "certificates", label: "Certificates", path: "/keys-secrets#certificates" },
    { key: "leases", label: "Secret Leases", path: "/keys-secrets#leases" },
    { key: "ceremonies", label: "Key Ceremonies", path: "/keys-secrets#ceremonies" },
  ],
  searchKeywords: ["secrets", "keys", "kms", "certificates", "mtls", "leases", "rotation"],
  resourceKinds: ["provider-secret-reference", "cryptographic-key", "signing-key", "platform-certificate", "secret-lease", "key-ceremony"],
});

// PCC-08: API Traffic Control
registerApp({
  id: "api-traffic",
  appId: "PCC-08",
  clusterId: "ecosystem",
  clusterName: "Developer Platform & Ecosystem",
  label: "API Traffic Control",
  description: "API gateway routing, rate limits, traffic shaping, WAF, and API deprecation policies.",
  icon: Network,
  base: "/api-traffic",
  canonicalPath: "/api-traffic",
  permission: "pcc.api-traffic.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/api-traffic" },
    { key: "apis", label: "Gateway Routes", path: "/developers/apis" },
    { key: "rate-limits", label: "Rate Limits", path: "/api-traffic#rate-limits" },
    { key: "traffic-rules", label: "Traffic Rules", path: "/api-traffic#traffic-rules" },
    { key: "usage", label: "API Usage", path: "/billing/usage" },
  ],
  searchKeywords: ["api", "traffic", "gateway", "rate limits", "waf", "meters", "quotas"],
  resourceKinds: ["api-product", "gateway-route", "gateway-policy", "traffic-rule", "meter-definition", "abuse-case", "api-deprecation"],
});

// PCC-09: Governance & Compliance Center
registerApp({
  id: "governance-compliance",
  appId: "PCC-09",
  clusterId: "security",
  clusterName: "Trust, Security & Compliance",
  label: "Governance & Compliance",
  description: "SOC2, ISO27001, HIPAA, GDPR frameworks, evidence locker, and audit engagements.",
  icon: Scale,
  base: "/governance-compliance",
  canonicalPath: "/governance-compliance",
  permission: "pcc.compliance.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/governance-compliance" },
    { key: "compliance", label: "Compliance Posture", path: "/security/compliance" },
    { key: "controls", label: "Controls", path: "/security/compliance/controls" },
    { key: "evidence", label: "Evidence Locker", path: "/governance-compliance#evidence" },
    { key: "audits", label: "Audit Engagements", path: "/security/audit" },
  ],
  searchKeywords: ["compliance", "governance", "soc2", "iso27001", "gdpr", "controls", "evidence"],
  resourceKinds: ["regulatory-framework", "provider-control", "provider-evidence", "provider-audit-engagement", "provider-risk", "provider-attestation", "privacy-impact-assessment"],
});

// PCC-10: Security Intelligence (SOC)
registerApp({
  id: "security-intelligence",
  appId: "PCC-10",
  clusterId: "security",
  clusterName: "Trust, Security & Compliance",
  label: "Security Intelligence (SOC)",
  description: "Real-time threat detection rules, SOC cases, SIEM feeds, and automated containment.",
  icon: Radar,
  base: "/security-intelligence",
  canonicalPath: "/security-intelligence",
  permission: "pcc.security-intelligence.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/security-intelligence" },
    { key: "threats", label: "Threat Events", path: "/security/threats" },
    { key: "detection-rules", label: "Detection Rules", path: "/security-intelligence#detection-rules" },
    { key: "soc-cases", label: "SOC Cases", path: "/security-intelligence#soc-cases" },
    { key: "containment", label: "Containment Actions", path: "/security-intelligence#containment" },
  ],
  searchKeywords: ["soc", "threats", "intelligence", "siem", "containment", "detections"],
  resourceKinds: ["security-telemetry-source", "detection-rule", "security-alert", "soc-case", "threat-indicator", "threat-hunt", "containment-action"],
});

// PCC-11: Mobile Platform Operations
registerApp({
  id: "mobile-operations",
  appId: "PCC-11",
  clusterId: "clients",
  clusterName: "Multi-Experience & Native Clients",
  label: "Mobile Platform Operations",
  description: "iOS/Android build pipelines, OTA updates, push gateways (APNs/FCM), and store releases.",
  icon: Smartphone,
  base: "/mobile-operations",
  canonicalPath: "/mobile-operations",
  permission: "pcc.mobile.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/mobile-operations" },
    { key: "builds", label: "Builds", path: "/mobile-operations#builds" },
    { key: "channels", label: "Release Channels", path: "/mobile-operations#channels" },
    { key: "push", label: "Push Gateways", path: "/mobile-operations#push" },
    { key: "signing", label: "Signing Profiles", path: "/mobile-operations#signing" },
  ],
  searchKeywords: ["mobile", "ios", "android", "ota", "push", "fcm", "apns", "app store"],
  resourceKinds: ["mobile-build", "mobile-release-channel", "mobile-version-policy", "mobile-signing-profile", "mobile-store-release", "push-provider-binding"],
});

// PCC-12: Desktop Platform Operations
registerApp({
  id: "desktop-operations",
  appId: "PCC-12",
  clusterId: "clients",
  clusterName: "Multi-Experience & Native Clients",
  label: "Desktop Platform Operations",
  description: "Windows/macOS/Linux client packaging, Apple Notarization, Windows Authenticode, auto-updates.",
  icon: Monitor,
  base: "/desktop-operations",
  canonicalPath: "/desktop-operations",
  permission: "pcc.desktop.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/desktop-operations" },
    { key: "builds", label: "Builds", path: "/desktop-operations#builds" },
    { key: "channels", label: "Channels", path: "/desktop-operations#channels" },
    { key: "signing", label: "Code Signing", path: "/desktop-operations#signing" },
    { key: "autoupdate", label: "Auto-Update", path: "/desktop-operations#autoupdate" },
  ],
  searchKeywords: ["desktop", "windows", "macos", "linux", "notarization", "authenticode", "installers"],
  resourceKinds: ["desktop-build", "desktop-release-channel", "desktop-version-policy", "desktop-signing-profile", "desktop-installer", "desktop-update-policy"],
});

// PCC-13: Global Platform Configuration
registerApp({
  id: "settings",
  appId: "PCC-13",
  clusterId: "platform",
  clusterName: "Platform & Infrastructure OS",
  label: "Global Configuration",
  description: "Global schemas, dynamic feature toggles, platform parameters, and configuration drift.",
  icon: Settings,
  base: "/settings",
  canonicalPath: "/platform-configuration",
  permission: "pcc.configuration.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/settings" },
    { key: "platform", label: "Platform", path: "/settings/platform" },
    { key: "defaults", label: "Defaults", path: "/settings/defaults" },
    { key: "localization", label: "Localization", path: "/settings/localization" },
    { key: "templates", label: "Templates", path: "/settings/templates" },
    { key: "branding", label: "Branding", path: "/settings/branding" },
    { key: "policies", label: "Policies", path: "/settings/policies" },
    { key: "features", label: "Features", path: "/settings/features" },
  ],
  searchKeywords: ["configuration", "settings", "feature flags", "schemas", "defaults", "drift"],
  resourceKinds: ["configuration-schema", "platform-configuration-value", "configuration-template", "feature-rollout", "configuration-promotion", "configuration-drift"],
});

// PCC-14: Developer Ecosystem Operations
registerApp({
  id: "developers",
  appId: "PCC-14",
  clusterId: "ecosystem",
  clusterName: "Developer Platform & Ecosystem",
  label: "Developer Ecosystem",
  description: "Developer applications, partner programs, SDK releases, sandboxes, and certifications.",
  icon: Code2,
  base: "/developers",
  canonicalPath: "/developer-ecosystem",
  permission: "pcc.developer-ecosystem.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/developers" },
    { key: "apps", label: "Apps", path: "/developers/apps" },
    { key: "apis", label: "APIs", path: "/developers/apis" },
    { key: "authentication", label: "Authentication", path: "/developers/authentication" },
    { key: "webhooks", label: "Webhooks", path: "/developers/webhooks" },
    { key: "sdk", label: "SDKs", path: "/developers/sdk" },
    { key: "usage", label: "Usage", path: "/developers/usage" },
    { key: "sandbox", label: "Sandbox", path: "/developers/sandbox" },
    { key: "documentation", label: "Documentation", path: "/developers/documentation" },
  ],
  searchKeywords: ["developers", "sdk", "sandbox", "api keys", "webhooks", "ecosystem"],
  resourceKinds: ["publisher-organization", "developer-program", "sdk-release", "developer-app-registration", "sandbox-allocation", "certification-run"],
});

// PCC-15: Knowledge & Adoption Operations
registerApp({
  id: "knowledge-adoption",
  appId: "PCC-15",
  clusterId: "intelligence",
  clusterName: "Intelligence, AI & Support",
  label: "Knowledge & Adoption",
  description: "Documentation, runbooks, training curricula, adoption campaigns, and user feedback.",
  icon: BookOpen,
  base: "/knowledge-adoption",
  canonicalPath: "/knowledge-adoption",
  permission: "pcc.knowledge-adoption.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/knowledge-adoption" },
    { key: "knowledge", label: "Knowledge Base", path: "/support/knowledge" },
    { key: "runbooks", label: "Runbooks", path: "/knowledge-adoption#runbooks" },
    { key: "onboarding", label: "Onboarding", path: "/knowledge-adoption#onboarding" },
    { key: "feedback", label: "Feedback", path: "/knowledge-adoption#feedback" },
  ],
  searchKeywords: ["knowledge", "adoption", "documentation", "runbooks", "training", "learning"],
  resourceKinds: ["provider-knowledge-article", "learning-path", "product-certification", "onboarding-program", "adoption-campaign", "product-feedback"],
});

// PCC-16: Platform Intelligence & Analytics
registerApp({
  id: "analytics",
  appId: "PCC-16",
  clusterId: "intelligence",
  clusterName: "Intelligence, AI & Support",
  label: "Platform Intelligence",
  description: "Cross-tenant analytics, semantic metrics, MRR forecasting, and cluster telemetry.",
  icon: PackageOpen,
  base: "/analytics",
  canonicalPath: "/platform-intelligence",
  permission: "pcc.intelligence.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/analytics" },
    { key: "customers", label: "Customers", path: "/analytics/customers" },
    { key: "product", label: "Product", path: "/analytics/product" },
    { key: "usage", label: "Usage", path: "/analytics/usage" },
    { key: "financial", label: "Financial", path: "/analytics/financial" },
    { key: "performance", label: "Performance", path: "/analytics/performance" },
    { key: "support", label: "Support", path: "/analytics/support" },
    { key: "reports", label: "Reports", path: "/analytics/reports" },
  ],
  searchKeywords: ["analytics", "intelligence", "metrics", "bi", "mrr", "telemetry", "reports"],
  resourceKinds: ["provider-semantic-metric", "provider-dataset", "provider-dashboard", "provider-report", "provider-forecast", "provider-anomaly"],
});

// PCC-17: Marketplace Operations
registerApp({
  id: "marketplace",
  appId: "PCC-17",
  clusterId: "ecosystem",
  clusterName: "Developer Platform & Ecosystem",
  label: "Marketplace Operations",
  description: "Extension verification, security review pipeline, app store listings, and commission payouts.",
  icon: Puzzle,
  base: "/marketplace",
  canonicalPath: "/marketplace-operations",
  permission: "pcc.marketplace.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/marketplace" },
    { key: "catalog", label: "Catalog", path: "/marketplace/catalog" },
    { key: "apps", label: "Applications", path: "/marketplace/apps" },
    { key: "extensions", label: "Extensions", path: "/marketplace/extensions" },
    { key: "versions", label: "Versions", path: "/marketplace/versions" },
    { key: "publishing", label: "Publishing", path: "/marketplace/publishing" },
    { key: "approvals", label: "Approvals", path: "/marketplace/approvals" },
    { key: "installations", label: "Installations", path: "/marketplace/installations" },
    { key: "reviews", label: "Reviews", path: "/marketplace/reviews" },
  ],
  searchKeywords: ["marketplace", "extensions", "apps", "store", "catalog", "publishing"],
  resourceKinds: ["marketplace-listing", "marketplace-submission", "marketplace-certification", "marketplace-version", "marketplace-review", "marketplace-recall"],
});

// PCC-18: Tenant & Customer Lifecycle
registerApp({
  id: "tenants",
  appId: "PCC-18",
  clusterId: "tenancy",
  clusterName: "Tenancy, Commercial & Revenue",
  label: "Tenant & Customer Lifecycle",
  description: "Tenant provisioning, regional cell placement, isolation tiering, suspension, and migration.",
  icon: Building2,
  base: "/tenants",
  canonicalPath: "/organizations",
  permission: "pcc.organizations.access",
  tabs: [
    {
      key: "overview",
      label: "Overview",
      path: "/tenants",
      permission: "system.tenant.view",
      description: "Tenant registry, KPIs and lifecycle at a glance",
    },
    { key: "directory", label: "Directory", path: "/tenants/directory", permission: "system.tenant.view" },
    { key: "structure", label: "Structure", path: "/tenants/structure", permission: "system.tenant.update" },
    { key: "users", label: "Users", path: "/tenants/users", permission: "admin.users.read" },
    { key: "subscription", label: "Subscription", path: "/tenants/subscription", permission: "admin.subscription.read" },
    { key: "usage", label: "Usage", path: "/tenants/usage", permission: "system.analytics.read" },
    { key: "quotas", label: "Quotas", path: "/tenants/quotas", permission: "admin.quotas.read" },
    { key: "modules", label: "Modules", path: "/tenants/modules" },
    { key: "configuration", label: "Configuration", path: "/tenants/configuration" },
    { key: "security", label: "Security", path: "/tenants/security", permission: "system.tenant.security" },
    { key: "integrations", label: "Integrations", path: "/tenants/integrations" },
    { key: "data", label: "Data", path: "/tenants/data", permission: "system.tenant.view" },
    { key: "activity", label: "Activity", path: "/tenants/activity" },
    { key: "support", label: "Support", path: "/tenants/support" },
  ],
  searchKeywords: ["tenants", "organizations", "provisioning", "lifecycle", "customers", "isolation"],
  resourceKinds: ["organization-account", "customer-account", "organization-provisioning-operation", "organization-placement", "organization-migration", "organization-offboarding"],
});

// PCC-19: Cloud Infrastructure & Reliability
registerApp({
  id: "infrastructure",
  appId: "PCC-19",
  clusterId: "platform",
  clusterName: "Platform & Infrastructure OS",
  label: "Cloud Infrastructure",
  description: "Multi-cloud clusters, database shards, storage buckets, DR, and regional cell topology.",
  icon: Server,
  base: "/infrastructure",
  canonicalPath: "/cloud-infrastructure",
  permission: "pcc.infrastructure.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/infrastructure" },
    { key: "compute", label: "Compute", path: "/infrastructure/compute" },
    { key: "kubernetes", label: "Kubernetes", path: "/infrastructure/kubernetes" },
    { key: "database", label: "Database", path: "/infrastructure/database" },
    { key: "storage", label: "Storage", path: "/infrastructure/storage" },
    { key: "network", label: "Network", path: "/infrastructure/network" },
    { key: "resources", label: "Resources", path: "/infrastructure/resources" },
    { key: "estate", label: "Estate", path: "/infrastructure/estate" },
    { key: "cloud-accounts", label: "Cloud Accounts", path: "/infrastructure/cloud-accounts" },
    { key: "provision", label: "Provision", path: "/infrastructure/resources/provision" },
    { key: "capacity", label: "Capacity", path: "/infrastructure/capacity" },
    { key: "backup", label: "Backup", path: "/infrastructure/backup" },
    { key: "dr", label: "Disaster Recovery", path: "/infrastructure/dr" },
    { key: "regions", label: "Regions", path: "/infrastructure/regions" },
  ],
  searchKeywords: ["infrastructure", "cloud", "kubernetes", "database", "storage", "disaster recovery", "clusters"],
  resourceKinds: ["cloud-account", "platform-region", "platform-cell", "compute-resource", "network-resource", "storage-resource", "database-resource", "backup-set", "recovery-plan"],
});

// PCC-20: Integration & Connector Operations
registerApp({
  id: "integrations",
  appId: "PCC-20",
  clusterId: "ecosystem",
  clusterName: "Developer Platform & Ecosystem",
  label: "Connector Operations",
  description: "Enterprise ERP connectors (SAP, Salesforce, Workday), webhook dispatch, and ETL mappings.",
  icon: Blocks,
  base: "/integrations",
  canonicalPath: "/connector-operations",
  permission: "pcc.connectors.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/integrations" },
    { key: "catalog", label: "Catalog", path: "/integrations/catalog" },
    { key: "connections", label: "Connections", path: "/integrations/connections" },
    { key: "credentials", label: "Credentials", path: "/integrations/credentials", permission: "system.security.admin" },
    { key: "synchronization", label: "Synchronization", path: "/integrations/synchronization" },
    { key: "mapping", label: "Mapping", path: "/integrations/mapping" },
    { key: "events", label: "Events", path: "/integrations/events" },
    { key: "logs", label: "Logs", path: "/integrations/logs" },
    { key: "health", label: "Health", path: "/integrations/health" },
  ],
  searchKeywords: ["integrations", "connectors", "sap", "salesforce", "workday", "webhooks", "etl"],
  resourceKinds: ["connector-definition", "connector-adapter-version", "provider-connection-account", "connector-certification", "connector-health-policy", "connector-deprecation"],
});

// PCC-21: AI Platform & Model Governance
registerApp({
  id: "ai",
  appId: "PCC-21",
  clusterId: "intelligence",
  clusterName: "Intelligence, AI & Support",
  label: "AI Platform Governance",
  description: "Multi-LLM routing, token rate budgeting, AI safety guardrails, and model evaluations.",
  icon: Brain,
  base: "/ai",
  canonicalPath: "/ai-platform",
  permission: "pcc.ai-platform.access",
  tabs: [
    { key: "overview", label: "Overview", path: "/ai" },
    { key: "providers", label: "Providers", path: "/ai/providers" },
    { key: "models", label: "Models", path: "/ai/models" },
    { key: "agents", label: "Agents", path: "/ai/agents" },
    { key: "tools", label: "Tools", path: "/ai/tools" },
    { key: "workflows", label: "Workflows", path: "/ai/workflows" },
    { key: "knowledge", label: "Knowledge", path: "/ai/knowledge" },
    { key: "usage", label: "Usage", path: "/ai/usage" },
    { key: "costs", label: "Costs", path: "/ai/costs" },
    { key: "guardrails", label: "Guardrails", path: "/ai/guardrails" },
    { key: "evaluation", label: "Evaluation", path: "/ai/evaluation" },
    { key: "governance", label: "Governance", path: "/ai/governance" },
  ],
  searchKeywords: ["ai", "models", "llm", "agents", "guardrails", "evaluations", "openai", "gemini", "anthropic"],
  resourceKinds: ["ai-provider", "ai-model", "ai-model-version", "platform-ai-policy", "ai-evaluation-standard", "ai-routing-policy", "platform-ai-incident"],
});

// PCC-22: Support & Service Operations
registerApp({
  id: "support",
  appId: "PCC-22",
  clusterId: "intelligence",
  clusterName: "Intelligence, AI & Support",
  label: "Support Operations",
  description: "Super-admin support desk, customer ticket triage, diagnostic consent, and SLA tracking.",
  icon: LifeBuoy,
  base: "/support",
  canonicalPath: "/service-operations",
  permission: "pcc.support.access",
  tabs: [
    { key: "dashboard", label: "Dashboard", path: "/support" },
    { key: "tickets", label: "Tickets", path: "/support/tickets" },
    { key: "customers", label: "Customers", path: "/support/customers" },
    { key: "sla", label: "SLA", path: "/support/sla" },
    { key: "knowledge", label: "Knowledge Base", path: "/support/knowledge" },
    { key: "communications", label: "Communications", path: "/support/communications" },
    { key: "incidents", label: "Incidents", path: "/support/incidents" },
  ],
  searchKeywords: ["support", "tickets", "sla", "service desk", "cases", "customers"],
  resourceKinds: ["provider-support-case", "service-request-definition", "support-sla", "support-queue", "support-diagnostic-consent", "support-quality-review"],
});

// ── derived views ────────────────────────────────────────────────────────────

/** All primary tab paths flattened for route registration. */
export function allNavPaths(): string[] {
  return _apps.flatMap((item) => item.tabs.map((tab) => tab.path));
}

export function navItemById(id: string): AppManifest | undefined {
  return _apps.find((item) => item.id === id);
}

export function navItemForPath(pathname: string): AppManifest | undefined {
  return _apps.find((item) => item.base === pathname || item.canonicalPath === pathname);
}

export function getAppsByCluster(clusterId: AppClusterId): AppManifest[] {
  return _apps.filter((a) => a.clusterId === clusterId);
}

export function getAppByPccId(appId: string): AppManifest | undefined {
  return _apps.find((a) => a.appId === appId);
}

export function getAllPccApps(): AppManifest[] {
  return _apps.filter((a) => a.appId && a.appId.startsWith("PCC-"));
}

