"use client";

import { Radio } from "lucide-react";
import { Badge, Button, Card } from "@kannan19302/ui";
import styles from "../mobile.module.css";
import type { ReleaseChannel } from "@/lib/mobile-schema";

interface ReleaseChannelsProps {
  channelsList: ReleaseChannel[];
  canDeployMobile: boolean;
  onOpenPromoteModal: () => void;
}

export function ReleaseChannels({
  channelsList,
  canDeployMobile,
  onOpenPromoteModal,
}: ReleaseChannelsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Release Channels & Staged Rollouts
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Manage alpha, beta, and production distribution rings and gradual percentage rollouts.
          </p>
        </div>
        {canDeployMobile && (
          <Button size="sm" variant="primary" onClick={onOpenPromoteModal}>
            <Radio size={14} />
            Promote Release Channel
          </Button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {channelsList.map((ch) => (
          <Card key={ch.channel} padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "var(--text-base)", textTransform: "capitalize" }}>
                  {ch.channel} Channel
                </h4>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  Current Target: <strong>v{ch.activeVersion}</strong> (Build #{ch.activeBuildNumber})
                </p>
              </div>
              <Badge variant={ch.channel === "production" ? "success" : "primary"}>
                {ch.rolloutPercentage}% Audience
              </Badge>
            </div>
            <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "var(--space-3)" }}>
              <span>Min iOS: {ch.minOsVersion.ios}</span>
              <span>Min Android: {ch.minOsVersion.android}</span>
              <span>Updated: {new Date(ch.updatedAt).toLocaleDateString()}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
