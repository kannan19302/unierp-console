"use client";

import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "../lib/use-debounce";
import styles from "./FilterBar.module.css";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface FilterBarProps {
  filters?: FilterConfig[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilter?: (key: string) => void;
  onClearAll?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
  debounceMs?: number;
}

export function FilterBar({
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilter,
  onClearAll,
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  debounceMs = 300,
}: FilterBarProps) {
  const [internalSearch, setInternalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(internalSearch, debounceMs);

  useEffect(() => {
    setInternalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearch !== searchQuery && onSearchChange) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, searchQuery, onSearchChange]);

  const activeChips = Object.entries(activeFilters).filter(
    ([, val]) => val !== undefined && val !== null && val !== ""
  );

  return (
    <div className={styles.filterBar}>
      <div className={styles.controlsRow}>
        {onSearchChange && (
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </div>
        )}

        {filters.length > 0 && (
          <div className={styles.dropdownFilters}>
            {filters.map((filter) => (
              <select
                key={filter.key}
                className={styles.select}
                value={activeFilters[filter.key] ?? ""}
                onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                aria-label={`Filter by ${filter.label}`}
              >
                <option value="">All {filter.label}s</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className={styles.chipsRow}>
          {activeChips.map(([key, val]) => {
            const filterDef = filters.find((f) => f.key === key);
            const label = filterDef ? filterDef.label : key;
            const option = filterDef?.options.find((o) => o.value === val);
            const displayVal = option ? option.label : val;

            return (
              <span key={key} className={styles.chip}>
                <span className={styles.chipLabel}>{label}:</span>
                <span className={styles.chipValue}>{displayVal}</span>
                {onClearFilter && (
                  <button
                    type="button"
                    className={styles.chipRemoveButton}
                    onClick={() => onClearFilter(key)}
                    aria-label={`Remove ${label} filter`}
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            );
          })}

          {onClearAll && (
            <button
              type="button"
              className={styles.clearAllButton}
              onClick={onClearAll}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
