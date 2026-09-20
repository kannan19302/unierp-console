import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TenantsDirectoryPage from "../../app/(control-plane)/tenants/directory/page";

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

vi.mock("@/lib/use-toast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/tenants/directory",
}));

describe("TenantsDirectoryPage Component", () => {
  const mockTenants = [
    {
      id: "tenant-1",
      name: "Acme Corp",
      slug: "acme",
      plan: "ENTERPRISE",
      status: "ACTIVE",
      residencyRegion: "us-east-1",
      orgCount: 2,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "tenant-2",
      name: "Beta Inc",
      slug: "beta",
      plan: "STARTUP",
      status: "SUSPENDED",
      residencyRegion: "eu-central-1",
      orgCount: 1,
      createdAt: "2026-02-01T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockUseCrud.mockReturnValue({
      items: mockTenants,
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
      handleUpdate: vi.fn().mockResolvedValue(true),
      handleDelete: vi.fn().mockResolvedValue(true),
      reload: vi.fn(),
    });
  });

  it("renders the directory with tenant rows and statistics", () => {
    render(<TenantsDirectoryPage />);

    expect(screen.getByRole("heading", { name: "Directory" })).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
    expect(screen.getByText("acme")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Suspended").length).toBeGreaterThan(0);
  });

  it("renders ForbiddenState when user lacks system.tenant.view", () => {
    mockUsePermission.mockImplementation((perm) => perm !== "system.tenant.view");

    render(<TenantsDirectoryPage />);
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
  });

  it("opens edit drawer when edit button is clicked", async () => {
    render(<TenantsDirectoryPage />);

    const editButtons = screen.getAllByTitle("Edit Tenant");
    expect(editButtons.length).toBe(2);

    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Edit Tenant: Acme Corp")).toBeInTheDocument();
    });
  });

  it("opens delete confirm dialog when delete button is clicked", async () => {
    render(<TenantsDirectoryPage />);

    const deleteButtons = screen.getAllByTitle("Delete Tenant");
    expect(deleteButtons.length).toBe(2);

    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText("Delete Tenant")[0]).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to delete "Acme Corp"/i)
      ).toBeInTheDocument();
    });
  });

  it("opens suspend confirm dialog when suspend button is clicked on active tenant", async () => {
    render(<TenantsDirectoryPage />);

    const suspendButton = screen.getByTitle("Suspend Tenant");
    fireEvent.click(suspendButton);

    await waitFor(() => {
      expect(screen.getAllByText("Suspend Tenant")[0]).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to suspend "Acme Corp"/i)
      ).toBeInTheDocument();
    });
  });

  it("opens reactivate confirm dialog when shield check clicked on suspended tenant", async () => {
    render(<TenantsDirectoryPage />);

    const reactivateButton = screen.getByTitle("Reactivate Tenant");
    fireEvent.click(reactivateButton);

    await waitFor(() => {
      expect(screen.getAllByText("Reactivate Tenant")[0]).toBeInTheDocument();
      expect(
        screen.getByText(/reinstate "Beta Inc"/i)
      ).toBeInTheDocument();
    });
  });
});
