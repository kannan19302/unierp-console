"use client";
/**
 * Users & Access → Sessions.
 * Session posture is read from the verified team-overview and security
 * configuration endpoints, and recent authentication events come from the
 * security audit trail. Real data only.
 */
import { Activity, Clock, Globe, Lock } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { useItem, useList } from "@/lib/data";

interface TeamOverview {
  totalMembers?: number;
  totalUsers?: number;
  members?: number;
  activeUsers?: number;
  usersActive?: number;
  online?: number;
  sessionsActive?: number;
  activeSessions?: number;
  pendingInvites?: number;
  byRole?: Record<string, unknown>;
}

interface SecurityConfig {
  session?: Record<string, unknown>;
  sessionTimeoutMinutes?: number;
  maxSessionsPerUser?: number;
  idleTimeoutMinutes?: number;
  lockout?: Record<string, unknown>;
}

interface AuditRow {
  id?: string;
  action?: string;
  event?: string;
  actor?: string;
  severity?: string;
  createdAt?: string;
  timestamp?: string;
}

const LOGIN_ACTIONS = ["LOGIN", "LOGIN_SUCCESS", "SIGN_IN", "AUTH", "SESSION", "MFA", "LOGOUT", "SESSION_EXPIRED", "2FA"];

export default function AccessSessions() {
  const team = useItem<TeamOverview>("/admin/users/team-overview");
  const security = useItem<SecurityConfig>("/saas/security");
  const audit = useList<AuditRow>({ path: "/audit/security" });

  const authEvents = audit.data.filter((a) => LOGIN_ACTIONS.some((k) => String(a.action ?? a.event ?? "").toUpperCase().includes(k)));

  const t = team.data ?? {};
  const total = t.totalMembers ?? t.totalUsers ?? t.members ?? 0;
  const active = t.activeUsers ?? t.usersActive ?? t.online ?? 0;
  const sessions = t.sessionsActive ?? t.activeSessions ?? active;

  const stats: StatCardItem[] = [
    { label: "Team members", value: total, icon: <Globe size={18} /> },
    { label: "Active users", value: active, icon: <Activity size={18} /> },
    { label: "Active sessions", value: sessions, icon: <Clock size={18} /> },
    { label: "Session timeout (min)", value: security.data?.sessionTimeoutMinutes ?? "—", icon: <Lock size={18} /> },
  ];

  if (team.loading || security.loading || audit.loading) {
    return (
      <DomainShell domainId="access" title="Sessions" description="Active sessions, session policy and authentication events.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="access" title="Sessions" description="Active sessions, session policy and authentication events.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Session policy</h3>
            {security.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{security.error.message}</p>
            ) : !security.data ? (
              <EmptyState title="No session policy" description="The security configuration endpoint returned no data." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", marginTop: "var(--space-3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Session timeout (min)</span>
                  <span style={{ fontWeight: 500 }}>{security.data.sessionTimeoutMinutes ?? "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Idle timeout (min)</span>
                  <span style={{ fontWeight: 500 }}>{security.data.idleTimeoutMinutes ?? "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Max sessions per user</span>
                  <span style={{ fontWeight: 500 }}>{security.data.maxSessionsPerUser ?? "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Session hardening</span>
                  <span style={{ fontWeight: 500 }}>{security.data.session ? "Configured" : "—"}</span>
                </div>
              </div>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Team overview</h3>
            {team.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{team.error.message}</p>
            ) : !team.data ? (
              <EmptyState title="No team data" description="The team-overview endpoint returned no data." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", marginTop: "var(--space-3)" }}>
                {team.data.byRole ? (
                  <div style={{ marginBottom: "var(--space-3)" }}>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-2)" }}>Members by role</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                      {Object.entries(team.data.byRole).map(([role, count]) => (
                        <Badge key={role} variant="info">
                          {role}: {count as number}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Active sessions</span>
                  <span style={{ fontWeight: 500 }}>{t.sessionsActive ?? t.activeSessions ?? "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Pending invites</span>
                  <span style={{ fontWeight: 500 }}>{t.pendingInvites ?? 0}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Recent authentication events</h3>
          {audit.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{audit.error.message}</p>
          ) : authEvents.length === 0 ? (
            <EmptyState title="No authentication events" description="The audit trail returned no session-related events." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {authEvents.slice(0, 20).map((a) => (
                <li
                  key={a.id ?? `${a.actor}-${a.createdAt ?? a.timestamp}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{a.action ?? a.event ?? "authentication event"}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {a.actor ?? "System"}
                    </span>
                    <Badge variant={a.severity === "CRITICAL" ? "danger" : a.severity === "HIGH" ? "warning" : "info"}>
                      {a.severity ?? "INFO"}
                    </Badge>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {a.createdAt ?? a.timestamp ?? ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}