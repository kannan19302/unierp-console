import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useSmartDefaults, detectOperatorRegion } from "@/lib/hooks/use-smart-defaults";

describe("useSmartDefaults (WS8.5)", () => {
  it("computes default values including 90-day expiry and currency", () => {
    const { result } = renderHook(() => useSmartDefaults());

    expect(result.current.currency).toBe("USD");
    expect(result.current.apiKeyExpiryDays).toBe(90);
    expect(result.current.defaultTier).toBe("standard");
    expect(result.current.apiKeyExpiryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("detects operator region correctly based on timezone", () => {
    expect(detectOperatorRegion("Europe/London")).toBe("eu-west-1");
    expect(detectOperatorRegion("Europe/Berlin")).toBe("eu-west-1");
    expect(detectOperatorRegion("Asia/Kolkata")).toBe("ap-south-1");
    expect(detectOperatorRegion("Asia/Tokyo")).toBe("ap-northeast-1");
    expect(detectOperatorRegion("Australia/Sydney")).toBe("ap-southeast-1");
    expect(detectOperatorRegion("America/New_York")).toBe("us-east-1");
  });

  it("applies custom overrides", () => {
    const { result } = renderHook(() =>
      useSmartDefaults({ currency: "EUR", defaultTier: "enterprise" })
    );

    expect(result.current.currency).toBe("EUR");
    expect(result.current.defaultTier).toBe("enterprise");
    expect(result.current.apiKeyExpiryDays).toBe(90);
  });
});
