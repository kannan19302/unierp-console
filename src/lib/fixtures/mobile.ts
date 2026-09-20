import type {
  MobileBuild,
  ReleaseChannel,
  PushProviderBinding,
} from "@/lib/mobile-schema";

export const DEFAULT_BUILDS: MobileBuild[] = [
  {
    id: "mob-bld-104",
    platform: "ios",
    version: "2.4.0",
    buildNumber: 104,
    commitHash: "e4f8b1c",
    branch: "release/2.4.0",
    status: "PUBLISHED",
    artifactSizeMb: 42.6,
    storeUrl: "https://apps.apple.com/app/unierp/id123456789",
    createdAt: new Date(Date.now() - 3600_000 * 24).toISOString(),
  },
  {
    id: "mob-bld-103",
    platform: "android",
    version: "2.4.0",
    buildNumber: 103,
    commitHash: "e4f8b1c",
    branch: "release/2.4.0",
    status: "PUBLISHED",
    artifactSizeMb: 38.1,
    storeUrl: "https://play.google.com/store/apps/details?id=com.unierp.mobile",
    createdAt: new Date(Date.now() - 3600_000 * 25).toISOString(),
  },
  {
    id: "mob-bld-105",
    platform: "ios",
    version: "2.5.0-beta.1",
    buildNumber: 105,
    commitHash: "a1c9d2f",
    branch: "main",
    status: "READY",
    artifactSizeMb: 43.2,
    createdAt: new Date(Date.now() - 3600_000 * 4).toISOString(),
  },
  {
    id: "mob-bld-106",
    platform: "android",
    version: "2.5.0-beta.1",
    buildNumber: 106,
    commitHash: "a1c9d2f",
    branch: "main",
    status: "READY",
    artifactSizeMb: 38.9,
    createdAt: new Date(Date.now() - 3600_000 * 3).toISOString(),
  },
];

export const DEFAULT_CHANNELS: ReleaseChannel[] = [
  {
    channel: "production",
    activeVersion: "2.4.0",
    activeBuildNumber: 104,
    rolloutPercentage: 100,
    minOsVersion: { ios: "16.0", android: "10.0" },
    updatedAt: new Date(Date.now() - 3600_000 * 24).toISOString(),
  },
  {
    channel: "beta",
    activeVersion: "2.5.0-beta.1",
    activeBuildNumber: 106,
    rolloutPercentage: 25,
    minOsVersion: { ios: "16.4", android: "11.0" },
    updatedAt: new Date(Date.now() - 3600_000 * 3).toISOString(),
  },
  {
    channel: "alpha",
    activeVersion: "2.5.0-alpha.3",
    activeBuildNumber: 102,
    rolloutPercentage: 100,
    minOsVersion: { ios: "17.0", android: "12.0" },
    updatedAt: new Date(Date.now() - 3600_000 * 48).toISOString(),
  },
];

export const DEFAULT_PUSH: PushProviderBinding[] = [
  {
    provider: "APNs",
    environment: "production",
    status: "HEALTHY",
    certificateExpiry: new Date(Date.now() + 3600_000 * 24 * 180).toISOString(),
    lastDeliveryCheck: new Date(Date.now() - 60_000 * 5).toISOString(),
    successRate24h: 99.85,
    keyId: "APN-KEY-9X12",
    teamId: "APPLE-TEAM-UNI",
  },
  {
    provider: "FCM",
    environment: "production",
    status: "HEALTHY",
    certificateExpiry: new Date(Date.now() + 3600_000 * 24 * 320).toISOString(),
    lastDeliveryCheck: new Date(Date.now() - 60_000 * 2).toISOString(),
    successRate24h: 99.92,
    projectId: "unierp-mobile-fcm",
  },
];
