"use client";
/**
 * Support / Knowledge Base.
 * Help-center articles read from the communication knowledge endpoint.
 */
import { BookOpen, Eye, Tag, FileText } from "lucide-react";
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

interface ArticleRow {
  id: string;
  title?: string;
  slug?: string;
  category?: string;
  section?: string;
  excerpt?: string;
  summary?: string;
  status?: string;
  views?: number;
  updatedAt?: string;
  createdAt?: string;
  author?: string;
  tags?: string[];
}

function fmtDate(v?: string): string {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString();
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function articleVariant(status?: string): "success" | "default" | "info" | "warning" {
  const st = (status ?? "").toUpperCase();
  if (["PUBLISHED", "LIVE"].includes(st)) return "success";
  if (["DRAFT", "PENDING", "REVIEW"].includes(st)) return "info";
  if (["ARCHIVED", "HIDDEN", "UNPUBLISHED"].includes(st)) return "warning";
  return "default";
}

export default function SupportKnowledge() {
  const articles = useList<ArticleRow>({ path: "/communication/knowledge" });

  const published = articles.data.filter((a) =>
    ["PUBLISHED", "LIVE"].includes((a.status ?? "").toUpperCase()),
  ).length;
  const totalViews = articles.data.reduce((n, a) => n + (num(a.views) ?? 0), 0);
  const categories = new Set(
    articles.data.map((a) => a.category ?? a.section).filter((c): c is string => Boolean(c)),
  ).size;

  const stats: StatCardItem[] = [
    { label: "Articles", value: articles.total ?? articles.data.length, icon: <FileText size={18} />, loading: articles.loading },
    { label: "Published", value: published, icon: <BookOpen size={18} />, loading: articles.loading },
    { label: "Total views", value: totalViews, icon: <Eye size={18} />, loading: articles.loading },
    { label: "Categories", value: categories ?? 0, icon: <Tag size={18} />, loading: articles.loading },
  ];

  return (
    <DomainShell
      domainId="support"
      title="Knowledge Base"
      description="Articles surfaced to support agents and customers."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />
        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Articles</h3>
          {articles.loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-10)" }}>
              <Spinner size="md" />
            </div>
          ) : articles.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{articles.error.message}</p>
          ) : articles.data.length === 0 ? (
            <EmptyState title="No articles" description="The knowledge endpoint returned no articles." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {articles.data.map((a) => (
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
                      {a.title ?? a.slug ?? a.id}
                    </span>
                    <span
                      style={{
                        display: "block",
                        marginTop: "var(--space-1)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {a.excerpt ?? a.summary ?? "—"}
                    </span>
                    <span style={{ display: "block", marginTop: "var(--space-1)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {a.category ?? a.section ?? "Uncategorized"} · {num(a.views) != null ? `${num(a.views)} views` : ""} · updated {fmtDate(a.updatedAt)}
                      {a.author ? ` · ${a.author}` : ""}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    {a.tags && a.tags.length > 0 && (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                          {a.tags.join(", ")}
                        </span>
                    )}
                    <Badge variant={articleVariant(a.status)}>{a.status ?? "UNKNOWN"}</Badge>
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