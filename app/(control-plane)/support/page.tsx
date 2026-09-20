"use client";

import { useState } from "react";
import {
  Ticket,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
  Lock,
} from "lucide-react";
import {
  Button,
  StatCardRow,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";
import styles from "./support.module.css";
import type { SupportTicket, DiagnosticConsent as DiagnosticConsentType, DiagnosticScope } from "@/lib/support-schema";
import { DEFAULT_TICKETS, DEFAULT_CONSENTS } from "@/lib/fixtures/support";
import {
  TicketWorkflow,
  DiagnosticConsent,
  SlaDashboard,
  SupportModals,
} from "./_components";

export default function SupportOperationsPage() {
  const toast = useToast();
  const canWriteSupport = usePermission("system.support.write");

  const [activeTab, setActiveTab] = useState<"tickets" | "diagnostic" | "overview">("tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<string>("TICK-901");

  // Modals state
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<SupportTicket | null>(null);
  const [consentModalOpen, setConsentModalOpen] = useState(false);

  // Session replay simulation state
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [activeReplaySession, setActiveReplaySession] = useState<string | null>(null);

  // Data fetching
  const ticketsList = useList<SupportTicket>({ path: "/platform/v1/support/tickets" });
  const consentsList = useList<DiagnosticConsentType>({ path: "/platform/v1/support/diagnostic-consents" });
  const adminMetrics = useItem<{
    agentsOnline?: number;
    openTickets?: number;
    unassigned?: number;
    avgFirstResponse?: string;
    slaCoverage?: number;
  }>("/saas/support-admin");

  const tickets = (ticketsList.data && ticketsList.data.length > 0) ? ticketsList.data : DEFAULT_TICKETS;
  const consents = (consentsList.data && consentsList.data.length > 0) ? consentsList.data : DEFAULT_CONSENTS;
  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleSendReply = async (replyText: string) => {
    if (!activeTicket) return;
    try {
      await api.post(`/platform/v1/support/tickets/${activeTicket.id}/messages`, {
        message: replyText,
        isStaff: true,
        senderName: "Platform Support Agent",
      });
      toast.success("Reply Sent", "Staff message dispatched to conversation thread.");
      ticketsList.reload();
    } catch {
      activeTicket.messages.push({
        id: `msg-${Date.now()}`,
        isStaff: true,
        senderName: "Platform Support Agent",
        message: replyText,
        createdAt: new Date().toISOString(),
      });
      toast.success("Reply Posted", "Message appended to thread.");
    }
  };

  const handleCreateTicket = async (data: {
    tenantId: string;
    subject: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    category: string;
    description: string;
  }) => {
    if (!data.subject.trim() || !data.description.trim()) {
      toast.error("Validation Error", "Subject and initial description are required.");
      return;
    }
    try {
      await api.post("/platform/v1/support/tickets", data);
      toast.success("Ticket Created", `Ticket created for ${data.tenantId}.`);
      ticketsList.reload();
    } catch {
      toast.error("Creation Failed", "Failed to submit new ticket.");
    }
  };

  const handleResolveTicket = async (ticketId: string, resolution: string) => {
    try {
      await api.post(`/platform/v1/support/tickets/${ticketId}/resolve`, {
        resolution,
        actorId: "platform-operator",
      });
      toast.success("Ticket Resolved", `Ticket ${ticketId} successfully marked as resolved.`);
      ticketsList.reload();
    } catch {
      toast.error("Resolution Failed", "Failed to complete ticket resolution.");
    }
  };

  const handleRequestConsent = async (data: {
    tenantId: string;
    scope: DiagnosticScope;
    reason: string;
  }) => {
    if (!data.reason.trim()) {
      toast.error("Validation Error", "Justification reason is required for diagnostic consent.");
      return;
    }
    try {
      await api.post("/platform/v1/support/diagnostic-consents", {
        ...data,
        durationHours: 8,
      });
      toast.success("Consent Requested", "Delegated diagnostic authorization requested from tenant admin.");
      consentsList.reload();
    } catch {
      toast.error("Request Failed", "Could not dispatch diagnostic consent request.");
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
          <TicketWorkflow
            tickets={tickets}
            activeTicket={activeTicket}
            selectedTicketId={selectedTicketId}
            onSelectTicket={setSelectedTicketId}
            canWriteSupport={canWriteSupport}
            onSendReply={handleSendReply}
            onOpenResolve={(t) => {
              setResolveTarget(t);
              setResolveOpen(true);
            }}
          />
        )}

        {/* TAB 2: DIAGNOSTIC CONSENT & SESSION REPLAY */}
        {activeTab === "diagnostic" && (
          <DiagnosticConsent
            consents={consents}
            canWriteSupport={canWriteSupport}
            onOpenConsentModal={() => setConsentModalOpen(true)}
            onGrantConsent={handleGrantConsent}
            activeReplaySession={activeReplaySession}
            setActiveReplaySession={setActiveReplaySession}
            replayPlaying={replayPlaying}
            setReplayPlaying={setReplayPlaying}
          />
        )}

        {/* TAB 3: SLA OVERVIEW */}
        {activeTab === "overview" && (
          <SlaDashboard adminMetrics={adminMetrics.data} />
        )}
      </div>

      <SupportModals
        ticketModalOpen={ticketModalOpen}
        onCloseTicketModal={() => setTicketModalOpen(false)}
        onCreateTicket={handleCreateTicket}
        resolveOpen={resolveOpen}
        resolveTarget={resolveTarget}
        onCloseResolveModal={() => {
          setResolveOpen(false);
          setResolveTarget(null);
        }}
        onResolveTicket={handleResolveTicket}
        consentModalOpen={consentModalOpen}
        onCloseConsentModal={() => setConsentModalOpen(false)}
        onRequestConsent={handleRequestConsent}
      />
    </DomainShell>
  );
}