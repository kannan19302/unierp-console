/**
 * Platform Admin Console — stable information architecture.
 *
 * This is the frozen single source of truth for the 14 sidebar items and their
 * primary tabs. Future capabilities are added as tabs / sub-tabs inside an
 * existing item — never as a new sidebar entry.
 *
 * Drive everything from here: the shell sidebar, the command palette, the
 * top-level route registration and the permission-aware visibility filter.
 * Do not duplicate this list anywhere else.
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

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  base: string;
  permission?: string;
  tabs: NavTab[];
}

export const NAV_ITEMS: NavItem[] = [
  {
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
  },
  {
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
      { key: "quotas", label: "Quotas", path: "/tenants/quotas", permission: "admin.quotas.read", },
      { key: "modules", label: "Modules", path: "/tenants/modules" },
      { key: "configuration", label: "Configuration", path: "/tenants/configuration" },
      { key: "security", label: "Security", path: "/tenants/security", permission: "system.tenant.security" },
      { key: "integrations", label: "Integrations", path: "/tenants/integrations" },
      { key: "data", label: "Data", path: "/tenants/data", permission: "system.tenant.view", },
      { key: "activity", label: "Activity", path: "/tenants/activity" },
      { key: "support", label: "Support", path: "/tenants/support" },
    ],
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
      { key: "capacity", label: "Capacity", path: "/infrastructure/capacity" },
      { key: "backup", label: "Backup", path: "/infrastructure/backup" },
      { key: "dr", label: "Disaster Recovery", path: "/infrastructure/dr" },
      { key: "regions", label: "Regions", path: "/infrastructure/regions" },
    ],
  },
  {
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
      { key: "audit", label: "Audit", path: "/security/audit" },
    ],
  },
  {
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
  },
  {
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
  },
  {
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
      { key: "governance", label: "Governance", path: "/ai/governance" },
    ],
  },
  {
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
  },
];

/** All primary tab paths flattened for route registration. */
export const ALL_NAV_PATHS: string[] = NAV_ITEMS.flatMap((item) =>
  item.tabs.map((tab) => tab.path),
);

export function navItemById(id: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.id === id);
}

export function navItemForPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.base === pathname);
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
  const activeItem = NAV_ITEMS.find(
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