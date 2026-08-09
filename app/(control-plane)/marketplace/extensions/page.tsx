"use client";
/**
 * Marketplace → Extensions.
 *
 * Verified storefront listing of published extensions (`/storefront/apps`) —
 * what tenants can install from the store.
 */
import { Star } from "lucide-react";
import { Card, EmptyState, Spinner, Badge, usePermission } from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface StorefrontApp {
  id?: string;
  slug?: string;
  name?: string;
  description?: string;
  icon?: string | null;
  category?: string;
  pricing?: string;
  price?: number;
  tags?: string[];
  vendorName?: string;
  vendorVerified?: boolean;
  installCount?: number;
  avgRating?: number;
  reviewCount?: number;
  bundleCount?: number;
  screenshots?: string[];
}

interface StorefrontResponse {
  apps?: StorefrontApp[];
  pagination?: { page?: number; total?: number; totalPages?: number };
}

export default function MarketplaceExtensionsPage() {
  const canRead = usePermission("marketplace.read");
  const { data, loading, error } = useItem<StorefrontResponse>(
    canRead ? "/storefront/apps" : null,
  );

  const apps = data?.apps ?? [];

  if (loading) {
    return (
      <DomainShell
        domainId="marketplace"
        title="Extensions"
        description="Published extensions visible in the tenant storefront."
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
      title="Extensions"
      description="Published extensions visible in the tenant storefront."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <Card padding="md">
          {error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
              {error.message}
            </p>
          ) : apps.length === 0 ? (
            <EmptyState
              title="No storefront extensions"
              description="The storefront endpoint returned no published extensions."
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
              {apps.map((app) => (
                <li
                  key={app.id ?? app.slug ?? "?"}
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
                      {app.name ?? app.slug ?? "—"}
                      {app.vendorVerified && <Badge variant="success">Verified vendor</Badge>}
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
                      {app.description ?? "—"}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {app.category ?? "—"} · {app.pricing ?? "FREE"} · by{" "}
                      {app.vendorName ?? "—"} · {Number(app.bundleCount) || 0} versions
                    </span>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "var(--space-1)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      <Star size={14} />
                      {app.avgRating != null ? app.avgRating : "—"} ({app.reviewCount ?? 0})
                    </span>
                    <Badge variant="primary">{Number(app.installCount) || 0} installs</Badge>
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