"use client";

import {
  Badge,
  Button,
} from "@kannan19302/ui";
import {
  Shield,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Power,
} from "lucide-react";
import { PaginatedTable, type ColumnDef } from "@/components/PaginatedTable";
import { FilterBar } from "@/components/FilterBar";
import { securityPolicyFilterConfigs, type SecurityPolicy } from "@/lib/security-schema";
import styles from "../policies.module.css";

interface PolicyInventoryProps {
  policies: SecurityPolicy[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  search: string;
  filters: Record<string, string>;
  canManage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onOpenCreate: () => void;
  onOpenEdit: (policy: SecurityPolicy) => void;
  onOpenDelete: (policy: SecurityPolicy) => void;
  onToggleStatus: (policy: SecurityPolicy) => void;
}

export function PolicyInventory({
  policies,
  total,
  page,
  pageSize,
  loading,
  search,
  filters,
  canManage,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onFilterChange,
  onOpenCreate,
  onOpenEdit,
  onOpenDelete,
  onToggleStatus,
}: PolicyInventoryProps) {
  const columns: ColumnDef<SecurityPolicy>[] = [
    {
      key: "name",
      label: "Policy Name & Directive",
      render: (_, row: SecurityPolicy) => (
        <div className={styles.policyCell}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Shield size={14} color="var(--color-primary)" />
            <span className={styles.policyName}>{row.name}</span>
            <Badge variant="info">v{row.version || 1}</Badge>
          </div>
          {row.description && (
            <span className={styles.policyDesc}>{row.description}</span>
          )}
        </div>
      ),
    },
    {
      key: "scopeType",
      label: "Scope Hierarchy",
      render: (_, row: SecurityPolicy) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <Badge variant="default">{row.scopeType}</Badge>
          {row.scopeId && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              ID: {row.scopeId}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "isolationLevel",
      label: "Isolation Strategy",
      render: (_, row: SecurityPolicy) => {
        const isRls = row.isolationLevel === "ROW_LEVEL_SECURITY";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
            {isRls ? (
              <Lock size={13} color="var(--color-success)" />
            ) : (
              <ShieldCheck size={13} color="var(--color-info)" />
            )}
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 500 }}>
              {row.isolationLevel.replace(/_/g, " ")}
            </span>
          </div>
        );
      },
    },
    {
      key: "enforcementMode",
      label: "Enforcement Mode",
      render: (_, row: SecurityPolicy) => {
        const variant =
          row.enforcementMode === "BLOCK"
            ? "danger"
            : row.enforcementMode === "ALERT"
            ? "warning"
            : "default";
        return <Badge variant={variant}>{row.enforcementMode}</Badge>;
      },
    },
    {
      key: "enabled",
      label: "Status",
      render: (_, row: SecurityPolicy) => {
        const isEnabled = row.enabled !== false;
        return (
          <button
            className={`${styles.toggleButton} ${
              isEnabled ? styles.toggleActive : styles.toggleDisabled
            }`}
            onClick={() => onToggleStatus(row)}
            title={isEnabled ? "Click to disable" : "Click to enable"}
          >
            <Power size={11} />
            <span>{isEnabled ? "ACTIVE" : "DISABLED"}</span>
          </button>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row: SecurityPolicy) => (
        <div style={{ display: "flex", gap: "var(--space-1)", justifyContent: "flex-end" }}>
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenEdit(row)}
              title="Edit Policy"
            >
              <Edit2 size={13} />
            </Button>
          )}
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDelete(row)}
              title="Delete Policy"
            >
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.tableToolbar}>
        <FilterBar
          filters={securityPolicyFilterConfigs}
          activeFilters={filters}
          searchPlaceholder="Search policies by directive name or intent..."
          onFilterChange={onFilterChange}
          searchQuery={search}
          onSearchChange={onSearchChange}
        />
        {canManage && (
          <Button variant="primary" size="sm" onClick={onOpenCreate}>
            <Plus size={14} />
            Create Policy
          </Button>
        )}
      </div>

      <PaginatedTable
        columns={columns}
        data={policies}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={loading}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        emptyMessage="No security policies registered. Add isolation directives to enforce multi-tenant database partitions."
      />
    </div>
  );
}
