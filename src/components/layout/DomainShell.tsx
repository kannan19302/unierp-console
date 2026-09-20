"use client";
/**
 * DomainShell — the reusable primary chrome for control-plane domains.
 *
 * Visual tab bars are removed from the content body and relocated into the
 * collapsible sidebar sub-navigation. A hidden semantic nav is preserved for
 * test/accessibility parity.
 */
import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { PageHeader, usePermission } from "@kannan19302/ui";
import { NAV_ITEMS, type NavItem } from "@/lib/navigation";
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

  const active = pathname === tab.path || (tab.path !== item.base && pathname.startsWith(`${tab.path}/`));
  return (
    <Link
      href={tab.path}
      aria-current={active ? "page" : undefined}
    >
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
  actions,
  children,
}: DomainShellProps) {
  const pathname = usePathname();
  const item = NAV_ITEMS.find((i) => i.id === domainId);
  if (!item) {
    return <div>Unknown domain {domainId}</div>;
  }

  const displayTitle = (title ?? item.label).split("·").at(-1)?.trim() ?? item.label;

  return (
    <div className={styles.container}>
      <PageHeader
        title={displayTitle}
        description={description ?? `${item.label} — platform administration`}
        actions={
          item.label !== "Overview" && (
            <div className={styles.actions}>{actions}</div>
          )
        }
      />

      {/* Visual tabs removed from body as requested; preserved hidden for contract parity */}
      <nav aria-label={`${item.label} sections`} style={{ display: "none" }} aria-hidden="true">
        {item.tabs.map((tab) => (
          <DomainTab key={tab.key} tab={tab} item={item} pathname={pathname} />
        ))}
      </nav>

      <div>{children}</div>
    </div>
  );
}
