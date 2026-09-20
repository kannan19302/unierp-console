import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AccessDirectoryPage from "../../app/(control-plane)/access/directory/page";

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
  usePathname: () => "/access/directory",
}));

describe("AccessDirectoryPage Component", () => {
  const mockStaff = [
    {
      id: "staff-1",
      email: "operator.alice@unierp.internal",
      name: "Alice Ops",
      firstName: "Alice",
      lastName: "Ops",
      status: "ACTIVE",
      mfaEnabled: true,
      lastLoginAt: "2026-03-20T10:00:00.000Z",
      roles: [{ id: "role-1", name: "Super Administrator" }],
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "staff-2",
      email: "operator.bob@unierp.internal",
      name: "Bob Sec",
      firstName: "Bob",
      lastName: "Sec",
      status: "SUSPENDED",
      mfaEnabled: false,
      lastLoginAt: null,
      roles: [{ id: "role-2", name: "SecOps Auditor" }],
      createdAt: "2026-02-01T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockUseCrud.mockReturnValue({
      items: mockStaff,
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

  it("renders operator staff directory rows and statistics", () => {
    render(<AccessDirectoryPage />);

    expect(screen.getByRole("heading", { name: "Directory" })).toBeInTheDocument();
    expect(screen.getByText("Alice Ops")).toBeInTheDocument();
    expect(screen.getByText("operator.alice@unierp.internal")).toBeInTheDocument();
    expect(screen.getByText("Bob Sec")).toBeInTheDocument();
    expect(screen.getByText("operator.bob@unierp.internal")).toBeInTheDocument();
    expect(screen.getByText("Super Administrator")).toBeInTheDocument();
    expect(screen.getByText("SecOps Auditor")).toBeInTheDocument();
  });

  it("renders ForbiddenState when user lacks pcc.identity-governance.access permission", () => {
    mockUsePermission.mockImplementation((perm) => perm !== "pcc.identity-governance.access");

    render(<AccessDirectoryPage />);
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.queryByText("Alice Ops")).not.toBeInTheDocument();
  });

  it("opens create operator drawer when 'Invite Operator' button is clicked", async () => {
    render(<AccessDirectoryPage />);

    const createBtn = screen.getByRole("button", { name: /Invite Operator/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText("Invite Staff Operator")).toBeInTheDocument();
    });
  });

  it("opens edit drawer when edit icon is clicked on operator row", async () => {
    render(<AccessDirectoryPage />);

    const editBtns = screen.getAllByTitle("Edit Staff Operator");
    expect(editBtns.length).toBe(2);

    fireEvent.click(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Edit Operator: Alice Ops")).toBeInTheDocument();
    });
  });

  it("opens deactivate confirmation dialog when trash icon is clicked", async () => {
    render(<AccessDirectoryPage />);

    const deactivateBtns = screen.getAllByTitle("Deactivate Operator");
    expect(deactivateBtns.length).toBeGreaterThan(0);
    fireEvent.click(deactivateBtns[0]);

    await waitFor(() => {
      expect(screen.getAllByText("Deactivate Staff Operator")[0]).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to deactivate "Alice Ops"/i)
      ).toBeInTheDocument();
    });
  });
});
