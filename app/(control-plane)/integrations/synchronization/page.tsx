"use client";
/**
 * Integrations → Synchronization.
 * Synchronizable data planes exposed by the communication deep-expansion
 * endpoints: email inboxes, wiki spaces and chat channels, with their sync
 * state.
 */
import { Inbox, FolderOpen, MessagesSquare } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface EmailInbox {
  id: string;
  name?: string;
  emailAddress?: string;
  provider?: string;
  isActive?: boolean;
  lastSyncAt?: string;
  createdAt?: string;
}

interface WikiSpace {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  isPublic?: boolean;
}

interface ChatChannel {
  id: string;
  name?: string;
  slug?: string;
  channelType?: string;
  memberCount?: number;
  isArchived?: boolean;
}

export default function IntegrationsSynchronization() {
  const inboxes = useList<EmailInbox>({ path: "/communication/deep-expansion/email-inboxes" });
  const spaces = useList<WikiSpace>({ path: "/communication/deep-expansion/wiki/spaces" });
  const channels = useList<ChatChannel>({ path: "/communication/deep-expansion/chat/channels" });

  const stats: StatCardItem[] = [
    { label: "Email inboxes", value: inboxes.total ?? inboxes.data.length, icon: <Inbox size={18} /> },
    { label: "Wiki spaces", value: spaces.data.length, icon: <FolderOpen size={18} /> },
    { label: "Chat channels", value: channels.data.length, icon: <MessagesSquare size={18} /> },
  ];

  if (inboxes.loading || spaces.loading || channels.loading) {
    return (
      <DomainShell
        domainId="integrations"
        title="Integrations"
        description="SaaS integrations, connectors, credentials and gateway activity across the platform."
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="integrations"
      title="Integrations"
      description="SaaS integrations, connectors, credentials and gateway activity across the platform."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Synchronization</h2>
          <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
            Channel and content-plane sources available for integration synchronization.
          </p>
        </div>

        <StatCardRow stats={stats} columns={3} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Email inboxes</h3>
          {inboxes.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{inboxes.error.message}</p>
          ) : inboxes.data.length === 0 ? (
            <EmptyState title="No email inboxes" description="The deep-expansion inbox endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {inboxes.data.slice(0, 20).map((i) => (
                <li
                  key={i.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{i.name ?? i.emailAddress ?? i.id}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {i.emailAddress ?? "—"} · {i.provider ?? "SMTP"}
                      {i.lastSyncAt ? ` · synced ${i.lastSyncAt}` : ""}
                    </div>
                  </div>
                  <Badge variant={i.isActive === false ? "default" : "success"}>
                    {i.isActive === false ? "Inactive" : "Active"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Wiki spaces</h3>
            {spaces.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{spaces.error.message}</p>
            ) : spaces.data.length === 0 ? (
              <EmptyState title="No wiki spaces" description="The deep-expansion wiki endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {spaces.data.map((s) => (
                  <li key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontWeight: 500 }}>{s.name ?? s.slug}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{s.description ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Chat channels</h3>
            {channels.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{channels.error.message}</p>
            ) : channels.data.length === 0 ? (
              <EmptyState title="No chat channels" description="The deep-expansion chat endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {channels.data.map((c) => (
                  <li key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontWeight: 500 }}>{c.name ?? c.slug}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <Badge variant="info">{c.channelType ?? "—"}</Badge>
                      {typeof c.memberCount === "number" ? (
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{c.memberCount} members</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </DomainShell>
  );
}