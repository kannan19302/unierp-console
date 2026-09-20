import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RoleDetailPage from "../../app/(control-plane)/access/roles/[id]/page";

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
  useParams: () => ({ id: "role-custom" }),
  usePathname: () => "/access/roles/role-custom",
}));

const mockApi = {
  get: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
};
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => mockApi.get(url),
    patch: (url: string, body: any) => mockApi.patch(url, body),
    del: (url: string) => mockApi.del(url),
  },
}));

describe("RoleDetailPage Component", () => {
  const mockRoleData = {
    id: "role-custom",
    name: "Custom Support Agent",
    description: "Support tier 2 access with read-only capabilities",
    isSystem: false,
    permissions: ["system.tenant.view"],
    principalCount: 3,
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockResolvedValue({ data: mockRoleData });
    mockApi.patch.mockResolvedValue({ data: { ...mockRoleData, permissions: ["system.tenant.view", "system.tenant.create"] } });
  });

  it("renders role detail header, stats, and permission matrix", async () => {
    render(<RoleDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Custom Support Agent")).toBeInTheDocument();
      expect(screen.getByText("Custom Role")).toBeInTheDocument();
      expect(screen.getByText("3 operator(s) assigned")).toBeInTheDocument();
      expect(screen.getByText("Tenant & Lifecycle Management (PCC-18)")).toBeInTheDocument();
      expect(screen.getByText("Identity Governance & Access (PCC-03)")).toBeInTheDocument();
    });
  });

  it("renders ForbiddenState when user lacks pcc.identity-governance.access", () => {
    mockUsePermission.mockImplementation((perm) => perm !== "pcc.identity-governance.access");

    render(<RoleDetailPage />);
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.queryByText("Custom Support Agent")).not.toBeInTheDocument();
  });

  it("toggles permission checkbox and displays save bar", async () => {
    render(<RoleDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Custom Support Agent")).toBeInTheDocument();
    });

    // Find a permission row (e.g. "Provision Tenant")
    const permLabel = screen.getByText("Provision Tenant");
    fireEvent.click(permLabel);

    await waitFor(() => {
      expect(screen.getByText("Unsaved Permission Changes")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Save Changes/i })).toBeInTheDocument();
    });

    // Click Save Changes
    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith(
        "/platform/v1/staff-idp/roles/role-custom",
        expect.objectContaining({
          permissions: expect.arrayContaining(["system.tenant.create"]),
        })
      );
    });
  });

  it("allows selecting all permissions within a domain category", async () => {
    render(<RoleDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Custom Support Agent")).toBeInTheDocument();
    });

    const selectAllBtns = screen.getAllByRole("button", { name: /Select All/i });
    expect(selectAllBtns.length).toBeGreaterThan(0);

    fireEvent.click(selectAllBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Unsaved Permission Changes")).toBeInTheDocument();
    });
  });

  it("opens delete confirm dialog for custom role", async () => {
    render(<RoleDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Custom Support Agent")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole("button", { name: /Delete/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getAllByText("Delete Role")[0]).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to permanently delete the role "Custom Support Agent"/i)
      ).toBeInTheDocument();
    });
  });
});
