"use client";

import { useState, useId } from "react";
import {
  Clock,
  Send,
  CheckCircle2,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
} from "@kannan19302/ui";
import styles from "../support.module.css";
import type { SupportTicket } from "@/lib/support-schema";

interface TicketWorkflowProps {
  tickets: SupportTicket[];
  activeTicket: SupportTicket | undefined;
  selectedTicketId: string;
  onSelectTicket: (id: string) => void;
  canWriteSupport: boolean;
  onSendReply: (replyText: string) => Promise<void>;
  onOpenResolve: (ticket: SupportTicket) => void;
}

export function TicketWorkflow({
  tickets,
  activeTicket,
  selectedTicketId,
  onSelectTicket,
  canWriteSupport,
  onSendReply,
  onOpenResolve,
}: TicketWorkflowProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const severityFilterId = useId();
  const statusFilterId = useId();

  const filteredTickets = tickets.filter((t) => {
    if (severityFilter !== "ALL" && t.severity !== severityFilter) return false;
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    return true;
  });

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsSendingReply(true);
    try {
      await onSendReply(replyText);
      setReplyText("");
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
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
                      onSelectTicket(t.id);
                    }
                  }}
                  className={`${styles.ticketCard} ${t.id === selectedTicketId ? styles.ticketCardActive : ""}`}
                  onClick={() => onSelectTicket(t.id)}
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
                  onClick={() => onOpenResolve(activeTicket)}
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
                    onClick={handleReply}
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
  );
}
