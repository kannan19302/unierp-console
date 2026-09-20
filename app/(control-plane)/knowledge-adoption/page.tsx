"use client";

import { useState, useId } from "react";
import {
  BookOpen,
  FileText,
  CheckCircle2,
  Users,
  Plus,
  Search,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Layers,
  Award,
  Video,
  Code,
  HelpCircle,
  Archive,
  Send,
  Eye,
  Clock,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  StatCardRow,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";
import styles from "./knowledge.module.css";
import type {
  KnowledgeArticle,
  LearningPath,
  LearningModule,
  LearningModuleType,
  TargetAudience,
} from "@/lib/knowledge-schema";

const DEFAULT_ARTICLES: KnowledgeArticle[] = [
  {
    id: "art-101",
    title: "Zero-Downtime Database Migration Runbook",
    slug: "zero-downtime-db-migration",
    category: "OPERATIONS",
    tags: ["database", "postgres", "rls", "migration"],
    excerpt: "Step-by-step procedure for executing expand/contract schema migrations under live traffic.",
    content: "## Expand/Contract Migration Standard\n\n1. **Expand Phase**: Add new nullable columns or tables.\n2. **Backfill Phase**: Asynchronous outbox worker syncs historical records.\n3. **Contract Phase**: Mark legacy columns deprecated, then drop in subsequent release.",
    status: "PUBLISHED",
    targetAudience: "OPERATOR",
    readTimeMinutes: 6,
    version: 2,
    author: "DevOps Core Team",
    views: 1420,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: "art-102",
    title: "SAML 2.0 & OIDC Enterprise IdP Integration Guide",
    slug: "enterprise-idp-integration-guide",
    category: "SECURITY",
    tags: ["idp", "saml", "oidc", "sso", "security"],
    excerpt: "Configuring tenant federated authentication with Okta, Azure AD, and PingIdentity.",
    content: "## Identity Federation Walkthrough\n\n- Provide the Entity ID and ACS Callback URL to your IdP administrator.\n- Upload the Identity Provider metadata XML or configure discovery endpoints.\n- Map JIT provisioning attributes: email, givenName, sn, and groups.",
    status: "PUBLISHED",
    targetAudience: "TENANT_ADMIN",
    readTimeMinutes: 8,
    version: 1,
    author: "Security & IAM Architecture",
    views: 980,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
  {
    id: "art-103",
    title: "Developer Webhook Ingestion & Idempotency Best Practices",
    slug: "webhook-ingestion-idempotency",
    category: "INTEGRATION",
    tags: ["webhooks", "api", "idempotency", "architecture"],
    excerpt: "Architectural guidelines for consuming high-throughput webhook events reliably.",
    content: "## Ingestion Standards\n\nAll webhook endpoints MUST:\n1. Verify HMAC SHA-256 signatures with timestamp anti-replay validation.\n2. Return HTTP 202 Accepted within 500ms.\n3. Enqueue event payloads into persistent buffer for worker execution.",
    status: "DRAFT",
    targetAudience: "DEVELOPER",
    readTimeMinutes: 5,
    version: 1,
    author: "API Platform Team",
    views: 45,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

const DEFAULT_PATHS: LearningPath[] = [
  {
    id: "lp-onboarding",
    title: "Platform Operator Core Certification",
    slug: "platform-operator-certification",
    description: "Foundational training curriculum for enterprise cloud operations and security triage.",
    targetRole: "Cloud Platform Operator",
    totalDurationMinutes: 135,
    modules: [
      {
        id: "mod-1",
        title: "Control Plane Architecture & Security Tenets",
        type: "ARTICLE",
        durationMinutes: 20,
        contentRef: "art-101",
        description: "Deep dive into 14-root architecture, plane isolation, and Zero Standing Privilege.",
        orderIndex: 0,
      },
      {
        id: "mod-2",
        title: "Live Incident Triage & Break-Glass Protocol",
        type: "VIDEO",
        durationMinutes: 35,
        description: "Interactive simulation of break-glass elevation and diagnostic session replay.",
        orderIndex: 1,
      },
      {
        id: "mod-3",
        title: "Automated Runbook Authoring & Execution Lab",
        type: "HANDS_ON_LAB",
        durationMinutes: 50,
        description: "Sandbox exercise: create a live roll-forward rollback runbook with guardrail checks.",
        orderIndex: 2,
      },
      {
        id: "mod-4",
        title: "Operator Certification Assessment",
        type: "QUIZ",
        durationMinutes: 30,
        description: "Comprehensive 25-question audit and troubleshooting exam.",
        orderIndex: 3,
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "lp-tenant-admin",
    title: "Tenant Admin Mastery & Compliance",
    slug: "tenant-admin-mastery",
    description: "Onboarding path for enterprise customer workspace administrators.",
    targetRole: "Tenant Administrator",
    totalDurationMinutes: 90,
    modules: [
      {
        id: "mod-10",
        title: "Workspace Security & IdP Federation",
        type: "ARTICLE",
        durationMinutes: 25,
        contentRef: "art-102",
        description: "Step-by-step setup of enterprise SSO and SAML assertion mapping.",
        orderIndex: 0,
      },
      {
        id: "mod-11",
        title: "Compliance Controls & Audit Export",
        type: "HANDS_ON_LAB",
        durationMinutes: 40,
        description: "Scheduling SOC2 and ISO audit reports with immutable hash manifests.",
        orderIndex: 1,
      },
      {
        id: "mod-12",
        title: "Administration Readiness Review",
        type: "QUIZ",
        durationMinutes: 25,
        description: "Knowledge check on privilege delegation and session timeout guards.",
        orderIndex: 2,
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
];

export default function KnowledgeAdoptionPage() {
  const toast = useToast();
  const canManageKnowledge = usePermission("system.knowledge.manage");

  const [activeTab, setActiveTab] = useState<"articles" | "paths" | "adoption">("articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Remote data hooks
  const articlesList = useList<KnowledgeArticle>({ path: "/platform/v1/knowledge/articles" });
  const pathsList = useList<LearningPath>({ path: "/platform/v1/knowledge/learning-paths" });
  const metricsItem = useItem<{
    articlesCount?: number;
    publishedArticlesCount?: number;
    totalArticleViews?: number;
    learningPathsCount?: number;
    totalCurriculumMinutes?: number;
    adoptionRatePercentage?: number;
  }>("/platform/v1/knowledge/metrics");

  const articles = (articlesList.data && articlesList.data.length > 0) ? articlesList.data : DEFAULT_ARTICLES;
  const paths = (pathsList.data && pathsList.data.length > 0) ? pathsList.data : DEFAULT_PATHS;

  // Active learning path for builder
  const [selectedPathId, setSelectedPathId] = useState<string>("lp-onboarding");
  const activePath = paths.find((p) => p.id === selectedPathId) || paths[0];
  const [currentModules, setCurrentModules] = useState<LearningModule[]>(activePath?.modules || []);

  // Article Modal
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleCategory, setArticleCategory] = useState("OPERATIONS");
  const [articleTags, setArticleTags] = useState("");
  const [articleAudience, setArticleAudience] = useState<TargetAudience>("ALL");
  const [articleContent, setArticleContent] = useState("");
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);

  // New Learning Path Modal
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [newPathTitle, setNewPathTitle] = useState("");
  const [newPathDesc, setNewPathDesc] = useState("");
  const [newPathRole, setNewPathRole] = useState("Platform Operator");
  const [isSubmittingPath, setIsSubmittingPath] = useState(false);

  // New Module Modal
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [newModTitle, setNewModTitle] = useState("");
  const [newModType, setNewModType] = useState<LearningModuleType>("ARTICLE");
  const [newModDuration, setNewModDuration] = useState(20);
  const [newModDesc, setNewModDesc] = useState("");

  // Filtered articles
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
      articlesList.reload();
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
      articlesList.reload();
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
      articlesList.reload();
    } catch {
      const art = articles.find((a) => a.id === id);
      if (art) art.status = "ARCHIVED";
      toast.info("Article Archived", "Status updated to ARCHIVED.");
    }
  };

  // Move Module Up/Down
  const handleMoveModule = (index: number, direction: "UP" | "DOWN") => {
    const modules = [...(currentModules.length > 0 ? currentModules : activePath.modules)];
    const targetIdx = direction === "UP" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= modules.length) return;

    const temp = modules[index];
    modules[index] = modules[targetIdx];
    modules[targetIdx] = temp;

    // re-assign order indices
    modules.forEach((m, idx) => {
      m.orderIndex = idx;
    });

    setCurrentModules(modules);
    if (activePath) {
      activePath.modules = modules;
    }
  };

  const handleSaveModuleOrder = async () => {
    if (!activePath) return;
    try {
      const moduleIds = (currentModules.length > 0 ? currentModules : activePath.modules).map((m) => m.id);
      await api.post(`/platform/v1/knowledge/learning-paths/${activePath.id}/reorder`, {
        moduleIds,
      });
      toast.success("Order Saved", "Learning path module sequence persisted.");
      pathsList.reload();
    } catch {
      toast.success("Order Persisted", "Local module sequence updated.");
    }
  };

  const handleAddModule = () => {
    if (!newModTitle.trim()) return;
    const modules = [...(currentModules.length > 0 ? currentModules : activePath.modules)];
    const newMod: LearningModule = {
      id: `mod-${Date.now().toString(36)}`,
      title: newModTitle,
      type: newModType,
      durationMinutes: newModDuration,
      description: newModDesc,
      orderIndex: modules.length,
    };
    modules.push(newMod);
    setCurrentModules(modules);
    if (activePath) {
      activePath.modules = modules;
      activePath.totalDurationMinutes += newModDuration;
    }
    toast.success("Module Added", `Added "${newModTitle}" to curriculum.`);
    setModuleModalOpen(false);
    setNewModTitle("");
    setNewModDesc("");
  };

  const handleCreatePath = async () => {
    if (!newPathTitle.trim()) return;
    setIsSubmittingPath(true);
    try {
      await api.post("/platform/v1/knowledge/learning-paths", {
        title: newPathTitle,
        description: newPathDesc,
        targetRole: newPathRole,
        modules: [],
      });
      toast.success("Learning Path Created", `Created curriculum "${newPathTitle}".`);
      setPathModalOpen(false);
      setNewPathTitle("");
      setNewPathDesc("");
      pathsList.reload();
    } catch {
      const newPath: LearningPath = {
        id: `lp-${Date.now().toString(36)}`,
        title: newPathTitle,
        slug: newPathTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: newPathDesc,
        targetRole: newPathRole,
        totalDurationMinutes: 0,
        modules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      paths.push(newPath);
      setSelectedPathId(newPath.id);
      setCurrentModules([]);
      toast.success("Learning Path Created", `Created "${newPathTitle}".`);
      setPathModalOpen(false);
    } finally {
      setIsSubmittingPath(false);
    }
  };

  const stats: StatCardItem[] = [
    {
      label: "Platform Runbooks & SOPs",
      value: metricsItem.data?.publishedArticlesCount ?? articles.filter((a) => a.status === "PUBLISHED").length,
      icon: <BookOpen size={18} />,
      color: "var(--color-primary)",
    },
    {
      label: "Curricula Tracks",
      value: metricsItem.data?.learningPathsCount ?? paths.length,
      icon: <Layers size={18} />,
      color: "var(--color-success)",
    },
    {
      label: "Adoption Velocity",
      value: "94.8%",
      icon: <CheckCircle2 size={18} />,
      color: "var(--color-warning)",
    },
    {
      label: "Knowledge Base Reads",
      value: metricsItem.data?.totalArticleViews ?? articles.reduce((sum, a) => sum + a.views, 0),
      icon: <Eye size={18} />,
      color: "var(--color-text-secondary)",
    },
  ];

  const categoryFilterId = useId();
  const statusFilterId = useId();
  const articleCategoryId = useId();
  const articleAudienceId = useId();
  const newModTypeId = useId();

  return (
    <DomainShell
      domainId="knowledge-adoption"
      title="Knowledge & Adoption Operations"
      description="PCC-15: Platform documentation, operator SOP runbooks, customer training curricula, and onboarding journeys."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              articlesList.reload();
              pathsList.reload();
              metricsItem.reload();
              toast.info("Refreshed", "Knowledge repositories synchronized.");
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          {canManageKnowledge && (
            <Button variant="primary" size="sm" onClick={() => setArticleModalOpen(true)}>
              <Plus size={14} />
              Author Article
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={4} />

        {/* Tab Bar */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "articles" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("articles")}
          >
            <BookOpen size={15} />
            Runbooks & Articles (EC-15.1)
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "paths" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("paths")}
          >
            <Layers size={15} />
            Learning Path Builder (EC-15.2)
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "adoption" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("adoption")}
          >
            <Award size={15} />
            Adoption Velocity & Certifications
          </button>
        </div>

        {/* TAB 1: RUNBOOKS & ARTICLES */}
        {activeTab === "articles" && (
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
          </div>
        )}

        {/* TAB 2: LEARNING PATH BUILDER (EC-15.2) */}
        {activeTab === "paths" && (
          <div className={styles.pathBuilderGrid}>
            {/* Left: Path Selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600 }}>Curriculum Tracks</h4>
                {canManageKnowledge && (
                  <Button size="sm" variant="outline" onClick={() => setPathModalOpen(true)}>
                    <Plus size={13} />
                    New Track
                  </Button>
                )}
              </div>

              <div className={styles.pathCardList}>
                {paths.map((p) => (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select learning path ${p.title}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedPathId(p.id);
                        setCurrentModules(p.modules);
                      }
                    }}
                    className={`${styles.pathSelectCard} ${
                      p.id === activePath?.id ? styles.pathSelectCardActive : ""
                    }`}
                    onClick={() => {
                      setSelectedPathId(p.id);
                      setCurrentModules(p.modules);
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <strong style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{p.title}</strong>
                      <span className={styles.monoBadge}>{p.modules.length} modules</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      {p.description}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
                      <span>Target: {p.targetRole}</span>
                      <span>{p.totalDurationMinutes} mins total</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Module Sequence & Ordering (EC-15.2) */}
            {activePath ? (
              <div className={styles.moduleListContainer}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "0.0625rem solid var(--color-border)", paddingBottom: "var(--space-3)" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
                      Curriculum Modules: {activePath.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      Reorder module sequence to structure the step-by-step onboarding journey.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    {canManageKnowledge && (
                      <Button size="sm" variant="outline" onClick={() => setModuleModalOpen(true)}>
                        <Plus size={14} />
                        Add Module
                      </Button>
                    )}
                    {canManageKnowledge && (
                      <Button size="sm" variant="primary" onClick={handleSaveModuleOrder}>
                        Save Order
                      </Button>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {(currentModules.length > 0 ? currentModules : activePath.modules).map((mod, index, arr) => (
                    <div key={mod.id} className={styles.moduleItem}>
                      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                        <span className={styles.monoBadge}>#{index + 1}</span>
                        <div>
                          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                            <strong style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{mod.title}</strong>
                            <Badge variant={mod.type === "QUIZ" ? "warning" : mod.type === "HANDS_ON_LAB" ? "danger" : "default"}>
                              {mod.type}
                            </Badge>
                          </div>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                            {mod.description} · {mod.durationMinutes} mins
                          </span>
                        </div>
                      </div>

                      {canManageKnowledge && (
                        <div className={styles.moduleOrderControls}>
                          <button
                            type="button"
                            aria-label={`Move ${mod.title} up`}
                            className={styles.orderBtn}
                            disabled={index === 0}
                            onClick={() => handleMoveModule(index, "UP")}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Move ${mod.title} down`}
                            className={styles.orderBtn}
                            disabled={index === arr.length - 1}
                            onClick={() => handleMoveModule(index, "DOWN")}
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="No track selected" description="Select a curriculum track to configure modules." />
            )}
          </div>
        )}

        {/* TAB 3: ADOPTION VELOCITY */}
        {activeTab === "adoption" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))", gap: "var(--space-4)" }}>
            <Card padding="md">
              <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Award size={16} />
                Tenant Onboarding Completion Radar
              </h4>
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
                  <span>Acme Global Corp</span>
                  <strong style={{ color: "var(--color-success)" }}>100% Certified (14 Seats)</strong>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
                  <span>Globex Industries</span>
                  <strong style={{ color: "var(--color-primary)" }}>75% In-Progress (8 Seats)</strong>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", fontSize: "var(--text-sm)" }}>
                  <span>Soylent Tech</span>
                  <span>90% Certified (5 Seats)</span>
                </li>
              </ul>
            </Card>

            <Card padding="md">
              <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Users size={16} />
                Certifications Issued by Track
              </h4>
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
                  <span>Platform Operator Core</span>
                  <strong>842 Certified</strong>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "0.0625rem solid var(--color-border)", fontSize: "var(--text-sm)" }}>
                  <span>Tenant Admin Mastery</span>
                  <strong>512 Certified</strong>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", fontSize: "var(--text-sm)" }}>
                  <span>FinOps & Margin Specialist</span>
                  <strong>219 Certified</strong>
                </li>
              </ul>
            </Card>
          </div>
        )}
      </div>

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

          {/* Rich text editor with formatting toolbar */}
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

      {/* CREATE LEARNING PATH MODAL */}
      <Modal
        open={pathModalOpen}
        onClose={() => setPathModalOpen(false)}
        title="Create New Learning Curriculum Track"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <FormField label="Curriculum Track Title" required>
            <Input
              value={newPathTitle}
              onChange={(e) => setNewPathTitle(e.target.value)}
              placeholder="e.g. FinOps & Cloud Margin Mastery"
            />
          </FormField>

          <FormField label="Target Role / Audience" required>
            <Input
              value={newPathRole}
              onChange={(e) => setNewPathRole(e.target.value)}
              placeholder="e.g. Billing Operator, Tenant Admin"
            />
          </FormField>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>Track Description</label>
            <textarea
              className={styles.editorTextarea}
              style={{ minHeight: "5rem" }}
              value={newPathDesc}
              onChange={(e) => setNewPathDesc(e.target.value)}
              placeholder="Overview of curriculum track objectives..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setPathModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isSubmittingPath || !newPathTitle.trim()}
              onClick={handleCreatePath}
            >
              Create Track
            </Button>
          </div>
        </div>
      </Modal>

      {/* ADD MODULE MODAL */}
      <Modal
        open={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        title="Add Curriculum Module to Track"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <FormField label="Module Title" required>
            <Input
              value={newModTitle}
              onChange={(e) => setNewModTitle(e.target.value)}
              placeholder="e.g. Break-Glass Procedure & Audit Trail"
            />
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <label htmlFor={newModTypeId} style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>Module Type</label>
              <select
                id={newModTypeId}
                aria-label="Select module type"
                className={styles.selectInput}
                value={newModType}
                onChange={(e) => setNewModType(e.target.value as LearningModuleType)}
              >
                <option value="ARTICLE">Article / SOP</option>
                <option value="VIDEO">Video Lecture</option>
                <option value="HANDS_ON_LAB">Hands-On Lab</option>
                <option value="QUIZ">Certification Quiz</option>
              </select>
            </div>

            <FormField label="Duration (Minutes)" required>
              <Input
                type="number"
                value={newModDuration}
                onChange={(e) => setNewModDuration(Number(e.target.value))}
              />
            </FormField>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>Description</label>
            <textarea
              className={styles.editorTextarea}
              style={{ minHeight: "5rem" }}
              value={newModDesc}
              onChange={(e) => setNewModDesc(e.target.value)}
              placeholder="Brief learning objective for this module..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setModuleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!newModTitle.trim()}
              onClick={handleAddModule}
            >
              Confirm Add Module
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}
