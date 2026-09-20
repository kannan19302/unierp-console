import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PlanDetailPage from "../../app/(control-plane)/billing/plans/[id]/page";

// Mock hooks
const mockUsePermission = vi.fn();
vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    usePermission: (perm: string) => mockUsePermission(perm),
  };
});

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};
vi.mock("@/lib/use-toast", () => ({
  useToast: () => mockToast,
}));

vi.mock("@/lib/use-domain-realtime", () => ({
  useDomainRealtime: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useParams: () => ({ id: "plan-growth" }),
  usePathname: () => "/billing/plans/plan-growth",
}));

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
};
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => mockApi.get(url),
    post: (url: string, body: any) => mockApi.post(url, body),
    put: (url: string, body: any) => mockApi.put(url, body),
  },
}));

describe("PlanDetailPage Component", () => {
  const mockPlan = {
    id: "plan-growth",
    name: "Growth Enterprise",
    description: "Multi-tenant packaging for high-velocity teams",
    status: "ACTIVE",
    version: 3,
    isPublic: true,
    maxUsers: 50,
    maxStorage: 200,
    maxApiCalls: 100000,
    prices: [
      {
        id: "p-1",
        currency: "USD",
        region: "us-east-1",
        monthly: 399,
        yearly: 3990,
      },
    ],
    features: { crm: true, finance: false },
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockResolvedValue({ data: mockPlan });
    mockApi.post.mockResolvedValue({ data: { success: true } });
    mockApi.put.mockResolvedValue({ data: { success: true } });
  });

  it("renders plan detail header, pricing tiers table, and preview card", async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Growth Enterprise").length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText("Multi-tenant packaging for high-velocity teams").length).toBeGreaterThan(0);
    expect(screen.getByText("Regional Pricing Tiers")).toBeInTheDocument();
    expect(screen.getByText("Customer Pricing Preview")).toBeInTheDocument();
    expect(screen.getAllByText("Customer Relationship Management (CRM)").length).toBeGreaterThan(0);
  });

  it("renders ForbiddenState when user lacks pcc.billing.view", () => {
    mockUsePermission.mockImplementation((perm) => perm !== "pcc.billing.view");

    render(<PlanDetailPage />);
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.queryByText("Growth Enterprise")).not.toBeInTheDocument();
  });

  it("adds a new pricing tier to the table and displays save bar", async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Growth Enterprise").length).toBeGreaterThan(0);
    });

    const addTierBtn = screen.getByRole("button", { name: /Add Tier/i });
    fireEvent.click(addTierBtn);

    await waitFor(() => {
      expect(screen.getByText("Unsaved Pricing & Entitlement Changes")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Save Plan Changes/i })).toBeInTheDocument();
    });

    // Save changes
    const saveBtn = screen.getByRole("button", { name: /Save Plan Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/plans/plan-growth/prices",
        expect.objectContaining({
          prices: expect.arrayContaining([
            expect.objectContaining({ currency: "USD", monthly: 399 }),
          ]),
        })
      );
    });
  });

  it("toggles feature entitlement and displays unsaved changes bar", async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Growth Enterprise").length).toBeGreaterThan(0);
    });

    const financeModule = screen.getByText("Core Financials & General Ledger");
    fireEvent.click(financeModule);

    await waitFor(() => {
      expect(screen.getByText("Unsaved Pricing & Entitlement Changes")).toBeInTheDocument();
    });
  });
});
