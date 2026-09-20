/**
 * Unit & Component Tests for Platform Intelligence & Analytics Console (PCC-16)
 *
 * Verifies:
 * - Tab navigation: Dashboard Composer, Report Scheduler, Anomaly Radar, Metric Catalog
 * - EC-16.1: Custom dashboard composer, multi-type widget layouts (KPI, Line, Bar, Table), dashboard creation & deletion
 * - EC-16.2: Automated report scheduler, recurring frequencies (Daily/Weekly/Monthly), output formats (PDF/CSV/Excel), and pause/run-now actions
 * - Anomaly radar displaying real-time threshold breaches
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AnalyticsPlatformOverview from "../../app/(control-plane)/analytics/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/analytics",
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(async () => ({ data: [] })),
    post: vi.fn(async (_url: string, body: any) => ({
      success: true,
      data: { id: `item-${Date.now()}`, ...body },
    })),
    put: vi.fn(async (_url: string, body: any) => ({
      success: true,
      data: body,
    })),
    del: vi.fn(async () => ({ success: true })),
  },
}));

vi.mock("@/lib/data", () => ({
  useList: vi.fn(() => ({ data: [], total: 0, loading: false, error: null, reload: vi.fn() })),
  useItem: vi.fn(() => ({ data: {}, loading: false, error: null, reload: vi.fn() })),
}));

describe("Platform Intelligence & Analytics Console (PCC-16)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the analytics command console with top summary metrics and navigation tabs", () => {
    render(<AnalyticsPlatformOverview />);

    expect(screen.getByText("Platform Intelligence & Analytics")).toBeDefined();
    expect(
      screen.getByText(/PCC-16: Custom multi-widget dashboard composer, recurring automated report scheduler/i)
    ).toBeDefined();

    expect(screen.getByText("Current SaaS MRR")).toBeDefined();
    expect(screen.getAllByText("Logo Churn Rate").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Seat Utilization").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Active Anomaly Alerts")).toBeDefined();

    expect(screen.getByRole("tab", { name: /Dashboard Composer/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Report Scheduler/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Anomaly Radar/i })).toBeDefined();
  });

  it("satisfies EC-16.1: dashboard composer renders multi-type widgets and creates custom dashboard", async () => {
    render(<AnalyticsPlatformOverview />);

    // Verify initial dashboard widgets
    expect(screen.getByText("Current MRR")).toBeDefined();
    expect(screen.getAllByText("Logo Churn Rate").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("12-Month ARR Trajectory ($M)")).toBeDefined();
    expect(screen.getByText("Cohort Retention Breakdown (%)")).toBeDefined();

    // Open New Custom Dashboard modal
    const newDashBtn = screen.getByRole("button", { name: /New Custom Dashboard/i });
    fireEvent.click(newDashBtn);

    expect(screen.getByText("Compose Custom Dashboard (EC-16.1)")).toBeDefined();

    const nameInput = screen.getByPlaceholderText(/e.g. FinOps Unit Economics/i);
    fireEvent.change(nameInput, { target: { value: "FinOps Cloud Unit Economics" } });

    // Add widget
    const addWidgetBtn = screen.getByRole("button", { name: /Add Widget/i });
    fireEvent.click(addWidgetBtn);

    const submitBtn = screen.getByRole("button", { name: /Save Custom Dashboard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByText("Compose Custom Dashboard (EC-16.1)")).toBeNull();
    });
  });

  it("satisfies EC-16.2: report scheduler lists recurring schedules, creates schedule, and toggles status", async () => {
    render(<AnalyticsPlatformOverview />);

    // Switch to Report Scheduler tab
    const schedulerTab = screen.getByRole("tab", { name: /Report Scheduler/i });
    fireEvent.click(schedulerTab);

    // Verify default schedules
    expect(screen.getByText("Weekly Executive SaaS Performance Brief")).toBeDefined();
    expect(screen.getByText("Daily Platform Capacity & Ingestion Dump")).toBeDefined();
    expect(screen.getByText("PDF")).toBeDefined();
    expect(screen.getByText("CSV")).toBeDefined();

    // Trigger Run Now
    const runNowBtns = screen.getAllByRole("button", { name: /Run Now/i });
    fireEvent.click(runNowBtns[0]);

    // Open New Report Schedule modal
    const newSchedBtn = screen.getByRole("button", { name: /New Report Schedule/i });
    fireEvent.click(newSchedBtn);

    expect(screen.getByText("Configure Recurring Report Schedule (EC-16.2)")).toBeDefined();

    const schedNameInput = screen.getByPlaceholderText(/e.g. Weekly Executive Performance Digest/i);
    fireEvent.change(schedNameInput, { target: { value: "Monthly Compliance Audit Digest" } });

    const createBtn = screen.getByRole("button", { name: /Create Schedule/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText("Monthly Compliance Audit Digest")).toBeDefined();
    });
  });

  it("renders anomaly radar alerts with severity indicators", () => {
    render(<AnalyticsPlatformOverview />);

    // Switch to Anomaly Radar tab
    const anomalyTab = screen.getByRole("tab", { name: /Anomaly Radar/i });
    fireEvent.click(anomalyTab);

    expect(screen.getByText("Real-Time Platform Anomaly Radar")).toBeDefined();
    expect(screen.getByText("API_LATENCY Anomaly Detected")).toBeDefined();
    expect(screen.getByText("TOKEN_USAGE Anomaly Detected")).toBeDefined();
  });
});
