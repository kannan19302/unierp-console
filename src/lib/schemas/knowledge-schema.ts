import { z } from "zod";

export const ArticleStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export type ArticleStatus = z.infer<typeof ArticleStatusEnum>;

export const TargetAudienceEnum = z.enum(["OPERATOR", "TENANT_ADMIN", "DEVELOPER", "ALL"]);
export type TargetAudience = z.infer<typeof TargetAudienceEnum>;

export const KnowledgeArticleSchema = z.object({
  id: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string(),
  category: z.string().default("GENERAL"),
  tags: z.array(z.string()).default([]),
  excerpt: z.string(),
  content: z.string().min(10, "Content must be at least 10 characters"),
  status: ArticleStatusEnum.default("DRAFT"),
  targetAudience: TargetAudienceEnum.default("ALL"),
  readTimeMinutes: z.number().default(5),
  version: z.number().default(1),
  author: z.string().default("Platform Admin"),
  views: z.number().default(0),
  publishedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type KnowledgeArticle = z.infer<typeof KnowledgeArticleSchema>;

export const LearningModuleTypeEnum = z.enum(["ARTICLE", "VIDEO", "QUIZ", "HANDS_ON_LAB"]);
export type LearningModuleType = z.infer<typeof LearningModuleTypeEnum>;

export const LearningModuleSchema = z.object({
  id: z.string(),
  title: z.string().min(2, "Module title is required"),
  type: LearningModuleTypeEnum,
  durationMinutes: z.number().min(1),
  contentRef: z.string().optional(),
  description: z.string(),
  orderIndex: z.number(),
});
export type LearningModule = z.infer<typeof LearningModuleSchema>;

export const LearningPathSchema = z.object({
  id: z.string(),
  title: z.string().min(3, "Path title must be at least 3 characters"),
  slug: z.string(),
  description: z.string(),
  targetRole: z.string().default("All Platform Roles"),
  totalDurationMinutes: z.number().default(0),
  modules: z.array(LearningModuleSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LearningPath = z.infer<typeof LearningPathSchema>;
