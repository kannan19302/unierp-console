import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DevelopersApisPage from "../../app/(control-plane)/developers/apis/page";

const mockUsePermission = vi.fn();
vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal();
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
  usePathname: () => "/developers/apis",
}));

const mockApi = {
  get: vi.fn(),
};
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    api: {
      get: (url: string, ...args: any[]) => mockApi.get(url, ...args),
    },
  };
});

describe("DevelopersApisPage Component", () => {
  const mockCatalog = [
    {
      id: "ep-1",
      name: "List Sales Deals",
      path: "/api/v1/sales/deals",
      method: "GET",
      version: "1",
      status: "ACTIVE",
    },
    {
      id: "ep-2",
      name: "Create Tenant Subscription",
      path: "/api/v1/saas/subscriptions",
      method: "POST",
      version: "2",
      status: "ACTIVE",
    },
    {
      id: "ep-3",
      name: "Delete Webhook Endpoint",
      path: "/saas/webhooks/endpoints/:id",
      method: "DELETE",
      version: "1",
      status: "DEPRECATED",
    },
  ];

  const mockAdmin = {
    totalEndpoints: 3,
    publishedEndpoints: 2,
    registered: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/api-platform") {
        return Promise.resolve({ data: mockCatalog });
      }
      if (url === "/admin/api-platform") {
        return Promise.resolve({ data: mockAdmin });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it("renders catalog endpoints, method badges, and KPI stats", async () => {
    render(<DevelopersApisPage />);

    await waitFor(() => {
      expect(screen.getByText("List Sales Deals")).toBeInTheDocument();
      expect(screen.getByText("Create Tenant Subscription")).toBeInTheDocument();
      expect(screen.getByText("Delete Webhook Endpoint")).toBeInTheDocument();
    });

    // Check stats
    expect(screen.getAllByText("Endpoints").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("Methods")).toBeInTheDocument();
    expect(screen.getByText("Admin registered")).toBeInTheDocument();

    // Check method badges
    expect(screen.getByText("GET")).toBeInTheDocument();
    expect(screen.getByText("POST")).toBeInTheDocument();
    expect(screen.getByText("DELETE")).toBeInTheDocument();
  });

  it("renders empty state when no endpoints exist", async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });

    render(<DevelopersApisPage />);

    await waitFor(() => {
      expect(screen.getByText("No endpoints published")).toBeInTheDocument();
    });
  });
});
