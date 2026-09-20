"use client";

import React from "react";
import { Search, X } from "lucide-react";
import styles from "./shell.module.css";

interface SidebarSearchProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export function SidebarSearch({
  searchQuery,
  setSearchQuery,
  searchInputRef,
}: SidebarSearchProps) {
  return (
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
  );
}
