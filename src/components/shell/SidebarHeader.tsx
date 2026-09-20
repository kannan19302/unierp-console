"use client";

import React from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";
import styles from "./shell.module.css";

interface SidebarHeaderProps {
  onCollapse: () => void;
}

export function SidebarHeader({ onCollapse }: SidebarHeaderProps) {
  return (
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
          onClick={onCollapse}
          aria-label="Collapse sidebar ([)"
          title="Collapse sidebar ([)"
        >
          <ChevronLeft size={16} />
        </button>
      </div>
      <div className={styles.scopeSubtitle}>Provider Control Plane</div>
    </div>
  );
}
