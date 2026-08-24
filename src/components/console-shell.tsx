"use client";
/**
 * Console shell — persistent furniture for the Platform Admin Console.
 *
 *   - frozen 14-item sidebar driven by NAV_ITEMS (edit NAV_ITEMS to expand)
 *   - top bar: global search/command palette, theme toggle, notifications
 *   - outage ticker from the real platform operations API
 *   - breadcrumbs + the active domain's primary tab bar
 * SessionProvider wraps every control-plane route.
 */
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Search, Bell, LogOut } from "lucide-react";
import {
  CommandPalette,
  useCommandPalette,
  usePermission,
  Breadcrumb,
  BrandMark,
  ThemeQuickToggle,
} from "@kannan19302/ui";
import { NAV_ITEMS, getBreadcrumbs, type NavItem } from "@/lib/navigation";
import { useSession } from "@kannan19302/shared/auth-client/react";
import { ControlPlaneGate } from "@/components/AuthShell";
import { useConsoleSocket } from "@/lib/use-console-socket";
import styles from "./console-shell.module.css";

function ConsoleSocketListener() {
  const { socket, isConnected } = useConsoleSocket();

  useEffect(() => {
    if (!socket) return;

    const onTenantUpdate = (data: { action: string; tenantId: string }) => {
      console.log("Real-time tenant update received:", data);
      // In a real application, this might trigger a SWR revalidation or Toast notification.
    };

    socket.on("tenant.update", onTenantUpdate);

    return () => {
      socket.off("tenant.update", onTenantUpdate);
    };
  }, [socket]);

  // For debugging / indicator purposes
  return isConnected ? (
    <div className={styles.socketIndicator} title="Connected to real-time events">
      <span className={styles.socketDot} />
    </div>
  ) : null;
}

function SidebarItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <nav
      aria-label="Control-plane navigation"
      className={styles.sidebarNav}
    >
      {NAV_ITEMS.map((item) => {
        const allow = item.permission ? usePermission(item.permission) : true;
        if (!allow) return null;
        const active =
          pathname === item.base || pathname.startsWith(`${item.base}/`);
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => {
              router.push(item.base);
              onNavigate?.();
            }}
            aria-current={active ? "page" : undefined}
            className={`${styles.sidebarButton} ${
              active ? styles.sidebarButtonActive : styles.sidebarButtonInactive
            }`}
          >
            <Icon size={17} />
            <span className={styles.buttonText}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const nameFromEmail = (email: string): string => {
  const [local] = email.split("@");
  if (!local) return "Provider Admin";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
};

function ProfileFooter() {
  const { claims, signOut } = useSession();
  const email = (claims as unknown as { email?: string })?.email ?? "";
  return (
    <div className={styles.profileFooter}>
      <a href="http://localhost:3005/oidc/account" className={styles.profileInfo}>
        <div className={styles.profileAvatar}>
          {nameFromEmail(email).charAt(0)}
        </div>
        <div className={styles.profileText}>
          <div className={styles.profileName}>
            {nameFromEmail(email)}
          </div>
          <div className={styles.profileEmail}>
            {email}
          </div>
        </div>
      </a>
      <button
        onClick={() => {
          void fetch("/api/session", { method: "DELETE", credentials: "include" });
          signOut();
        }}
        className={styles.signOutButton}
      >
        <LogOut size={15} /> Sign out session
      </button>
    </div>
  );
}

export default function ControlPlaneShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { claims } = useSession();
  const accountEmail = (claims as unknown as { email?: string } | null)?.email ?? "";
  const { open, setOpen } = useCommandPalette();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ticker, setTicker] = useState<string | null>(null);


  const commandItems = NAV_ITEMS.flatMap((item) => [
    {
      id: `nav-${item.id}`,
      category: "Domains",
      title: item.label,
      subtitle: item.base,
      onSelect: () => router.push(item.base),
    },
    ...item.tabs.map((tab) => ({
      id: `tab-${item.id}-${tab.key}`,
      category: item.label,
      title: tab.label,
      subtitle: tab.path,
      onSelect: () => router.push(tab.path),
    })),
  ]);

  // Outage ticker fetched from the real operations API.
  useEffect(() => {
    let active = true;
    void fetch("/api/v1/platform/v1/operations/incidents/active", {
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return;
        const list = Array.isArray(d)
          ? d
          : Array.isArray((d as { items?: unknown[] }).items)
            ? (d as { items: unknown[] }).items
            : null;
        if (Array.isArray(list) && list.length > 0) {
          const first = list[0] as { title?: string; summary?: string };
          setTicker(
            first?.title ?? first?.summary ?? "Active incident — check Operations.",
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const crumbs = getBreadcrumbs(pathname);

  return (
    <ControlPlaneGate>
      <div className={styles.layout}>
        <aside
          className={styles.sidebar}
          // --sidebar-width, not a literal 264. This app was the only one of
          // four using a hardcoded rail width, so compact density (which moves
          // the token to 220) moved every other surface and left this one.
          style={{ width: sidebarOpen ? "var(--sidebar-width)" : 0 }}
        >
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarLogo}>
              <BrandMark compact size="sm" />
            </div>
            <div className={styles.sidebarTitleContainer}>
              <div className={styles.sidebarTitle}>
                uniERP Console
              </div>
              <div className={styles.sidebarSubtitle}>
                Provider Control Plane
              </div>
            </div>
          </div>
          <SidebarItems />
          <ProfileFooter />
        </aside>

        <div className={styles.mainWrapper}>
          <header className={styles.topbar}>
            <ConsoleSocketListener />
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
              className={styles.menuToggle}
            >
              <Menu size={20} />
            </button>
            <div className={styles.spacer} />
            <button
              onClick={() => setOpen(true)}
              className={styles.searchButton}
            >
              <Search size={16} />
              <span className={styles.searchLabel}>Search…</span>
              <span className={styles.searchShortcut}>⌘K</span>
            </button>
            <ThemeQuickToggle className={styles.iconButton} />
            <button
              title="Notifications"
              className={styles.notificationButton}
            >
              <Bell size={16} />
              <span className={styles.notificationBadge} />
            </button>
            <a
              href="http://localhost:3005/oidc/account"
              className={styles.iconButton}
              aria-label="Open Account Center"
              title="Account Center"
            >
              {nameFromEmail(accountEmail).charAt(0)}
            </a>
          </header>

          {ticker && (
            <div className={styles.outageTicker}>
              <span>◉ Active incident</span>
              <span className={styles.outageTickerText}>{ticker}</span>
              <button onClick={() => setTicker(null)} className={styles.outageTickerDismiss}>
                Dismiss
              </button>
            </div>
          )}

          <main className={styles.mainContent}>{children}</main>
        </div>

        <CommandPalette open={open} onClose={() => setOpen(false)} items={commandItems} />
      </div>
    </ControlPlaneGate>
  );
}
