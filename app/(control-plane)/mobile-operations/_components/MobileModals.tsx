"use client";

import { useState, useId } from "react";
import { Modal, FormField, Input, Button } from "@kannan19302/ui";
import styles from "../mobile.module.css";
import type { MobileBuild, MobilePlatform } from "@/lib/mobile-schema";

interface MobileModalsProps {
  // Trigger Build Modal
  buildModalOpen: boolean;
  onCloseBuildModal: () => void;
  onTriggerBuild: (data: {
    platform: MobilePlatform;
    branch: string;
    version: string;
    buildNumber: number;
    commitHash: string;
  }) => Promise<void>;

  // Log Modal
  logModalOpen: boolean;
  selectedBuildForLog: MobileBuild | null;
  onCloseLogModal: () => void;

  // Push Config Modal
  pushConfigModalOpen: boolean;
  configProvider: "APNs" | "FCM";
  onClosePushConfigModal: () => void;
  onSavePushConfig: (data: {
    provider: "APNs" | "FCM";
    apnsKeyId: string;
    apnsTeamId: string;
    fcmProjectId: string;
  }) => Promise<void>;

  // Promote Channel Modal
  promoteModalOpen: boolean;
  onClosePromoteModal: () => void;
  onPromoteChannel: (data: {
    channel: "alpha" | "beta" | "production";
    version: string;
    buildNumber: number;
    rolloutPercentage: number;
  }) => Promise<void>;
}

export function MobileModals({
  buildModalOpen,
  onCloseBuildModal,
  onTriggerBuild,
  logModalOpen,
  selectedBuildForLog,
  onCloseLogModal,
  pushConfigModalOpen,
  configProvider,
  onClosePushConfigModal,
  onSavePushConfig,
  promoteModalOpen,
  onClosePromoteModal,
  onPromoteChannel,
}: MobileModalsProps) {
  // Build state
  const [buildPlatform, setBuildPlatform] = useState<MobilePlatform>("ios");
  const [buildBranch, setBuildBranch] = useState("main");
  const [buildVersion, setBuildVersion] = useState("2.5.0");
  const [buildNumber, setBuildNumber] = useState(107);
  const [buildCommit, setBuildCommit] = useState("b4f1a2c");
  const [isSubmittingBuild, setIsSubmittingBuild] = useState(false);

  // Push state
  const [apnsKeyId, setApnsKeyId] = useState("APN-AUTHKEY-771");
  const [apnsTeamId, setApnsTeamId] = useState("APPLE-DEV-9812");
  const [fcmProjectId, setFcmProjectId] = useState("unierp-fcm-prod");
  const [isSubmittingPushConfig, setIsSubmittingPushConfig] = useState(false);

  // Promote state
  const [promoteChannel, setPromoteChannel] = useState<"alpha" | "beta" | "production">("production");
  const [promoteVersion, setPromoteVersion] = useState("2.5.0-beta.1");
  const [promoteBuildNumber, setPromoteBuildNumber] = useState(106);
  const [promoteRollout, setPromoteRollout] = useState(50);
  const [isSubmittingPromote, setIsSubmittingPromote] = useState(false);

  const buildPlatformId = useId();
  const buildBranchId = useId();
  const promoteChannelId = useId();

  const handleBuild = async () => {
    setIsSubmittingBuild(true);
    try {
      await onTriggerBuild({
        platform: buildPlatform,
        branch: buildBranch,
        version: buildVersion,
        buildNumber,
        commitHash: buildCommit,
      });
      onCloseBuildModal();
    } finally {
      setIsSubmittingBuild(false);
    }
  };

  const handlePush = async () => {
    setIsSubmittingPushConfig(true);
    try {
      await onSavePushConfig({
        provider: configProvider,
        apnsKeyId,
        apnsTeamId,
        fcmProjectId,
      });
      onClosePushConfigModal();
    } finally {
      setIsSubmittingPushConfig(false);
    }
  };

  const handlePromote = async () => {
    setIsSubmittingPromote(true);
    try {
      await onPromoteChannel({
        channel: promoteChannel,
        version: promoteVersion,
        buildNumber: promoteBuildNumber,
        rolloutPercentage: promoteRollout,
      });
      onClosePromoteModal();
    } finally {
      setIsSubmittingPromote(false);
    }
  };

  return (
    <>
      {/* TRIGGER BUILD MODAL (EC-11.1) */}
      <Modal
        open={buildModalOpen}
        onClose={onCloseBuildModal}
        title="Trigger Mobile Platform Build"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <div className={styles.formGroup}>
            <label htmlFor={buildPlatformId} className={styles.formLabel}>Target Platform</label>
            <select
              id={buildPlatformId}
              aria-label="Select platform"
              className={styles.formSelect}
              value={buildPlatform}
              onChange={(e) => setBuildPlatform(e.target.value as MobilePlatform)}
            >
              <option value="ios">iOS (Xcode runner, IPA artifact)</option>
              <option value="android">Android (Gradle runner, AAB artifact)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor={buildBranchId} className={styles.formLabel}>Source Branch</label>
            <select
              id={buildBranchId}
              aria-label="Select source branch"
              className={styles.formSelect}
              value={buildBranch}
              onChange={(e) => setBuildBranch(e.target.value)}
            >
              <option value="main">main (nightly staging)</option>
              <option value="release/2.5.0">release/2.5.0 (release candidate)</option>
              <option value="hotfix/security-patch">hotfix/security-patch</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <FormField label="Semantic Version" required>
              <Input
                value={buildVersion}
                onChange={(e) => setBuildVersion(e.target.value)}
              />
            </FormField>
            <FormField label="Build Number" required>
              <Input
                type="number"
                value={buildNumber}
                onChange={(e) => setBuildNumber(Number(e.target.value))}
              />
            </FormField>
          </div>

          <FormField label="Git Commit Hash" required>
            <Input
              value={buildCommit}
              onChange={(e) => setBuildCommit(e.target.value)}
            />
          </FormField>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
            <Button variant="outline" onClick={onCloseBuildModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isSubmittingBuild || !buildVersion.trim()}
              onClick={handleBuild}
            >
              {isSubmittingBuild ? "Dispatching..." : "Start Build Pipeline"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* BUILD LOG VIEWER MODAL (EC-11.1) */}
      <Modal
        open={logModalOpen}
        onClose={onCloseLogModal}
        title={`Build Logs: ${selectedBuildForLog?.platform.toUpperCase()} #${selectedBuildForLog?.buildNumber}`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-2) 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            <span>Version: v{selectedBuildForLog?.version}</span>
            <span>Commit: {selectedBuildForLog?.commitHash}</span>
            <span>Branch: {selectedBuildForLog?.branch}</span>
          </div>
          <div className={styles.logTerminal}>
            {`[00:00.01] Worker allocated on runner cluster (macos-14-apple-silicon)\n` +
              `[00:01.12] Checking out commit ${selectedBuildForLog?.commitHash || "HEAD"} on branch ${selectedBuildForLog?.branch || "main"}\n` +
              `[00:03.45] Restoring CocoaPods/Gradle dependency cache: 94% cache hit\n` +
              `[00:12.80] Running static code analysis & lint audit: 0 errors, 2 warnings\n` +
              `[00:35.20] Compiling Swift/Kotlin bytecode with LLVM toolchain optimization\n` +
              `[01:14.60] Embedding provision profiles and code signing binary with Apple/Google distribution key\n` +
              `[01:32.40] Generating release symbols (dSYM/ProGuard mappings) and uploading to crash reporting\n` +
              `[01:45.00] Artifact created: ${selectedBuildForLog?.artifactSizeMb || "42.0"} MB (${selectedBuildForLog?.status || "READY"})\n` +
              `[01:45.10] Build pipeline successfully concluded with exit code 0.`}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="outline" onClick={onCloseLogModal}>
              Close Log Viewer
            </Button>
          </div>
        </div>
      </Modal>

      {/* PUSH GATEWAY CONFIG MODAL (EC-11.2) */}
      <Modal
        open={pushConfigModalOpen}
        onClose={onClosePushConfigModal}
        title={`Configure ${configProvider} Push Gateway Keys`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          {configProvider === "APNs" ? (
            <>
              <FormField label="Apple Auth Key ID (10-character key ID)" required>
                <Input
                  value={apnsKeyId}
                  onChange={(e) => setApnsKeyId(e.target.value)}
                  placeholder="e.g. 9X12AB78CD"
                />
              </FormField>
              <FormField label="Apple Developer Team ID" required>
                <Input
                  value={apnsTeamId}
                  onChange={(e) => setApnsTeamId(e.target.value)}
                  placeholder="e.g. TEAM9812ABCD"
                />
              </FormField>
            </>
          ) : (
            <FormField label="Firebase Project ID" required>
              <Input
                value={fcmProjectId}
                onChange={(e) => setFcmProjectId(e.target.value)}
                placeholder="e.g. unierp-fcm-prod"
              />
            </FormField>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
            <Button variant="outline" onClick={onClosePushConfigModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isSubmittingPushConfig}
              onClick={handlePush}
            >
              {isSubmittingPushConfig ? "Saving..." : "Save Gateway Credentials"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* PROMOTE CHANNEL MODAL */}
      <Modal
        open={promoteModalOpen}
        onClose={onClosePromoteModal}
        title="Promote Mobile Release Ring"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <div className={styles.formGroup}>
            <label htmlFor={promoteChannelId} className={styles.formLabel}>Target Ring</label>
            <select
              id={promoteChannelId}
              aria-label="Select target channel"
              className={styles.formSelect}
              value={promoteChannel}
              onChange={(e) => setPromoteChannel(e.target.value as "alpha" | "beta" | "production")}
            >
              <option value="production">Production (Public App Store / Play Store)</option>
              <option value="beta">Beta (TestFlight / Google Play Beta)</option>
              <option value="alpha">Alpha (Internal Operator Testing)</option>
            </select>
          </div>

          <FormField label="Version" required>
            <Input
              value={promoteVersion}
              onChange={(e) => setPromoteVersion(e.target.value)}
            />
          </FormField>

          <FormField label="Rollout Percentage (0-100%)" required>
            <Input
              type="number"
              value={promoteRollout}
              onChange={(e) => setPromoteRollout(Number(e.target.value))}
            />
          </FormField>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
            <Button variant="outline" onClick={onClosePromoteModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isSubmittingPromote}
              onClick={handlePromote}
            >
              {isSubmittingPromote ? "Promoting..." : "Confirm Promotion"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
