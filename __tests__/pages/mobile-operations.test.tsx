/**
 * Unit & Component Tests for Mobile Platform Operations (PCC-11)
 *
 * Verifies:
 * - Tab navigation: Pipeline Status Grid, Build Archive, Push Gateway Config, Release Channels, Code Signing
 * - EC-11.1: Build pipeline status grid displays platform × branch × status, triggers new build, and opens log viewer
 * - EC-11.2: Push gateway configuration modal updates APNs/FCM keys and dispatches diagnostic push notification
 * - Release channel promotion and staged rollout controls
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MobileOperationsPage from "../../app/(control-plane)/mobile-operations/page";

const mockUsePermission = vi.fn((_perm?: string) => true);
vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...(actual as object),
    usePermission: (perm: string) => mockUsePermission(perm),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/mobile-operations",
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(async (url: string) => {
      return { data: [] };
    }),
    post: vi.fn(async (url: string, body: any) => {
      if (url.includes("/push-providers/test")) {
        return { success: true, messageId: "msg-test-12345" };
      }
      return { success: true, data: body };
    }),
    put: vi.fn(async (url: string, body: any) => {
      return { success: true, data: body };
    }),
  },
}));

vi.mock("@/lib/data", () => ({
  useList: vi.fn(() => ({ data: [], total: 0, loading: false, error: null, reload: vi.fn() })),
  useItem: vi.fn(() => ({ data: {}, loading: false, error: null, reload: vi.fn() })),
}));

describe("Mobile Platform Operations Console (PCC-11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
  });

  it("renders mobile command console with KPIs and navigation tabs", () => {
    render(<MobileOperationsPage />);

    expect(screen.getByText("Mobile Platform Operations")).toBeDefined();
    expect(screen.getByText("Total Mobile Builds")).toBeDefined();
    expect(screen.getByText("Production Release")).toBeDefined();
    expect(screen.getByText("Min Compatibility Floor")).toBeDefined();
    expect(screen.getByText("Emergency Killswitch")).toBeDefined();

    expect(screen.getByRole("button", { name: /Pipeline Status Grid/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Build Archive/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Push Gateway Config/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Release Channels/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Code Signing & Profiles/i })).toBeDefined();
  });

  it("satisfies EC-11.1: build pipeline shows platform × branch × status grid, triggers build, and views logs", async () => {
    render(<MobileOperationsPage />);

    // Verify matrix cards (platform × branch)
    expect(screen.getByText("iOS · main")).toBeDefined();
    expect(screen.getByText("Android · main")).toBeDefined();
    expect(screen.getByText("iOS · release/2.4.0")).toBeDefined();
    expect(screen.getByText("Android · release/2.4.0")).toBeDefined();

    // Open Build Log Viewer
    const logBtns = screen.getAllByRole("button", { name: /View Build Log/i });
    expect(logBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(logBtns[0]);

    expect(screen.getByText(/Compiling Swift\/Kotlin bytecode/i)).toBeDefined();

    const closeLogBtn = screen.getByRole("button", { name: /Close Log Viewer/i });
    fireEvent.click(closeLogBtn);

    // Trigger New Build Modal
    const triggerBtns = screen.getAllByRole("button", { name: /Trigger (New )?Build/i });
    expect(triggerBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(triggerBtns[0]);

    expect(screen.getByText("Trigger Mobile Platform Build")).toBeDefined();

    const versionInput = screen.getByDisplayValue("2.5.0");
    fireEvent.change(versionInput, { target: { value: "2.6.0" } });

    const submitBuildBtn = screen.getByRole("button", { name: /Start Build Pipeline/i });
    fireEvent.click(submitBuildBtn);

    await waitFor(() => {
      expect(screen.queryByText("Start Build Pipeline")).toBeNull();
    });
  });

  it("satisfies EC-11.2: push gateway config updates APNs/FCM keys and dispatches test notification", async () => {
    render(<MobileOperationsPage />);

    // Switch to Push Gateway tab
    const pushTab = screen.getByRole("button", { name: /Push Gateway Config/i });
    fireEvent.click(pushTab);

    // Verify gateways
    expect(screen.getByText("APNs Push Gateway")).toBeDefined();
    expect(screen.getByText("FCM Push Gateway")).toBeDefined();

    // Dispatch test notification
    const testPushBtns = screen.getAllByRole("button", { name: /Dispatch Test Notification/i });
    expect(testPushBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(testPushBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Test payload dispatched via/i)).toBeDefined();
    });

    // Open Configure Gateway Keys modal
    const configBtn = screen.getByRole("button", { name: /Configure Gateway Keys/i });
    fireEvent.click(configBtn);

    expect(screen.getByText(/Configure APNs Push Gateway Keys/i)).toBeDefined();

    const keyIdInput = screen.getByPlaceholderText(/e.g. 9X12AB78CD/i);
    fireEvent.change(keyIdInput, { target: { value: "KEY998877" } });

    const saveKeysBtn = screen.getByRole("button", { name: /Save Gateway Credentials/i });
    fireEvent.click(saveKeysBtn);

    await waitFor(() => {
      expect(screen.queryByText("Save Gateway Credentials")).toBeNull();
    });
  });

  it("promotes mobile release channels and inspects signing profiles", async () => {
    render(<MobileOperationsPage />);

    // Switch to Release Channels tab
    const channelsTab = screen.getByRole("button", { name: /Release Channels/i });
    fireEvent.click(channelsTab);

    expect(screen.getByText("production Channel")).toBeDefined();
    expect(screen.getByText("beta Channel")).toBeDefined();

    // Open promote modal
    const promoteBtn = screen.getByRole("button", { name: /Promote Release Channel/i });
    fireEvent.click(promoteBtn);

    expect(screen.getByText("Promote Mobile Release Ring")).toBeDefined();

    const confirmPromoteBtn = screen.getByRole("button", { name: /Confirm Promotion/i });
    fireEvent.click(confirmPromoteBtn);

    await waitFor(() => {
      expect(screen.queryByText("Confirm Promotion")).toBeNull();
    });

    // Switch to Signing tab
    const signingTab = screen.getByRole("button", { name: /Code Signing & Profiles/i });
    fireEvent.click(signingTab);

    expect(screen.getByText("Apple Developer Distribution Identity")).toBeDefined();
    expect(screen.getByText("Google Play App Signing Key")).toBeDefined();
  });
});
