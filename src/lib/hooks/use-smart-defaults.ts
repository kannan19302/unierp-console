"use client";

import { useMemo } from "react";

export interface SmartDefaults {
  region: string;
  currency: string;
  apiKeyExpiryDays: number;
  apiKeyExpiryDate: string;
  defaultTier: "starter" | "standard" | "enterprise";
  environment: "development" | "staging" | "production";
  locale: string;
  timezone: string;
}

export function detectOperatorRegion(timeZone?: string): string {
  const tz =
    timeZone ||
    (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC");

  if (
    tz.includes("Europe") ||
    tz.includes("London") ||
    tz.includes("Paris") ||
    tz.includes("Berlin")
  ) {
    return "eu-west-1";
  }
  if (tz.includes("Asia/Kolkata") || tz.includes("India")) {
    return "ap-south-1";
  }
  if (tz.includes("Asia/Tokyo") || tz.includes("Japan")) {
    return "ap-northeast-1";
  }
  if (tz.includes("Asia/Singapore") || tz.includes("Australia") || tz.includes("Sydney")) {
    return "ap-southeast-1";
  }
  return "us-east-1";
}

export function useSmartDefaults(customOverrides?: Partial<SmartDefaults>): SmartDefaults {
  return useMemo(() => {
    const tz =
      typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
    const region = detectOperatorRegion(tz);
    const ninetyDaysAhead = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const defaults: SmartDefaults = {
      region,
      currency: "USD",
      apiKeyExpiryDays: 90,
      apiKeyExpiryDate: ninetyDaysAhead,
      defaultTier: "standard",
      environment: "production",
      locale: typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US",
      timezone: tz,
      ...customOverrides,
    };

    return defaults;
  }, [customOverrides]);
}
