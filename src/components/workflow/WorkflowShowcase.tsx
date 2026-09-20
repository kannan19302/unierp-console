"use client";

import React, { useState } from "react";
import {
  StageProgressionBar,
  LifecycleTracker,
  ApprovalChain,
  type StageItem,
  type LifecycleStage,
  type ApprovalStep,
} from "@kannan19302/ui/workflow";
import styles from "./WorkflowShowcase.module.css";

export interface WorkflowShowcaseProps {
  currentStage?: string;
  className?: string;
}

export function WorkflowShowcase({ currentStage = "review", className = "" }: WorkflowShowcaseProps) {
  const [activeStageId, setActiveStageId] = useState(currentStage);

  const stages: StageItem[] = [
    { id: "draft", label: "Configuration", status: "completed" },
    { id: "review", label: "Compliance Review", status: "current" },
    { id: "approval", label: "Dual-Key Approval", status: "upcoming" },
    { id: "deployed", label: "Production Deployed", status: "upcoming" },
  ];

  const lifecycleStages: LifecycleStage[] = [
    { id: "trial", name: "Trial Provisioning", description: "14-day sandbox access" },
    { id: "active", name: "Active Enterprise", description: "Production cluster operational" },
    { id: "suspended", name: "Suspension Grace", description: "Read-only access hold" },
    { id: "deprovisioned", name: "Deprovisioned", description: "Cryptographically purged" },
  ];

  const approvalSteps: ApprovalStep[] = [
    {
      id: "sec-step",
      title: "Security Officer Sign-off",
      status: "approved",
      approvers: [
        {
          id: "appr-1",
          name: "Security Lead",
          role: "SecOps",
          status: "approved",
          decidedAt: "2026-09-20T10:00:00Z",
        },
      ],
    },
    {
      id: "admin-step",
      title: "Provider Super Admin Key Release",
      status: "pending",
      approvers: [
        {
          id: "appr-2",
          name: "Universal Super Admin",
          role: "SUPER_ADMIN",
          status: "pending",
        },
      ],
    },
  ];

  return (
    <div className={`${styles.showcaseWrap} ${className}`}>
      <div>
        <div className={styles.sectionHeader}>Execution Pipeline Progression</div>
        <StageProgressionBar
          stages={stages}
          currentStageId={activeStageId}
          onStageClick={(s) => setActiveStageId(s.id)}
          ariaLabel="Deployment stage progress"
        />
      </div>

      <div>
        <div className={styles.sectionHeader}>Tenant Lifecycle State</div>
        <LifecycleTracker
          stages={lifecycleStages}
          currentStageId="active"
          onSelectStage={() => {}}
        />
      </div>

      <div>
        <div className={styles.sectionHeader}>Privileged Operation Approval Chain</div>
        <ApprovalChain steps={approvalSteps} />
      </div>
    </div>
  );
}
