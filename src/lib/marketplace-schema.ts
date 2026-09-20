import { z } from "zod";

export const submissionStageSchema = z.enum([
  "SUBMITTED",
  "SECURITY_REVIEW",
  "FUNCTIONAL_REVIEW",
  "APPROVED",
  "REJECTED",
]);

export type SubmissionStage = z.infer<typeof submissionStageSchema>;

export const reviewChecklistSchema = z.object({
  securitySastPassed: z.boolean(),
  securityNoCriticalCve: z.boolean(),
  securityLeastPrivilege: z.boolean(),
  perfBundleUnder5Mb: z.boolean(),
  perfColdStartUnder800ms: z.boolean(),
  uxDocumentationComplete: z.boolean(),
  uxHighResIcon: z.boolean(),
  uxVerifiedContact: z.boolean(),
});

export type ReviewChecklist = z.infer<typeof reviewChecklistSchema>;

export const marketplaceSubmissionSchema = z.object({
  id: z.string(),
  appSlug: z.string(),
  name: z.string(),
  category: z.string(),
  version: z.string(),
  developerName: z.string(),
  developerEmail: z.string(),
  stage: submissionStageSchema,
  assignedReviewer: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  checklist: reviewChecklistSchema,
  feedbackNotes: z.string().optional(),
  submittedAt: z.string(),
  updatedAt: z.string(),
  approvedAt: z.string().optional(),
  rejectedAt: z.string().optional(),
});

export type MarketplaceSubmission = z.infer<typeof marketplaceSubmissionSchema>;

export const extensionVersionSchema = z.object({
  id: z.string(),
  appSlug: z.string(),
  version: z.string(),
  releaseNotes: z.string(),
  changelogDiff: z.string(),
  rolloutPercentage: z.number().min(0).max(100),
  status: z.enum(["ACTIVE", "ROLLED_BACK", "DEPRECATED"]),
  releasedAt: z.string(),
  rolledBackAt: z.string().optional(),
  rollbackReason: z.string().optional(),
});

export type ExtensionVersion = z.infer<typeof extensionVersionSchema>;
