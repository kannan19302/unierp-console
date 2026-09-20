import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MarketplaceOverview from "../../app/(control-plane)/marketplace/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/marketplace",
}));

const mockApi = {
  get: vi.fn().mockResolvedValue({ data: {} }),
  post: vi.fn().mockResolvedValue({ data: {} }),
  put: vi.fn().mockResolvedValue({ data: {} }),
  del: vi.fn().mockResolvedValue({ data: {} }),
};

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    api: {
      get: (url: string, ...args: any[]) => mockApi.get(url, ...args),
      post: (url: string, ...args: any[]) => mockApi.post(url, ...args),
      put: (url: string, ...args: any[]) => mockApi.put(url, ...args),
      del: (url: string, ...args: any[]) => mockApi.del(url, ...args),
    },
  };
});

describe("Marketplace Operations Console (PCC-17)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.get.mockResolvedValue({ data: {} });
    mockApi.post.mockResolvedValue({ data: {} });
    mockApi.put.mockResolvedValue({ data: {} });
    mockApi.del.mockResolvedValue({ data: {} });
  });

  it("renders the marketplace command console with tabs and KPIs", () => {
    render(<MarketplaceOverview />);

    expect(screen.getByText("Marketplace & Partner Operations")).toBeDefined();
    expect(screen.getByText(/PCC-17: Extension submission review pipeline/)).toBeDefined();

    expect(screen.getByRole("tab", { name: /Submission Review Pipeline/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Version Management & Staged Rollouts/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Catalog Inventory/i })).toBeDefined();

    expect(screen.getByText("HubSpot Cloud CRM Connector")).toBeDefined();
    expect(screen.getByText("Stripe Automatic Global Tax Engine")).toBeDefined();
    expect(screen.getByText("GeoFleet Telematics Tracker")).toBeDefined();
  });

  it("satisfies EC-17.1: submission review pipeline, checklist audits, reviewer assignment and approval", async () => {
    render(<MarketplaceOverview />);

    // Click on HubSpot submission card to open review drawer
    const subCard = screen.getByText("HubSpot Cloud CRM Connector");
    fireEvent.click(subCard);

    // Detail modal opens
    expect(screen.getByText("HubSpot Cloud CRM Connector (v2.1.0)")).toBeDefined();

    // Assign reviewer
    const reviewerSelect = screen.getByRole("combobox");
    fireEvent.change(reviewerSelect, { target: { value: "Marcus Reviewer" } });

    // Toggle a checklist item
    const sastCheck = screen.getByLabelText(/SAST Scan Clean/i);
    expect((sastCheck as HTMLInputElement).checked).toBe(true);
    fireEvent.click(sastCheck);
    expect((sastCheck as HTMLInputElement).checked).toBe(false);

    // Advance to Functional Review
    const advanceBtn = screen.getByRole("button", { name: /Advance to Functional Review/i });
    fireEvent.click(advanceBtn);

    // Now button to approve appears
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Approve & Sign Listing/i })).toBeDefined();
    });

    const approveBtn = screen.getByRole("button", { name: /Approve & Sign Listing/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(screen.queryByText("HubSpot Cloud CRM Connector (v2.1.0)")).toBeNull();
    });
  });

  it("satisfies EC-17.1: rejects a submission with feedback notes", async () => {
    render(<MarketplaceOverview />);

    // Click on GeoFleet submission card
    const subCard = screen.getByText("GeoFleet Telematics Tracker");
    fireEvent.click(subCard);

    // Click Reject Submission
    const rejectBtn = screen.getByRole("button", { name: /Reject Submission/i });
    fireEvent.click(rejectBtn);

    expect(screen.getByText("Reject Marketplace Submission")).toBeDefined();

    // Fill rejection feedback
    const reasonInput = screen.getByPlaceholderText(/e.g. Cold start latency exceeded/i);
    fireEvent.change(reasonInput, { target: { value: "OAuth scopes exceed required inventory permissions." } });

    const confirmRejectBtn = screen.getByRole("button", { name: /Confirm Rejection/i });
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(screen.queryByText("Reject Marketplace Submission")).toBeNull();
    });
  });

  it("satisfies EC-17.2: version management, staged rollout adjustment, rollback and emergency revocation", async () => {
    render(<MarketplaceOverview />);

    // Switch to Version Management tab
    const versionsTab = screen.getByRole("tab", { name: /Version Management & Staged Rollouts/i });
    fireEvent.click(versionsTab);

    // Check version list & changelog diff
    expect(screen.getByText("v2.1.0")).toBeDefined();
    expect(screen.getByText("v2.0.0")).toBeDefined();
    expect(screen.getByText(/\+ Add DealWebhooksController/)).toBeDefined();

    // Adjust staged rollout
    const sliders = screen.getAllByRole("slider");
    expect(sliders.length).toBeGreaterThan(0);
    fireEvent.change(sliders[0], { target: { value: "50" } });

    // Open rollback modal
    const rollbackBtn = screen.getByRole("button", { name: /Rollback to Previous Version/i });
    fireEvent.click(rollbackBtn);

    expect(screen.getByText(/Rollback Extension Version/i)).toBeDefined();

    const rollbackReasonInput = screen.getByPlaceholderText(/e.g. Critical memory spike observed/i);
    fireEvent.change(rollbackReasonInput, { target: { value: "High latency in v2.1.0 quotes processor" } });

    const confirmRollbackBtn = screen.getByRole("button", { name: /Execute Version Rollback/i });
    fireEvent.click(confirmRollbackBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Rollback Extension Version/i)).toBeNull();
    });

    // Test emergency revocation modal (G-20)
    const revokeBtn = screen.getByRole("button", { name: /Emergency Revoke Extension \(G-20\)/i });
    fireEvent.click(revokeBtn);

    expect(screen.getByText(/Emergency Revocation \(G-20 Inviolable Law\)/i)).toBeDefined();
    const cancelRevokeBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelRevokeBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Emergency Revocation \(G-20 Inviolable Law\)/i)).toBeNull();
    });
  });
});
