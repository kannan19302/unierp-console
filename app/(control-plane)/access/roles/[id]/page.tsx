"use client";
/**
 * Users & Access → Role Detail & Permission Matrix.
 * Interactive Permission Matrix for granular RBAC definition across all 22 PCC domains.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckSquare,
  Edit2,
  Lock,
  RefreshCw,
  Save,
  Shield,
  Square,
  Trash2,
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
import DomainShell from "@/components/domain-shell";
import { CrudDrawer } from "@/components/CrudDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  type ProviderRole,
  PERMISSION_CATALOG,
  roleFormSchema,
  roleDrawerFields,
} from "@/lib/access-schema";
import styles from "./matrix.module.css";

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const canAccess = usePermission("pcc.identity-governance.access");
  const canManageRoles = usePermission("system.role.manage");

  const [role, setRole] = useState<ProviderRole | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRole = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get<ProviderRole>(`/platform/v1/staff-idp/roles/${id}`);
      setRole(res.data);
      setSelectedPermissions(new Set(res.data.permissions || []));
    } catch (err: any) {
      toast.error("Failed to load role", err.message || "Could not retrieve role details.");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  // Real-time updates
  useDomainRealtime("access", fetchRole);

  const isDirty = useMemo(() => {
    if (!role) return false;
    const original = new Set(role.permissions || []);
    if (original.size !== selectedPermissions.size) return true;
    for (const p of selectedPermissions) {
      if (!original.has(p)) return true;
    }
    return false;
  }, [role, selectedPermissions]);

  const togglePermission = (key: string) => {
    if (role?.isSystem) return;
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllInDomain = (domainKey: string) => {
    if (role?.isSystem) return;
    const group = PERMISSION_CATALOG.find((g) => g.domain === domainKey);
    if (!group) return;
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      group.permissions.forEach((p) => next.add(p.key));
      return next;
    });
  };

  const clearAllInDomain = (domainKey: string) => {
    if (role?.isSystem) return;
    const group = PERMISSION_CATALOG.find((g) => g.domain === domainKey);
    if (!group) return;
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      group.permissions.forEach((p) => next.delete(p.key));
      return next;
    });
  };

  const handleSavePermissions = async () => {
    if (!role) return;
    try {
      setSaving(true);
      const permissionsArray = Array.from(selectedPermissions);
      await api.patch(`/platform/v1/staff-idp/roles/${role.id}`, {
        permissions: permissionsArray,
      });
      setRole({ ...role, permissions: permissionsArray });
      toast.success("Role Saved", `Updated permissions for "${role.name}".`);
    } catch (err: any) {
      toast.error("Save Failed", err.message || "Failed to update role permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (values: Record<string, any>) => {
    if (!role) return;
    try {
      const resp = await api.patch<ProviderRole>(`/platform/v1/staff-idp/roles/${role.id}`, values);
      setRole(resp.data);
      setIsEditing(false);
      toast.success("Role Updated", `Role details for "${resp.data.name}" saved.`);
    } catch (err: any) {
      toast.error("Update Failed", err.message || "Failed to update role.");
    }
  };

  const handleDeleteRole = async () => {
    if (!role) return;
    try {
      await api.del(`/platform/v1/staff-idp/roles/${role.id}`);
      toast.success("Role Deleted", `Role "${role.name}" was successfully removed.`);
      router.push("/access/roles");
    } catch (err: any) {
      toast.error("Delete Failed", err.message || "Failed to delete role.");
    }
  };

  if (!canAccess) {
    return (
      <DomainShell domainId="access" title="Role Permission Matrix">
        <ForbiddenState
          title="Access Restricted"
          description="You do not have permission (pcc.identity-governance.access) to inspect role permissions."
        />
      </DomainShell>
    );
  }

  if (loading && !role) {
    return (
      <DomainShell domainId="access" title="Role Permission Matrix">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  if (!role) {
    return (
      <DomainShell domainId="access" title="Role Permission Matrix">
        <EmptyState
          title="Role Not Found"
          description={`No role record found with ID "${id}".`}
        />
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="access" title={`Role: ${role.name}`} description="Permission matrix and capability bounds.">
      <div className={styles.container}>
        <div>
          <Link href="/access/roles" className={styles.backLink}>
            <ArrowLeft size={14} />
            <span>Back to Roles Registry</span>
          </Link>
        </div>

        {/* Role Header Card */}
        <Card padding="lg">
          <div className={styles.headerCard}>
            <div className={styles.titleArea}>
              <div className={styles.titleRow}>
                <h2 className={styles.title}>{role.name}</h2>
                <Badge variant={role.isSystem ? "primary" : "default"}>
                  {role.isSystem ? "Built-in System Role" : "Custom Role"}
                </Badge>
                <Badge variant="info">{selectedPermissions.size} permission(s) granted</Badge>
                <Badge variant="default">{role.principalCount ?? 0} operator(s) assigned</Badge>
              </div>
              <p className={styles.description}>
                {role.description || "No description provided for this role."}
              </p>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" size="sm" onClick={fetchRole}>
                <RefreshCw size={13} />
                Refresh
              </Button>

              {canManageRoles && !role.isSystem && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 size={13} />
                  Edit Role
                </Button>
              )}

              {canManageRoles && !role.isSystem && (
                <Button variant="danger" size="sm" onClick={() => setIsDeleting(true)}>
                  <Trash2 size={13} />
                  Delete Role
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Interactive Permission Matrix */}
        <div className={styles.matrixContainer}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Permission Coverage Matrix
            </h3>
            {role.isSystem && (
              <Badge variant="warning">
                System role privileges are immutable and managed by platform policy.
              </Badge>
            )}
          </div>

          {PERMISSION_CATALOG.map((group) => {
            const allSelected = group.permissions.every((p) => selectedPermissions.has(p.key));
            const someSelected =
              group.permissions.some((p) => selectedPermissions.has(p.key)) && !allSelected;

            return (
              <div key={group.domain} className={styles.domainCard}>
                <div className={styles.domainHeader}>
                  <span className={styles.domainTitle}>{group.domainName}</span>
                  {!role.isSystem && canManageRoles && (
                    <div className={styles.domainActions}>
                      <button
                        type="button"
                        className={styles.textBtn}
                        onClick={() => selectAllInDomain(group.domain)}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className={styles.textBtn}
                        onClick={() => clearAllInDomain(group.domain)}
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.permissionsList}>
                  {group.permissions.map((perm) => {
                    const isChecked = selectedPermissions.has(perm.key);
                    return (
                      <div
                        key={perm.key}
                        className={styles.permissionItem}
                        onClick={() => togglePermission(perm.key)}
                      >
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={isChecked}
                          disabled={role.isSystem || !canManageRoles}
                          onChange={() => {}} // Handled by container onClick
                        />
                        <div className={styles.permissionText}>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                            <span className={styles.permissionLabel}>{perm.label}</span>
                            <span className={styles.permissionKey}>({perm.key})</span>
                          </div>
                          <span className={styles.permissionDesc}>{perm.description}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Assigned Users Section */}
        {role.users && role.users.length > 0 && (
          <Card padding="md">
            <h3 style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-base)", fontWeight: 600 }}>
              Assigned Operators ({role.users.length})
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(18rem, 1fr))", gap: "var(--space-2)" }}>
              {role.users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-2) var(--space-3)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-surface)",
                  }}
                >
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>{u.name}</span>
                  <Link href={`/access/directory/${u.id}`} style={{ textDecoration: "none" }}>
                    <Button variant="ghost" size="sm">
                      Inspect
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Sticky Save Bar if Changes Exist */}
        {isDirty && !role.isSystem && canManageRoles && (
          <div className={styles.stickyFooter}>
            <div>
              <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                Unsaved Permission Changes
              </span>
              <span style={{ marginLeft: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                You have modified permission grants for this role.
              </span>
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button variant="outline" size="sm" onClick={() => setSelectedPermissions(new Set(role.permissions || []))}>
                Discard
              </Button>
              <Button variant="primary" size="sm" onClick={handleSavePermissions} disabled={saving}>
                <Save size={14} />
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {/* Edit Role Drawer */}
        {isEditing && (
          <CrudDrawer
            open={isEditing}
            title={`Edit Role: ${role.name}`}
            mode="edit"
            schema={roleFormSchema}
            fields={roleDrawerFields}
            initialValues={{
              name: role.name,
              description: role.description || "",
            }}
            onSubmit={handleUpdateRole}
            onClose={() => setIsEditing(false)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={isDeleting}
          title="Delete Role"
          message={`Are you sure you want to permanently delete the role "${role.name}"? This action cannot be undone.`}
          variant="danger"
          confirmLabel="Delete Role"
          onConfirm={handleDeleteRole}
          onCancel={() => setIsDeleting(false)}
        />
      </div>
    </DomainShell>
  );
}
