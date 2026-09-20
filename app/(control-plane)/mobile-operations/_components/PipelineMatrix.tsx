"use client";

import {
  Smartphone,
  Play,
  Terminal,
} from "lucide-react";
import { Badge, Button } from "@kannan19302/ui";
import styles from "../mobile.module.css";
import type { MobileBuild } from "@/lib/mobile-schema";

interface PipelineMatrixProps {
  canDeployMobile: boolean;
  onOpenTriggerBuild: () => void;
  onSelectBuildForLog: (build: MobileBuild) => void;
  buildsList: MobileBuild[];
}

export function PipelineMatrix({
  canDeployMobile,
  onOpenTriggerBuild,
  onSelectBuildForLog,
  buildsList,
}: PipelineMatrixProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Build Pipeline Matrix (Platform × Branch × Status)
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Continuous delivery pipeline monitoring across iOS Xcode and Android Gradle build runners.
          </p>
        </div>
        {canDeployMobile && (
          <Button size="sm" variant="primary" onClick={onOpenTriggerBuild}>
            <Play size={14} />
            Trigger New Build
          </Button>
        )}
      </div>

      {/* Platform × Branch Matrix Grid */}
      <div className={styles.pipelineMatrix}>
        {/* iOS main */}
        <div className={styles.pipelineCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Smartphone size={18} color="var(--color-primary)" />
              <strong>iOS · main</strong>
            </div>
            <Badge variant="primary">READY</Badge>
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span>Latest: v2.5.0-beta.1 (#105)</span>
            <span className={styles.monoBadge}>commit: a1c9d2f</span>
            <span>Artifact: 43.2 MB · IPA signed</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onSelectBuildForLog(buildsList.find((b) => b.platform === "ios" && b.branch === "main") || buildsList[0]);
            }}
          >
            <Terminal size={13} />
            View Build Log
          </Button>
        </div>

        {/* Android main */}
        <div className={styles.pipelineCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Smartphone size={18} color="var(--color-success)" />
              <strong>Android · main</strong>
            </div>
            <Badge variant="primary">READY</Badge>
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span>Latest: v2.5.0-beta.1 (#106)</span>
            <span className={styles.monoBadge}>commit: a1c9d2f</span>
            <span>Artifact: 38.9 MB · AAB aligned</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onSelectBuildForLog(buildsList.find((b) => b.platform === "android" && b.branch === "main") || buildsList[1]);
            }}
          >
            <Terminal size={13} />
            View Build Log
          </Button>
        </div>

        {/* iOS release/2.4.0 */}
        <div className={styles.pipelineCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Smartphone size={18} color="var(--color-primary)" />
              <strong>iOS · release/2.4.0</strong>
            </div>
            <Badge variant="success">PUBLISHED</Badge>
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span>Active Prod: v2.4.0 (#104)</span>
            <span className={styles.monoBadge}>commit: e4f8b1c</span>
            <span>App Store Approved</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onSelectBuildForLog(buildsList.find((b) => b.buildNumber === 104) || buildsList[0]);
            }}
          >
            <Terminal size={13} />
            View Build Log
          </Button>
        </div>

        {/* Android release/2.4.0 */}
        <div className={styles.pipelineCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Smartphone size={18} color="var(--color-success)" />
              <strong>Android · release/2.4.0</strong>
            </div>
            <Badge variant="success">PUBLISHED</Badge>
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span>Active Prod: v2.4.0 (#103)</span>
            <span className={styles.monoBadge}>commit: e4f8b1c</span>
            <span>Google Play Track Active</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onSelectBuildForLog(buildsList.find((b) => b.buildNumber === 103) || buildsList[1]);
            }}
          >
            <Terminal size={13} />
            View Build Log
          </Button>
        </div>
      </div>
    </div>
  );
}
