"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Layers,
  Activity,
  Shield,
  Building,
  Sparkles,
} from "lucide-react";
import {
  PCC_REGISTRY,
  PCC_CLUSTERS,
  type PccDomainCluster,
  type PccDomainEntry,
} from "@/lib/pcc-registry";
import { PccIconTile } from "@/components/home";
import styles from "./home.module.css";

export default function HomeLauncherPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<PccDomainCluster | "all">("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: '/' focuses search; Esc clears/blurs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement;

      // Press '/' to search
      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Escape to clear search or blur
      if (e.key === "Escape") {
        if (searchQuery) {
          setSearchQuery("");
        } else if (isInputFocused) {
          searchInputRef.current?.blur();
        }
        return;
      }

      // Single-letter shortcut navigation when not typing in an input
      if (!isInputFocused && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.length === 1) {
        const key = e.key.toUpperCase();
        const match = PCC_REGISTRY.find((d) => d.shortcut === key);
        if (match) {
          e.preventDefault();
          router.push(match.href);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery, router]);

  // Filter PCC domains by search query and active cluster
  const filteredDomains = useMemo(() => {
    return PCC_REGISTRY.filter((d) => {
      // Cluster filter
      if (selectedCluster !== "all" && d.cluster !== selectedCluster) {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.shortTitle.toLowerCase().includes(q) ||
        d.pccCode.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.clusterName.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCluster]);

  return (
    <main className={styles.container} id="provider-main" tabIndex={-1}>
      {/* Top Status & Telemetry Bar */}
      <section className={styles.statsTicker} aria-label="System status telemetry">
        <div className={styles.statsItems}>
          <div className={styles.statItem}>
            <span className={styles.liveDot} />
            <span>Control Plane Status:</span>
            <span className={styles.statValue}>ALL SYSTEMS NOMINAL</span>
          </div>
          <div className={styles.statItem}>
            <Activity size={14} />
            <span>Telemetry:</span>
            <span className={styles.statValue}>99.99% Uptime</span>
          </div>
        </div>
        <div className={styles.statsItems}>
          <div className={styles.statItem}>
            <Shield size={14} />
            <span>Tenant Isolation:</span>
            <span className={styles.statValue}>RLS ENFORCED</span>
          </div>
          <div className={styles.statItem}>
            <Building size={14} />
            <span>Active Tenants:</span>
            <span className={styles.statValue}>142</span>
          </div>
        </div>
      </section>

      {/* Hero Header */}
      <header className={styles.heroHeader}>
        <div className={styles.heroBadge}>
          <Sparkles size={13} color="var(--color-primary)" />
          <span>FRAPPE ERPNEXT-INSPIRED DESK LAUNCHER</span>
        </div>
        <h1 className={styles.heroTitle}>Platform Control Center</h1>
        <p className={styles.heroSubtitle}>
          Central enterprise administrative console covering all 22 Platform Control Center (PCC) domains, multi-tenant isolation, and developer services.
        </p>
      </header>

      {/* Search & Cluster Filter Bar */}
      <section className={styles.searchSection} aria-label="Filter applications">
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search 22 control-plane domains (e.g. Subscriptions, Secrets, AI, K8s)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search applications"
            data-testid="pcc-search-input"
          />
          {searchQuery ? (
            <button
              type="button"
              className={styles.searchClearButton}
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          ) : (
            <span className={styles.searchKeyHint}>/</span>
          )}
        </div>

        {/* Cluster Filter Pills */}
        <div className={styles.clusterFilterBar} role="tablist" aria-label="Filter by cluster">
          <button
            type="button"
            role="tab"
            aria-selected={selectedCluster === "all"}
            className={`${styles.filterPill} ${selectedCluster === "all" ? styles.filterPillActive : ""}`}
            onClick={() => setSelectedCluster("all")}
            data-testid="filter-all"
          >
            All Domains ({PCC_REGISTRY.length})
          </button>
          {(Object.keys(PCC_CLUSTERS) as PccDomainCluster[]).map((clusterKey) => {
            const cluster = PCC_CLUSTERS[clusterKey];
            const count = PCC_REGISTRY.filter((d) => d.cluster === clusterKey).length;
            const isSelected = selectedCluster === clusterKey;
            return (
              <button
                key={clusterKey}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`${styles.filterPill} ${isSelected ? styles.filterPillActive : ""}`}
                onClick={() => setSelectedCluster(clusterKey)}
                data-testid={`filter-${clusterKey}`}
              >
                {cluster.name.replace(/ & Fleet| & Secrets| & Config| & Licenses| & Developer Tools| & Analytics/g, "")} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* 6-Column Icon Grid (Frappe ERPNext style) */}
      <section aria-label="Application launcher grid">
        {filteredDomains.length === 0 ? (
          <div className={styles.emptyState}>
            <Layers size={40} color="var(--color-text-tertiary)" />
            <div className={styles.emptyStateText}>
              No platform domains match &quot;<strong>{searchQuery}</strong>&quot;
            </div>
            <button
              type="button"
              className={styles.filterPill}
              onClick={() => {
                setSearchQuery("");
                setSelectedCluster("all");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={styles.iconGrid} role="grid" data-testid="pcc-icon-grid">
            {filteredDomains.map((entry) => (
              <PccIconTile
                key={entry.id}
                entry={entry}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
