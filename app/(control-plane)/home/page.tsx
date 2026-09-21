"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { EmptyStateIllustration } from "@/components/feedback";
import { PccIconTile } from "@/components/home";
import { SetupChecklist } from "@/components/onboarding";
import { PCC_CLUSTERS, PCC_REGISTRY, type PccDomainCluster } from "@/lib/pcc-registry";
import styles from "./home.module.css";

const SHORT_CLUSTER_NAMES: Record<PccDomainCluster, string> = {
  ops: "Operations", security: "Security", iam: "Identity & tenants",
  billing: "Billing", dev: "Developer ecosystem", support: "Support & analytics",
};

export default function HomeLauncherPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<PccDomainCluster | "all">("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
      if (event.key === "/" && !isInput) {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (event.key === "Escape") {
        if (searchQuery) setSearchQuery("");
        else if (isInput) searchInputRef.current?.blur();
        return;
      }
      if (!isInput && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.length === 1) {
        const match = PCC_REGISTRY.find((domain) => domain.shortcut === event.key.toUpperCase());
        if (match) {
          event.preventDefault();
          router.push(match.href);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, searchQuery]);

  const filteredDomains = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return PCC_REGISTRY.filter((domain) => {
      if (selectedCluster !== "all" && domain.cluster !== selectedCluster) return false;
      if (!query) return true;
      return [domain.title, domain.shortTitle, domain.pccCode, domain.description, domain.clusterName]
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [searchQuery, selectedCluster]);

  const clusterDescription = selectedCluster === "all"
    ? "Provider-wide applications and operational workspaces."
    : PCC_CLUSTERS[selectedCluster].description;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCluster("all");
    searchInputRef.current?.focus();
  };

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.scope}>Provider estate</p>
          <h1 className={styles.title}>Control center</h1>
          <p className={styles.introduction}>
            Choose an operational workspace. Live service health and incidents remain inside Operations,
            where source status and refresh time are visible.
          </p>
        </div>
        <div className={styles.directorySummary} aria-label={`${PCC_REGISTRY.length} control center domains`}>
          <strong>{PCC_REGISTRY.length}</strong><span>operational domains</span>
        </div>
      </header>

      <section className={styles.directory} aria-labelledby="domain-directory-title">
        <div className={styles.directoryHeader}>
          <div><h2 id="domain-directory-title">Domain directory</h2><p>{clusterDescription}</p></div>
          <p className={styles.resultCount} aria-live="polite">
            {filteredDomains.length} {filteredDomains.length === 1 ? "result" : "results"}
          </p>
        </div>

        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <Search size={17} className={styles.searchIcon} aria-hidden="true" />
            <input ref={searchInputRef} type="search" className={styles.searchInput}
              placeholder="Search domains, responsibilities, or PCC code" value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search control center domains" data-testid="pcc-search-input" />
            {searchQuery ? (
              <button type="button" className={styles.searchClearButton} onClick={() => setSearchQuery("")} aria-label="Clear search">
                <X size={15} aria-hidden="true" />
              </button>
            ) : <kbd className={styles.searchKeyHint} aria-hidden="true">/</kbd>}
          </div>
        </div>

        <div className={styles.clusterFilterBar} aria-label="Filter domains by responsibility">
          <button type="button" aria-pressed={selectedCluster === "all"} className={styles.filterButton}
            onClick={() => setSelectedCluster("all")} data-testid="filter-all">
            All <span>{PCC_REGISTRY.length}</span>
          </button>
          {(Object.keys(PCC_CLUSTERS) as PccDomainCluster[]).map((clusterKey) => {
            const count = PCC_REGISTRY.filter((domain) => domain.cluster === clusterKey).length;
            return (
              <button key={clusterKey} type="button" aria-pressed={selectedCluster === clusterKey}
                className={styles.filterButton} onClick={() => setSelectedCluster(clusterKey)} data-testid={`filter-${clusterKey}`}>
                {SHORT_CLUSTER_NAMES[clusterKey]} <span>{count}</span>
              </button>
            );
          })}
        </div>

        {filteredDomains.length === 0 ? (
          <EmptyStateIllustration type="no-search-results" title={`No domains match “${searchQuery}”`}
            description="Try a responsibility, PCC code, or a broader cluster."
            action={{ label: "Reset filters", onClick: resetFilters }} />
        ) : (
          <div className={styles.domainGrid} data-testid="pcc-icon-grid">
            {filteredDomains.map((entry) => <PccIconTile key={entry.id} entry={entry} />)}
          </div>
        )}
      </section>

      <SetupChecklist />
    </div>
  );
}
