"use client";
/**
 * Marketplace → Publishing.
 *
 * Pending publication pipeline from the verified developer endpoint: bundles
 * currently IN_REVIEW awaiting an approval decision before they can ship.
 */
import { ShieldAlert } from "lucide-react";
import { Card, EmptyState, Spinner, Badge, usePermission } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface PendingBundle {
  id?: string;
  version?: string;
  channel?: string;
  status?: string;
  changelog?: string | null;
  checksum?: string | null;
  sizeBytes?: number | null;
  updatedAt?: string;
  package?: {
    id?: string;
    name?: string;
    slug?: string;
    category?: string;
    vendor?: { name?: string; slug?: string; verified?: boolean };
  };
}

const STATUS_VARIANT = (s?: string) =>
  s === "PUBLISHED" || s === "ACTIVE"
    ? "success"
    : s === "IN_REVIEW"
      ? "warning"
      : s === "REJECTED" || s === "FAILED"
        ? "danger"
        : s === "DRAFT"
          ? "info"
          : "default";

export default function MarketplacePublishingPage() {
  const canRead = usePermission("admin.platform.update");
  const pending = useList<PendingBundle>({
    path: "/developer/review/pending",
    disabled: !canRead,
  });

  if (pending.loading) {
    return (
      <DomainShell
        domainId="marketplace"
        title="Publishing"
        description="Bundles awaiting review before they go live to the storefront."
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="marketplace"
      title="Publishing"
      description="Bundles awaiting review before they go live to the storefront."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-secondary)",
            margin: 0,
          }}
        >
          <ShieldAlert size={16} />
          {pending.data.length} bundle(s) in the review queue.
        </p>

        <Card padding="md">
          {pending.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
              {pending.error.message}
            </p>
          ) : pending.data.length === 0 ? (
            <EmptyState
              title="Publishing queue is clear"
              description="The developer endpoint returned no bundles in review."
            />
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {pending.data.map((b) => (
                <li
                  key={b.id ?? b.version}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    gap: "var(--space-4)",
                    alignItems: "center",
                    padding: "var(--space-3) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", minWidth: 0 }}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        fontWeight: 600,
                      }}
                    >
                      {b.package?.name ?? b.package?.slug ?? "—"}
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>
                        v{b.version ?? "—"}
                      </span>
                      {b.package?.vendor?.verified && <Badge variant="success">Verified</Badge>}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {b.changelog ?? "No changelog"}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {b.package?.category ?? "—"} · by {b.package?.vendor?.name ?? "—"} · updated{" "}
                      {b.updatedAt ?? "—"}
                    </span>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {b.channel ?? "STABLE"}
                    </span>
                    <Badge variant={STATUS_VARIANT(b.status)}>{b.status ?? "UNKNOWN"}</Badge>
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