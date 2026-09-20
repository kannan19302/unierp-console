import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SubscriptionOperationsPage from "../../app/(control-plane)/subscription-operations/page";

const mockUsePermission = vi.fn();
vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    usePermission: (perm: string) => mockUsePermission(perm),
  };
});

const mockShowToast = vi.fn();
vi.mock("@/lib/use-toast", () => ({
  useToast: () => ({
    showToast: mockShowToast,
    toasts: [],
    dismissToast: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/subscription-operations",
}));

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
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

describe("SubscriptionOperationsPage Component (PCC-04)", () => {
  const mockSubscriptions = [
    {
      id: "sub-1",
      tenantId: "00000000-0000-0000-0000-000000000001",
      name: "Acme Global Corporation",
      tenant: { name: "Acme Global Corporation" },
      planId: "plan-starter",
      plan: { name: "Growth Standard" },
      status: "ACTIVE",
      billingPeriod: "MONTHLY",
      currency: "USD",
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-12-31T23:59:59.000Z",
    },
    {
      id: "sub-2",
      tenantId: "tenant-starlight",
      name: "Starlight Financial Inc.",
      tenant: { name: "Starlight Financial Inc." },
      planId: "plan-enterprise",
      plan: { name: "Enterprise Hyper-Scale" },
      status: "TRIAL",
      billingPeriod: "YEARLY",
      currency: "USD",
      startDate: "2026-02-01T00:00:00.000Z",
      endDate: "2026-03-01T23:59:59.000Z",
    },
  ];

  const mockRenewals = [
    {
      id: "ren-1",
      tenantId: "00000000-0000-0000-0000-000000000001",
      tenantName: "Acme Global Corporation",
      planName: "Enterprise Hyper-Scale",
      billingPeriod: "YEARLY",
      contractValue: 120000,
      renewalDate: "2026-10-15T00:00:00.000Z",
      daysUntilRenewal: 25,
      autoRenew: true,
      status: "EXPIRING_SOON",
    },
  ];

  const mockAmendmentPreview = {
    tenantId: "00000000-0000-0000-0000-000000000001",
    currentPlan: {
      id: "plan-starter",
      name: "Growth Standard",
      price: 149,
      billingPeriod: "MONTHLY",
      currency: "USD",
    },
    newPlan: {
      id: "plan-enterprise",
      name: "Enterprise Hyper-Scale",
      price: 499,
      billingPeriod: "MONTHLY",
      currency: "USD",
    },
    periodStart: "2026-09-01T00:00:00.000Z",
    periodEnd: "2026-10-01T00:00:00.000Z",
    effectiveDate: "2026-09-20T00:00:00.000Z",
    proration: {
      creditAmount: 74.5,
      chargeAmount: 249.5,
      netAmount: 175.0,
    },
    differencePerMonth: 350,
    status: "READY_FOR_APPROVAL",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("/renewals/pipeline")) {
        return Promise.resolve({ data: mockRenewals });
      }
      if (url.includes("/subscriptions")) {
        return Promise.resolve({ data: mockSubscriptions });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it("renders subscription table, KPI cards, and tabs", async () => {
    render(<SubscriptionOperationsPage />);

    // Check KPIs
    await waitFor(() => {
      expect(screen.getByText("Total Subscriptions")).toBeInTheDocument();
      expect(screen.getByText("Active Commitments")).toBeInTheDocument();
      expect(screen.getByText("Expiring Horizon (<30d)")).toBeInTheDocument();
    });

    // Check Rows
    await waitFor(() => {
      expect(screen.getByText("Acme Global Corporation")).toBeInTheDocument();
      expect(screen.getByText("Starlight Financial Inc.")).toBeInTheDocument();
    });
  });

  it("opens amendment wizard with side-by-side comparison and prorated cost preview", async () => {
    mockApi.post.mockResolvedValueOnce({ data: mockAmendmentPreview });

    render(<SubscriptionOperationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Acme Global Corporation")).toBeInTheDocument();
    });

    // Click Amend Plan button for Acme
    const amendBtn = screen.getByRole("button", { name: /Amend Acme Global Corporation/i });
    fireEvent.click(amendBtn);

    // Assert Wizard modal opens (EC-04.1)
    await waitFor(() => {
      expect(screen.getByText("Subscription Amendment Wizard")).toBeInTheDocument();
      expect(screen.getByText("CURRENT COMMITMENT")).toBeInTheDocument();
      expect(screen.getByText("TARGET PLAN REVISION")).toBeInTheDocument();
    });

    // Assert Proration breakdown (EC-04.2)
    await waitFor(() => {
      expect(screen.getByText("Proration Calculation (Mid-Cycle Adjustment)")).toBeInTheDocument();
      expect(screen.getByText("Net Due Today:")).toBeInTheDocument();
      expect(screen.getByText("$175.00 USD")).toBeInTheDocument();
    });

    // Execute Amendment
    mockApi.post.mockResolvedValueOnce({ data: { success: true } });
    const confirmBtn = screen.getByRole("button", { name: /Confirm & Execute Amendment/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/subscriptions/00000000-0000-0000-0000-000000000001/amend",
        expect.objectContaining({
          planId: "plan-enterprise",
        })
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Subscription Amended",
          variant: "success",
        })
      );
    });
  });

  it("switches to renewal pipeline tab and toggles auto-renewal", async () => {
    mockApi.post.mockResolvedValueOnce({ data: { success: true, autoRenew: false } });

    render(<SubscriptionOperationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Total Subscriptions")).toBeInTheDocument();
    });

    // Click Renewals tab
    const renewalsTab = screen.getByRole("tab", { name: /Renewal Pipeline & Contracts/i });
    fireEvent.click(renewalsTab);

    // Assert Renewal Grid rendered
    await waitFor(() => {
      expect(screen.getByText("Upcoming Contract Renewals")).toBeInTheDocument();
      expect(screen.getByText(/20,000/)).toBeInTheDocument();
      expect(screen.getByText(/25 Days Left/)).toBeInTheDocument();
    });

    // Toggle Auto-Renew
    const toggleBtn = screen.getByRole("button", { name: "Disable Auto-Renew" });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/subscriptions/00000000-0000-0000-0000-000000000001/renewals/toggle-auto",
        { enabled: false }
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Auto-Renew Updated",
          variant: "success",
        })
      );
    });
  });

  it("extends trial period using confirmation dialog", async () => {
    mockApi.post.mockResolvedValueOnce({ data: { success: true, newTrialEnd: "2026-04-01T00:00:00.000Z" } });

    render(<SubscriptionOperationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Starlight Financial Inc.")).toBeInTheDocument();
    });

    // Click Extend for Starlight
    const extendBtn = screen.getByRole("button", { name: /Extend trial for Starlight Financial Inc./i });
    fireEvent.click(extendBtn);

    // Dialog opens
    await waitFor(() => {
      expect(screen.getByText("Extend Customer Trial Period?")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: /Extend Trial \(30 Days\)/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/subscriptions/tenant-starlight/trial/extend",
        { days: 30 }
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Trial Extended",
          variant: "success",
        })
      );
    });
  });
});
