"use client";
/**
 * Marketplace → Applications.
 *
 * Published applications managed in the marketplace, read from the verified
 * admin marketplace endpoint (`/admin/marketplace/apps`).
 */
import { Star } from "lucide-react";
import { Card, EmptyState, Spinner, Badge, usePermission } from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface MarketplaceApplication {
  id?: string;
  slug?: string;
  name?: string;
  category?: string;
  version?: string;
  pricing?: string;
  installs?: number;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  featured?: boolean;
  status?: string;
  icon?: string | null;
  description?: string | null;
}

interface AdminMarketplaceResponse {
  apps?: MarketplaceApplication[];
  total?: number;
}

export default function MarketplaceApplicationsPage() {
  const canRead = usePermission("admin.platform.read");
  const { data, loading, error } = useItem<AdminMarketplaceResponse>(
    canRead ? "/admin/marketplace/apps" : null,
  );

  const apps = data?.apps ?? [];

  if (loading) {
    return (
      <DomainShell
        domainId="marketplace"
        title="Applications"
        description="Published applications and their marketplace metadata."
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
      title="Applications"
      description="Published applications and their marketplace metadata."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <Card padding="md">
          {error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
              {error.message}
            </p>
          ) : apps.length === 0 ? (
            <EmptyState
              title="No applications"
              description="The admin marketplace endpoint returned no apps."
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
                      {app.verified && <Badge variant="success">Verified</Badge>}
                      {app.featured && <Badge variant="primary">Featured</Badge>}
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
                      {app.category ?? "—"} · v{app.version ?? "—"} · {app.pricing ?? "FREE"} ·{" "}
                      {Number(app.installs) || 0} installs
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
                      {app.rating != null ? app.rating : "—"} ({app.reviewCount ?? 0})
                    </span>
                    <Badge variant={app.status === "PUBLISHED" ? "success" : "default"}>
                      {app.status ?? "UNKNOWN"}
                    </Badge>
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