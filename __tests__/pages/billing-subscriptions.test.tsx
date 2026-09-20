import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SubscriptionsPage from "../../app/(control-plane)/billing/subscriptions/page";

// Mock hooks
const mockUsePermission = vi.fn();
vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    usePermission: (perm: string) => mockUsePermission(perm),
  };
});

const mockUseCrud = vi.fn();
vi.mock("@/lib/use-crud", () => ({
  useCrud: () => mockUseCrud(),
}));

vi.mock("@/lib/use-domain-realtime", () => ({
  useDomainRealtime: vi.fn(),
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};
vi.mock("@/lib/use-toast", () => ({
  useToast: () => mockToast,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/billing/subscriptions",
}));

const mockApi = {
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
};
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => mockApi.get(url),
    put: (url: string, body: any) => mockApi.put(url, body),
    post: (url: string, body: any) => mockApi.post(url, body),
  },
}));

describe("SubscriptionsPage Component", () => {
  const mockSubscriptions = [
    {
      id: "sub-1",
      tenantId: "tenant-acme",
      tenant: {
        id: "tenant-acme",
        name: "Acme Corporation",
        slug: "acme",
        status: "ACTIVE",
      },
      planId: "plan-enterprise",
      plan: {
        id: "plan-enterprise",
        name: "Enterprise Global",
      },
      status: "ACTIVE",
      billingPeriod: "MONTHLY",
      currency: "USD",
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2027-01-01T00:00:00.000Z",
      autoRenew: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "sub-2",
      tenantId: "tenant-beta",
      tenant: {
        id: "tenant-beta",
        name: "Beta Labs",
        slug: "beta",
        status: "ACTIVE",
      },
      planId: "plan-growth",
      plan: {
        id: "plan-growth",
        name: "Growth Tier",
      },
      status: "PAST_DUE",
      billingPeriod: "YEARLY",
      currency: "USD",
      startDate: "2026-02-01T00:00:00.000Z",
      endDate: null,
      autoRenew: false,
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockUseCrud.mockReturnValue({
      items: mockSubscriptions,
      total: 2,
      loading: false,
      error: null,
      page: 1,
      pageSize: 25,
      sortColumn: "createdAt",
      sortDirection: "desc",
      searchQuery: "",
      filters: {},
      setPage: vi.fn(),
      setPageSize: vi.fn(),
      setSortColumn: vi.fn(),
      setSortDirection: vi.fn(),
      setSearchQuery: vi.fn(),
      setFilter: vi.fn(),
      setFilters: vi.fn(),
      handleCreate: vi.fn().mockResolvedValue(true),
      handleUpdate: vi.fn().mockResolvedValue(true),
      handleDelete: vi.fn().mockResolvedValue(true),
      reload: vi.fn(),
    });
    mockApi.put.mockResolvedValue({ data: { success: true } });
    mockApi.post.mockResolvedValue({ data: { success: true } });
  });

  it("renders subscriptions table with tenant partitions and statuses", () => {
    render(<SubscriptionsPage />);

    expect(screen.getByRole("heading", { name: "Subscriptions" })).toBeInTheDocument();
    expect(screen.getByText("Acme Corporation")).toBeInTheDocument();
    expect(screen.getByText("@acme")).toBeInTheDocument();
    expect(screen.getByText("Enterprise Global")).toBeInTheDocument();
    expect(screen.getByText("Beta Labs")).toBeInTheDocument();
    expect(screen.getByText("@beta")).toBeInTheDocument();
    expect(screen.getByText("Growth Tier")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("PAST_DUE")).toBeInTheDocument();
  });

  it("renders ForbiddenState when user lacks pcc.billing.view", () => {
    mockUsePermission.mockImplementation((perm) => perm !== "pcc.billing.view");

    render(<SubscriptionsPage />);
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.queryByText("Acme Corporation")).not.toBeInTheDocument();
  });

  it("opens amend subscription drawer when amend button is clicked", async () => {
    render(<SubscriptionsPage />);

    const amendBtns = screen.getAllByTitle("Amend Subscription Plan");
    expect(amendBtns.length).toBe(2);

    fireEvent.click(amendBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Amend Subscription: Acme Corporation")).toBeInTheDocument();
    });
  });

  it("opens cancel subscription confirmation dialog", async () => {
    render(<SubscriptionsPage />);

    const cancelBtns = screen.getAllByTitle("Cancel Subscription");
    expect(cancelBtns.length).toBe(2);

    fireEvent.click(cancelBtns[0]);

    await waitFor(() => {
      expect(screen.getAllByText("Cancel Subscription")[0]).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to cancel the subscription for "Acme Corporation"/i)
      ).toBeInTheDocument();
    });
  });

  it("opens pause subscription confirmation dialog on active subscription", async () => {
    render(<SubscriptionsPage />);

    const pauseBtn = screen.getByTitle("Pause Subscription");
    fireEvent.click(pauseBtn);

    await waitFor(() => {
      expect(screen.getAllByText("Pause Subscription")[0]).toBeInTheDocument();
      expect(
        screen.getByText(/Temporarily freeze recurring billing for "Acme Corporation"/i)
      ).toBeInTheDocument();
    });
  });
});
