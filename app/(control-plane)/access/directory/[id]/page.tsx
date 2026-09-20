"use client";
/**
 * Users & Access → Operator Detail.
 * Deep inspection of workforce operator account, role assignments, active sessions,
 * and effective permissions.
 */
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit2,
  Lock,
  Mail,
  RefreshCw,
  Shield,
  ShieldAlert,
  Trash2,
  User,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ForbiddenState,
  Spinner,
  usePermission,
} from "@kannan19302/ui";
import { api } from "@/lib/api";
import { useToast } from "@/lib/use-toast";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import { formatDate } from "@/lib/format-date";
import DomainShell from "@/components/domain-shell";
import { CrudDrawer } from "@/components/CrudDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  type StaffPrincipal,
  staffPrincipalFormSchema,
  staffDrawerFields,
} from "@/lib/access-schema";
import styles from "./detail.module.css";

function statusVariant(status: string): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "SUSPENDED":
      return "warning";
    case "DEACTIVATED":
      return "default";
    case "LOCKED":
      return "danger";
    default:
      return "default";
  }
}

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const canAccess = usePermission("pcc.identity-governance.access");
  const canUpdate = usePermission("system.staff.update");
  const canDelete = usePermission("system.staff.delete");
  const canRevoke = usePermission("system.session.revoke");

  const [operator, setOperator] = useState<StaffPrincipal | null>(null);
  const [effectiveAccess, setEffectiveAccess] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "roles" | "sessions" | "permissions">("overview");

  const [isEditing, setIsEditing] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [userRes, accessRes] = await Promise.all([
        api.get<StaffPrincipal>(`/platform/v1/staff-idp/principals/${id}`),
        api.get<any>(`/platform/v1/staff-idp/principals/${id}/effective-access`).catch(() => ({ data: null })),
      ]);
      setOperator(userRes.data);
      setEffectiveAccess(accessRes.data);
    } catch (err: any) {
      toast.error("Failed to load operator", err.message || "Operator details could not be retrieved.");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Real-time updates
  useDomainRealtime("access", fetchDetails);

  const handleUpdate = async (values: Record<string, any>) => {
    if (!operator) return;
    try {
      const resp = await api.patch<StaffPrincipal>(`/platform/v1/staff-idp/principals/${operator.id}`, values);
      setOperator(resp.data);
      setIsEditing(false);
      toast.success("Operator Updated", `Successfully saved changes for ${resp.data.name}.`);
      fetchDetails();
    } catch (err: any) {
      toast.error("Update Failed", err.message || "Failed to update operator.");
    }
  };

  const handleDeactivate = async () => {
    if (!operator) return;
    try {
      await api.del(`/platform/v1/staff-idp/principals/${operator.id}`);
      toast.success("Operator Deactivated", `Account for ${operator.name} has been deactivated.`);
      router.push("/access/directory");
    } catch (err: any) {
      toast.error("Deactivation Failed", err.message || "Failed to deactivate operator.");
    }
  };

  const handleRevokeSessions = async () => {
    if (!operator) return;
    try {
      await api.post("/platform/v1/staff-idp/sessions/revoke-all", { userId: operator.id });
      toast.success("Sessions Revoked", `All active sessions for ${operator.name} terminated.`);
      setIsRevokingSessions(false);
      fetchDetails();
    } catch (err: any) {
      toast.error("Revocation Failed", err.message || "Failed to revoke sessions.");
    }
  };

  if (!canAccess) {
    return (
      <DomainShell domainId="access" title="Operator Profile">
        <ForbiddenState
          title="Access Restricted"
          description="You do not have permission (pcc.identity-governance.access) to view operator profiles."
        />
      </DomainShell>
    );
  }

  if (loading && !operator) {
    return (
      <DomainShell domainId="access" title="Operator Profile">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  if (!operator) {
    return (
      <DomainShell domainId="access" title="Operator Profile">
        <EmptyState
          title="Operator Not Found"
          description={`No operator record found with ID "${id}".`}
        />
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="access" title={operator.name} description="Workforce profile, role privileges, and active sessions.">
      <div className={styles.container}>
        <div>
          <Link href="/access/directory" className={styles.backLink}>
            <ArrowLeft size={14} />
            <span>Back to Staff Directory</span>
          </Link>
        </div>

        {/* Header Summary Card */}
        <Card padding="lg">
          <div className={styles.headerCard}>
            <div className={styles.titleArea}>
              <div className={styles.titleRow}>
                <h2 className={styles.title}>{operator.name}</h2>
                <Badge variant={statusVariant(operator.status)}>{operator.status}</Badge>
                {operator.mfaEnabled && <Badge variant="success">MFA Enforced</Badge>}
              </div>
              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <Mail size={13} />
                  <span>{operator.email}</span>
                </div>
                <div className={styles.metaItem}>
                  <User size={13} />
                  <span>ID: {operator.id}</span>
                </div>
                <div className={styles.metaItem}>
                  <span>Created: {formatDate(operator.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" size="sm" onClick={fetchDetails}>
                <RefreshCw size={13} />
                Refresh
              </Button>

              {canRevoke && (
                <Button variant="outline" size="sm" onClick={() => setIsRevokingSessions(true)}>
                  <Lock size={13} />
                  Revoke Sessions
                </Button>
              )}

              {canUpdate && (
                <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 size={13} />
                  Edit Profile
                </Button>
              )}

              {canDelete && operator.status !== "DEACTIVATED" && (
                <Button variant="danger" size="sm" onClick={() => setIsDeactivating(true)}>
                  <Trash2 size={13} />
                  Deactivate
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Tab Navigation */}
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tabBtn} ${activeTab === "overview" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "roles" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("roles")}
          >
            Assigned Roles ({operator.roles?.length ?? 0})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "sessions" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("sessions")}
          >
            Active Sessions
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "permissions" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("permissions")}
          >
            Effective Permissions ({effectiveAccess?.effectivePermissions?.length ?? 0})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className={styles.grid}>
            <Card padding="md">
              <h3 style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-base)", fontWeight: 600 }}>
                Account Information
              </h3>
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{operator.email}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>First Name</span>
                  <span className={styles.infoValue}>{operator.firstName || "—"}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Last Name</span>
                  <span className={styles.infoValue}>{operator.lastName || "—"}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Status</span>
                  <Badge variant={statusVariant(operator.status)}>{operator.status}</Badge>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Multi-Factor Authentication</span>
                  <span className={styles.infoValue}>{operator.mfaEnabled ? "Enabled" : "Disabled"}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Last Login</span>
                  <span className={styles.infoValue}>
                    {operator.lastLoginAt ? formatDate(operator.lastLoginAt) : "Never"}
                  </span>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <h3 style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-base)", fontWeight: 600 }}>
                Privilege Overview
              </h3>
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Direct Roles Assigned</span>
                  <span className={styles.infoValue}>{operator.roles?.length ?? 0}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Effective Permissions</span>
                  <span className={styles.infoValue}>{effectiveAccess?.effectivePermissions?.length ?? 0}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Active Web Sessions</span>
                  <span className={styles.infoValue}>{operator.activeSessionCount ?? 0}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "roles" && (
          <Card padding="md">
            <h3 style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-base)", fontWeight: 600 }}>
              Assigned Provider Roles
            </h3>
            {operator.roles && operator.roles.length > 0 ? (
              <div className={styles.roleList}>
                {operator.roles.map((role) => (
                  <div key={role.id} className={styles.roleCard}>
                    <div>
                      <div className={styles.roleName}>{role.name}</div>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                        ID: {role.id}
                      </span>
                    </div>
                    <Link href={`/access/roles/${role.id}`} style={{ textDecoration: "none" }}>
                      <Button variant="outline" size="sm">
                        View Role Matrix
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No roles assigned" description="This operator does not currently hold any roles." />
            )}
          </Card>
        )}

        {activeTab === "sessions" && (
          <Card padding="md">
            <h3 style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-base)", fontWeight: 600 }}>
              Active Sessions
            </h3>
            {(operator as any).activeSessions && (operator as any).activeSessions.length > 0 ? (
              <div className={styles.roleList}>
                {(operator as any).activeSessions.map((sess: any) => (
                  <div key={sess.id} className={styles.sessionItem}>
                    <div className={styles.sessionInfo}>
                      <span className={styles.sessionDevice}>
                        {sess.browser || "Browser"} on {sess.platform || sess.device || "Device"}
                      </span>
                      <span className={styles.sessionIp}>
                        IP: {sess.ipAddress || "Unknown"} · Started: {formatDate(sess.startedAt || new Date().toISOString())}
                      </span>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No active sessions" description="The operator is not currently signed into any active sessions." />
            )}
          </Card>
        )}

        {activeTab === "permissions" && (
          <Card padding="md">
            <h3 style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-base)", fontWeight: 600 }}>
              Effective Permissions Matrix
            </h3>
            {effectiveAccess?.effectivePermissions && effectiveAccess.effectivePermissions.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                {effectiveAccess.effectivePermissions.map((perm: string) => (
                  <Badge key={perm} variant="info">
                    {perm}
                  </Badge>
                ))}
              </div>
            ) : (
              <EmptyState title="No effective permissions" description="This operator has zero granted permissions." />
            )}
          </Card>
        )}

        {/* Edit Operator Drawer */}
        {isEditing && (
          <CrudDrawer
            open={isEditing}
            title={`Edit Operator: ${operator.name}`}
            mode="edit"
            schema={staffPrincipalFormSchema}
            fields={staffDrawerFields}
            initialValues={{
              email: operator.email,
              firstName: operator.firstName || "",
              lastName: operator.lastName || "",
              status: operator.status,
              mfaEnabled: operator.mfaEnabled,
            }}
            onSubmit={handleUpdate}
            onClose={() => setIsEditing(false)}
          />
        )}

        {/* Deactivate Confirm Dialog */}
        <ConfirmDialog
          open={isDeactivating}
          title="Deactivate Staff Operator"
          message={`Are you sure you want to deactivate "${operator.name}"? Active operator sessions will terminate immediately.`}
          variant="danger"
          confirmLabel="Deactivate Operator"
          onConfirm={handleDeactivate}
          onCancel={() => setIsDeactivating(false)}
        />

        {/* Revoke Sessions Confirm Dialog */}
        <ConfirmDialog
          open={isRevokingSessions}
          title="Revoke All Operator Sessions"
          message={`Are you sure you want to revoke all active sessions for "${operator.name}"? The operator will need to sign in again.`}
          variant="warning"
          confirmLabel="Revoke Sessions"
          onConfirm={handleRevokeSessions}
          onCancel={() => setIsRevokingSessions(false)}
        />
      </div>
    </DomainShell>
  );
}
