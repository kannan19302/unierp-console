"use client";
/**
 * Platform Admin Console — persistent shell and navigation runtime.
 *
 * Exact design and architectural parity with tenant-apps Finance module (FinanceSidebarV2):
 *   - Clean typography and hierarchy: 232px width, title case headers, no oversized logos
 *   - Search input box: rounded sunken background with Search icon and clear button
 *   - FAVORITES section: App Launchpad, Operational incidents, and user favorites
 *   - WORKSPACE section:
 *       • Overview root link (active blue bar, subtle light blue highlight)
 *       • Clean expandable groups with Lucide icons and Chevron toggles (title case, zero truncation)
 *       • Tree sub-items with subtle vertical left guideline and clean plain text labels
 *   - Zero PCC/OCC badge chips anywhere in the navigation
 *   - Footer:
 *       • Operational status trigger with status dot ("Operations • Nominal")
 *       • Quick settings access
 *       • Clean user profile row with sign out control (Next.js dev indicator hidden)
 */
import React, { useEffect, useState, useRef, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { StrataBar } from "@kannan19302/ui/shell";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Star,
  CheckSquare,
  Clock,
  Settings,
  Bell,
  LogOut,
  LayoutGrid,
  MoreHorizontal,
  Copy,
  ExternalLink,
} from "lucide-react";
import AdminAppSwitcher from "@/components/AdminAppSwitcher";
import {
  CommandPalette,
  useCommandPalette,
  usePermission,
} from "@kannan19302/ui/components";
import { ProviderThemeControl } from "@/components/provider-theme";
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
    };
    socket.on("tenant.update", onTenantUpdate);
    return () => {
      socket.off("tenant.update", onTenantUpdate);
    };
  }, [socket]);

  return isConnected ? (
    <div className={styles.socketIndicator} title="Connected to real-time events">
      <span className={styles.socketDot} />
    </div>
  ) : null;
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

interface FlattenedNavigationItem {
  id: string;
  name: string;
  href: string;
  icon: any;
  parentApp?: string;
  description?: string;
  keywords?: string[];
}

export default function ControlPlaneShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { claims, signOut } = useSession();
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
    // Default open Platform Operations & Platform Security (matches Accounting & Cash Management in Finance)
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
  const [contextMenu, setContextMenu] = useState<{
    href: string;
    label: string;
    position: { x: number; y: number };
  } | null>(null);
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
        Boolean(item.canonicalPath && (pathname === item.canonicalPath || pathname.startsWith(`${item.canonicalPath}/`)))
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

  // Command palette items without PCC badges
  const commandItems = useMemo(() => [
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
  ], [router]);

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

  // Functional domain apps (excluding overview which sits as standalone link under Workspace)
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
        <aside
          id="provider-navigation"
          inert={!isExpanded}
          aria-hidden={!isExpanded}
          className={`${styles.sidebar} ${!isExpanded ? styles.sidebarCollapsed : ""}`}
        >
          <div className={styles.sidebarInner}>
            {/* Header: Title, Subtitle, Collapse Button */}
            <div className={styles.header}>
              <div className={styles.titleRow}>
                <button
                  type="button"
                  className={styles.workspaceSwitcherTrigger}
                  title="Switch Console"
                >
                  <span className={styles.title}>uniERP Console</span>
                  <ChevronDown size={16} className={styles.chevronIcon} />
                </button>
                <button
                  type="button"
                  className={styles.collapseButton}
                  onClick={() => {
                    handleSetCollapsed(true);
                    setSidebarOpen(false);
                  }}
                  aria-label="Collapse sidebar ([)"
                  title="Collapse sidebar ([)"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
              <div className={styles.scopeSubtitle}>Provider Control Plane</div>
            </div>

            {/* Find in Console Search Input Box */}
            <div className={styles.searchWrap}>
              <div className={styles.searchInputBox}>
                <Search size={14} className={styles.searchIcon} aria-hidden />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Find in Console"
                  aria-label="Search platform applications and tabs"
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Clear Console search"
                    className={styles.searchClearBtn}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Nav Body */}
            <nav
              className={styles.navBody}
              aria-label="Admin OS navigation"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSearchQuery("");
                  setSidebarOpen(false);
                  document.getElementById("provider-menu-toggle")?.focus();
                }
              }}
            >
              {cleanQuery ? (
                /* Search Results Mode */
                <div className={styles.sectionGroup} aria-label="Console search results">
                  <div className={styles.sectionHeader}>
                    Matching Results ({filteredSearchResults.length})
                  </div>
                  {filteredSearchResults.map((res) => {
                    const active = pathname === res.href;
                    const Icon = res.icon || LayoutGrid;
                    return (
                      <Link
                        key={res.id}
                        href={res.href}
                        aria-label={res.parentApp ? `${res.name} (${res.parentApp})` : res.name}
                        aria-current={active ? "page" : undefined}
                        className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                        onClick={() => {
                          setSearchQuery("");
                          if (isMobile) setSidebarOpen(false);
                        }}
                      >
                        <div className={styles.navItemLeft}>
                          <Icon size={15} className={styles.navItemIcon} />
                          <span>{res.name}</span>
                        </div>
                        {res.parentApp && (
                          <div className={styles.navItemRight}>
                            <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)" }}>
                              {res.parentApp}
                            </span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                  {filteredSearchResults.length === 0 && (
                    <div style={{ padding: "var(--space-3) var(--space-2)", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "var(--text-xs)" }}>
                      <p>No pages found matching &ldquo;{searchQuery}&rdquo;</p>
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className={styles.emptyResetBtn}
                        style={{ marginTop: "var(--space-2)" }}
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Starred Favorites (if any exist) */}
                  {starredItems.length > 0 && (
                    <div className={styles.sectionGroup}>
                      <div className={styles.sectionHeader}>Starred</div>
                      {starredItems.map((fav) => (
                        <div
                          key={`fav-${fav.id}`}
                          className={styles.navItem}
                          onContextMenu={(e) => openNavContextMenu(fav.href, fav.name, e)}
                        >
                          <Link
                            href={fav.href}
                            aria-label={`Starred: ${fav.name}`}
                            className={styles.navItemLeft}
                            style={{ flex: 1, textDecoration: "none", color: "inherit" }}
                            onClick={() => { if (isMobile) setSidebarOpen(false); }}
                          >
                            <Star size={14} style={{ fill: "var(--color-warning, #f59e0b)", color: "var(--color-warning, #f59e0b)", flexShrink: 0 }} />
                            <span>{fav.name}</span>
                          </Link>
                          <div className={styles.navItemRight}>
                            {renderMoreButton(fav.href, fav.name)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FAVORITES Section */}
                  <div className={styles.sectionGroup}>
                    <div className={styles.sectionHeader}>FAVORITES</div>

                    <Link
                      href="/apps"
                      className={`${styles.navItem} ${pathname === "/apps" ? styles.navItemActive : ""}`}
                      onContextMenu={(e) => openNavContextMenu("/apps", "App Launchpad", e)}
                      onClick={() => { if (isMobile) setSidebarOpen(false); }}
                    >
                      <div className={styles.navItemLeft}>
                        <LayoutGrid size={15} className={styles.navItemIcon} />
                        <span>App Launchpad</span>
                      </div>
                      <div className={styles.navItemRight}>
                        {renderMoreButton("/apps", "App Launchpad")}
                      </div>
                    </Link>

                    <Link
                      href="/ops/incidents"
                      className={`${styles.navItem} ${pathname === "/ops/incidents" ? styles.navItemActive : ""}`}
                      onContextMenu={(e) => openNavContextMenu("/ops/incidents", "Operational incidents", e)}
                      onClick={() => { if (isMobile) setSidebarOpen(false); }}
                    >
                      <div className={styles.navItemLeft}>
                        <CheckSquare size={15} className={styles.navItemIcon} />
                        <span>Operational incidents</span>
                      </div>
                      <div className={styles.navItemRight}>
                        {hasActiveIncident && (
                          <span className={`${styles.navBadge} ${styles.navBadgeBlue}`}>1</span>
                        )}
                        {renderMoreButton("/ops/incidents", "Operational incidents")}
                      </div>
                    </Link>
                  </div>

                  {/* WORKSPACE Section */}
                  <div className={styles.sectionGroup}>
                    <div className={styles.sectionHeader}>WORKSPACE</div>

                    {/* Overview Root Item */}
                    <Link
                      href="/overview"
                      aria-current={pathname === "/overview" || pathname.startsWith("/overview/") ? "page" : undefined}
                      className={`${styles.navItem} ${
                        pathname === "/overview" || pathname.startsWith("/overview/")
                          ? styles.navItemActive
                          : ""
                      }`}
                      onContextMenu={(e) => openNavContextMenu("/overview", "Overview", e)}
                      onClick={() => { if (isMobile) setSidebarOpen(false); }}
                    >
                      <div className={styles.navItemLeft}>
                        <Clock size={15} className={styles.navItemIcon} />
                        <span>Overview</span>
                      </div>
                      <div className={styles.navItemRight}>
                        {renderMoreButton("/overview", "Overview")}
                      </div>
                    </Link>

                    {/* Domain Expandable Groups */}
                    {domainApps.map((app) => {
                      const isOpen = Boolean(expandedApps[app.id]);
                      const isAppActive =
                        pathname === app.base ||
                        pathname.startsWith(`${app.base}/`) ||
                        Boolean(app.canonicalPath && (pathname === app.canonicalPath || pathname.startsWith(`${app.canonicalPath}/`)));
                      const Icon = app.icon;

                      return (
                        <div key={app.id} className={styles.expandableGroup}>
                          <div
                            className={styles.groupItemHeader}
                            onContextMenu={(e) => openNavContextMenu(app.base, app.label, e)}
                          >
                            <Link
                              href={app.base}
                              className={styles.groupItemTitleLink}
                              aria-label={app.label}
                              onClick={() => {
                                if (!isOpen) toggleAppExpanded(app.id);
                                if (isMobile) setSidebarOpen(false);
                              }}
                            >
                              <Icon size={15} className={styles.navItemIcon} />
                              <span>{app.label}</span>
                            </Link>

                            <div className={styles.navItemRight}>
                              {renderMoreButton(app.base, app.label)}
                              <button
                                type="button"
                                className={styles.groupChevronBtn}
                                onClick={(e) => toggleAppExpanded(app.id, e)}
                                aria-label={`Toggle ${app.label} section`}
                                aria-expanded={isOpen}
                                title={isOpen ? `Collapse ${app.label}` : `Expand ${app.label}`}
                              >
                                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            </div>
                          </div>

                          {/* Indented Sub-Items Tree */}
                          {isOpen && app.tabs && app.tabs.length > 0 && (
                            <div className={styles.subItemsContainer}>
                              {app.tabs.map((tab) => {
                                const isTabActive =
                                  pathname === tab.path ||
                                  (tab.path !== app.base && pathname.startsWith(`${tab.path}/`));
                                const isIncidentTab = tab.path === "/ops/incidents" && hasActiveIncident;

                                return (
                                  <Link
                                    key={tab.key}
                                    href={tab.path}
                                    aria-current={isTabActive ? "page" : undefined}
                                    className={`${styles.navItem} ${
                                      isTabActive ? styles.navItemActive : ""
                                    }`}
                                    onContextMenu={(e) => openNavContextMenu(tab.path, tab.label, e)}
                                    onClick={() => {
                                      if (cleanQuery) setSearchQuery("");
                                      if (isMobile) setSidebarOpen(false);
                                    }}
                                  >
                                    <div className={styles.navItemLeft}>
                                      <span>{tab.label}</span>
                                    </div>
                                    <div className={styles.navItemRight}>
                                      {isIncidentTab && (
                                        <span className={`${styles.navBadge} ${styles.navBadgeBlue}`}>1</span>
                                      )}
                                      {renderMoreButton(tab.path, tab.label)}
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </nav>

            {/* Pinned Footer */}
            <div className={styles.footer}>
              <Link href="/ops/incidents" className={styles.periodTrigger}>
                <div className={styles.periodLeft}>
                  <span className={styles.greenDot} />
                  <span>Operations • Nominal</span>
                </div>
                <ChevronRight size={14} />
              </Link>

              <Link href="/governance-compliance" className={styles.footerBtn}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <Settings size={15} />
                  <span>Settings</span>
                </div>
              </Link>

              <div className={styles.userFooterRow}>
                <a href="http://localhost:3005/oidc/account" className={styles.userFooterLeft} title="Account Profile">
                  <div className={styles.userAvatarMini}>{initial}</div>
                  <span className={styles.userNameMini}>{displayName}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    void fetch("/api/session", { method: "DELETE", credentials: "include" });
                    signOut();
                  }}
                  className={styles.signOutIconBtn}
                  title="Sign out session"
                  aria-label="Sign out session"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Docked Edge Expand Button when collapsed */}
        {!isExpanded && (
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
          <header className={styles.topbar}>
            <AdminAppSwitcher />
            <button
              id="provider-menu-toggle"
              onClick={handleToggleSidebar}
              aria-label="Toggle sidebar"
              aria-expanded={isExpanded}
              aria-controls="provider-navigation"
              className={styles.menuToggle}
            >
              <Menu size={20} />
            </button>
            <ConsoleSocketListener />
            <div className={styles.spacer} />
            <button
              onClick={() => setOpen(true)}
              aria-label="Search provider applications and pages"
              className={styles.searchButton}
            >
              <Search size={16} />
              <span className={styles.searchLabel}>Search…</span>
              <span className={styles.searchShortcut}>⌘K</span>
            </button>
            <ProviderThemeControl className={styles.themeSelect} />
            <Link
              href="/ops/incidents"
              aria-label="Review operational incidents"
              title="Review operational incidents"
              className={styles.notificationButton}
            >
              <Bell size={16} />
              {hasActiveIncident && <span className={styles.notificationBadge} />}
            </Link>
            <a
              href="http://localhost:3005/oidc/account"
              className={styles.iconButton}
              aria-label="Open Account Center"
              title="Account Center"
            >
              {nameFromEmail(accountEmail).charAt(0)}
            </a>
          </header>

          <StrataBar segments={crumbs.map((crumb) => crumb.label)} scope="manage" />

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
              aria-label={favorites.includes(contextMenu.href) ? `Remove ${contextMenu.label} from favorites` : `Star ${contextMenu.label}`}
            >
              <Star
                size={14}
                className={styles.contextMenuItemIcon}
                style={favorites.includes(contextMenu.href) ? { fill: "var(--color-warning, #f59e0b)", color: "var(--color-warning, #f59e0b)" } : {}}
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
