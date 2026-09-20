"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";
import { exportToCsv } from "@/lib/export-csv";
import styles from "./PaginatedTable.module.css";

export interface ColumnDef<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface PaginatedTableProps<T = any> {
  columns: ColumnDef<T>[];
  data: T[];
  keyField?: string;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc" | null;
  onSortChange?: (column: string, direction: "asc" | "desc" | null) => void;
  selectable?: boolean;
  selectedKeys?: (string | number)[];
  onSelectionChange?: (keys: (string | number)[]) => void;
  bulkActions?: React.ReactNode;
  emptyMessage?: string;
  exportable?: boolean;
  exportFilename?: string;
  onExport?: () => void;
}

export function PaginatedTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = "id",
  loading = false,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSortChange,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  bulkActions,
  emptyMessage = "No records found",
  exportable = false,
  exportFilename = "data-export.csv",
  onExport,
}: PaginatedTableProps<T>) {
  const effectiveTotal = total ?? data.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));

  // Determine current page rows if not server-paginated
  const displayData = useMemo(() => {
    if (total !== undefined) {
      // Server-paginated: data is already the current page
      return data;
    }
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize, total]);

  const allKeysOnPage = useMemo(() => {
    return displayData.map((row) => row[keyField]);
  }, [displayData, keyField]);

  const isAllSelected =
    allKeysOnPage.length > 0 && allKeysOnPage.every((k) => selectedKeys.includes(k));
  const isPartiallySelected =
    allKeysOnPage.some((k) => selectedKeys.includes(k)) && !isAllSelected;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange(selectedKeys.filter((k) => !allKeysOnPage.includes(k)));
    } else {
      const union = Array.from(new Set([...selectedKeys, ...allKeysOnPage]));
      onSelectionChange(union);
    }
  };

  const handleRowSelect = (key: string | number) => {
    if (!onSelectionChange) return;
    if (selectedKeys.includes(key)) {
      onSelectionChange(selectedKeys.filter((k) => k !== key));
    } else {
      onSelectionChange([...selectedKeys, key]);
    }
  };

  const handleSort = (columnKey: string, sortable?: boolean) => {
    if (!sortable || !onSortChange) return;

    if (sortColumn === columnKey) {
      if (sortDirection === "asc") {
        onSortChange(columnKey, "desc");
      } else if (sortDirection === "desc") {
        onSortChange(columnKey, null);
      } else {
        onSortChange(columnKey, "asc");
      }
    } else {
      onSortChange(columnKey, "asc");
    }
  };

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, effectiveTotal);

  return (
    <div className={styles.wrapper}>
      {selectable && selectedKeys.length > 0 && (
        <div className={styles.bulkToolbar}>
          <span>{selectedKeys.length} selected</span>
          <div className={styles.bulkActions}>{bulkActions}</div>
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {selectable && (
                <th className={styles.checkboxTh}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isPartiallySelected;
                    }}
                    onChange={handleSelectAll}
                    aria-label="Select all rows on page"
                  />
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`${styles.th} ${col.sortable ? styles.sortable : ""}`}
                    onClick={() => handleSort(col.key, col.sortable)}
                  >
                    <div className={styles.sortHeader}>
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span className={`${styles.sortIcon} ${isSorted ? styles.active : ""}`}>
                          {isSorted && sortDirection === "asc" ? (
                            <ArrowUp size={14} />
                          ) : isSorted && sortDirection === "desc" ? (
                            <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`}>
                  <td colSpan={columns.length + (selectable ? 1 : 0)}>
                    <div className={styles.skeletonRow} />
                  </td>
                </tr>
              ))
            ) : displayData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className={styles.emptyState}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIdx) => {
                const rowKey = row[keyField] ?? `row-${rowIdx}`;
                const isSelected = selectedKeys.includes(rowKey);
                return (
                  <tr
                    key={rowKey}
                    className={`${styles.tr} ${isSelected ? styles.selected : ""}`}
                  >
                    {selectable && (
                      <td className={styles.checkboxTd}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={isSelected}
                          onChange={() => handleRowSelect(rowKey)}
                          aria-label={`Select row ${rowKey}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const val = row[col.key];
                      return (
                        <td key={col.key} className={styles.td}>
                          {col.render ? col.render(val, row) : (val ?? "-")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.paginationBar}>
        <div aria-live="polite" role="status">
          {effectiveTotal > 0 ? (
            <span>
              Showing {startIndex} to {endIndex} of {effectiveTotal} results
            </span>
          ) : (
            <span>0 results</span>
          )}
        </div>

        <div className={styles.paginationControls}>
          {exportable && (
            <button
              type="button"
              className={styles.pageButton}
              title="Export CSV"
              onClick={() => {
                if (onExport) {
                  onExport();
                } else {
                  exportToCsv(
                    columns.map((c) => ({ key: c.key, label: c.label })),
                    displayData,
                    exportFilename
                  );
                }
              }}
              aria-label="Export CSV"
            >
              <Download size={14} />
            </button>
          )}

          {onPageSizeChange && (
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={styles.pageSizeSelect}
              aria-label="Rows per page"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          )}

          {onPageChange && (
            <>
              <button
                type="button"
                className={styles.pageButton}
                onClick={() => onPageChange(1)}
                disabled={page <= 1}
                aria-label="First page"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                className={styles.pageButton}
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ margin: "0 var(--space-2, 8px)" }}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className={styles.pageButton}
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                className={styles.pageButton}
                onClick={() => onPageChange(totalPages)}
                disabled={page >= totalPages}
                aria-label="Last page"
              >
                <ChevronsRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
