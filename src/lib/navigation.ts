/**
 * Platform Admin Console — manifest-driven navigation runtime.
 *
 * M01: this was a single frozen array (`NAV_ITEMS`) that the sidebar,
 * breadcrumbs and command palette all imported directly — adding an app meant
 * editing this file, and there was no single place a new capability declared
 * itself once. `registerApp()` is that place now. The fifteen apps below are
 * the same fourteen sidebar items this console shipped with (plus this
 * comment's own count staying honest about it), converted from array-literal
 * entries into individual manifest registrations — no navigational data
 * changed, only how it is declared.
 *
 * `NAV_ITEMS` is the SAME array object `registerApp`/`unregisterApp` mutate in
 * place, not a snapshot copied at import time. `console-shell.tsx` and
 * `domain-shell.tsx` read it inside their render bodies (`NAV_ITEMS.map(...)`),
 * so a manifest registered or removed after those modules loaded is reflected
 * on the next render — sidebar, breadcrumbs, tab bar and command palette all
 * derive from this one array, so registering an app updates all four via the
 * one call.
 *
 * "The permission registry" for this phase means `getAllDeclaredPermissions()`
 * — every `permission` string named anywhere in a registered manifest's item,
 * tab or sub-tab. It is not the API-side `PERMISSION_REGISTRY`
 * (`@kannan19302/shared`) that guards `/platform/v1` endpoints — that registry
 * is cross-repo and owned by the API; this one is the console's own record of
 * which permissions its navigation actually gates, used by the visibility
 * filter each shell already applies via `item.permission`/`tab.permission`.
 */
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
} from "lucide-react";

export type IconName = ComponentType<{ size?: number; className?: string }>;

export interface NavSubTab {
  key: string;
  label: string;
  path: string; // absolute route under the group root
  permission?: string;
}

export interface NavTab {
  key: string;
  label: string;
  path: string; // absolute route for the tab landing
  permission?: string;
  description?: string;
  subTabs?: NavSubTab[];
}

/**
 * An app manifest — the declarative contract a control-plane app registers
 * once. `resourceKinds` and `lifecycleHooks` are declared in the shape now,
 * ahead of the phases that populate them (M07's resource model, M12's
 * provisioning pipeline), so the manifest's shape does not change under
 * those later phases — only these two fields go from always-empty to used.
 */
export interface AppManifest {
  id: string;
  label: string;
  icon: IconName;
  base: string;
  permission?: string;
  tabs: NavTab[];
  /** Extra terms the command palette should match beyond label/path. */
  searchKeywords?: string[];
  /** Populated starting M07 — this app's managed resource kinds, if any. */
  resourceKinds?: string[];
  /** Populated starting M12 — install/upgrade/remove hooks, if any. */
  lifecycleHooks?: { onInstall?: string; onRemove?: string };
}

/** Back-compat alias — every existing import of `NavItem` keeps working. */
export type NavItem = AppManifest;

// ── the registry ────────────────────────────────────────────────────────────
//
// `NAV_ITEMS` IS this array, not a copy of it. `registerApp`/`unregisterApp`
// mutate it in place so every consumer that reads `NAV_ITEMS` at call time —
// which is how React components read module-level arrays in their render
// bodies — observes a registration or removal without re-importing anything.

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

// ── the console's own apps ──────────────────────────────────────────────────

registerApp({
  id: "overview",
  label: "Overview",
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
});

registerApp({
  id: "tenants",
  label: "Tenants",
  icon: Building2,
  base: "/tenants",
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
});

registerApp({
  id: "access",
  label: "Users & Access",
  icon: UserCog,
  base: "/access",
  tabs: [
    { key: "directory", label: "Directory", path: "/access/directory" },
    { key: "roles", label: "Roles", path: "/access/roles" },
    { key: "permissions", label: "Permissions", path: "/access/permissions" },
    { key: "authentication", label: "Authentication", path: "/access/authentication" },
    { key: "sessions", label: "Sessions", path: "/access/sessions" },
    { key: "governance", label: "Governance", path: "/access/governance" },
    { key: "audit", label: "Audit", path: "/access/audit" },
  ],
});

registerApp({
  id: "billing",
  label: "Billing",
  icon: CreditCard,
  base: "/billing",
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
});

registerApp({
  id: "marketplace",
  label: "Marketplace",
  icon: Puzzle,
  base: "/marketplace",
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
});

registerApp({
  id: "developers",
  label: "Developers",
  icon: Code2,
  base: "/developers",
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
});

registerApp({
  id: "integrations",
  label: "Integrations",
  icon: Blocks,
  base: "/integrations",
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
});

registerApp({
  id: "ops",
  label: "Platform Operations",
  icon: ServerCog,
  base: "/ops",
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
});

registerApp({
  id: "infrastructure",
  label: "Infrastructure",
  icon: Server,
  base: "/infrastructure",
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
});

registerApp({
  id: "security",
  label: "Security & Compliance",
  icon: ShieldCheck,
  base: "/security",
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
});

registerApp({
  id: "support",
  label: "Support",
  icon: LifeBuoy,
  base: "/support",
  tabs: [
    { key: "dashboard", label: "Dashboard", path: "/support" },
    { key: "tickets", label: "Tickets", path: "/support/tickets" },
    { key: "customers", label: "Customers", path: "/support/customers" },
    { key: "sla", label: "SLA", path: "/support/sla" },
    { key: "knowledge", label: "Knowledge Base", path: "/support/knowledge" },
    { key: "communications", label: "Communications", path: "/support/communications" },
    { key: "incidents", label: "Incidents", path: "/support/incidents" },
  ],
});

registerApp({
  id: "analytics",
  label: "Analytics",
  icon: PackageOpen,
  base: "/analytics",
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
});

registerApp({
  id: "ai",
  label: "AI Platform",
  icon: Globe,
  base: "/ai",
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
});

registerApp({
  id: "settings",
  label: "Settings",
  icon: Settings,
  base: "/settings",
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
  return _apps.find((item) => item.base === pathname);
}

export interface BreadcrumbItem {
  key: string;
  label: string;
  href?: string;
}

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [
    { key: "console", label: "Console", href: "/overview" },
  ];

  if (!pathname || pathname === "/" || pathname === "/overview") {
    crumbs.push({ key: "overview", label: "Overview", href: "/overview" });
    return crumbs;
  }

  // Find active top-level nav item
  const activeItem = _apps.find(
    (i) => pathname === i.base || pathname.startsWith(`${i.base}/`),
  );

  if (!activeItem) {
    // Dynamic fallback for unmapped routes
    const segments = pathname.split("/").filter(Boolean);
    let currentPath = "";
    for (const seg of segments) {
      currentPath += `/${seg}`;
      const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
      crumbs.push({ key: currentPath, label, href: currentPath });
    }
    return crumbs;
  }

  crumbs.push({
    key: activeItem.id,
    label: activeItem.label,
    href: activeItem.base,
  });

  // Find matching tab within the active item
  const activeTab = activeItem.tabs.find(
    (t) =>
      pathname === t.path ||
      (t.path !== activeItem.base && pathname.startsWith(`${t.path}/`)),
  );

  if (activeTab) {
    if (activeTab.path !== activeItem.base || activeTab.label !== activeItem.label) {
      crumbs.push({
        key: activeTab.key,
        label: activeTab.label,
        href: activeTab.path,
      });
    }

    // Handle nested sub-routes beyond tab path (e.g. /tenants/directory/create)
    if (pathname.startsWith(activeTab.path) && pathname !== activeTab.path) {
      const remainder = pathname.slice(activeTab.path.length).replace(/^\//, "");
      if (remainder) {
        const parts = remainder.split("/").filter(Boolean);
        let accPath = activeTab.path;
        for (const part of parts) {
          accPath += `/${part}`;
          const label =
            part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
          crumbs.push({ key: accPath, label, href: accPath });
        }
      }
    }
  } else if (pathname !== activeItem.base) {
    // Handle sub-routes directly under item base
    const remainder = pathname.slice(activeItem.base.length).replace(/^\//, "");
    if (remainder) {
      const parts = remainder.split("/").filter(Boolean);
      let accPath = activeItem.base;
      for (const part of parts) {
        accPath += `/${part}`;
        const label =
          part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
        crumbs.push({ key: accPath, label, href: accPath });
      }
    }
  }

  return crumbs;
}
