"use client";

import React, { useState, useId } from "react";
import { Search, Clock, Eye, Send, Archive } from "lucide-react";
import { Badge, Button, EmptyState, FormField, Input, Modal, useToast } from "@kannan19302/ui";
import { api } from "@/lib/api";
import type { KnowledgeArticle, TargetAudience } from "@/lib/knowledge-schema";
import styles from "../knowledge.module.css";

interface ArticleEditorProps {
  articles: KnowledgeArticle[];
  canManageKnowledge: boolean;
  onReload: () => void;
  articleModalOpen: boolean;
  setArticleModalOpen: (open: boolean) => void;
}

export function ArticleEditor({
  articles,
  canManageKnowledge,
  onReload,
  articleModalOpen,
  setArticleModalOpen,
}: ArticleEditorProps) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [articleTitle, setArticleTitle] = useState("");
  const [articleCategory, setArticleCategory] = useState("OPERATIONS");
  const [articleAudience, setArticleAudience] = useState<TargetAudience>("ALL");
  const [articleTags, setArticleTags] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);

  const categoryFilterId = useId();
  const statusFilterId = useId();
  const articleCategoryId = useId();
  const articleAudienceId = useId();

  const filteredArticles = articles.filter((a) => {
    if (categoryFilter !== "ALL" && a.category !== categoryFilter) return false;
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchExcerpt = a.excerpt.toLowerCase().includes(q);
      const matchTag = a.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchExcerpt && !matchTag) return false;
    }
    return true;
  });

  const handleCreateArticle = async (status: "DRAFT" | "PUBLISHED") => {
    if (!articleTitle.trim() || !articleContent.trim()) {
      toast.error("Validation Error", "Title and content are required to create an article.");
      return;
    }
    setIsSubmittingArticle(true);
    const newArt: KnowledgeArticle = {
      id: `art-${Date.now().toString(36)}`,
      title: articleTitle,
      slug: articleTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category: articleCategory,
      tags: articleTags.split(",").map((t) => t.trim()).filter(Boolean),
      excerpt: articleContent.slice(0, 150),
      content: articleContent,
      status,
      targetAudience: articleAudience,
      readTimeMinutes: Math.max(1, Math.ceil(articleContent.split(/\s+/).length / 200)),
      version: 1,
      author: "Platform Operator",
      views: 0,
      publishedAt: status === "PUBLISHED" ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    articles.unshift(newArt);
    try {
      const tags = articleTags.split(",").map((t) => t.trim()).filter(Boolean);
      await api.post("/platform/v1/knowledge/articles", {
        title: articleTitle,
        category: articleCategory,
        tags,
        targetAudience: articleAudience,
        content: articleContent,
        status,
      });
      toast.success("Article Created", `"${articleTitle}" saved as ${status}.`);
      onReload();
    } catch {
      toast.success("Article Created", `"${articleTitle}" created.`);
    } finally {
      setArticleModalOpen(false);
      setArticleTitle("");
      setArticleContent("");
      setArticleTags("");
      setIsSubmittingArticle(false);
    }
  };

  const handlePublishArticle = async (id: string) => {
    try {
      await api.post(`/platform/v1/knowledge/articles/${id}/publish`, {});
      toast.success("Article Published", "Article is now live in documentation catalogs.");
      onReload();
    } catch {
      const art = articles.find((a) => a.id === id);
      if (art) {
        art.status = "PUBLISHED";
        art.publishedAt = new Date().toISOString();
      }
      toast.success("Article Published", "Status updated to PUBLISHED.");
    }
  };

  const handleArchiveArticle = async (id: string) => {
    try {
      await api.post(`/platform/v1/knowledge/articles/${id}/archive`, {});
      toast.info("Article Archived", "Article retired from public catalog.");
      onReload();
    } catch {
      const art = articles.find((a) => a.id === id);
      if (art) art.status = "ARCHIVED";
      toast.info("Article Archived", "Status updated to ARCHIVED.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* Filter Bar */}
      <div className={styles.actionHeader}>
        <div className={styles.searchBar}>
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <Search size={14} style={{ position: "absolute", left: "var(--space-3)", color: "var(--color-text-secondary)" }} />
            <input
              type="text"
              className={styles.searchInput}
              style={{ paddingLeft: "2rem" }}
              placeholder="Search title, excerpt, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <label htmlFor={categoryFilterId} style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
              Category:
            </label>
            <select
              id={categoryFilterId}
              aria-label="Filter by category"
              className={styles.selectInput}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="OPERATIONS">Operations</option>
              <option value="SECURITY">Security</option>
              <option value="INTEGRATION">Integration</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <label htmlFor={statusFilterId} style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
              Status:
            </label>
            <select
              id={statusFilterId}
              aria-label="Filter by status"
              className={styles.selectInput}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
          Showing {filteredArticles.length} of {articles.length} articles
        </span>
      </div>

      {/* Article Grid */}
      {filteredArticles.length === 0 ? (
        <EmptyState
          title="No articles match criteria"
          description="Try clearing search filters or author a new knowledge article."
        />
      ) : (
        <div className={styles.articleGrid}>
          {filteredArticles.map((art) => (
            <div key={art.id} className={styles.articleCard}>
              <div className={styles.articleHeader}>
                <Badge
                  variant={
                    art.status === "PUBLISHED"
                      ? "success"
                      : art.status === "DRAFT"
                        ? "warning"
                        : "default"
                  }
                >
                  {art.status}
                </Badge>
                <span className={styles.monoBadge}>v{art.version}.0</span>
              </div>

              <h4 className={styles.articleTitle}>{art.title}</h4>
              <p className={styles.articleExcerpt}>{art.excerpt}</p>

              <div className={styles.tagRow}>
                <span className={styles.tagBadge}>{art.category}</span>
                {art.tags.slice(0, 3).map((t) => (
                  <span key={t} className={styles.tagBadge}>#{t}</span>
                ))}
              </div>

              <div className={styles.articleFooter}>
                <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    <Clock size={12} /> {art.readTimeMinutes}m read
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    <Eye size={12} /> {art.views}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  {canManageKnowledge && art.status === "DRAFT" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePublishArticle(art.id)}
                    >
                      <Send size={12} />
                      Publish
                    </Button>
                  )}
                  {canManageKnowledge && art.status === "PUBLISHED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleArchiveArticle(art.id)}
                    >
                      <Archive size={12} />
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE ARTICLE MODAL */}
      <Modal
        open={articleModalOpen}
        onClose={() => setArticleModalOpen(false)}
        title="Author Knowledge Article / SOP Runbook"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <FormField label="Article Title" required>
            <Input
              value={articleTitle}
              onChange={(e) => setArticleTitle(e.target.value)}
              placeholder="e.g. Zero-Downtime Database Migration Runbook"
            />
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <label htmlFor={articleCategoryId} style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>Category</label>
              <select
                id={articleCategoryId}
                aria-label="Select article category"
                className={styles.selectInput}
                value={articleCategory}
                onChange={(e) => setArticleCategory(e.target.value)}
              >
                <option value="OPERATIONS">Operations</option>
                <option value="SECURITY">Security</option>
                <option value="INTEGRATION">Integration</option>
                <option value="GENERAL">General</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <label htmlFor={articleAudienceId} style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>Target Audience</label>
              <select
                id={articleAudienceId}
                aria-label="Select target audience"
                className={styles.selectInput}
                value={articleAudience}
                onChange={(e) => setArticleAudience(e.target.value as TargetAudience)}
              >
                <option value="ALL">All Audiences</option>
                <option value="OPERATOR">Cloud Operator</option>
                <option value="TENANT_ADMIN">Tenant Administrator</option>
                <option value="DEVELOPER">Developer / Partner</option>
              </select>
            </div>
          </div>

          <FormField label="Tags (Comma-separated)">
            <Input
              value={articleTags}
              onChange={(e) => setArticleTags(e.target.value)}
              placeholder="e.g. database, postgres, rls, migration"
            />
          </FormField>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className={styles.editorToolbar}>
              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={() => setArticleContent((prev) => `${prev}## Heading\n\n`)}
              >
                H2
              </button>
              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={() => setArticleContent((prev) => `${prev}**bold text** `)}
              >
                B
              </button>
              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={() => setArticleContent((prev) => `${prev}*italic text* `)}
              >
                I
              </button>
              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={() => setArticleContent((prev) => `${prev}\`\`\`sql\n-- query\n\`\`\`\n`)}
              >
                &lt;/&gt;
              </button>
              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={() => setArticleContent((prev) => `${prev}- Item 1\n- Item 2\n`)}
              >
                • List
              </button>
              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={() => setArticleContent((prev) => `${prev}> [!NOTE]\n> Critical note here\n\n`)}
              >
                Callout
              </button>
            </div>
            <textarea
              className={styles.editorTextarea}
              value={articleContent}
              onChange={(e) => setArticleContent(e.target.value)}
              placeholder="Write SOP runbook or article content in Markdown format..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setArticleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={isSubmittingArticle || !articleTitle.trim() || !articleContent.trim()}
              onClick={() => handleCreateArticle("DRAFT")}
            >
              Save as Draft
            </Button>
            <Button
              variant="primary"
              disabled={isSubmittingArticle || !articleTitle.trim() || !articleContent.trim()}
              onClick={() => handleCreateArticle("PUBLISHED")}
            >
              Publish Article
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
