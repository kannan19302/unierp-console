"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import styles from "./shell.module.css";

interface SidebarHeaderProps {
  onCollapse: () => void;
}

export function SidebarHeader({ onCollapse }: SidebarHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <Link
          href="/home"
          className={styles.workspaceSwitcherTrigger}
          title="Open control center home"
        >
          <span className={styles.title}>UniERP</span>
        </Link>
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
      <div className={styles.scopeSubtitle}>Provider control center</div>
    </div>
  );
}
