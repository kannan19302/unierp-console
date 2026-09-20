import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StaffDetailPage from "../../app/(control-plane)/access/directory/[id]/page";

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
  useParams: () => ({ id: "staff-1" }),
  usePathname: () => "/access/directory/staff-1",
}));

const mockApi = {
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
};
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => mockApi.get(url),
    patch: (url: string, body: any) => mockApi.patch(url, body),
    post: (url: string, body: any) => mockApi.post(url, body),
    del: (url: string) => mockApi.del(url),
  },
}));

describe("StaffDetailPage Component", () => {
  const mockStaffData = {
    id: "staff-1",
    email: "operator.alice@unierp.internal",
    name: "Alice Ops",
    firstName: "Alice",
    lastName: "Ops",
    status: "ACTIVE",
    mfaEnabled: true,
    lastLoginAt: "2026-03-20T10:00:00.000Z",
    activeSessionCount: 1,
    roles: [
      {
        id: "role-1",
        name: "Super Administrator",
        description: "Full global bypass across all PCC modules",
        isSystem: true,
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const mockEffectiveAccess = {
    effectivePermissions: ["system.tenant.view", "system.tenant.create", "pcc.identity-governance.access"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("/effective-access")) {
        return Promise.resolve({ data: mockEffectiveAccess });
      }
      return Promise.resolve({ data: mockStaffData });
    });
  });

  it("renders operator profile with details and overview tab", async () => {
    render(<StaffDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Alice Ops").length).toBeGreaterThan(0);
      expect(screen.getAllByText("operator.alice@unierp.internal").length).toBeGreaterThan(0);
      expect(screen.getAllByText("ACTIVE").length).toBeGreaterThan(0);
      expect(screen.getByText("MFA Enforced")).toBeInTheDocument();
    });
  });

  it("renders ForbiddenState when user lacks pcc.identity-governance.access", () => {
    mockUsePermission.mockImplementation((perm) => perm !== "pcc.identity-governance.access");

    render(<StaffDetailPage />);
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.queryByText("Alice Ops")).not.toBeInTheDocument();
  });

  it("switches tabs to view assigned roles and sessions", async () => {
    render(<StaffDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Alice Ops").length).toBeGreaterThan(0);
    });

    // Switch to Roles tab
    const rolesTab = screen.getByRole("button", { name: /Assigned Roles/i });
    fireEvent.click(rolesTab);

    expect(screen.getByText("Super Administrator")).toBeInTheDocument();
    expect(screen.getByText("ID: role-1")).toBeInTheDocument();

    // Switch to Permissions tab
    const permsTab = screen.getByRole("button", { name: /Effective Permissions/i });
    fireEvent.click(permsTab);

    expect(screen.getByText("system.tenant.view")).toBeInTheDocument();
    expect(screen.getByText("system.tenant.create")).toBeInTheDocument();
  });

  it("opens edit drawer when edit button is clicked", async () => {
    render(<StaffDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Alice Ops").length).toBeGreaterThan(0);
    });

    const editBtn = screen.getByRole("button", { name: /Edit Profile/i });
    fireEvent.click(editBtn);

    await waitFor(() => {
      expect(screen.getByText("Edit Operator: Alice Ops")).toBeInTheDocument();
    });
  });

  it("opens revoke all sessions confirm dialog", async () => {
    render(<StaffDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Alice Ops").length).toBeGreaterThan(0);
    });

    const revokeBtn = screen.getByRole("button", { name: /Revoke Sessions/i });
    fireEvent.click(revokeBtn);

    await waitFor(() => {
      expect(screen.getByText("Revoke All Operator Sessions")).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to revoke all active sessions for "Alice Ops"/i)
      ).toBeInTheDocument();
    });
  });

  it("opens deactivate account confirm dialog", async () => {
    render(<StaffDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Alice Ops").length).toBeGreaterThan(0);
    });

    const deactivateBtn = screen.getByRole("button", { name: /Deactivate/i });
    fireEvent.click(deactivateBtn);

    await waitFor(() => {
      expect(screen.getByText("Deactivate Staff Operator")).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to deactivate "Alice Ops"/i)
      ).toBeInTheDocument();
    });
  });
});
