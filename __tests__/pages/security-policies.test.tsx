import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SecurityPoliciesPage from "../../app/(control-plane)/security/policies/page";

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/security/policies",
}));

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
};
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => mockApi.get(url),
    post: (url: string, body: any) => mockApi.post(url, body),
    patch: (url: string, body: any) => mockApi.patch(url, body),
    del: (url: string) => mockApi.del(url),
  },
}));

describe("SecurityPoliciesPage Component", () => {
  const mockPolicies = [
    {
      id: "pol-rls-1",
      name: "Strict PostgreSQL RLS Invariant Enforcer",
      description: "Mandates NOBYPASSRLS on multi-tenant queries",
      version: 3,
      scopeType: "PLATFORM",
      isolationLevel: "ROW_LEVEL_SECURITY",
      enforcementMode: "BLOCK",
      enabled: true,
      createdAt: "2026-01-10T00:00:00.000Z",
    },
    {
      id: "pol-key-2",
      name: "Cryptographic Key Envelope Auto-Rotation",
      description: "Enforces 90-day maximum age for tenant keys",
      version: 1,
      scopeType: "REGION",
      scopeId: "us-east-1",
      isolationLevel: "DATABASE_PER_TENANT",
      enforcementMode: "ALERT",
      enabled: false,
      createdAt: "2026-02-01T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockResolvedValue({
      data: { data: mockPolicies, total: mockPolicies.length },
    });
    mockApi.post.mockResolvedValue({ data: { success: true } });
    mockApi.patch.mockResolvedValue({ data: { success: true } });
    mockApi.del.mockResolvedValue({ data: { success: true } });
  });

  it("renders policies table with directives, isolation strategies, and stat cards", async () => {
    render(<SecurityPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText("Strict PostgreSQL RLS Invariant Enforcer")).toBeInTheDocument();
      expect(screen.getByText("Cryptographic Key Envelope Auto-Rotation")).toBeInTheDocument();
      expect(screen.getByText("Mandates NOBYPASSRLS on multi-tenant queries")).toBeInTheDocument();
      expect(screen.getByText("BLOCK")).toBeInTheDocument();
      expect(screen.getByText("ALERT")).toBeInTheDocument();
    });
  });

  it("renders ForbiddenState when user lacks pcc.security.view", () => {
    mockUsePermission.mockImplementation((perm) => perm !== "pcc.security.view");

    render(<SecurityPoliciesPage />);
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.queryByText("Strict PostgreSQL RLS Invariant Enforcer")).not.toBeInTheDocument();
  });

  it("opens register policy drawer when 'Register Policy' button is clicked", async () => {
    render(<SecurityPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText("Strict PostgreSQL RLS Invariant Enforcer")).toBeInTheDocument();
    });

    const registerBtn = screen.getByRole("button", { name: /Register Policy/i });
    fireEvent.click(registerBtn);

    await waitFor(() => {
      expect(screen.getByText("Register Security Policy")).toBeInTheDocument();
      expect(screen.getByLabelText(/Policy Name/i)).toBeInTheDocument();
    });
  });

  it("toggles policy status between active and disabled", async () => {
    render(<SecurityPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText("Strict PostgreSQL RLS Invariant Enforcer")).toBeInTheDocument();
    });

    const activeBtn = screen.getByRole("button", { name: /ACTIVE/i });
    fireEvent.click(activeBtn);

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith(
        "/platform/v1/soc/policies/pol-rls-1",
        expect.objectContaining({ enabled: false })
      );
    });
  });

  it("opens delete confirmation dialog and triggers deletion on confirm", async () => {
    render(<SecurityPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText("Strict PostgreSQL RLS Invariant Enforcer")).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByTitle("Delete Policy");
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Delete Security Policy")).toBeInTheDocument();
    });

    const confirmButtons = screen.getAllByRole("button", { name: "Delete Policy" });
    const confirmBtn = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApi.del).toHaveBeenCalledWith("/platform/v1/soc/policies/pol-rls-1");
    });
  });
});
