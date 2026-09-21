"use client";

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

export function PccIconTile({ entry, badgeCount, showShortcut = true, onClick, className = "" }: PccIconTileProps) {
  const Icon = entry.icon;
  const count = badgeCount ?? entry.badge;
  return (
    <Link href={entry.href} className={`${styles.domainLink} ${className}`} onClick={onClick}
      aria-label={`${entry.pccCode}: ${entry.title} (${entry.clusterName})`}
      data-cluster={entry.cluster} data-testid={`pcc-tile-${entry.id}`}>
      <span className={styles.iconBox} aria-hidden="true"><Icon size={20} /></span>
      <span className={styles.content}>
        <span className={styles.headingRow}><span className={styles.title}>{entry.shortTitle}</span><span className={styles.code}>{entry.pccCode}</span></span>
        <span className={styles.description}>{entry.description}</span>
        <span className={styles.meta}><span>{entry.clusterName}</span>{count !== undefined && count !== null && count !== 0 && <span>{count} open</span>}</span>
      </span>
      {showShortcut && entry.shortcut && <kbd className={styles.shortcut} aria-label={`Keyboard shortcut ${entry.shortcut}`}>{entry.shortcut}</kbd>}
    </Link>
  );
}

export default PccIconTile;
