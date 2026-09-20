"use client";

import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Plus,
  RefreshCw,
  Layers,
  Award,
  Eye,
} from "lucide-react";
import {
  Button,
  StatCardRow,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";
import type {
  KnowledgeArticle,
  LearningPath,
} from "@/lib/knowledge-schema";
import { DEFAULT_ARTICLES, DEFAULT_PATHS } from "@/lib/fixtures/knowledge";
import {
  ArticleEditor,
  LearningPathBuilder,
  AdoptionRadar,
} from "./_components";
import styles from "./knowledge.module.css";

type TabKey = "articles" | "paths" | "adoption";

export default function KnowledgeAdoptionPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("articles");

  // Permissions
  const canManageKnowledge = usePermission("pcc.knowledge.manage");

  // Remote data bindings
  const articlesList = useList<KnowledgeArticle>({
    path: "/platform/v1/knowledge/articles",
  });
  const pathsList = useList<LearningPath>({
    path: "/platform/v1/knowledge/learning-paths",
  });
  const metricsItem = useItem<{
    publishedArticlesCount: number;
    learningPathsCount: number;
    totalArticleViews: number;
  }>("/platform/v1/knowledge/metrics");

  // Fallback state
  const articles: KnowledgeArticle[] =
    articlesList.data && articlesList.data.length > 0 ? articlesList.data : DEFAULT_ARTICLES;
  const paths: LearningPath[] =
    pathsList.data && pathsList.data.length > 0 ? pathsList.data : DEFAULT_PATHS;

  // Article creation modal state controlled at top for action button trigger
  const [articleModalOpen, setArticleModalOpen] = useState(false);

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
          <ArticleEditor
            articles={articles}
            canManageKnowledge={canManageKnowledge}
            onReload={() => articlesList.reload()}
            articleModalOpen={articleModalOpen}
            setArticleModalOpen={setArticleModalOpen}
          />
        )}

        {/* TAB 2: LEARNING PATH BUILDER (EC-15.2) */}
        {activeTab === "paths" && (
          <LearningPathBuilder
            paths={paths}
            canManageKnowledge={canManageKnowledge}
            onReload={() => pathsList.reload()}
          />
        )}

        {/* TAB 3: ADOPTION VELOCITY */}
        {activeTab === "adoption" && <AdoptionRadar />}
      </div>
    </DomainShell>
  );
}
