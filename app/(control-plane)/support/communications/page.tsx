"use client";
/**
 * Support / Communications.
 * Platform announcements read from the admin announcements endpoint.
 */
import { Megaphone, Send, Clock, LifeBuoy } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface AnnouncementRow {
  id: string;
  title?: string;
  message?: string;
  body?: string;
  channel?: string;
  status?: string;
  audience?: string;
  publishedAt?: string;
  createdAt?: string;
  expiresAt?: string;
}

function fmtDate(v?: string): string {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString();
}

function announcementVariant(status?: string): "success" | "warning" | "info" | "default" {
  const st = (status ?? "").toUpperCase();
  if (["ACTIVE", "PUBLISHED", "SENT", "LIVE"].includes(st)) return "success";
  if (["SCHEDULED", "PENDING", "QUEUED"].includes(st)) return "info";
  if (["ARCHIVED", "EXPIRED", "CANCELLED"].includes(st)) return "warning";
  return "default";
}

export default function SupportCommunications() {
  const announcements = useList<AnnouncementRow>({ path: "/admin/announcements" });

  const active = announcements.data.filter((a) =>
    ["ACTIVE", "PUBLISHED", "SENT", "LIVE"].includes((a.status ?? "").toUpperCase()),
  ).length;
  const scheduled = announcements.data.filter((a) =>
    ["SCHEDULED", "PENDING", "QUEUED"].includes((a.status ?? "").toUpperCase()),
  ).length;
  const channels = new Set(announcements.data.map((a) => a.channel).filter((c): c is string => Boolean(c))).size;

  const stats: StatCardItem[] = [
    { label: "Announcements", value: announcements.total ?? announcements.data.length, icon: <Megaphone size={18} />, loading: announcements.loading },
    { label: "Active", value: active, icon: <Send size={18} />, loading: announcements.loading },
    { label: "Scheduled", value: scheduled, icon: <Clock size={18} />, loading: announcements.loading },
    { label: "Channels", value: channels, icon: <LifeBuoy size={18} />, loading: announcements.loading },
  ];

  return (
    <DomainShell
      domainId="support"
      title="Communications"
      description="Platform announcements to tenants and end users."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />
        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Announcements</h3>
          {announcements.loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-10)" }}>
              <Spinner size="md" />
            </div>
          ) : announcements.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{announcements.error.message}</p>
          ) : announcements.data.length === 0 ? (
            <EmptyState title="No announcements" description="The announcements endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {announcements.data.map((a) => (
                <li
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-3) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 600 }}>
                      {a.title ?? a.id}
                    </span>
                    <span
                      style={{
                        display: "block",
                        marginTop: "var(--space-1)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {a.message ?? a.body ?? "—"}
                    </span>
                    <span style={{ display: "block", marginTop: "var(--space-1)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {a.channel ?? "—"}
                      {a.audience ? ` · audience: ${a.audience}` : ""}
                      {a.publishedAt ? ` · published ${fmtDate(a.publishedAt)}` : a.createdAt ? ` · created ${fmtDate(a.createdAt)}` : ""}
                    </span>
                  </span>
                  <Badge variant={announcementVariant(a.status)}>{a.status ?? "UNKNOWN"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}