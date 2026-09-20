"use client";

import React from "react";
import styles from "./DomainSkeleton.module.css";

export type DomainSkeletonVariant = "table" | "cards" | "detail" | "dashboard";

export interface DomainSkeletonProps {
  variant?: DomainSkeletonVariant;
  rows?: number;
  cards?: number;
  className?: string;
  hasKpi?: boolean;
}

export function DomainSkeleton({
  variant = "table",
  rows = 5,
  cards = 6,
  className,
  hasKpi = true,
}: DomainSkeletonProps) {
  return (
    <div
      className={`${styles.container} ${className ?? ""}`}
      role="status"
      aria-label="Loading domain content"
      aria-busy="true"
    >
      {/* Header skeleton */}
      <div className={styles.headerSkeleton}>
        <div className={`${styles.shimmerBox} ${styles.titleSkeleton}`} />
        <div className={styles.actionsSkeleton}>
          <div className={`${styles.shimmerBox} ${styles.buttonSkeleton}`} />
          <div className={`${styles.shimmerBox} ${styles.buttonSkeleton}`} />
        </div>
      </div>

      {/* KPI row */}
      {hasKpi && (
        <div className={styles.kpiRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`kpi-${i}`} className={styles.kpiCard}>
              <div className={`${styles.shimmerBox} ${styles.kpiLabel}`} />
              <div className={`${styles.shimmerBox} ${styles.kpiValue}`} />
            </div>
          ))}
        </div>
      )}

      {/* Variant Content */}
      {variant === "table" && (
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <div className={`${styles.shimmerBox} ${styles.tableHeaderCell}`} />
            <div className={`${styles.shimmerBox} ${styles.tableHeaderCell}`} />
            <div className={`${styles.shimmerBox} ${styles.tableHeaderCell}`} />
            <div className={`${styles.shimmerBox} ${styles.tableHeaderCell}`} />
          </div>
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={`row-${idx}`} className={styles.tableRow}>
              <div className={`${styles.shimmerBox} ${styles.tableCell}`} />
              <div className={`${styles.shimmerBox} ${styles.tableCell}`} />
              <div className={`${styles.shimmerBox} ${styles.tableCell}`} />
              <div className={`${styles.shimmerBox} ${styles.tableCell}`} />
            </div>
          ))}
        </div>
      )}

      {variant === "cards" && (
        <div className={styles.cardsGrid}>
          {Array.from({ length: cards }).map((_, idx) => (
            <div key={`card-${idx}`} className={styles.cardItem}>
              <div className={`${styles.shimmerBox} ${styles.cardHeaderLine}`} />
              <div className={`${styles.shimmerBox} ${styles.cardBodyLineLong}`} />
              <div className={`${styles.shimmerBox} ${styles.cardBodyLineShort}`} />
            </div>
          ))}
        </div>
      )}

      {variant === "detail" && (
        <div className={styles.detailGrid}>
          <div className={styles.detailMain}>
            <div className={`${styles.shimmerBox} ${styles.detailTitle}`} />
            <div className={`${styles.shimmerBox} ${styles.cardBodyLineLong}`} />
            <div className={`${styles.shimmerBox} ${styles.cardBodyLineLong}`} />
            <div className={`${styles.shimmerBox} ${styles.cardBodyLineShort}`} />
          </div>
          <div className={styles.detailSidebar}>
            <div className={`${styles.shimmerBox} ${styles.detailTitle}`} />
            <div className={`${styles.shimmerBox} ${styles.detailSidebarAction}`} />
            <div className={`${styles.shimmerBox} ${styles.detailSidebarAction}`} />
          </div>
        </div>
      )}

      {variant === "dashboard" && (
        <>
          <div className={styles.dashboardChart}>
            <div className={`${styles.shimmerBox} ${styles.detailTitle}`} />
            <div className={`${styles.shimmerBox} ${styles.chartCanvas}`} />
          </div>
          <div className={styles.tableContainer}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={`dash-row-${idx}`} className={styles.tableRow}>
                <div className={`${styles.shimmerBox} ${styles.tableCell}`} />
                <div className={`${styles.shimmerBox} ${styles.tableCell}`} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default DomainSkeleton;
