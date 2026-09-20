/**
 * Unit & Component Tests for Support & Service Operations (PCC-22)
 *
 * Verifies:
 * - Tab navigation: Tickets & Triage, Diagnostic Consent & Replay, SLA Performance
 * - EC-22.1: Multi-tenant triage workspace with severity-based SLA countdown timers and breached status flags
 * - EC-22.2: Split-view conversation thread with staff message composition and ticket resolution
 * - EC-22.3: Diagnostic access consent request workflow, status tracking, and session replay playback controls
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SupportOperationsPage from "../../app/(control-plane)/support/page";

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
  usePathname: () => "/support",
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(async (url: string) => {
      return { data: [] };
    }),
    post: vi.fn(async (url: string, body: any) => {
      return { success: true, data: body };
    }),
  },
}));

vi.mock("@/lib/data", () => ({
  useList: vi.fn(() => ({ data: [], total: 0, loading: false, error: null, reload: vi.fn() })),
  useItem: vi.fn(() => ({ data: {}, loading: false, error: null, reload: vi.fn() })),
}));

describe("Support & Service Operations Console (PCC-22)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
  });

  it("renders the support command console with top summary metrics and navigation tabs", () => {
    render(<SupportOperationsPage />);

    expect(screen.getByText("Support & Service Operations")).toBeDefined();
    expect(screen.getByText("Active Support Tickets")).toBeDefined();
    expect(screen.getByText("SLA Breaches")).toBeDefined();
    expect(screen.getByText("Diagnostic Consents Active")).toBeDefined();
    expect(screen.getByText("SLA Compliance Coverage")).toBeDefined();

    expect(screen.getByRole("button", { name: /Tickets & Triage/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Diagnostic Consent & Replay/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /SLA Performance/i })).toBeDefined();
  });

  it("satisfies EC-22.1: triage workspace displays severity-based SLA countdowns, breached badges, and filters", () => {
    render(<SupportOperationsPage />);

    // Check initial tickets loaded
    expect(screen.getAllByText("Webhook delivery failure on high throughput").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Audit log export times out on month-end reports")).toBeDefined();

    // Check SLA badges (one breached, one active countdown)
    expect(screen.getByText(/BREACHED/i)).toBeDefined();
    expect(screen.getByText(/SLA: 45m left/i)).toBeDefined();

    // Filter by severity
    const severitySelect = screen.getByLabelText(/Filter by severity/i);
    fireEvent.change(severitySelect, { target: { value: "CRITICAL" } });

    expect(screen.getAllByText("Webhook delivery failure on high throughput").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Audit log export times out on month-end reports")).toBeNull();
  });

  it("satisfies EC-22.2: ticket split-view renders chronological thread, posts staff reply, and resolves ticket", async () => {
    render(<SupportOperationsPage />);

    // Select the first ticket (TICK-901)
    const ticketCard = screen.getByLabelText("Select ticket TICK-901");
    fireEvent.click(ticketCard);

    // Verify messages in thread
    expect(
      screen.getByText("We are seeing 504 errors on payload delivery to our staging webhook endpoints.")
    ).toBeDefined();
    expect(
      screen.getByText("Investigating the connector egress queues. Rate limiting thresholds were recently adjusted.")
    ).toBeDefined();

    // Type and send a staff reply
    const replyInput = screen.getByPlaceholderText(/Type reply or internal triage note.../i);
    fireEvent.change(replyInput, {
      target: { value: "We have isolated the dropped packets to the egress gateway cluster." },
    });

    const sendBtn = screen.getByRole("button", { name: /Send Staff Reply/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(
        screen.getByText("We have isolated the dropped packets to the egress gateway cluster.")
      ).toBeDefined();
    });

    // Resolve ticket modal
    const resolveBtn = screen.getByRole("button", { name: /Resolve Ticket/i });
    fireEvent.click(resolveBtn);

    expect(screen.getByText(/Resolve Support Ticket/i)).toBeDefined();

    const resolutionInput = screen.getByPlaceholderText(/e.g. Cleared stuck background job/i);
    fireEvent.change(resolutionInput, { target: { value: "Replaced gateway route table and verified zero 504s." } });

    const confirmBtn = screen.getByRole("button", { name: /Confirm Resolution/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText("Confirm Resolution")).toBeNull();
    });
  });

  it("satisfies EC-22.3: diagnostic consent requests, status verification, and session replay playback controls", async () => {
    render(<SupportOperationsPage />);

    // Switch to Diagnostic Consent tab
    const diagTab = screen.getByRole("button", { name: /Diagnostic Consent & Replay/i });
    fireEvent.click(diagTab);

    // Verify table headers & rows
    expect(screen.getByText("Tenant Diagnostic Access Authorizations")).toBeDefined();
    expect(screen.getByText("EPHEMERAL_LOG_STREAM")).toBeDefined();
    expect(screen.getByText("SESSION_REPLAY_VIEW")).toBeDefined();
    expect(screen.getByText("Inspect egress dropped packet trace logs for webhook investigation")).toBeDefined();

    // Open Request Consent modal
    const requestBtn = screen.getByRole("button", { name: /Request Diagnostic Consent/i });
    fireEvent.click(requestBtn);

    expect(screen.getByText("Request Delegated Diagnostic Access")).toBeDefined();

    const reasonInput = screen.getByPlaceholderText(/e.g. Inspect client crash dump/i);
    fireEvent.change(reasonInput, {
      target: { value: "Investigate memory spike on inventory bulk upload" },
    });

    const submitBtn = screen.getByRole("button", { name: /Send Consent Request/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByText("Send Consent Request")).toBeNull();
    });

    // Launch Session Replay Viewer for granted consent
    const launchViewerBtn = screen.getByRole("button", { name: /Launch Viewer/i });
    fireEvent.click(launchViewerBtn);

    expect(screen.getByText(/Session Replay & DOM Telemetry Stream/i)).toBeDefined();
    expect(screen.getByText(/Playing Diagnostic Event Stream/i)).toBeDefined();

    // Pause replay
    const pauseBtn = screen.getByRole("button", { name: /Pause/i });
    fireEvent.click(pauseBtn);

    expect(screen.getByText(/Diagnostic Stream Paused/i)).toBeDefined();
  });
});
