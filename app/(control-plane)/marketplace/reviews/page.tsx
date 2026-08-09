"use client";
/**
 * Marketplace → Reviews.
 *
 * App reviews read from the verified admin marketplace reviews endpoint
 * (`/admin/marketplace/apps/:slug/reviews`), with an app selector driven by
 * the storefront listing.
 */
import { useEffect, useState } from "react";
import { Star, User } from "lucide-react";
import { Card, EmptyState, Spinner, Badge, usePermission } from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface StorefrontApp {
  id?: string;
  slug?: string;
  name?: string;
}

interface StorefrontResponse {
  apps?: StorefrontApp[];
}

interface AppReview {
  id?: string;
  rating?: number;
  title?: string;
  body?: string;
  userName?: string;
  userId?: string;
  tenant?: { name?: string } | null;
  verifiedPurchase?: boolean;
  createdAt?: string;
}

interface ReviewsResponse {
  reviews?: AppReview[];
  total?: number;
}

const ratingColor = (r?: number) =>
  r == null
    ? "var(--color-text-muted)"
    : r >= 4
      ? "var(--color-success)"
      : r >= 3
        ? "var(--color-warning)"
        : "var(--color-danger)";

export default function MarketplaceReviewsPage() {
  const canRead = usePermission("admin.platform.read");
  const store = useItem<StorefrontResponse>(canRead ? "/storefront/apps" : null);

  const [selected, setSelected] = useState<string>("");
  useEffect(() => {
    if (!selected && store.data?.apps?.length) {
      setSelected(store.data.apps[0].slug ?? "");
    }
  }, [selected, store.data]);

  const reviews = useItem<ReviewsResponse>(
    canRead && selected ? `/admin/marketplace/apps/${selected}/reviews` : null,
  );

  const apps = store.data?.apps ?? [];
  const list = reviews.data?.reviews ?? [];

  if (store.loading || (selected && reviews.loading)) {
    return (
      <DomainShell
        domainId="marketplace"
        title="Reviews"
        description="Tenant reviews and ratings for marketplace apps."
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
      title="Reviews"
      description="Tenant reviews and ratings for marketplace apps."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <Card padding="md">
          <label
            htmlFor="review-app-select"
            style={{ fontSize: "var(--text-sm)", fontWeight: 600, display: "block" }}
          >
            Application
          </label>
          <select
            id="review-app-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{
              marginTop: "var(--space-2)",
              width: "100%",
              padding: "var(--space-2)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg)",
              color: "var(--color-text)",
              fontSize: "var(--text-sm)",
            }}
          >
            {apps.map((app) => (
              <option key={app.id ?? app.slug} value={app.slug ?? ""}>
                {app.name ?? app.slug ?? "—"}
              </option>
            ))}
          </select>
        </Card>

        {store.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
            {store.error.message}
          </p>
        ) : reviews.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
            {reviews.error.message}
          </p>
        ) : list.length === 0 ? (
          <Card padding="md">
            <EmptyState
              title="No reviews"
              description="This app has no reviews yet."
            />
          </Card>
        ) : (
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Reviews — {selected} ({reviews.data?.total ?? list.length})
            </h3>
            <ul
              style={{
                listStyle: "none",
                margin: "var(--space-3) 0 0",
                padding: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {list.map((review) => (
                <li
                  key={review.id ?? review.userId ?? "?"}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-1)",
                    padding: "var(--space-3) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        fontWeight: 600,
                      }}
                    >
                      <Star size={14} style={{ color: ratingColor(review.rating) }} fill="currentColor" />
                      <span style={{ color: ratingColor(review.rating) }}>
                        {review.rating ?? "—"}/5
                      </span>
                      <span
                        style={{
                          fontSize: "var(--text-sm)",
                          fontWeight: 500,
                          color: "var(--color-text)",
                        }}
                      >
                        {review.title ?? "—"}
                      </span>
                      {review.verifiedPurchase && <Badge variant="success">Verified</Badge>}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-1)",
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      <User size={12} />
                      {review.userName ?? review.tenant?.name ?? review.userId ?? "—"} ·{" "}
                      {review.createdAt ?? ""}
                    </span>
                  </span>
                  {review.body && (
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
                      {review.body}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </DomainShell>
  );
}