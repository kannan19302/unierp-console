"use client";

import React from "react";
import Link from "next/link";
import { Clock, ChevronDown, ChevronRight, LayoutGrid } from "lucide-react";
import { usePermission } from "@kannan19302/ui/components";
import type { NavItem } from "@/lib/navigation";
import type { FlattenedNavigationItem } from "./types";
import { SidebarFavorites } from "./SidebarFavorites";
import styles from "./shell.module.css";

interface SidebarTabItemProps {
  tab: any;
  app: NavItem;
  pathname: string;
  hasActiveIncident: boolean;
  cleanQuery: string;
  isMobile: boolean;
  setSearchQuery: (q: string) => void;
  setSidebarOpen: (o: boolean) => void;
  openNavContextMenu: (href: string, label: string, e: React.MouseEvent) => void;
  renderMoreButton: (href: string, label: string) => React.ReactNode;
}

export function SidebarTabItem({
  tab,
  app,
  pathname,
  hasActiveIncident,
  cleanQuery,
  isMobile,
  setSearchQuery,
  setSidebarOpen,
  openNavContextMenu,
  renderMoreButton,
}: SidebarTabItemProps) {
  const hasTabPermission = usePermission(tab.permission ?? "");
  if (tab.permission && !hasTabPermission) return null;

  const isTabActive =
    pathname === tab.path ||
    (tab.path !== app.base && pathname.startsWith(`${tab.path}/`));
  const isIncidentTab = tab.path === "/ops/incidents" && hasActiveIncident;

  return (
    <Link
      key={tab.key}
      href={tab.path}
      aria-current={isTabActive ? "page" : undefined}
      className={`${styles.navItem} ${isTabActive ? styles.navItemActive : ""}`}
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
}

interface SidebarAppGroupProps {
  app: NavItem;
  pathname: string;
  isOpen: boolean;
  isConnected: boolean;
  isMobile: boolean;
  cleanQuery: string;
  hasActiveIncident: boolean;
  setSearchQuery: (q: string) => void;
  setSidebarOpen: (o: boolean) => void;
  toggleAppExpanded: (appId: string, e?: React.MouseEvent) => void;
  openNavContextMenu: (href: string, label: string, e: React.MouseEvent) => void;
  renderMoreButton: (href: string, label: string) => React.ReactNode;
}

export function SidebarAppGroup({
  app,
  pathname,
  isOpen,
  isConnected,
  isMobile,
  cleanQuery,
  hasActiveIncident,
  setSearchQuery,
  setSidebarOpen,
  toggleAppExpanded,
  openNavContextMenu,
  renderMoreButton,
}: SidebarAppGroupProps) {
  const hasAppPermission = usePermission(app.permission ?? "");
  if (app.permission && !hasAppPermission) return null;

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
          {isConnected && (
            <span
              className={styles.realTimeDot}
              title={`WebSocket real-time active for ${app.label}`}
              aria-label={`${app.label} real-time active`}
            />
          )}
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
          {app.tabs.map((tab: any) => (
            <SidebarTabItem
              key={tab.key}
              tab={tab}
              app={app}
              pathname={pathname}
              hasActiveIncident={hasActiveIncident}
              cleanQuery={cleanQuery}
              isMobile={isMobile}
              setSearchQuery={setSearchQuery}
              setSidebarOpen={setSidebarOpen}
              openNavContextMenu={openNavContextMenu}
              renderMoreButton={renderMoreButton}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarNavigationProps {
  pathname: string;
  cleanQuery: string;
  searchQuery: string;
  filteredSearchResults: FlattenedNavigationItem[];
  starredItems: FlattenedNavigationItem[];
  domainApps: NavItem[];
  expandedApps: Record<string, boolean>;
  isConnected: boolean;
  isMobile: boolean;
  hasActiveIncident: boolean;
  setSearchQuery: (q: string) => void;
  setSidebarOpen: (o: boolean) => void;
  toggleAppExpanded: (appId: string, e?: React.MouseEvent) => void;
  openNavContextMenu: (href: string, label: string, e: React.MouseEvent) => void;
  renderMoreButton: (href: string, label: string) => React.ReactNode;
}

export function SidebarNavigation({
  pathname,
  cleanQuery,
  searchQuery,
  filteredSearchResults,
  starredItems,
  domainApps,
  expandedApps,
  isConnected,
  isMobile,
  hasActiveIncident,
  setSearchQuery,
  setSidebarOpen,
  toggleAppExpanded,
  openNavContextMenu,
  renderMoreButton,
}: SidebarNavigationProps) {
  return (
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
            <div
              style={{
                padding: "var(--space-3) var(--space-2)",
                textAlign: "center",
                color: "var(--color-text-tertiary)",
                fontSize: "var(--text-xs)",
              }}
            >
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
          <SidebarFavorites
            starredItems={starredItems}
            pathname={pathname}
            hasActiveIncident={hasActiveIncident}
            isMobile={isMobile}
            setSidebarOpen={setSidebarOpen}
            openNavContextMenu={openNavContextMenu}
            renderMoreButton={renderMoreButton}
          />

          {/* WORKSPACE Section */}
          <div className={styles.sectionGroup}>
            <div className={styles.sectionHeader}>WORKSPACE</div>

            {/* Overview Root Item */}
            <Link
              href="/overview"
              aria-current={
                pathname === "/overview" || pathname.startsWith("/overview/")
                  ? "page"
                  : undefined
              }
              className={`${styles.navItem} ${
                pathname === "/overview" || pathname.startsWith("/overview/")
                  ? styles.navItemActive
                  : ""
              }`}
              onContextMenu={(e) => openNavContextMenu("/overview", "Overview", e)}
              onClick={() => {
                if (isMobile) setSidebarOpen(false);
              }}
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
            {domainApps.map((app) => (
              <SidebarAppGroup
                key={app.id}
                app={app}
                pathname={pathname}
                isOpen={Boolean(expandedApps[app.id])}
                isConnected={isConnected}
                isMobile={isMobile}
                cleanQuery={cleanQuery}
                hasActiveIncident={hasActiveIncident}
                setSearchQuery={setSearchQuery}
                setSidebarOpen={setSidebarOpen}
                toggleAppExpanded={toggleAppExpanded}
                openNavContextMenu={openNavContextMenu}
                renderMoreButton={renderMoreButton}
              />
            ))}
          </div>
        </>
      )}
    </nav>
  );
}
