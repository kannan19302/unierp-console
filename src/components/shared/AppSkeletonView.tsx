"use client";

import { useState, useId, type ReactNode } from "react";
import {
  Search,
  RefreshCw,
  Sliders,
  Plus,
  ArrowUpRight,
  Shield,
  X,
  Layers,
  FileCode,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import {
  StatCardRow,
  type StatCardItem,
  EmptyState,
  LoadingState,
  ForbiddenState,
  usePermission,
} from "@kannan19302/ui";
import PrivilegedCommandModal from "./PrivilegedCommandModal";
import styles from "./AppSkeletonView.module.css";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  isMono?: boolean;
}

export interface AppSkeletonViewProps<T extends Record<string, any>> {
  domainId: string;
  appId: string;
  title: string;
  description: string;
  permission?: string;
  kpis: StatCardItem[];
  columns: ColumnDef<T>[];
  items: T[];
  loading?: boolean;
  onRefresh?: () => void;
  primaryActionLabel?: string;
  privilegedActionName?: string;
  onExecuteAction?: (justification: string, approvalRef: string) => Promise<void> | void;
  emptyTitle?: string;
  emptyDescription?: string;
  filterOptions?: { label: string; value: string }[];
}

export default function AppSkeletonView<T extends Record<string, any>>({
  domainId,
  appId,
  title,
  description,
  permission,
  kpis,
  columns,
  items,
  loading = false,
  onRefresh,
  primaryActionLabel = "Execute Operation",
  privilegedActionName = "Privileged Action",
  onExecuteAction,
  emptyTitle = "No records found",
  emptyDescription = "No resources currently provisioned for this scope.",
  filterOptions = [
    { label: "All Statuses", value: "ALL" },
    { label: "Active Only", value: "ACTIVE" },
    { label: "Pending", value: "PENDING" },
    { label: "Degraded", value: "DEGRADED" },
  ],
}: AppSkeletonViewProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const searchInputId = useId();

  const hasPermission = usePermission(permission ?? "");
  const isAllowed = permission ? hasPermission : true;

  if (!isAllowed) {
    return (
      <div className={styles.container}>
        <ForbiddenState
          title="Zero-Trust Access Denied"
          description={`Missing required provider permission: ${permission}`}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingState message={`Loading ${title} telemetry…`} />
      </div>
    );
  }

  // Filter items
  const filteredItems = items.filter((item) => {
    if (statusFilter !== "ALL" && item.status && item.status !== statusFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(item).some((val) =>
      typeof val === "string" ? val.toLowerCase().includes(q) : false,
    );
  });

  return (
    <div className={styles.container}>
      {/* Stat Cards Strip */}
      <div className={styles.kpiContainer}>
        <StatCardRow stats={kpis} />
      </div>

      {/* Filter / Search Toolbar */}
      <div className={styles.toolbar} role="toolbar" aria-label="Table filters">
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} aria-hidden="true" />
          <input
            id={searchInputId}
            type="text"
            placeholder="Filter records by ID, name, or metadata..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.toolbarActions}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by status"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {onRefresh && (
            <button
              type="button"
              className={styles.actionButton}
              onClick={onRefresh}
              title="Refresh telemetry"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          )}

          <button
            type="button"
            className={`${styles.actionButton} ${styles.primaryActionButton}`}
            onClick={() => setIsCommandModalOpen(true)}
          >
            <Plus size={13} />
            <span>{primaryActionLabel}</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className={styles.tableWrapper}>
        {filteredItems.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className={styles.th}>
                      {col.header}
                    </th>
                  ))}
                  <th className={styles.th} style={{ textAlign: "right" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const isSelected = selectedItem === item;
                  return (
                    <tr
                      key={item.id ?? idx}
                      className={`${styles.tr} ${isSelected ? styles.trActive : ""}`}
                      onClick={() => setSelectedItem(item)}
                    >
                      {columns.map((col, colIdx) => {
                        const cellVal = item[col.key];
                        return (
                          <td
                            key={col.key}
                            className={`${styles.td} ${colIdx === 0 ? styles.tdPrimary : ""} ${col.isMono ? styles.tdMono : ""}`}
                          >
                            {col.render ? col.render(item) : String(cellVal ?? "—")}
                          </td>
                        );
                      })}
                      <td className={styles.td} style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                          }}
                        >
                          <span>Inspect</span>
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.pagination}>
          <span>
            Showing {filteredItems.length} of {items.length} records
          </span>
          <span>Zero-Trust Verification Active</span>
        </div>
      </div>

      {/* Record Inspector Drawer (SplitViewShell Pattern) */}
      {selectedItem && (
        <aside
          role="dialog"
          aria-label="Record Details Inspector"
          className={styles.drawer}
        >
          <div className={styles.drawerHeader}>
            <h3 className={styles.drawerTitle}>Record Inspector · {appId}</h3>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => setSelectedItem(null)}
              aria-label="Close inspector"
            >
              <X size={14} />
            </button>
          </div>

          <div className={styles.drawerContent}>
            <div className={styles.drawerSection}>
              <h4 className={styles.drawerSectionTitle}>Authoritative Attributes</h4>
              <div className={styles.drawerGrid}>
                {Object.entries(selectedItem)
                  .filter(([k]) => typeof selectedItem[k] !== "object")
                  .map(([k, v]) => (
                    <div key={k} className={styles.drawerField}>
                      <span className={styles.drawerLabel}>{k}</span>
                      <span className={styles.drawerValue}>{String(v ?? "—")}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className={styles.drawerSection}>
              <h4 className={styles.drawerSectionTitle}>Governance &amp; Tenancy Scope</h4>
              <div className={styles.drawerGrid}>
                <div className={styles.drawerField}>
                  <span className={styles.drawerLabel}>RLS Policy</span>
                  <span className={styles.drawerValue}>FORCE ROW LEVEL SECURITY</span>
                </div>
                <div className={styles.drawerField}>
                  <span className={styles.drawerLabel}>Assurance</span>
                  <span className={styles.drawerValue}>PCC Super-Admin</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.drawerActions}>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.primaryActionButton}`}
              onClick={() => setIsCommandModalOpen(true)}
            >
              <span>Privileged Mutation</span>
              <ArrowUpRight size={13} />
            </button>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => setSelectedItem(null)}
            >
              Close
            </button>
          </div>
        </aside>
      )}

      {/* Privileged Command Sequence Modal */}
      <PrivilegedCommandModal
        isOpen={isCommandModalOpen}
        onClose={() => setIsCommandModalOpen(false)}
        title={`${primaryActionLabel} — ${appId}`}
        actionName={privilegedActionName}
        appId={appId}
        targetDescription={selectedItem?.name ?? selectedItem?.id ?? `${appId} Scoped Target`}
        onExecute={onExecuteAction}
      />
    </div>
  );
}
