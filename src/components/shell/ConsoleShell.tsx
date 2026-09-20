"use client";
/**
 * Platform Admin Console — persistent shell and navigation runtime.
 * Decomposed orchestrator component.
 */
import React, { useEffect, useState, useRef, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  MoreHorizontal,
  Star,
  Copy,
  ExternalLink,
  LayoutGrid,
} from "lucide-react";
import {
  CommandPalette,
  useCommandPalette,
} from "@kannan19302/ui/components";
import { NAV_ITEMS, getBreadcrumbs } from "@/lib/navigation";
import { useSession } from "@kannan19302/shared/auth-client/react";
import { ControlPlaneGate } from "@/components/AuthShell";
import { useConsoleSocket } from "@/lib/use-console-socket";
import type { FlattenedNavigationItem, NavContextMenuState } from "./types";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarSearch } from "./SidebarSearch";
import { SidebarNavigation } from "./SidebarNavigation";
import { SidebarFooter } from "./SidebarFooter";
import { TopBar } from "./TopBar";
import { Breadcrumbs } from "./Breadcrumbs";
import styles from "./shell.module.css";

const nameFromEmail = (email: string): string => {
  const [local] = email.split("@");
  if (!local) return "Provider Admin";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
};

export function ConsoleShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { claims, signOut } = useSession();
  const { isConnected } = useConsoleSocket();

  const accountEmail = (claims as unknown as { email?: string } | null)?.email ?? "";
  const displayName = nameFromEmail(accountEmail);
  const initial = displayName.charAt(0) || "P";
  const { open, setOpen } = useCommandPalette();

  // Full hide/show for mobile drawer & test contracts
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Rail collapse: mini icon-rail mode (persisted)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unierp_provider_sidebar_collapsed");
        if (saved !== null) return JSON.parse(saved);
      } catch {}
    }
    return false;
  });

  // Search filter query
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Incident ticker from operations API
  const [ticker, setTicker] = useState<string | null>(null);

  // Starred / Favorites (persisted)
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unierp_provider_sidebar_favorites");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Expanded sub-tab trees for apps
  const [expandedApps, setExpandedApps] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unierp_provider_sidebar_expanded_apps");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return { ops: true, security: true };
  });

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const updateMatch = () => {
      const mobile = window.matchMedia("(max-width: 48rem)").matches;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    updateMatch();
    window.addEventListener("resize", updateMatch);
    return () => window.removeEventListener("resize", updateMatch);
  }, []);

  // Unified expanded state: open when both sidebarOpen is true and collapsed is false
  const isExpanded = sidebarOpen && !collapsed;

  const handleSetCollapsed = (val: boolean) => {
    setCollapsed(val);
    try {
      localStorage.setItem("unierp_provider_sidebar_collapsed", JSON.stringify(val));
    } catch {}
  };

  const handleToggleSidebar = () => {
    if (isExpanded) {
      setSidebarOpen(false);
      handleSetCollapsed(true);
    } else {
      setSidebarOpen(true);
      handleSetCollapsed(false);
    }
  };

  // Context Menu for (...) options on hover
  const [contextMenu, setContextMenu] = useState<NavContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handleDown = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu]);

  const openNavContextMenu = (href: string, label: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, typeof window !== "undefined" ? window.innerWidth - 230 : 200);
    const y = Math.min(e.clientY, typeof window !== "undefined" ? window.innerHeight - 180 : 200);
    setContextMenu({ href, label, position: { x, y } });
  };

  const renderMoreButton = (href: string, label: string) => (
    <button
      type="button"
      className={styles.moreBtn}
      title={`More options for ${label}`}
      aria-label={`More options for ${label}`}
      onClick={(e) => openNavContextMenu(href, label, e)}
    >
      <MoreHorizontal size={14} aria-hidden="true" />
    </button>
  );

  const toggleFavorite = (href: string) => {
    setFavorites((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      try {
        localStorage.setItem("unierp_provider_sidebar_favorites", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleAppExpanded = (appId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedApps((prev) => {
      const next = { ...prev, [appId]: !prev[appId] };
      try {
        localStorage.setItem("unierp_provider_sidebar_expanded_apps", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Auto-expand active app on pathname change
  useEffect(() => {
    const activeApp = NAV_ITEMS.find(
      (item) =>
        pathname === item.base ||
        pathname.startsWith(`${item.base}/`) ||
        Boolean(
          item.canonicalPath &&
            (pathname === item.canonicalPath || pathname.startsWith(`${item.canonicalPath}/`))
        )
    );
    if (activeApp && activeApp.id !== "overview") {
      setExpandedApps((prev) => {
        if (!prev[activeApp.id]) {
          const next = { ...prev, [activeApp.id]: true };
          try {
            localStorage.setItem("unierp_provider_sidebar_expanded_apps", JSON.stringify(next));
          } catch {}
          return next;
        }
        return prev;
      });
    }
  }, [pathname]);

  // Global hotkeys: "/" to focus search, "[" to toggle collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        setSidebarOpen(true);
        handleSetCollapsed(false);
        setTimeout(() => searchInputRef.current?.focus(), 60);
      }

      if ((e.key === "[" || (e.ctrlKey && e.key === "[")) && !isInputFocused) {
        e.preventDefault();
        handleToggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  // Command palette items
  const commandItems = useMemo(
    () => [
      {
        id: "admin-os-launchpad",
        category: "Admin OS Suite",
        title: "App Launchpad",
        subtitle: "/apps · Browse all platform applications",
        onSelect: () => router.push("/apps"),
      },
      ...NAV_ITEMS.map((item) => ({
        id: `app-${item.id}`,
        category: item.clusterName ?? "Platform Applications",
        title: item.label,
        subtitle: item.base,
        onSelect: () => router.push(item.base),
      })),
      ...NAV_ITEMS.flatMap((item) =>
        item.tabs.map((tab) => ({
          id: `tab-${item.id}-${tab.key}`,
          category: item.label,
          title: tab.label,
          subtitle: tab.path,
          onSelect: () => router.push(tab.path),
        }))
      ),
    ],
    [router]
  );

  // Outage ticker from operations API
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
          setTicker(first?.title ?? first?.summary ?? "Active incident — check Operations.");
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const hasActiveIncident = Boolean(ticker);

  // Flatten all navigable items (apps + tabs) for search
  const allSearchableItems: FlattenedNavigationItem[] = useMemo(() => {
    const list: FlattenedNavigationItem[] = [
      {
        id: "launchpad",
        name: "App Launchpad",
        href: "/apps",
        icon: LayoutGrid,
        description: "Browse all platform applications",
        keywords: ["launchpad", "apps", "waffle", "suite"],
      },
    ];

    for (const app of NAV_ITEMS) {
      list.push({
        id: app.id,
        name: app.label,
        href: app.base,
        icon: app.icon,
        description: app.description,
        keywords: app.searchKeywords,
      });

      for (const tab of app.tabs) {
        if (tab.path !== app.base) {
          list.push({
            id: `${app.id}-${tab.key}`,
            name: tab.label,
            href: tab.path,
            icon: app.icon,
            parentApp: app.label,
            description: tab.description,
          });
        }
      }
    }
    return list;
  }, []);

  const cleanQuery = searchQuery.trim().toLowerCase();

  const filteredSearchResults = useMemo(() => {
    if (!cleanQuery) return [];
    return allSearchableItems.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(cleanQuery);
      const parentMatch = item.parentApp?.toLowerCase().includes(cleanQuery);
      const descMatch = item.description?.toLowerCase().includes(cleanQuery);
      const kwMatch = item.keywords?.some((k) => k.toLowerCase().includes(cleanQuery));
      const hrefMatch = item.href.toLowerCase().includes(cleanQuery);
      return nameMatch || parentMatch || descMatch || kwMatch || hrefMatch;
    });
  }, [allSearchableItems, cleanQuery]);

  // Starred navigation items
  const starredItems = useMemo(() => {
    return allSearchableItems.filter((item) => favorites.includes(item.href));
  }, [allSearchableItems, favorites]);

  const crumbs = getBreadcrumbs(pathname);

  const domainApps = useMemo(() => {
    return NAV_ITEMS.filter((item) => item.id !== "overview");
  }, []);

  return (
    <ControlPlaneGate>
      <div className={styles.layout} data-density="compact" data-shell="strata-provider">
        <Link className={styles.skipLink} href="#provider-main">
          Skip to workspace
        </Link>

        {/* Mobile Backdrop */}
        {isMobile && sidebarOpen && (
          <div
            className={styles.backdrop}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Container */}
        {pathname !== "/home" && (
          <aside
            id="provider-navigation"
            inert={!isExpanded}
            aria-hidden={!isExpanded}
            className={`${styles.sidebar} ${!isExpanded ? styles.sidebarCollapsed : ""}`}
          >
            <div className={styles.sidebarInner}>
              <SidebarHeader
                onCollapse={() => {
                  handleSetCollapsed(true);
                  setSidebarOpen(false);
                }}
              />

              <SidebarSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchInputRef={searchInputRef}
              />

              <SidebarNavigation
                pathname={pathname}
                cleanQuery={cleanQuery}
                searchQuery={searchQuery}
                filteredSearchResults={filteredSearchResults}
                starredItems={starredItems}
                domainApps={domainApps}
                expandedApps={expandedApps}
                isConnected={isConnected}
                isMobile={isMobile}
                hasActiveIncident={hasActiveIncident}
                setSearchQuery={setSearchQuery}
                setSidebarOpen={setSidebarOpen}
                toggleAppExpanded={toggleAppExpanded}
                openNavContextMenu={openNavContextMenu}
                renderMoreButton={renderMoreButton}
              />

              <SidebarFooter
                displayName={displayName}
                initial={initial}
                onSignOut={() => {
                  void fetch("/api/session", { method: "DELETE", credentials: "include" });
                  signOut();
                }}
              />
            </div>
          </aside>
        )}

        {/* Docked Edge Expand Button when collapsed */}
        {pathname !== "/home" && !isExpanded && (
          <button
            type="button"
            onClick={() => {
              handleSetCollapsed(false);
              setSidebarOpen(true);
            }}
            className={styles.edgeExpandBtn}
            aria-label="Expand sidebar ([)"
            title="Expand sidebar ([)"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Main Wrapper */}
        <div className={styles.mainWrapper}>
          <TopBar
            isExpanded={isExpanded}
            onToggleSidebar={handleToggleSidebar}
            onOpenCommandPalette={() => setOpen(true)}
            hasActiveIncident={hasActiveIncident}
            accountEmail={accountEmail}
            initial={initial}
          />

          {pathname !== "/home" && <Breadcrumbs crumbs={crumbs} scope="manage" />}

          {ticker && (
            <div className={styles.outageTicker}>
              <span>◉ Active incident</span>
              <span className={styles.outageTickerText}>{ticker}</span>
              <button onClick={() => setTicker(null)} className={styles.outageTickerDismiss}>
                Dismiss
              </button>
            </div>
          )}

          <main id="provider-main" tabIndex={-1} className={styles.mainContent}>
            {children}
          </main>
        </div>

        <CommandPalette open={open} onClose={() => setOpen(false)} items={commandItems} />

        {/* Floating Context Menu for (...) and right-click */}
        {contextMenu && (
          <div
            ref={contextMenuRef}
            className={styles.contextMenu}
            style={{ top: `${contextMenu.position.y}px`, left: `${contextMenu.position.x}px` }}
            role="menu"
            aria-label="Navigation options"
          >
            <div className={styles.contextMenuHeader}>{contextMenu.label}</div>
            <div className={styles.contextMenuDivider} />

            <button
              type="button"
              role="menuitem"
              className={styles.contextMenuItem}
              onClick={() => {
                toggleFavorite(contextMenu.href);
                setContextMenu(null);
              }}
              aria-label={
                favorites.includes(contextMenu.href)
                  ? `Remove ${contextMenu.label} from favorites`
                  : `Star ${contextMenu.label}`
              }
            >
              <Star
                size={14}
                className={styles.contextMenuItemIcon}
                style={
                  favorites.includes(contextMenu.href)
                    ? { fill: "var(--color-warning, #f59e0b)", color: "var(--color-warning, #f59e0b)" }
                    : {}
                }
              />
              <span>
                {favorites.includes(contextMenu.href)
                  ? "Remove from favorites"
                  : "Add to favorites / Starred"}
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              className={styles.contextMenuItem}
              onClick={() => {
                if (typeof window !== "undefined") {
                  void navigator.clipboard?.writeText(window.location.origin + contextMenu.href);
                }
                setContextMenu(null);
              }}
            >
              <Copy size={14} className={styles.contextMenuItemIcon} />
              <span>Copy link address</span>
            </button>

            <button
              type="button"
              role="menuitem"
              className={styles.contextMenuItem}
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.open(contextMenu.href, "_blank", "noopener,noreferrer");
                }
                setContextMenu(null);
              }}
            >
              <ExternalLink size={14} className={styles.contextMenuItemIcon} />
              <span>Open in new window</span>
            </button>
          </div>
        )}
      </div>
    </ControlPlaneGate>
  );
}

export default ConsoleShell;
