"use client";
/**
 * Marketplace → Versions.
 *
 * Versioned bundles per developer package, read from the verified developer
 * endpoint (`/developer/apps`).
 */
import { Package, FileArchive } from "lucide-react";
import { Card, EmptyState, Spinner, Badge, usePermission } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface DeveloperBundle {
  id?: string;
  version?: string;
  channel?: string;
  status?: string;
  changelog?: string | null;
  checksum?: string | null;
  sizeBytes?: number | null;
  createdAt?: string;
  publishedAt?: string | null;
}

interface DeveloperPackage {
  id?: string;
  name?: string;
  slug?: string;
  category?: string;
  status?: string;
  bundles?: DeveloperBundle[];
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

export default function MarketplaceVersionsPage() {
  const canRead = usePermission("admin.platform.read");
  const packages = useList<DeveloperPackage>({
    path: "/developer/apps",
    disabled: !canRead,
  });

  if (packages.loading) {
    return (
      <DomainShell
        domainId="marketplace"
        title="Versions"
        description="Published version bundles across marketplace packages."
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
      title="Versions"
      description="Published version bundles across marketplace packages."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        {packages.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
            {packages.error.message}
          </p>
        ) : packages.data.length === 0 ? (
          <EmptyState
            title="No version bundles"
            description="The developer endpoint returned no packages."
          />
        ) : (
          packages.data.map((pkg) => {
            const bundles = pkg.bundles ?? [];
            return (
              <Card key={pkg.id ?? pkg.slug ?? "?"} padding="md">
                <h3
                  style={{
                    margin: 0,
                    fontSize: "var(--text-base)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                  }}
                >
                  <Package size={16} />
                  {pkg.name ?? pkg.slug ?? "—"}
                  <Badge variant={STATUS_VARIANT(pkg.status)}>{pkg.status ?? "UNKNOWN"}</Badge>
                </h3>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
                  {pkg.category ?? "—"} · {pkg.slug ?? "—"}
                </p>

                {bundles.length === 0 ? (
                  <EmptyState
                    title="No bundles for this package"
                    description="This package has no version bundles yet."
                  />
                ) : (
                  <ul
                    style={{
                      listStyle: "none",
                      margin: "var(--space-3) 0 0",
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {bundles.map((b, i) => (
                      <li
                        key={b.id ?? `${pkg.id}-${b.version}-${i}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "var(--space-2) 0",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                          <FileArchive size={14} />
                          <span style={{ fontWeight: 500 }}>v{b.version ?? "—"}</span>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                            {b.channel ?? "STABLE"}
                          </span>
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                            {b.sizeBytes != null ? `${formatBytes(b.sizeBytes)}` : ""}
                            {b.publishedAt ? ` · ${b.publishedAt}` : ""}
                          </span>
                          <Badge variant={STATUS_VARIANT(b.status)}>{b.status ?? "UNKNOWN"}</Badge>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })
        )}
      </div>
    </DomainShell>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}