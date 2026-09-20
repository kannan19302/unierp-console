"use client";

import React from "react";
import Link from "next/link";
import { Star, LayoutGrid, CheckSquare } from "lucide-react";
import type { FlattenedNavigationItem } from "./types";
import styles from "./shell.module.css";

interface SidebarFavoritesProps {
  starredItems: FlattenedNavigationItem[];
  pathname: string;
  hasActiveIncident: boolean;
  isMobile: boolean;
  setSidebarOpen: (open: boolean) => void;
  openNavContextMenu: (href: string, label: string, e: React.MouseEvent) => void;
  renderMoreButton: (href: string, label: string) => React.ReactNode;
}

export function SidebarFavorites({
  starredItems,
  pathname,
  hasActiveIncident,
  isMobile,
  setSidebarOpen,
  openNavContextMenu,
  renderMoreButton,
}: SidebarFavoritesProps) {
  return (
    <>
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
                onClick={() => {
                  if (isMobile) setSidebarOpen(false);
                }}
              >
                <Star
                  size={14}
                  style={{
                    fill: "var(--color-warning, #f59e0b)",
                    color: "var(--color-warning, #f59e0b)",
                    flexShrink: 0,
                  }}
                />
                <span>{fav.name}</span>
              </Link>
              <div className={styles.navItemRight}>
                {renderMoreButton(fav.href, fav.name)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.sectionGroup}>
        <div className={styles.sectionHeader}>FAVORITES</div>

        <Link
          href="/apps"
          className={`${styles.navItem} ${pathname === "/apps" ? styles.navItemActive : ""}`}
          onContextMenu={(e) => openNavContextMenu("/apps", "App Launchpad", e)}
          onClick={() => {
            if (isMobile) setSidebarOpen(false);
          }}
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
          onClick={() => {
            if (isMobile) setSidebarOpen(false);
          }}
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
    </>
  );
}
