"use client";
/**
 * DomainShell — the reusable primary-tab chrome for every one of the 14
 * control-plane domains.
 *
 * Each domain is one folder (`/tenants`, `/billing`, ...). This shell renders:
 *   - the domain page header (icon, label, description + action slot)
 *   - the PRIMARY TAB bar (driven by the frozen `NAV_ITEMS` config)
 *   - the domain content
 * The detail/create/edit views then nest under the active tab route.
 */
import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  PageHeader,
  usePermission,
} from "@kannan19302/ui";
import { NAV_ITEMS } from "@/lib/navigation";
import type { NavItem } from "@/lib/navigation";
import styles from "./domain-shell.module.css";

function DomainTab({
  tab,
  item,
  pathname,
}: {
  tab: NavItem["tabs"][number];
  item: NavItem;
  pathname: string;
}) {
  const hasDeclaredPermission = usePermission(tab.permission ?? "");
  if (tab.permission && !hasDeclaredPermission) return null;

  const active = pathname === tab.path || pathname.startsWith(`${tab.path}/`);
  const Icon = tab.permission ? undefined : item.icon;
  return (
    <Link
      href={tab.path}
      role="tab"
      aria-selected={active}
      aria-current={active ? "page" : undefined}
      className={`${styles.tab} ${active ? styles.tabActive : styles.tabInactive}`}
    >
      {Icon && <Icon size={16} />}
      <span>{tab.label}</span>
    </Link>
  );
}

export interface DomainShellProps {
  domainId: string;
  title?: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: ReactNode;
  children: ReactNode;
}

export default function DomainShell({
  domainId,
  title,
  description,
  breadcrumb,
  actions,
  children,
}: DomainShellProps) {
  const pathname = usePathname();
  const item = NAV_ITEMS.find((i) => i.id === domainId);
  if (!item) {
    return <div>Unknown domain {domainId}</div>;
  }

  let displayTitle = title ?? item.label;
  let resolvedBreadcrumbs = breadcrumb;

  if (!resolvedBreadcrumbs && displayTitle.includes("·")) {
    const parts = displayTitle.split("·").map((s) => s.trim());
    if (parts.length === 2) {
      displayTitle = parts[1];
      resolvedBreadcrumbs = [
        { label: "Console", href: "/" },
        { label: parts[0], href: `/${domainId}` },
      ];
    }
  } else if (!resolvedBreadcrumbs) {
    resolvedBreadcrumbs = [
      { label: "Console", href: "/" },
      { label: item.label, href: `/${domainId}` },
    ];
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title={displayTitle}
        description={description ?? `${item.label} — platform administration`}
        breadcrumbs={resolvedBreadcrumbs}
        actions={
          item.label !== "Overview" && (
            <div className={styles.actions}>{actions}</div>
          )
        }
      />

      <div
        role="tablist"
        aria-label={`${item.label} sections`}
        className={styles.tabList}
      >
        {item.tabs.map((tab) => (
          <DomainTab key={tab.key} tab={tab} item={item} pathname={pathname} />
        ))}
      </div>

      <div>{children}</div>
    </div>
  );
}
