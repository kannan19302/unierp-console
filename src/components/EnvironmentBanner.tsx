"use client";

import React from "react";
import styles from "./EnvironmentBanner.module.css";

export interface EnvironmentBannerProps {
  environment?: string;
  forceShow?: boolean;
}

export function EnvironmentBanner({ environment, forceShow = false }: EnvironmentBannerProps) {
  const env =
    environment ||
    process.env.NEXT_PUBLIC_ENV ||
    process.env.NODE_ENV ||
    "development";

  const normalizedEnv = env.toLowerCase();

  // Hide in production unless explicitly forced
  if (normalizedEnv === "production" && !forceShow) {
    return null;
  }

  const label =
    normalizedEnv === "development"
      ? "🛠️ DEV ENVIRONMENT — Local / Non-Production Control Plane"
      : normalizedEnv === "staging"
      ? "⚠️ STAGING ENVIRONMENT — Pre-Production Data Only"
      : normalizedEnv === "test"
      ? "🧪 TEST / CI ENVIRONMENT"
      : `🔴 ${normalizedEnv.toUpperCase()} ENVIRONMENT`;

  const variantClass = styles[normalizedEnv] || styles.development;

  return (
    <aside className={`${styles.banner} ${variantClass}`} role="status" aria-label="Environment Banner">
      <span>{label}</span>
    </aside>
  );
}
