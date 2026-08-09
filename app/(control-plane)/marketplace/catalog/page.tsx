"use client";
/**
 * Marketplace → Catalog.
 *
 * The live extensions catalog from the verified platform marketplace endpoint:
 * every distinct extension listing with its current status.
 */
import { Card, EmptyState, Spinner, Badge, usePermission } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface ExtensionRow {
  id?: string;
  appSlug?: string;
  appId?: string;
  status?: string;
}

const STATUS_VARIANT = (s?: string) =>
  s === "ACTIVE" || s === "PUBLISHED" || s === "APPROVED"
    ? "success"
    : s === "PENDING_REVIEW" || s === "PENDING" || s === "IN_REVIEW"
      ? "warning"
      : s === "REJECTED" || s === "FAILED" || s === "DISABLED"
        ? "danger"
        : "default";

export default function MarketplaceCatalogPage() {
  const canRead = usePermission("admin.platform.read");
  const extensions = useList<ExtensionRow>({
    path: "/platform/v1/marketplace/extensions",
    disabled: !canRead,
  });

  if (extensions.loading) {
    return (
      <DomainShell
        domainId="marketplace"
        title="Catalog"
        description="Extensions available in the marketplace."
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
      title="Catalog"
      description="Extensions available in the marketplace."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <Card padding="md">
          {extensions.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
              {extensions.error.message}
            </p>
          ) : extensions.data.length === 0 ? (
            <EmptyState
              title="No extensions in the catalog"
              description="The marketplace catalog endpoint returned no records."
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
              {extensions.data.map((e) => (
                <li
                  key={e.appSlug ?? e.appId ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-3) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                    <span style={{ fontWeight: 600 }}>{e.appSlug ?? e.appId ?? "—"}</span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      id: {e.appId ?? "—"}
                    </span>
                  </div>
                  <Badge variant={STATUS_VARIANT(e.status)}>{e.status ?? "UNKNOWN"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}