import { z } from "zod";

export const MobilePlatformEnum = z.enum(["ios", "android"]);
export type MobilePlatform = z.infer<typeof MobilePlatformEnum>;

export const MobileBuildStatusEnum = z.enum(["BUILDING", "READY", "PUBLISHED", "FAILED"]);
export type MobileBuildStatus = z.infer<typeof MobileBuildStatusEnum>;

export const MobileBuildSchema = z.object({
  id: z.string(),
  platform: MobilePlatformEnum,
  version: z.string().min(1, "Version is required"),
  buildNumber: z.number().int().positive(),
  commitHash: z.string().min(7),
  branch: z.string().default("main"),
  status: MobileBuildStatusEnum.default("READY"),
  artifactSizeMb: z.number().default(40.0),
  storeUrl: z.string().url().optional(),
  createdAt: z.string(),
});
export type MobileBuild = z.infer<typeof MobileBuildSchema>;

export const MobileChannelEnum = z.enum(["alpha", "beta", "production"]);
export type MobileChannel = z.infer<typeof MobileChannelEnum>;

export const ReleaseChannelSchema = z.object({
  channel: MobileChannelEnum,
  activeVersion: z.string(),
  activeBuildNumber: z.number(),
  rolloutPercentage: z.number().min(0).max(100),
  minOsVersion: z.object({
    ios: z.string(),
    android: z.string(),
  }),
  updatedAt: z.string(),
});
export type ReleaseChannel = z.infer<typeof ReleaseChannelSchema>;

export const PushProviderBindingSchema = z.object({
  provider: z.enum(["FCM", "APNs"]),
  environment: z.enum(["production", "sandbox"]),
  status: z.enum(["HEALTHY", "DEGRADED", "EXPIRED"]),
  certificateExpiry: z.string(),
  lastDeliveryCheck: z.string(),
  successRate24h: z.number(),
  keyId: z.string().optional(),
  teamId: z.string().optional(),
  projectId: z.string().optional(),
});
export type PushProviderBinding = z.infer<typeof PushProviderBindingSchema>;
