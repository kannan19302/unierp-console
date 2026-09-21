"use client";

import { useState, useId, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  X,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  NAV_ITEMS,
  ADMIN_OS_CLUSTERS,
  type AppClusterId,
  type AppManifest,
} from "@/lib/navigation";
import { getPccDomain } from "@/lib/pcc-registry";
import styles from "./AdminAppSwitcher.module.css";

export interface AdminAppSwitcherProps {
  className?: string;
}

export default function AdminAppSwitcher({ className }: AdminAppSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCluster, setActiveCluster] = useState<AppClusterId | "all">("all");
  const searchInputId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
      setActiveCluster("all");
    }
  }, [isOpen]);

  // Handle ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Filter applications
  const filteredApps = NAV_ITEMS.filter((app) => {
    if (activeCluster !== "all" && app.clusterId !== activeCluster) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.label.toLowerCase().includes(q) ||
      (app.appId && app.appId.toLowerCase().includes(q)) ||
      (app.description && app.description.toLowerCase().includes(q)) ||
      (app.clusterName && app.clusterName.toLowerCase().includes(q)) ||
      (app.searchKeywords && app.searchKeywords.some((k) => k.toLowerCase().includes(q)))
    );
  });

  const handleLaunchApp = (app: AppManifest) => {
    router.push(app.base);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={`${styles.waffleButton} ${isOpen ? styles.waffleButtonActive : ""} ${className ?? ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Admin OS App Switcher: Open ${NAV_ITEMS.length} Platform Applications`}
        title="Admin OS App Switcher"
      >
        <div className={styles.waffleGridIcon} aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={styles.waffleDot} />
          ))}
        </div>
      </button>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="UniERP Admin OS Applications Suite"
            className={styles.flyout}
          >
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.titleArea}>
                  <h2 className={styles.title}>Admin OS Applications</h2>
                  <span className={styles.badge}>{NAV_ITEMS.length} Applications</span>
                </div>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={() => setIsOpen(false)}
                  aria-label="Close switcher"
                >
                  <X size={14} />
                </button>
              </div>

              <div className={styles.searchContainer}>
                <Search size={14} className={styles.searchIcon} aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  id={searchInputId}
                  type="text"
                  placeholder={`Search ${NAV_ITEMS.length} platform applications (e.g. Subscriptions, KMS, AI, K8s)...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.filterPills} role="tablist" aria-label="Application clusters">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCluster === "all"}
                  onClick={() => setActiveCluster("all")}
                  className={`${styles.filterPill} ${activeCluster === "all" ? styles.filterPillActive : ""}`}
                >
                  All ({NAV_ITEMS.length})
                </button>
                {ADMIN_OS_CLUSTERS.map((cluster) => {
                  const count = NAV_ITEMS.filter((a) => a.clusterId === cluster.id).length;
                  return (
                    <button
                      key={cluster.id}
                      type="button"
                      role="tab"
                      aria-selected={activeCluster === cluster.id}
                      onClick={() => setActiveCluster(cluster.id)}
                      className={`${styles.filterPill} ${activeCluster === cluster.id ? styles.filterPillActive : ""}`}
                    >
                      {cluster.name.replace(/ OS$/, "")} ({count})
                    </button>
                  );
                })}
              </div>
            </header>

            <div className={styles.appsList} role="grid">
              {filteredApps.length === 0 ? (
                <div className={styles.emptyState}>
                  No applications match &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredApps.map((app) => {
                  const Icon = app.icon;
                  const isActive = pathname === app.base || pathname.startsWith(`${app.base}/`);
                  const pccEntry = getPccDomain(app.id) || getPccDomain(app.base);
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => handleLaunchApp(app)}
                      className={`${styles.appCard} ${isActive ? styles.appCardActive : ""}`}
                    >
                      <div
                        className={styles.appIconContainer}
                        style={pccEntry ? { backgroundColor: pccEntry.accentVar, color: "var(--color-text-inverse, #ffffff)" } : undefined}
                      >
                        <Icon size={18} />
                      </div>
                      <div className={styles.appContent}>
                        <div className={styles.appHeaderRow}>
                          <span className={styles.appName}>{app.label}</span>
                          {app.appId && <span className={styles.appIdBadge}>{app.appId}</span>}
                        </div>
                        {app.description && (
                          <div className={styles.appDescription}>{app.description}</div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <footer className={styles.footer}>
              <span className={styles.footerNote}>
                Zero-Trust Multi-Tenant Governance · PostgreSQL RLS Enforced
              </span>
              <Link
                href="/home"
                onClick={() => setIsOpen(false)}
                className={styles.launchpadLink}
              >
                <span>Home Desk Launcher</span>
                <ArrowUpRight size={13} />
              </Link>
            </footer>
          </div>
        </>
      )}
    </>
  );
}
