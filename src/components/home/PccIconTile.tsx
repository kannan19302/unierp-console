"use client";

import React from "react";
import Link from "next/link";
import type { PccDomainEntry } from "@/lib/pcc-registry";
import styles from "./PccIconTile.module.css";

export interface PccIconTileProps {
  entry: PccDomainEntry;
  badgeCount?: number | string;
  showShortcut?: boolean;
  onClick?: () => void;
  className?: string;
}

export function PccIconTile({
  entry,
  badgeCount,
  showShortcut = true,
  onClick,
  className = "",
}: PccIconTileProps) {
  const IconComponent = entry.icon;
  const count = badgeCount ?? entry.badge;

  return (
    <Link
      href={entry.href}
      className={`${styles.tileWrapper} ${className}`}
      onClick={onClick}
      aria-label={`${entry.pccCode}: ${entry.title} (${entry.clusterName})`}
      title={`${entry.pccCode}: ${entry.title}\n${entry.description}`}
      tabIndex={0}
      data-testid={`pcc-tile-${entry.id}`}
      style={{
        ["--tile-glow" as any]: entry.accentGlowVar,
      }}
    >
      <div
        className={styles.iconBox}
        style={{
          backgroundColor: entry.accentVar,
        }}
      >
        <IconComponent size={30} color="#ffffff" />

        {count !== undefined && count !== null && count !== 0 && (
          <span className={styles.badge} aria-label={`${count} items`}>
            {count}
          </span>
        )}

        {showShortcut && entry.shortcut && (
          <span className={styles.shortcut} aria-hidden="true">
            {entry.shortcut}
          </span>
        )}
      </div>

      <span className={styles.title}>{entry.shortTitle}</span>
      <span className={styles.pccCode}>{entry.pccCode}</span>
    </Link>
  );
}

export default PccIconTile;
