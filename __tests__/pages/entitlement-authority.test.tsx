import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EntitlementAuthorityPage from "../../app/(control-plane)/entitlement-authority/page";

const mockUsePermission = vi.fn();
vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    usePermission: (perm: string) => mockUsePermission(perm),
  };
});

const mockShowToast = vi.fn();
vi.mock("@/lib/use-toast", () => ({
  useToast: () => ({
    showToast: mockShowToast,
    toasts: [],
    dismissToast: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/entitlement-authority",
}));

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
};
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    api: {
      get: (url: string, ...args: any[]) => mockApi.get(url, ...args),
      post: (url: string, ...args: any[]) => mockApi.post(url, ...args),
      put: (url: string, ...args: any[]) => mockApi.put(url, ...args),
      del: (url: string, ...args: any[]) => mockApi.del(url, ...args),
    },
  };
});

describe("EntitlementAuthorityPage Component (PCC-05)", () => {
  const mockPools = [
    {
      id: "pool-core-erp",
      name: "Core ERP Standard Enterprise Seats",
      moduleCode: "core-erp",
      totalSeats: 5000,
      allocatedSeats: 3850,
      availableSeats: 1150,
      utilizationPct: 77,
      tier: "ENTERPRISE",
    },
    {
      id: "pool-ai-copilot",
      name: "AI Autonomous Agents & LLM Copilot",
      moduleCode: "ai-copilot",
      totalSeats: 2000,
      allocatedSeats: 1420,
      availableSeats: 580,
      utilizationPct: 71,
      tier: "ENTERPRISE",
    },
  ];

  const mockMatrix = [
    {
      tenantId: "00000000-0000-0000-0000-000000000001",
      tenantName: "Acme Global Corporation",
      planTier: "Enterprise",
      modules: {
        "core-erp": { enabled: true },
        "finance-ledger": { enabled: true },
        "crm-sales": { enabled: true },
        "ai-copilot": { enabled: false },
      },
    },
  ];

  const mockOfflineLicenses = [
    {
      id: "lic-airgap-001",
      licenseKey: "UNIERP-LIC-E3B0C442-98FC1C14-9AFBF4C8",
      tenantId: "00000000-0000-0000-0000-000000000001",
      tenantName: "Acme Global Corporation (Air-Gapped GovCloud)",
      allowedModules: ["core-erp", "finance-ledger", "ai-copilot"],
      maxSeats: 500,
      issuedAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2027-01-01T00:00:00.000Z",
      machineFingerprint: "SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      signature: "hmac-sha256-sig-992a",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("/pools")) {
        return Promise.resolve({ data: mockPools });
      }
      if (url.includes("/matrix")) {
        return Promise.resolve({ data: mockMatrix });
      }
      if (url.includes("/offline-licenses")) {
        return Promise.resolve({ data: mockOfflineLicenses });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it("renders license pools and utilization progress bar (EC-05.1)", async () => {
    render(<EntitlementAuthorityPage />);

    await waitFor(() => {
      expect(screen.getByText("Core ERP Standard Enterprise Seats")).toBeInTheDocument();
      expect(screen.getByText("AI Autonomous Agents & LLM Copilot")).toBeInTheDocument();
      expect(screen.getByText("77% (3850 / 5000 seats)")).toBeInTheDocument();
      expect(screen.getByText("Available: 1150")).toBeInTheDocument();
    });
  });

  it("creates a new license pool via modal (EC-05.1)", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        id: "pool-new",
        name: "Mobile Barcode Scanner Seats",
        moduleCode: "inventory-scm",
        totalSeats: 1500,
        allocatedSeats: 0,
        availableSeats: 1500,
        utilizationPct: 0,
        tier: "STANDARD",
      },
    });

    render(<EntitlementAuthorityPage />);

    await waitFor(() => {
      expect(screen.getByText("Core ERP Standard Enterprise Seats")).toBeInTheDocument();
    });

    const createBtn = screen.getByRole("button", { name: /Create Seat Pool/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Create License Pool" })).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText("e.g. Supply Chain Mobile Barcode Seats");
    fireEvent.change(nameInput, { target: { value: "Mobile Barcode Scanner Seats" } });

    const submitBtn = screen.getByRole("button", { name: "Create Pool" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/entitlements/pools",
        expect.objectContaining({
          name: "Mobile Barcode Scanner Seats",
        })
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Pool Created",
          variant: "success",
        })
      );
    });
  });

  it("allocates seats from an existing pool to a tenant (EC-05.1)", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        id: "pool-core-erp",
        allocatedSeats: 3950,
        availableSeats: 1050,
        utilizationPct: 79,
      },
    });

    render(<EntitlementAuthorityPage />);

    await waitFor(() => {
      expect(screen.getByText("Core ERP Standard Enterprise Seats")).toBeInTheDocument();
    });

    const allocateBtns = screen.getAllByRole("button", { name: /Allocate Seats/i });
    fireEvent.click(allocateBtns[0]);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Allocate Seats from Pool" })).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: "Confirm Allocation" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/entitlements/pools/pool-core-erp/allocate",
        expect.objectContaining({
          seatCount: 50,
        })
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Seats Allocated",
          variant: "success",
        })
      );
    });
  });

  it("switches to Module Grant Matrix and toggles capability (EC-05.2)", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        tenantId: "00000000-0000-0000-0000-000000000001",
        modules: { "ai-copilot": { enabled: true } },
      },
    });

    render(<EntitlementAuthorityPage />);

    const matrixTab = screen.getByRole("tab", { name: /Module Grant Matrix/i });
    fireEvent.click(matrixTab);

    await waitFor(() => {
      expect(screen.getByText("Interactive Module Grant Matrix")).toBeInTheDocument();
      expect(screen.getByText("Acme Global Corporation")).toBeInTheDocument();
    });

    // Find AI Copilot toggle button
    const toggleBtn = screen.getByRole("button", { name: /Toggle AI Copilot for Acme Global Corporation/i });
    expect(toggleBtn).toHaveTextContent("DISABLED");
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/entitlements/matrix/toggle",
        {
          tenantId: "00000000-0000-0000-0000-000000000001",
          moduleCode: "ai-copilot",
          enabled: true,
        }
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Entitlement Updated",
          variant: "success",
        })
      );
    });
  });

  it("executes bulk capability enablement across tenants (EC-05.2)", async () => {
    mockApi.post.mockResolvedValueOnce({ data: { success: true, affectedTenants: 3 } });

    render(<EntitlementAuthorityPage />);

    const matrixTab = screen.getByRole("tab", { name: /Module Grant Matrix/i });
    fireEvent.click(matrixTab);

    await waitFor(() => {
      expect(screen.getByText("Interactive Module Grant Matrix")).toBeInTheDocument();
    });

    const bulkBtn = screen.getByRole("button", { name: "Bulk Enable" });
    fireEvent.click(bulkBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/entitlements/matrix/bulk",
        expect.objectContaining({
          enabled: true,
        })
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Bulk Update Completed",
          variant: "success",
        })
      );
    });
  });

  it("switches to Offline Cryptographic Licenses and issues signed license (EC-05.3)", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        id: "lic-new",
        licenseKey: "UNIERP-LIC-99887766-55443322",
        tenantId: "tenant-defense-01",
        tenantName: "Defense Air-Gap Unit 7",
        maxSeats: 300,
        allowedModules: ["core-erp"],
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        signature: "hmac-sig-12345",
      },
    });

    render(<EntitlementAuthorityPage />);

    const licTab = screen.getByRole("tab", { name: /Offline Cryptographic Licenses/i });
    fireEvent.click(licTab);

    await waitFor(() => {
      expect(screen.getByText("Cryptographically Signed Offline Licenses")).toBeInTheDocument();
      expect(screen.getByText("Acme Global Corporation (Air-Gapped GovCloud)")).toBeInTheDocument();
      expect(screen.getByText("UNIERP-LIC-E3B0C442-98FC1C14-9AFBF4C8")).toBeInTheDocument();
    });

    const issueBtn = screen.getByRole("button", { name: /Issue Cryptographic License/i });
    fireEvent.click(issueBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Issue Cryptographic Offline License" })).toBeInTheDocument();
    });

    const tenantIdInput = screen.getByPlaceholderText("e.g. 00000000-0000-0000-0000-000000000001");
    fireEvent.change(tenantIdInput, { target: { value: "tenant-defense-01" } });

    const tenantNameInput = screen.getByPlaceholderText("e.g. Acme Defense Air-Gap Cell 01");
    fireEvent.change(tenantNameInput, { target: { value: "Defense Air-Gap Unit 7" } });

    const submitBtn = screen.getByRole("button", { name: "Generate & Sign License" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/entitlements/offline-licenses/generate",
        expect.objectContaining({
          tenantId: "tenant-defense-01",
          tenantName: "Defense Air-Gap Unit 7",
        })
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Cryptographic License Issued",
          variant: "success",
        })
      );
    });
  });
});
