import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BillingPlansPage from "../../app/(control-plane)/billing/plans/page";

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
  usePathname: () => "/billing/plans",
}));

describe("BillingPlansPage Component", () => {
  const mockPlans = [
    {
      id: "plan-growth",
      name: "Growth Tier",
      description: "Fast-growing teams needing full CRM & Financials",
      status: "ACTIVE",
      version: 1,
      maxUsers: 25,
      maxStorage: 100,
      maxApiCalls: 50000,
      isPublic: true,
      prices: [
        {
          id: "price-1",
          currency: "USD",
          region: "global",
          monthly: 299,
          yearly: 2990,
        },
      ],
      features: { crm: true, finance: true },
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "plan-legacy",
      name: "Legacy Starter",
      description: "Grandfathered entry tier",
      status: "ARCHIVED",
      version: 2,
      maxUsers: 5,
      maxStorage: 20,
      maxApiCalls: 10000,
      isPublic: false,
      prices: [
        {
          id: "price-2",
          currency: "USD",
          region: "global",
          monthly: 49,
          yearly: 490,
        },
      ],
      features: { crm: true },
      createdAt: "2025-06-01T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockUseCrud.mockReturnValue({
      items: mockPlans,
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
  });

  it("renders plans table with quotas, versions, and pricing", () => {
    render(<BillingPlansPage />);

    expect(screen.getByRole("heading", { name: "Plans" })).toBeInTheDocument();
    expect(screen.getByText("Growth Tier")).toBeInTheDocument();
    expect(screen.getByText("Fast-growing teams needing full CRM & Financials")).toBeInTheDocument();
    expect(screen.getByText("$299")).toBeInTheDocument();
    expect(screen.getByText("25 seats")).toBeInTheDocument();
    expect(screen.getByText("100GB")).toBeInTheDocument();
    expect(screen.getByText("Legacy Starter")).toBeInTheDocument();
  });

  it("renders ForbiddenState when user lacks pcc.billing.view", () => {
    mockUsePermission.mockImplementation((perm) => perm !== "pcc.billing.view");

    render(<BillingPlansPage />);
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.queryByText("Growth Tier")).not.toBeInTheDocument();
  });

  it("opens create plan drawer when 'Create Plan' button is clicked", async () => {
    render(<BillingPlansPage />);

    const createBtn = screen.getByRole("button", { name: /Create Plan/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText("Create Billing Plan")).toBeInTheDocument();
    });
  });

  it("opens edit drawer when edit button is clicked on a plan", async () => {
    render(<BillingPlansPage />);

    const editBtns = screen.getAllByTitle("Edit Plan");
    expect(editBtns.length).toBe(1); // Only active plan has edit button

    fireEvent.click(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Edit Plan: Growth Tier")).toBeInTheDocument();
    });
  });

  it("opens archive confirm dialog when archive button is clicked", async () => {
    render(<BillingPlansPage />);

    const archiveBtns = screen.getAllByTitle("Archive Plan");
    expect(archiveBtns.length).toBe(1); // Only active plan has archive button

    fireEvent.click(archiveBtns[0]);

    await waitFor(() => {
      expect(screen.getAllByText("Archive Plan")[0]).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to archive "Growth Tier"/i)
      ).toBeInTheDocument();
    });
  });
});
