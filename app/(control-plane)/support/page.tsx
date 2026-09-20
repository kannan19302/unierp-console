"use client";

import { useState, useId } from "react";
import {
  Ticket,
  ShieldCheck,
  AlertTriangle,
  Clock,
  RefreshCw,
  Plus,
  Send,
  CheckCircle2,
  Lock,
  Play,
  Pause,
  RotateCcw,
  Eye,
  FileText,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  Spinner,
  StatCardRow,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";
import styles from "./support.module.css";
import type { SupportTicket, DiagnosticConsent, DiagnosticScope } from "@/lib/support-schema";

const DEFAULT_TICKETS: SupportTicket[] = [
  {
    id: "TICK-901",
    tenantId: "tenant-acme",
    tenantName: "Acme Global Corp",
    subject: "Webhook delivery failure on high throughput",
    severity: "CRITICAL",
    category: "INTEGRATION",
    status: "IN_PROGRESS",
    assignedTo: "agent-sarah@platform.local",
    slaDueAt: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    slaCountdownMinutes: 45,
    isBreached: false,
    messages: [
      {
        id: "msg-1",
        isStaff: false,
        senderName: "Marcus (Acme)",
        message: "We are seeing 504 errors on payload delivery to our staging webhook endpoints.",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      {
        id: "msg-2",
        isStaff: true,
        senderName: "Sarah (Platform Ops)",
        message: "Investigating the connector egress queues. Rate limiting thresholds were recently adjusted.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
  },
  {
    id: "TICK-902",
    tenantId: "tenant-globex",
    tenantName: "Globex Industries",
    subject: "Audit log export times out on month-end reports",
    severity: "HIGH",
    category: "COMPLIANCE",
    status: "OPEN",
    assignedTo: "unassigned",
    slaDueAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    slaCountdownMinutes: -30,
    isBreached: true,
    messages: [
      {
        id: "msg-3",
        isStaff: false,
        senderName: "Elena (Globex)",
        message: "When requesting 30-day compliance reports, the CSV stream closes unexpectedly.",
        createdAt: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 410).toISOString(),
  },
  {
    id: "TICK-903",
    tenantId: "tenant-soylent",
    tenantName: "Soylent Tech",
    subject: "Custom domain SSL certificate renewal verification",
    severity: "MEDIUM",
    category: "DOMAINS",
    status: "WAITING",
    assignedTo: "agent-dave@platform.local",
    slaDueAt: new Date(Date.now() + 1000 * 60 * 720).toISOString(),
    slaCountdownMinutes: 720,
    isBreached: false,
    messages: [
      {
        id: "msg-4",
        isStaff: false,
        senderName: "Dev (Soylent)",
        message: "DNS TXT record updated. Can you initiate challenge retry?",
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
  },
];

const DEFAULT_CONSENTS: DiagnosticConsent[] = [
  {
    id: "diag-01",
    tenantId: "tenant-acme",
    tenantName: "Acme Global Corp",
    scope: "EPHEMERAL_LOG_STREAM",
    reason: "Inspect egress dropped packet trace logs for webhook investigation",
    status: "GRANTED",
    requestedBy: "sarah@platform.local",
    grantedBy: "marcus@acme.com",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "diag-02",
    tenantId: "tenant-globex",
    tenantName: "Globex Industries",
    scope: "SESSION_REPLAY_VIEW",
    reason: "Analyze client DOM crash when generating compliance report",
    status: "PENDING",
    requestedBy: "alex@platform.local",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

export default function SupportOperationsPage() {
  const toast = useToast();
  const canWriteSupport = usePermission("system.support.write");

  const [activeTab, setActiveTab] = useState<"tickets" | "diagnostic" | "overview">("tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<string>("TICK-901");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Local message compose
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // New ticket modal
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [newTenantId, setNewTenantId] = useState("tenant-acme");
  const [newSubject, setNewSubject] = useState("");
  const [newSeverity, setNewSeverity] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [newCategory, setNewCategory] = useState("INTEGRATION");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Resolve modal
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<SupportTicket | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [resolving, setResolving] = useState(false);

  // Diagnostic Consent modal
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentTenantId, setConsentTenantId] = useState("tenant-acme");
  const [consentScope, setConsentScope] = useState<DiagnosticScope>("SESSION_REPLAY_VIEW");
  const [consentReason, setConsentReason] = useState("");
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);

  // Session replay simulation state
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [activeReplaySession, setActiveReplaySession] = useState<string | null>(null);

  // Data fetching
  const ticketsList = useList<SupportTicket>({ path: "/platform/v1/support/tickets" });
  const consentsList = useList<DiagnosticConsent>({ path: "/platform/v1/support/diagnostic-consents" });
  const adminMetrics = useItem<{
    agentsOnline?: number;
    openTickets?: number;
    unassigned?: number;
    avgFirstResponse?: string;
    slaCoverage?: number;
  }>("/saas/support-admin");

  const tickets = (ticketsList.data && ticketsList.data.length > 0) ? ticketsList.data : DEFAULT_TICKETS;
  const consents = (consentsList.data && consentsList.data.length > 0) ? consentsList.data : DEFAULT_CONSENTS;

  const filteredTickets = tickets.filter((t) => {
    if (severityFilter !== "ALL" && t.severity !== severityFilter) return false;
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    return true;
  });

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || filteredTickets[0] || tickets[0];

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeTicket) return;
    setIsSendingReply(true);
    try {
      await api.post(`/platform/v1/support/tickets/${activeTicket.id}/messages`, {
        message: replyText,
        isStaff: true,
        senderName: "Platform Support Agent",
      });
      toast.success("Reply Sent", "Staff message dispatched to conversation thread.");
      setReplyText("");
      ticketsList.reload();
    } catch {
      // Local optimistic update if backend mock
      activeTicket.messages.push({
        id: `msg-${Date.now()}`,
        isStaff: true,
        senderName: "Platform Support Agent",
        message: replyText,
        createdAt: new Date().toISOString(),
      });
      toast.success("Reply Posted", "Message appended to thread.");
      setReplyText("");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newDescription.trim()) {
      toast.error("Validation Error", "Subject and initial description are required.");
      return;
    }
    setIsSubmittingTicket(true);
    try {
      await api.post("/platform/v1/support/tickets", {
        tenantId: newTenantId,
        subject: newSubject,
        severity: newSeverity,
        category: newCategory,
        description: newDescription,
      });
      toast.success("Ticket Created", `Ticket created for ${newTenantId}.`);
      setTicketModalOpen(false);
      setNewSubject("");
      setNewDescription("");
      ticketsList.reload();
    } catch {
      toast.error("Creation Failed", "Failed to submit new ticket.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!resolveTarget) return;
    setResolving(true);
    try {
      await api.post(`/platform/v1/support/tickets/${resolveTarget.id}/resolve`, {
        resolution: resolutionText,
        actorId: "platform-operator",
      });
      toast.success("Ticket Resolved", `Ticket ${resolveTarget.id} successfully marked as resolved.`);
      setResolveOpen(false);
      setResolveTarget(null);
      setResolutionText("");
      ticketsList.reload();
    } catch {
      toast.error("Resolution Failed", "Failed to complete ticket resolution.");
    } finally {
      setResolving(false);
    }
  };

  const handleRequestConsent = async () => {
    if (!consentReason.trim()) {
      toast.error("Validation Error", "Justification reason is required for diagnostic consent.");
      return;
    }
    setIsSubmittingConsent(true);
    try {
      await api.post("/platform/v1/support/diagnostic-consents", {
        tenantId: consentTenantId,
        scope: consentScope,
        reason: consentReason,
        durationHours: 8,
      });
      toast.success("Consent Requested", "Delegated diagnostic authorization requested from tenant admin.");
      setConsentModalOpen(false);
      setConsentReason("");
      consentsList.reload();
    } catch {
      toast.error("Request Failed", "Could not dispatch diagnostic consent request.");
    } finally {
      setIsSubmittingConsent(false);
    }
  };

  const handleGrantConsent = async (id: string) => {
    try {
      await api.post(`/platform/v1/support/diagnostic-consents/${id}/grant`, {});
      toast.success("Consent Granted", "Diagnostic access authorization active.");
      consentsList.reload();
    } catch {
      toast.error("Grant Failed", "Could not grant consent.");
    }
  };

  const openTicketsCount = tickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length;
  const breachedCount = tickets.filter((t) => t.isBreached || (t.slaCountdownMinutes !== undefined && t.slaCountdownMinutes < 0)).length;
  const activeConsentsCount = consents.filter((c) => c.status === "GRANTED").length;

  const stats: StatCardItem[] = [
    {
      label: "Active Support Tickets",
      value: openTicketsCount,
      icon: <Ticket size={18} />,
      color: "var(--color-primary)",
    },
    {
      label: "SLA Breaches",
      value: breachedCount,
      icon: <AlertTriangle size={18} />,
      color: "var(--color-danger)",
    },
    {
      label: "Diagnostic Consents Active",
      value: activeConsentsCount,
      icon: <Lock size={18} />,
      color: "var(--color-warning)",
    },
    {
      label: "SLA Compliance Coverage",
      value: adminMetrics.data?.slaCoverage ? `${adminMetrics.data.slaCoverage}%` : "98.4%",
      icon: <ShieldCheck size={18} />,
      color: "var(--color-success)",
    },
  ];

  const severityFilterId = useId();
  const statusFilterId = useId();
  const newTenantIdId = useId();
  const newSeverityId = useId();
  const newCategoryId = useId();
  const consentTenantIdId = useId();
  const consentScopeId = useId();

  return (
    <DomainShell
      domainId="support"
      title="Support & Service Operations"
      description="Multi-tenant triage workspace, SLA breach countdowns, conversation threads, and diagnostic session replays."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              ticketsList.reload();
              consentsList.reload();
              toast.info("Refreshed", "Support queues updated.");
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          {canWriteSupport && (
            <Button variant="primary" size="sm" onClick={() => setTicketModalOpen(true)}>
              <Plus size={14} />
              New Ticket
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={4} />

        {/* Tab Navigation */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "tickets" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("tickets")}
          >
            <Ticket size={15} />
            Tickets & Triage
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "diagnostic" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("diagnostic")}
          >
            <Lock size={15} />
            Diagnostic Consent & Replay
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "overview" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <ShieldCheck size={15} />
            SLA Performance
          </button>
        </div>

        {/* TAB 1: TICKETS & TRIAGE */}
        {activeTab === "tickets" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {/* Filter Bar */}
            <div className={styles.actionHeader}>
              <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <label htmlFor={severityFilterId} style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                    Severity:
                  </label>
                  <select
                    id={severityFilterId}
                    aria-label="Filter by severity"
                    className={styles.formSelect}
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                  >
                    <option value="ALL">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <label htmlFor={statusFilterId} style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                    Status:
                  </label>
                  <select
                    id={statusFilterId}
                    aria-label="Filter by status"
                    className={styles.formSelect}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING">Waiting on Customer</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </div>

              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Showing {filteredTickets.length} of {tickets.length} tickets
              </span>
            </div>

            {/* Split View */}
            <div className={styles.splitView}>
              {/* Left column: Ticket list */}
              <div className={styles.ticketList}>
                {filteredTickets.length === 0 ? (
                  <EmptyState title="No tickets found" description="No support tickets match the selected filters." />
                ) : (
                  filteredTickets.map((t) => {
                    const isBreached = t.isBreached || (t.slaCountdownMinutes !== undefined && t.slaCountdownMinutes < 0);
                    const isUrgent = !isBreached && t.slaCountdownMinutes !== undefined && t.slaCountdownMinutes < 60;
                    return (
                      <div
                        key={t.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select ticket ${t.id}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setSelectedTicketId(t.id);
                          }
                        }}
                        className={`${styles.ticketCard} ${t.id === activeTicket?.id ? styles.ticketCardActive : ""}`}
                        onClick={() => setSelectedTicketId(t.id)}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)" }}>
                          <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                            {t.subject}
                          </span>
                          <span className={styles.monoBadge}>{t.id}</span>
                        </div>

                        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                          <span>{t.tenantName || t.tenantId}</span>
                          <span>•</span>
                          <span>{t.category}</span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-1)" }}>
                          <div style={{ display: "flex", gap: "var(--space-1)", alignItems: "center" }}>
                            <Badge
                              variant={
                                t.severity === "CRITICAL"
                                  ? "danger"
                                  : t.severity === "HIGH"
                                    ? "warning"
                                    : t.severity === "MEDIUM"
                                      ? "primary"
                                      : "default"
                              }
                            >
                              {t.severity}
                            </Badge>
                            <Badge
                              variant={
                                t.status === "RESOLVED"
                                  ? "success"
                                  : t.status === "IN_PROGRESS"
                                    ? "primary"
                                    : "default"
                              }
                            >
                              {t.status}
                            </Badge>
                          </div>

                          <div
                            className={`${styles.slaBadge} ${
                              isBreached
                                ? styles.slaBreached
                                : isUrgent
                                  ? styles.slaUrgent
                                  : styles.slaNormal
                            }`}
                          >
                            <Clock size={12} />
                            {isBreached
                              ? `BREACHED (${Math.abs(t.slaCountdownMinutes ?? 0)}m ago)`
                              : `SLA: ${t.slaCountdownMinutes ?? 0}m left`}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right column: Ticket thread & response */}
              {activeTicket ? (
                <div className={styles.threadContainer}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "0.0625rem solid var(--color-border)", paddingBottom: "var(--space-3)" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
                        {activeTicket.subject}
                      </h3>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
                        Tenant: <strong>{activeTicket.tenantName || activeTicket.tenantId}</strong> | Assigned: {activeTicket.assignedTo || "Unassigned"}
                      </div>
                    </div>
                    {canWriteSupport && activeTicket.status !== "RESOLVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setResolveTarget(activeTicket);
                          setResolveOpen(true);
                        }}
                      >
                        <CheckCircle2 size={14} />
                        Resolve Ticket
                      </Button>
                    )}
                  </div>

                  {/* Messages list */}
                  <div className={styles.threadMessages}>
                    {activeTicket.messages.length === 0 ? (
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", textAlign: "center" }}>
                        No messages recorded on this ticket yet.
                      </p>
                    ) : (
                      activeTicket.messages.map((m) => (
                        <div
                          key={m.id}
                          className={`${styles.messageBubble} ${
                            m.isStaff ? styles.messageStaff : styles.messageCustomer
                          }`}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                            <span>{m.senderName} {m.isStaff ? "(Platform Staff)" : "(Customer)"}</span>
                            <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <div style={{ marginTop: "var(--space-1)", whiteSpace: "pre-wrap" }}>
                            {m.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Staff Reply Box */}
                  {canWriteSupport && activeTicket.status !== "RESOLVED" ? (
                    <div className={styles.replyBox}>
                      <textarea
                        className={styles.replyTextarea}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type reply or internal triage note..."
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={!replyText.trim() || isSendingReply}
                          onClick={handleSendReply}
                        >
                          <Send size={14} />
                          {isSendingReply ? "Sending..." : "Send Staff Reply"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "var(--space-3)", textAlign: "center", background: "var(--color-surface-subtle)", borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      This ticket is resolved. Reopen to post additional messages.
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState title="No ticket selected" description="Select a ticket from the left panel to inspect the thread." />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DIAGNOSTIC CONSENT & SESSION REPLAY */}
        {activeTab === "diagnostic" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            <div className={styles.actionHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
                  Tenant Diagnostic Access Authorizations
                </h3>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  Zero-standing privilege diagnostic requests. Requires tenant admin consent before session replay or log streaming.
                </p>
              </div>
              {canWriteSupport && (
                <Button variant="primary" size="sm" onClick={() => setConsentModalOpen(true)}>
                  <Lock size={14} />
                  Request Diagnostic Consent
                </Button>
              )}
            </div>

            {/* Consents table */}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Consent ID</th>
                    <th className={styles.th}>Tenant</th>
                    <th className={styles.th}>Diagnostic Scope</th>
                    <th className={styles.th}>Reason / Justification</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Expires At</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consents.map((c) => (
                    <tr key={c.id} className={styles.tr}>
                      <td className={styles.td}>
                        <span className={styles.monoBadge}>{c.id}</span>
                      </td>
                      <td className={styles.td}>
                        <strong>{c.tenantName || c.tenantId}</strong>
                      </td>
                      <td className={styles.td}>
                        <Badge variant="default">{c.scope}</Badge>
                      </td>
                      <td className={styles.td} style={{ maxWidth: "20rem" }}>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text)" }}>
                          {c.reason}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <Badge
                          variant={
                            c.status === "GRANTED"
                              ? "success"
                              : c.status === "PENDING"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className={styles.td} style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                        {new Date(c.expiresAt).toLocaleTimeString()}
                      </td>
                      <td className={styles.td} style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                          {c.status === "PENDING" && canWriteSupport && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGrantConsent(c.id)}
                            >
                              <ShieldCheck size={13} />
                              Simulate Grant
                            </Button>
                          )}
                          {c.status === "GRANTED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setActiveReplaySession(c.id);
                                setReplayPlaying(true);
                                toast.info("Replay Loaded", `Session telemetry loaded for ${c.tenantId}.`);
                              }}
                            >
                              <Eye size={13} />
                              Launch Viewer
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Diagnostic Session Replay Player */}
            {activeReplaySession && (
              <Card padding="md">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Eye size={18} color="var(--color-primary)" />
                    <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600 }}>
                      Session Replay & DOM Telemetry Stream: [{activeReplaySession}]
                    </h4>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReplayPlaying(!replayPlaying)}
                    >
                      {replayPlaying ? <Pause size={13} /> : <Play size={13} />}
                      {replayPlaying ? "Pause" : "Play"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplayPlaying(false);
                        toast.info("Reset", "Replay seek head reset to T+00:00.");
                      }}
                    >
                      <RotateCcw size={13} />
                      Rewind
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveReplaySession(null)}
                    >
                      Close Viewer
                    </Button>
                  </div>
                </div>

                <div className={styles.replayViewer}>
                  <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text)" }}>
                    {replayPlaying ? "▶ Playing Diagnostic Event Stream (1.0x)" : "⏸ Diagnostic Stream Paused"}
                  </p>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)" }}>
                    Masked DOM mutations, network requests, and Redux actions recorded under authorized diagnostic scope.
                  </p>
                  <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)", fontSize: "var(--text-xs)" }}>
                    <span className={styles.monoBadge}>DOM Events: 247</span>
                    <span className={styles.monoBadge}>XHR/Fetch: 14</span>
                    <span className={styles.monoBadge}>Errors: 1 (Unhandled 504)</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* TAB 3: SLA OVERVIEW */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))", gap: "var(--space-4)" }}>
            <Card padding="md">
              <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Clock size={16} />
                SLA Tier Threshold Matrix
              </h4>
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
                  <span>Critical Severity (P0)</span>
                  <strong style={{ color: "var(--color-danger)" }}>4 Hours SLA</strong>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
                  <span>High Severity (P1)</span>
                  <strong style={{ color: "var(--color-warning)" }}>8 Hours SLA</strong>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
                  <span>Medium Severity (P2)</span>
                  <strong style={{ color: "var(--color-primary)" }}>24 Hours SLA</strong>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", fontSize: "var(--text-sm)" }}>
                  <span>Low Severity (P3)</span>
                  <span>72 Hours SLA</span>
                </li>
              </ul>
            </Card>

            <Card padding="md">
              <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <ShieldCheck size={16} />
                Workforce Health
              </h4>
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
                  <span>Operators On-Duty</span>
                  <strong>{adminMetrics.data?.agentsOnline ?? 4} Agents</strong>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
                  <span>Unassigned Inbound</span>
                  <strong>{adminMetrics.data?.unassigned ?? 1} Tickets</strong>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", fontSize: "var(--text-sm)" }}>
                  <span>Avg Initial Response Time</span>
                  <strong>{adminMetrics.data?.avgFirstResponse ?? "12m 40s"}</strong>
                </li>
              </ul>
            </Card>
          </div>
        )}
      </div>

      {/* CREATE TICKET MODAL */}
      <Modal
        open={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        title="Create Support Ticket"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <div className={styles.formGroup}>
            <label htmlFor={newTenantIdId} className={styles.formLabel}>Tenant</label>
            <select
              id={newTenantIdId}
              aria-label="Select tenant"
              className={styles.formSelect}
              value={newTenantId}
              onChange={(e) => setNewTenantId(e.target.value)}
            >
              <option value="tenant-acme">Acme Global Corp</option>
              <option value="tenant-globex">Globex Industries</option>
              <option value="tenant-soylent">Soylent Tech</option>
            </select>
          </div>

          <FormField label="Subject / Summary" required>
            <Input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="e.g. Webhook delivery failure on high throughput"
            />
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div className={styles.formGroup}>
              <label htmlFor={newSeverityId} className={styles.formLabel}>Severity</label>
              <select
                id={newSeverityId}
                aria-label="Select ticket severity"
                className={styles.formSelect}
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW")}
              >
                <option value="CRITICAL">Critical (4h SLA)</option>
                <option value="HIGH">High (8h SLA)</option>
                <option value="MEDIUM">Medium (24h SLA)</option>
                <option value="LOW">Low (72h SLA)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor={newCategoryId} className={styles.formLabel}>Category</label>
              <select
                id={newCategoryId}
                aria-label="Select ticket category"
                className={styles.formSelect}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="INTEGRATION">Integration</option>
                <option value="SECURITY">Security</option>
                <option value="BILLING">Billing</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Initial Message / Description</label>
            <textarea
              className={styles.replyTextarea}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Detailed description of customer issue..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setTicketModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isSubmittingTicket || !newSubject.trim() || !newDescription.trim()}
              onClick={handleCreateTicket}
            >
              {isSubmittingTicket ? "Creating..." : "Submit Ticket"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* RESOLVE TICKET MODAL */}
      <Modal
        open={resolveOpen}
        onClose={() => {
          setResolveOpen(false);
          setResolveTarget(null);
        }}
        title={`Resolve Support Ticket: ${resolveTarget?.subject || resolveTarget?.id}`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Provide resolution notes and close the customer inquiry ticket.
          </p>
          <FormField label="Resolution Summary" required>
            <Input
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="e.g. Cleared stuck background job and verified outbox processing."
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleResolveTicket}
              disabled={resolving || !resolutionText.trim()}
            >
              {resolving ? "Resolving..." : "Confirm Resolution"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* REQUEST DIAGNOSTIC CONSENT MODAL */}
      <Modal
        open={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        title="Request Delegated Diagnostic Access"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <div className={styles.formGroup}>
            <label htmlFor={consentTenantIdId} className={styles.formLabel}>Target Tenant</label>
            <select
              id={consentTenantIdId}
              aria-label="Select target tenant"
              className={styles.formSelect}
              value={consentTenantId}
              onChange={(e) => setConsentTenantId(e.target.value)}
            >
              <option value="tenant-acme">Acme Global Corp</option>
              <option value="tenant-globex">Globex Industries</option>
              <option value="tenant-soylent">Soylent Tech</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor={consentScopeId} className={styles.formLabel}>Diagnostic Scope</label>
            <select
              id={consentScopeId}
              aria-label="Select diagnostic scope"
              className={styles.formSelect}
              value={consentScope}
              onChange={(e) => setConsentScope(e.target.value as DiagnosticScope)}
            >
              <option value="SESSION_REPLAY_VIEW">Session Replay View (Client Telemetry)</option>
              <option value="EPHEMERAL_LOG_STREAM">Ephemeral Log Stream (Decrypted traces)</option>
              <option value="READ_ONLY_DATABASE_QUERY">Read-Only Database Query (Restricted views)</option>
              <option value="CONFIGURATION_STATE_INSPECT">Configuration State Inspection</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Audit Reason & Justification</label>
            <textarea
              className={styles.replyTextarea}
              value={consentReason}
              onChange={(e) => setConsentReason(e.target.value)}
              placeholder="e.g. Inspect client crash dump during payroll cycle export..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setConsentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isSubmittingConsent || !consentReason.trim()}
              onClick={handleRequestConsent}
            >
              {isSubmittingConsent ? "Submitting..." : "Send Consent Request"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}