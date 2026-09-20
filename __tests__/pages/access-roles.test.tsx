import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AccessRolesPage from "../../app/(control-plane)/access/roles/page";

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
  usePathname: () => "/access/roles",
}));

describe("AccessRolesPage Component", () => {
  const mockRoles = [
    {
      id: "role-super-admin",
      name: "Super Administrator",
      description: "Root control plane authority across all PCC domains",
      isSystem: true,
      permissions: ["*"],
      principalCount: 4,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "role-billing-analyst",
      name: "Billing Operations Analyst",
      description: "Invoicing and subscription audit authority",
      isSystem: false,
      permissions: ["pcc.billing.view", "pcc.billing.invoices.export"],
      principalCount: 2,
      createdAt: "2026-02-15T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockUseCrud.mockReturnValue({
      items: mockRoles,
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

  it("renders roles catalog with statistics and roles list", () => {
    render(<AccessRolesPage />);

    expect(screen.getByRole("heading", { name: "Roles" })).toBeInTheDocument();
    expect(screen.getByText("Super Administrator")).toBeInTheDocument();
    expect(screen.getByText("Root control plane authority across all PCC domains")).toBeInTheDocument();
    expect(screen.getByText("Billing Operations Analyst")).toBeInTheDocument();
    expect(screen.getByText("Built-in System")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("renders ForbiddenState when user lacks pcc.identity-governance.access", () => {
    mockUsePermission.mockImplementation((perm) => perm !== "pcc.identity-governance.access");

    render(<AccessRolesPage />);
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.queryByText("Super Administrator")).not.toBeInTheDocument();
  });

  it("opens create role drawer when 'Create Role' button is clicked", async () => {
    render(<AccessRolesPage />);

    const createBtn = screen.getByRole("button", { name: /Create Role/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText("Create Provider Role")).toBeInTheDocument();
    });
  });

  it("opens edit drawer when edit button is clicked on a custom role", async () => {
    render(<AccessRolesPage />);

    // Custom role has Edit button, system role does not
    const editBtns = screen.getAllByTitle("Edit Role");
    expect(editBtns.length).toBe(1);

    fireEvent.click(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Edit Role: Billing Operations Analyst")).toBeInTheDocument();
    });
  });

  it("renders delete button only for custom roles and opens confirmation dialog", async () => {
    render(<AccessRolesPage />);

    // Custom role should have delete button, while system role doesn't
    const deleteBtns = screen.getAllByTitle("Delete Role");
    expect(deleteBtns.length).toBe(1);

    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(screen.getAllByText("Delete Role")[0]).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to delete the role "Billing Operations Analyst"/i)
      ).toBeInTheDocument();
    });
  });
});
