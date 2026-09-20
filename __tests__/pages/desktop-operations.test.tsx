/**
 * Unit & Component Tests for Desktop Platform Operations (PCC-12)
 *
 * Verifies:
 * - Tab navigation: Auto-Update Channels, Installer Packages & Signing, Code Signing Profiles, Update Policy
 * - EC-12.1: Auto-update channels list with version assignment and channel rollback
 * - EC-12.2: Per-build code signing verification status (Authenticode, Notarization) and installer registration
 * - Emergency killswitch and update policy display
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DesktopOperationsPage from "../../app/(control-plane)/desktop-operations/page";

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
  usePathname: () => "/desktop-operations",
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(async (_url: string) => {
      return { data: [] };
    }),
    post: vi.fn(async (url: string, body: any) => {
      if (url.includes("/channels/promote")) {
        return { success: true, channel: body.channel, version: body.version };
      }
      return { success: true, data: body };
    }),
    put: vi.fn(async (_url: string, body: any) => {
      return { success: true, data: body };
    }),
  },
}));

vi.mock("@/lib/data", () => ({
  useList: vi.fn(() => ({ data: [], total: 0, loading: false, error: null, reload: vi.fn() })),
  useItem: vi.fn(() => ({ data: {}, loading: false, error: null, reload: vi.fn() })),
}));

describe("Desktop Platform Operations Console (PCC-12)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
  });

  it("renders desktop operations console with KPIs and navigation tabs", () => {
    render(<DesktopOperationsPage />);

    expect(screen.getByText("Desktop Platform Operations")).toBeDefined();
    expect(screen.getByText("Total Native Builds")).toBeDefined();
    expect(screen.getByText("Latest Desktop Release")).toBeDefined();
    expect(screen.getByText("Min Compatibility Floor")).toBeDefined();
    expect(screen.getByText("Code Signing Posture")).toBeDefined();

    expect(screen.getByRole("button", { name: /Auto-Update Channels/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Installer Packages & Signing/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Code Signing Profiles/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Auto-Update Policy/i })).toBeDefined();
  });

  it("satisfies EC-12.1: auto-update channels list with version assignment and channel rollback", async () => {
    render(<DesktopOperationsPage />);

    // Channels render
    expect(screen.getByText("stable Ring")).toBeDefined();
    expect(screen.getByText("beta Ring")).toBeDefined();
    expect(screen.getByText("nightly Ring")).toBeDefined();

    // Change Version Modal
    const changeVersionBtns = screen.getAllByRole("button", { name: /Change Version/i });
    expect(changeVersionBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(changeVersionBtns[0]);

    expect(screen.getByText("Assign Build Version to Auto-Update Channel")).toBeDefined();

    const versionInput = screen.getByDisplayValue("1.8.0");
    fireEvent.change(versionInput, { target: { value: "1.9.1" } });

    const deployBtn = screen.getByRole("button", { name: /Deploy Version to Channel/i });
    fireEvent.click(deployBtn);

    await waitFor(() => {
      expect(screen.queryByText("Deploy Version to Channel")).toBeNull();
    });

    // Rollback Button on non-stable channel
    const rollbackBtns = screen.getAllByRole("button", { name: /Rollback/i });
    expect(rollbackBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(rollbackBtns[0]);
  });

  it("satisfies EC-12.2: per-build code signing verification status and installer registration", async () => {
    render(<DesktopOperationsPage />);

    // Switch to Builds & Signing tab
    const buildsTab = screen.getByRole("button", { name: /Installer Packages & Signing/i });
    fireEvent.click(buildsTab);

    // Verify table headers & contents
    expect(screen.getByText("Target OS")).toBeDefined();
    expect(screen.getByText("Signing Status (EC-12.2)")).toBeDefined();
    expect(screen.getAllByText("windows-x64").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("macos-arm64")).toBeDefined();
    expect(screen.getByText("linux-x64")).toBeDefined();
    expect(screen.getByText("NOTARIZED")).toBeDefined();

    // Re-verify sign action
    const resignBtns = screen.getAllByRole("button", { name: /Re-Verify Sign/i });
    expect(resignBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(resignBtns[0]);

    // Register Installer Build modal
    const registerBuildBtns = screen.getAllByRole("button", { name: /Register Installer( Build)?/i });
    expect(registerBuildBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(registerBuildBtns[0]);

    expect(screen.getByText("Register Desktop Installer Build Artifact")).toBeDefined();

    const registerVersionInput = screen.getByDisplayValue("1.9.0");
    fireEvent.change(registerVersionInput, { target: { value: "1.9.2" } });

    const submitRegisterBtn = screen.getByRole("button", { name: /^Register Build$/i });
    fireEvent.click(submitRegisterBtn);

    await waitFor(() => {
      expect(screen.queryByText("Register Desktop Installer Build Artifact")).toBeNull();
    });
  });

  it("renders code signing profiles and update policy controls", () => {
    render(<DesktopOperationsPage />);

    // Switch to Signing profiles tab
    const signingTab = screen.getByRole("button", { name: /Code Signing Profiles/i });
    fireEvent.click(signingTab);

    expect(screen.getByText("Apple Notarization")).toBeDefined();
    expect(screen.getByText("Windows EV Authenticode")).toBeDefined();
    expect(screen.getByText("Linux GPG")).toBeDefined();

    // Switch to Policy tab
    const policyTab = screen.getByRole("button", { name: /Auto-Update Policy/i });
    fireEvent.click(policyTab);

    expect(screen.getByText("Client Compatibility & Auto-Update Policy")).toBeDefined();
    expect(screen.getByText("Emergency Desktop Killswitch")).toBeDefined();
    expect(screen.getByText("INACTIVE (NOMINAL)")).toBeDefined();
  });
});
