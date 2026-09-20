import { z } from "zod";

export const DesktopOsTargetEnum = z.enum([
  "windows-x64",
  "windows-arm64",
  "macos-arm64",
  "macos-x64",
  "linux-x64",
]);
export type DesktopOsTarget = z.infer<typeof DesktopOsTargetEnum>;

export const InstallerTypeEnum = z.enum(["exe", "msi", "dmg", "pkg", "deb", "AppImage"]);
export type InstallerType = z.infer<typeof InstallerTypeEnum>;

export const SignatureStatusEnum = z.enum([
  "SIGNED_VERIFIED",
  "NOTARIZED",
  "SELF_SIGNED",
  "PENDING",
]);
export type SignatureStatus = z.infer<typeof SignatureStatusEnum>;

export const DesktopBuildSchema = z.object({
  id: z.string(),
  targetOs: DesktopOsTargetEnum,
  version: z.string().min(1, "Version is required"),
  installerType: InstallerTypeEnum,
  commitHash: z.string().min(7),
  sha256: z.string().min(16),
  signatureStatus: SignatureStatusEnum.default("PENDING"),
  fileSizeBytes: z.number().default(80_000_000),
  downloadUrl: z.string().url().optional(),
  createdAt: z.string(),
});
export type DesktopBuild = z.infer<typeof DesktopBuildSchema>;

export const DesktopChannelEnum = z.enum(["stable", "beta", "nightly"]);
export type DesktopChannel = z.infer<typeof DesktopChannelEnum>;

export const DesktopReleaseChannelSchema = z.object({
  channel: DesktopChannelEnum,
  activeVersion: z.string(),
  rolloutPercentage: z.number().min(0).max(100),
  autoUpdateEnabled: z.boolean().default(true),
  minOsRequirements: z.object({
    windows: z.string(),
    macos: z.string(),
    linux: z.string(),
  }),
  updatedAt: z.string(),
});
export type DesktopReleaseChannel = z.infer<typeof DesktopReleaseChannelSchema>;

export const CodeSigningProfileSchema = z.object({
  platform: z.enum(["Apple Notarization", "Windows EV Authenticode", "Linux GPG"]),
  identity: z.string(),
  certificateExpiry: z.string(),
  status: z.enum(["VALID", "EXPIRING_SOON", "EXPIRED"]),
  timestampServer: z.string(),
});
export type CodeSigningProfile = z.infer<typeof CodeSigningProfileSchema>;
