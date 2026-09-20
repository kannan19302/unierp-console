import type { ComponentType } from "react";
import {
  Building2,
  ServerCog,
  ShieldCheck,
  Code2,
  Smartphone,
  Brain,
} from "lucide-react";

export type IconName = ComponentType<{ size?: number; className?: string }>;

export type AppClusterId =
  | "platform"
  | "security"
  | "tenancy"
  | "ecosystem"
  | "clients"
  | "intelligence";

export interface AppCluster {
  id: AppClusterId;
  name: string;
  description: string;
  icon: IconName;
}

export const ADMIN_OS_CLUSTERS: AppCluster[] = [
  {
    id: "platform",
    name: "Platform & Infrastructure OS",
    description: "Core runtime services, multi-cloud clusters, background queues, and global configuration.",
    icon: ServerCog,
  },
  {
    id: "security",
    name: "Trust, Security & Compliance",
    description: "Zero-trust IAM governance, KMS secret keys, SOC threat intelligence, and compliance.",
    icon: ShieldCheck,
  },
  {
    id: "tenancy",
    name: "Tenancy, Commercial & Revenue",
    description: "Tenant lifecycle provisioning, subscription plans, entitlement licenses, and billing.",
    icon: Building2,
  },
  {
    id: "ecosystem",
    name: "Developer Platform & Ecosystem",
    description: "Partner ecosystem, API gateway traffic, native ERP connectors, and marketplace.",
    icon: Code2,
  },
  {
    id: "clients",
    name: "Multi-Experience & Native Clients",
    description: "Mobile build channels, push notifications, desktop installers, and code signing.",
    icon: Smartphone,
  },
  {
    id: "intelligence",
    name: "Intelligence, AI & Support",
    description: "Multi-model AI governance, platform analytics BI, support desk, and knowledge runbooks.",
    icon: Brain,
  },
];

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
 * An app manifest — declarative contract registered once for each Admin OS application.
 */
export interface AppManifest {
  id: string;
  appId?: string; // Canonical ID, e.g. "PCC-01"
  clusterId?: AppClusterId;
  clusterName?: string;
  label: string;
  description?: string;
  icon: IconName;
  base: string;
  canonicalPath?: string;
  permission?: string;
  tabs: NavTab[];
  /** Extra terms the command palette should match beyond label/path. */
  searchKeywords?: string[];
  /** Managed resource kinds, if any. */
  resourceKinds?: string[];
  /** Lifecycle hooks, if any. */
  lifecycleHooks?: { onInstall?: string; onRemove?: string };
}

/** Back-compat alias — every existing import of `NavItem` keeps working. */
export type NavItem = AppManifest;

export interface BreadcrumbItem {
  key: string;
  label: string;
  href?: string;
}
