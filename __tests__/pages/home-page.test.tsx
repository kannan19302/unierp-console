/**
 * Unit & Integration Tests for Frappe ERPNext-Inspired Home Desk Launcher
 * Workstream 2 (WS2): 22 PCC Domain Tiles, Real-time Search, Cluster Filter, Keyboard Shortcuts
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomeLauncherPage from "../../app/(control-plane)/home/page";
import { PCC_REGISTRY } from "@/lib/pcc-registry";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  usePathname: () => "/home",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Frappe ERPNext-Inspired Home Desk Launcher (WS2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the hero header, status telemetry, and all 22 PCC domain tiles", () => {
    render(<HomeLauncherPage />);

    // Header & Telemetry
    expect(screen.getByText("Platform Control Center")).toBeDefined();
    expect(screen.getByText("ALL SYSTEMS NOMINAL")).toBeDefined();
    expect(screen.getByText("99.99% Uptime")).toBeDefined();
    expect(screen.getByText("RLS ENFORCED")).toBeDefined();
    expect(screen.getByText("142")).toBeDefined();

    // All 22 PCC tiles rendered in the grid
    const grid = screen.getByTestId("pcc-icon-grid");
    expect(grid).toBeDefined();

    PCC_REGISTRY.forEach((entry) => {
      expect(screen.getByTestId(`pcc-tile-${entry.id}`)).toBeDefined();
      expect(screen.getByText(entry.pccCode)).toBeDefined();
    });

    // Check specific critical domain tiles
    expect(screen.getByText("Operations")).toBeDefined();
    expect(screen.getByText("Security")).toBeDefined();
    expect(screen.getByText("Developers")).toBeDefined();
    expect(screen.getByText("AI Governance")).toBeDefined();
    expect(screen.getByText("Analytics")).toBeDefined();
  });

  it("ensures each tile has accessible aria-label with code, title, and cluster", () => {
    render(<HomeLauncherPage />);

    const opsTile = screen.getByTestId("pcc-tile-operations");
    expect(opsTile.getAttribute("aria-label")).toContain("PCC-01: Platform Operations & Fleet");

    const aiTile = screen.getByTestId("pcc-tile-ai");
    expect(aiTile.getAttribute("aria-label")).toContain("PCC-21: AI Models & Governance");
  });

  it("filters tiles in real-time via search input and renders empty state on no match", () => {
    render(<HomeLauncherPage />);

    const searchInput = screen.getByTestId("pcc-search-input") as HTMLInputElement;

    // Filter by "Subscriptions"
    fireEvent.change(searchInput, { target: { value: "Subscriptions" } });
    expect(screen.getByTestId("pcc-tile-subscriptions")).toBeDefined();
    expect(screen.queryByTestId("pcc-tile-operations")).toBeNull();

    // Filter by PCC code "PCC-21"
    fireEvent.change(searchInput, { target: { value: "PCC-21" } });
    expect(screen.getByTestId("pcc-tile-ai")).toBeDefined();
    expect(screen.queryByTestId("pcc-tile-subscriptions")).toBeNull();

    // Non-existent search query
    fireEvent.change(searchInput, { target: { value: "xyznonexistent999" } });
    expect(screen.getByText(/No platform domains match/i)).toBeDefined();

    // Click "Reset Filters"
    const resetBtn = screen.getByRole("button", { name: /Reset Filters/i });
    fireEvent.click(resetBtn);
    expect(screen.getByTestId("pcc-tile-operations")).toBeDefined();
    expect(screen.getByTestId("pcc-tile-ai")).toBeDefined();
  });

  it("filters tiles by cluster pill tabs", () => {
    render(<HomeLauncherPage />);

    // Click "Security" cluster filter
    const securityFilter = screen.getByTestId("filter-security");
    fireEvent.click(securityFilter);

    // Should show security domains (Security, Keys & Secrets, Compliance, Threat Intel)
    expect(screen.getByTestId("pcc-tile-security")).toBeDefined();
    expect(screen.getByTestId("pcc-tile-keys-secrets")).toBeDefined();
    expect(screen.getByTestId("pcc-tile-compliance")).toBeDefined();
    expect(screen.getByTestId("pcc-tile-threats")).toBeDefined();

    // Should NOT show operations or developers
    expect(screen.queryByTestId("pcc-tile-operations")).toBeNull();
    expect(screen.queryByTestId("pcc-tile-developers")).toBeNull();

    // Click "All Domains" filter
    const allFilter = screen.getByTestId("filter-all");
    fireEvent.click(allFilter);
    expect(screen.getByTestId("pcc-tile-operations")).toBeDefined();
    expect(screen.getByTestId("pcc-tile-developers")).toBeDefined();
  });

  it("handles keyboard navigation: '/' focuses search and single key shortcuts navigate", () => {
    render(<HomeLauncherPage />);

    const searchInput = screen.getByTestId("pcc-search-input");

    // Press '/' to focus search
    fireEvent.keyDown(window, { key: "/" });
    expect(document.activeElement).toBe(searchInput);

    // Press Escape to blur
    fireEvent.keyDown(window, { key: "Escape" });
    expect(document.activeElement).not.toBe(searchInput);

    // Press 'O' to navigate to Operations
    fireEvent.keyDown(window, { key: "o" });
    expect(mockPush).toHaveBeenCalledWith("/ops");

    // Press 'S' to navigate to Security
    fireEvent.keyDown(window, { key: "s" });
    expect(mockPush).toHaveBeenCalledWith("/security/policies");
  });
});
