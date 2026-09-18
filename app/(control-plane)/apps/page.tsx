"use client";

import { useState, useId } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpRight,
  Shield,
  Layers,
  Sparkles,
  Server,
  Activity,
  CheckCircle2,
} from "lucide-react";
import {
  NAV_ITEMS,
  ADMIN_OS_CLUSTERS,
  type AppClusterId,
  type AppManifest,
} from "@/lib/navigation";
import styles from "./apps.module.css";

export default function AdminOsLaunchpadPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCluster, setActiveCluster] = useState<AppClusterId | "all">("all");
  const searchInputId = useId();

  // Filter applications
  const filteredApps = NAV_ITEMS.filter((app) => {
    // Only canonical PCC apps (exclude standalone overview dashboard from cluster grid, or include it under platform)
    if (app.id === "overview") return false;
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

  const activeClusters = ADMIN_OS_CLUSTERS.filter((cluster) => {
    if (activeCluster !== "all" && cluster.id !== activeCluster) return false;
    return filteredApps.some((app) => app.clusterId === cluster.id);
  });

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero} aria-labelledby="launchpad-heading">
        <div className={styles.heroTop}>
          <div className={styles.heroTitleArea}>
            <div className={styles.badgeRow}>
              <span className={styles.heroBadge}>Admin OS Suite</span>
              <span className={styles.securityBadge}>Zero-Trust Multi-Tenant Isolated</span>
            </div>
            <h1 id="launchpad-heading" className={styles.heroTitle}>
              Platform Application Launchpad
            </h1>
            <p className={styles.heroDescription}>
              The unified Operating System for platform super-administrators, platform engineers, SREs, and FinOps.
              Governs all 22 canonical applications across 6 enterprise clusters with PostgreSQL RLS and dual-control approval.
            </p>
          </div>
        </div>

        <div className={styles.kpiRow} role="region" aria-label="Platform Highlights">
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Canonical Applications</span>
            <span className={styles.kpiValue}>22 Apps</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Enterprise Clusters</span>
            <span className={styles.kpiValue}>6 Clusters</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Security Model</span>
            <span className={styles.kpiValue}>Zero-Trust RLS</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Transaction Latency</span>
            <span className={styles.kpiValue}>Sub-100ms P99</span>
          </div>
        </div>
      </section>

      {/* Search & Filter Toolbar */}
      <div className={styles.toolbar} role="search" aria-label="Filter applications">
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            id={searchInputId}
            type="text"
            placeholder="Filter applications by name, ID, or keywords (e.g. Subscriptions, KMS, AI, K8s)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterPills} role="tablist" aria-label="Filter by cluster">
          <button
            type="button"
            role="tab"
            aria-selected={activeCluster === "all"}
            onClick={() => setActiveCluster("all")}
            className={`${styles.filterPill} ${activeCluster === "all" ? styles.filterPillActive : ""}`}
          >
            All Clusters (22)
          </button>
          {ADMIN_OS_CLUSTERS.map((cluster) => {
            const count = NAV_ITEMS.filter((a) => a.clusterId === cluster.id && a.id !== "overview").length;
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
      </div>

      {/* Cluster Sections */}
      {activeClusters.length === 0 ? (
        <div className={styles.emptyState}>
          <Search size={32} />
          <p>No applications match &quot;{searchQuery}&quot;</p>
        </div>
      ) : (
        <div className={styles.clustersContainer}>
          {activeClusters.map((cluster) => {
            const ClusterIcon = cluster.icon;
            const clusterApps = filteredApps.filter((app) => app.clusterId === cluster.id);
            if (clusterApps.length === 0) return null;

            return (
              <section
                key={cluster.id}
                className={styles.clusterSection}
                aria-labelledby={`cluster-${cluster.id}`}
              >
                <div className={styles.clusterHeader}>
                  <div className={styles.clusterTitleArea}>
                    <div className={styles.clusterIconWrapper}>
                      <ClusterIcon size={16} />
                    </div>
                    <h2 id={`cluster-${cluster.id}`} className={styles.clusterTitle}>
                      {cluster.name}
                    </h2>
                    <span className={styles.clusterDescription}>{cluster.description}</span>
                  </div>
                  <span className={styles.clusterBadge}>
                    {clusterApps.length} {clusterApps.length === 1 ? "App" : "Apps"}
                  </span>
                </div>

                <div className={styles.appsGrid} role="grid">
                  {clusterApps.map((app) => {
                    const AppIcon = app.icon;
                    return (
                      <article key={app.id} className={styles.appCard} role="gridcell">
                        <div>
                          <div className={styles.appCardTop}>
                            <div className={styles.appIcon}>
                              <AppIcon size={20} />
                            </div>
                            <div className={styles.appMeta}>
                              <div className={styles.appHeaderRow}>
                                <h3 className={styles.appTitle}>{app.label}</h3>
                                {app.appId && <span className={styles.appIdBadge}>{app.appId}</span>}
                              </div>
                              {app.description && (
                                <p className={styles.appDescription}>{app.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Quick sub-tabs */}
                          {app.tabs && app.tabs.length > 0 && (
                            <div className={styles.tabsContainer} aria-label={`${app.label} tabs`}>
                              {app.tabs.slice(0, 4).map((tab) => (
                                <Link
                                  key={tab.key}
                                  href={tab.path}
                                  className={styles.tabPill}
                                >
                                  {tab.label}
                                </Link>
                              ))}
                              {app.tabs.length > 4 && (
                                <span className={styles.tabPill}>+{app.tabs.length - 4} more</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className={styles.appCardFooter}>
                          <span className={styles.routeLabel}>{app.base}</span>
                          <Link href={app.base} className={styles.launchButton}>
                            <span>Open App</span>
                            <ArrowUpRight size={13} />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
