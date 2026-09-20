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

describe("SecurityPoliciesPage Component (EC-8.1)", () => {
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
    mockApi.post.mockImplementation(async (url: string, body: any) => {
      if (url.includes("/policies/evaluate")) {
        return {
          data: {
            decision: body.subject?.role === "SUPER_ADMIN" ? "ALLOW" : "DENY",
            matchedPolicy: "pol-test",
            matchedRule: "Test Evaluated Rule",
            reasons: ["Evaluated in test environment."],
            evaluatedAt: new Date().toISOString(),
          },
        };
      }
      return { data: { success: true } };
    });
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

  it("opens register policy drawer when 'Create Policy' button is clicked", async () => {
    render(<SecurityPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText("Strict PostgreSQL RLS Invariant Enforcer")).toBeInTheDocument();
    });

    const createBtn = screen.getByRole("button", { name: /Create Policy/i });
    fireEvent.click(createBtn);

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

  it("satisfies EC-8.1: visual ABAC policy rules editor manages conditions and priorities", async () => {
    render(<SecurityPoliciesPage />);

    // Switch to ABAC Rules tab
    const abacTab = screen.getByRole("button", { name: /Visual ABAC Policy Rules/i });
    fireEvent.click(abacTab);

    // Verify default rules
    expect(screen.getByText("SuperAdmin Universal Bypass Clearance")).toBeInTheDocument();
    expect(screen.getByText("Customer PII Strict Isolation Perimeter")).toBeInTheDocument();
    expect(screen.getByText("Off-Hours Destructive Mutation Governance")).toBeInTheDocument();

    // Priority adjust controls
    const upBtns = screen.getAllByTitle("Increase Priority");
    expect(upBtns.length).toBeGreaterThanOrEqual(1);
    // Click on down button for first item
    const downBtns = screen.getAllByTitle("Decrease Priority");
    fireEvent.click(downBtns[0]);

    // Open Add ABAC Rule Modal
    const addRuleBtns = screen.getAllByRole("button", { name: /Add ABAC Rule/i });
    fireEvent.click(addRuleBtns[0]);

    expect(screen.getByText(/Create Visual ABAC Policy Rule/i)).toBeInTheDocument();

    // Fill rule details
    const nameInput = screen.getByPlaceholderText(/e.g. Finance Ledger Write Lockdown/i);
    fireEvent.change(nameInput, { target: { value: "Finance Ledger Integrity Barrier" } });

    // Add another condition
    const addCondBtn = screen.getByRole("button", { name: /Add Condition/i });
    fireEvent.click(addCondBtn);

    // Save rule
    const saveBtn = screen.getByRole("button", { name: /Save ABAC Policy Rule/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Create Visual ABAC Policy Rule/i)).not.toBeInTheDocument();
      expect(screen.getByText("Finance Ledger Integrity Barrier")).toBeInTheDocument();
    });
  });

  it("satisfies EC-8.1: policy evaluation simulator tests sample requests and renders decision trace", async () => {
    render(<SecurityPoliciesPage />);

    // Switch to Simulator tab
    const simTab = screen.getByRole("button", { name: /Policy Evaluation Simulator/i });
    fireEvent.click(simTab);

    expect(screen.getByText("Simulate ABAC Access Request")).toBeInTheDocument();
    expect(screen.getByText("Decision & Audit Trace")).toBeInTheDocument();

    // Select role & resource
    const roleSelect = screen.getByLabelText(/Select subject role/i);
    fireEvent.change(roleSelect, { target: { value: "SUPER_ADMIN" } });

    // Click evaluate
    const evalBtn = screen.getByRole("button", { name: /Evaluate Sample Request/i });
    fireEvent.click(evalBtn);

    await waitFor(() => {
      expect(screen.getByText(/DECISION: ALLOW/i)).toBeInTheDocument();
      expect(screen.getByText(/Evaluation Reasons:/i)).toBeInTheDocument();
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

    const confirmInput = screen.getByPlaceholderText("Strict PostgreSQL RLS Invariant Enforcer");
    fireEvent.change(confirmInput, { target: { value: "Strict PostgreSQL RLS Invariant Enforcer" } });

    const confirmButtons = screen.getAllByRole("button", { name: "Delete Policy" });
    const confirmBtn = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApi.del).toHaveBeenCalledWith("/platform/v1/soc/policies/pol-rls-1");
    });
  });
});
