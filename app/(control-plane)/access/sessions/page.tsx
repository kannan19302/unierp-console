"use client";
/**
 * Users & Access → Sessions.
 * Live workforce operator sessions, posture inspection, and instantaneous revocation.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Clock,
  Globe,
  Lock,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ForbiddenState,
  StatCardRow,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { api } from "@/lib/api";
import { useToast } from "@/lib/use-toast";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import { formatDate } from "@/lib/format-date";
import { exportToCsv } from "@/lib/export-csv";
import DomainShell from "@/components/domain-shell";
import { PaginatedTable, type ColumnDef } from "@/components/PaginatedTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { type StaffSession } from "@/lib/access-schema";
import styles from "./sessions.module.css";

export default function AccessSessionsPage() {
  const toast = useToast();
  const canAccess = usePermission("pcc.identity-governance.access");
  const canRevoke = usePermission("system.session.revoke");

  const [sessions, setSessions] = useState<StaffSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingSession, setRevokingSession] = useState<StaffSession | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await api.get<StaffSession[]>("/platform/v1/staff-idp/sessions");
      const list = Array.isArray(resp.data) ? resp.data : [];
      setSessions(list);
    } catch (err: any) {
      toast.error("Failed to load sessions", err.message || "Could not retrieve operator sessions.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Real-time updates
  useDomainRealtime("access", fetchSessions);

  const handleRevokeSession = async () => {
    if (!revokingSession) return;
    try {
      await api.del(`/platform/v1/staff-idp/sessions/${revokingSession.id}`);
      toast.success("Session Revoked", "The operator session has been terminated.");
      setRevokingSession(null);
      fetchSessions();
    } catch (err: any) {
      toast.error("Revocation Failed", err.message || "Failed to terminate session.");
    }
  };

  const handleRevokeAll = async () => {
    try {
      await api.post("/platform/v1/staff-idp/sessions/revoke-all", {});
      toast.success("All Sessions Revoked", "All operator web sessions have been terminated.");
      setIsRevokingAll(false);
      fetchSessions();
    } catch (err: any) {
      toast.error("Revocation Failed", err.message || "Failed to terminate all sessions.");
    }
  };

  const handleExportCsv = useCallback(() => {
    const rowsToExport = sessions.filter((s) =>
      selectedIds.length === 0 ? true : selectedIds.includes(s.id)
    );
    exportToCsv(
      [
        { key: "id", label: "Session ID" },
        { key: "userId", label: "User ID" },
        { key: "browser", label: "Browser" },
        { key: "platform", label: "Platform" },
        { key: "ipAddress", label: "IP Address" },
        { key: "startedAt", label: "Started At" },
        { key: "lastActivityAt", label: "Last Activity" },
      ],
      rowsToExport,
      `sessions-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    toast.info("CSV Exported", `Exported ${rowsToExport.length} session record(s).`);
  }, [sessions, selectedIds, toast]);

  // Statistics
  const activeCount = useMemo(
    () => sessions.filter((s) => s.isActive).length,
    [sessions]
  );
  const uniqueUsersCount = useMemo(
    () => new Set(sessions.map((s) => s.userId)).size,
    [sessions]
  );

  const stats: StatCardItem[] = useMemo(
    () => [
      {
        label: "Active Sessions",
        value: activeCount,
        icon: <Clock size={16} />,
      },
      {
        label: "Connected Operators",
        value: uniqueUsersCount,
        icon: <Users size={16} />,
      },
      {
        label: "Total Sessions",
        value: sessions.length,
        icon: <Globe size={16} />,
      },
      {
        label: "Selected Sessions",
        value: selectedIds.length,
        icon: <Lock size={16} />,
      },
    ],
    [activeCount, uniqueUsersCount, sessions.length, selectedIds.length]
  );

  const columns: ColumnDef<StaffSession>[] = useMemo(
    () => [
      {
        key: "user",
        label: "Operator",
        render: (_val, row) => (
          <div className={styles.userCell}>
            <span className={styles.userName}>
              {row.user?.firstName && row.user?.lastName
                ? `${row.user.firstName} ${row.user.lastName}`
                : row.user?.email || row.userId}
            </span>
            {row.user?.email && <span className={styles.userEmail}>{row.user.email}</span>}
          </div>
        ),
      },
      {
        key: "device",
        label: "Device & Client",
        render: (_val, row) => (
          <div className={styles.deviceCell}>
            <span className={styles.devicePrimary}>{row.browser || "Standard Browser"}</span>
            <span className={styles.deviceSecondary}>
              {row.platform || row.device || "Unknown Platform"}
            </span>
          </div>
        ),
      },
      {
        key: "ipAddress",
        label: "Network Location",
        render: (_val, row) => (
          <div className={styles.deviceCell}>
            <span className={styles.devicePrimary}>{row.ipAddress || "127.0.0.1"}</span>
            {row.location && <span className={styles.deviceSecondary}>{row.location}</span>}
          </div>
        ),
      },
      {
        key: "isActive",
        label: "Status",
        render: (_val, row) => (
          <Badge variant={row.isActive ? "success" : "default"}>
            {row.isActive ? "Active" : "Terminated"}
          </Badge>
        ),
      },
      {
        key: "startedAt",
        label: "Started At",
        render: (_val, row) => (row.startedAt ? formatDate(row.startedAt) : "—"),
      },
      {
        key: "lastActivityAt",
        label: "Last Activity",
        render: (_val, row) => (row.lastActivityAt ? formatDate(row.lastActivityAt) : "—"),
      },
      {
        key: "actions",
        label: "Actions",
        render: (_val, row) => (
          <div className={styles.actionButtons}>
            {canRevoke && row.isActive && (
              <button
                className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                title="Revoke Session"
                onClick={() => setRevokingSession(row)}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ),
      },
    ],
    [canRevoke]
  );

  if (!canAccess) {
    return (
      <DomainShell domainId="access" title="Sessions">
        <ForbiddenState
          title="Access Restricted"
          description="You do not have permission (pcc.identity-governance.access) to inspect active operator sessions."
        />
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="access"
      title="Sessions"
      description="Active operator sessions, client telemetry, and instantaneous session invalidation."
      actions={
        <div className={styles.actionsGroup}>
          <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>

          {canRevoke && sessions.length > 0 && (
            <Button variant="danger" size="sm" onClick={() => setIsRevokingAll(true)}>
              <ShieldAlert size={14} />
              Revoke All Sessions
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.container}>
        {/* Metric Statistics */}
        <StatCardRow stats={stats} columns={4} />

        {/* Paginated Data Grid */}
        <Card padding="none">
          <PaginatedTable<StaffSession>
            columns={columns}
            data={sessions}
            loading={loading}
            selectedKeys={selectedIds}
            onSelectionChange={(keys) => setSelectedIds(keys.map(String))}
            selectable
            exportable
            onExport={handleExportCsv}
            emptyMessage="No active operator sessions found."
          />
        </Card>

        {/* Revoke Session Confirm Dialog */}
        <ConfirmDialog
          open={Boolean(revokingSession)}
          title="Revoke Session"
          message={`Are you sure you want to terminate this active session from IP ${revokingSession?.ipAddress}? The operator will be disconnected immediately.`}
          variant="danger"
          confirmLabel="Revoke Session"
          onConfirm={handleRevokeSession}
          onCancel={() => setRevokingSession(null)}
        />

        {/* Revoke All Sessions Confirm Dialog */}
        <ConfirmDialog
          open={isRevokingAll}
          title="Revoke All Operator Sessions"
          message="Are you sure you want to terminate ALL active workforce sessions across the entire platform? Every signed-in administrator and operator will be logged out immediately."
          variant="danger"
          confirmLabel="Revoke All Sessions"
          onConfirm={handleRevokeAll}
          onCancel={() => setIsRevokingAll(false)}
        />
      </div>
    </DomainShell>
  );
}