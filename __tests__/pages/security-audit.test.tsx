import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SecurityAuditPage from "../../app/(control-plane)/security/audit/page";

// Mock hooks
const mockUsePermission = vi.fn();
vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/security/audit",
}));

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
};
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    api: {
      get: (url: string, ...args: any[]) => mockApi.get(url, ...args),
      post: (url: string, ...args: any[]) => mockApi.post(url, ...args),
      patch: (url: string, ...args: any[]) => mockApi.patch(url, ...args),
      del: (url: string, ...args: any[]) => mockApi.del(url, ...args),
    },
  };
});

describe("SecurityAuditPage Component", () => {
  const mockAuditRecords = [
    {
      id: "rec-001",
      sequenceNum: 1042,
      actorId: "operator-admin",
      actorRole: "SUPER_ADMIN",
      action: "tenant.provision",
      targetId: "tenant-acme-corp",
      contentHash: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
      previousHash: "f0e1d2c3b4a5968778695a4b3c2d1e0ff0e1d2c3b4a5968778695a4b3c2d1e0f",
      details: { tenantName: "Acme Corp", plan: "ENTERPRISE" },
      ipAddress: "192.168.1.100",
      correlationId: "corr-888999",
      createdAt: "2026-09-20T10:00:00Z",
    },
    {
      id: "rec-002",
      sequenceNum: 1043,
      actorId: "operator-admin",
      actorRole: "SUPER_ADMIN",
      action: "tenant.quarantine",
      targetId: "tenant-rogue-01",
      contentHash: "b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1",
      previousHash: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
      details: { reason: "Anomalous exfiltration attempt" },
      ipAddress: "192.168.1.100",
      correlationId: "corr-888999",
      createdAt: "2026-09-20T10:05:00Z",
    },
  ];

  const mockStats = {
    totalRecords: 1043,
    uniqueActorsCount: 4,
    chainIntegrityStatus: "VERIFIED",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("/audit/stats")) {
        return Promise.resolve({ data: mockStats, status: 200 });
      }
      if (url.includes("/audit/records")) {
        return Promise.resolve({ data: mockAuditRecords, status: 200 });
      }
      if (url.includes("/verify-chain/")) {
        return Promise.resolve({ data: { verified: 2 }, status: 200 });
      }
      return Promise.resolve({ data: [], status: 200 });
    });
  });

  it("renders audit spine records with sequence numbers and tamper-evidence KPIs", async () => {
    render(<SecurityAuditPage />);

    await waitFor(() => {
      expect(screen.getByText("tenant.provision")).toBeInTheDocument();
      expect(screen.getByText("tenant.quarantine")).toBeInTheDocument();
      expect(screen.getAllByText("operator-admin").length).toBeGreaterThanOrEqual(1);
    });

    // Check stats
    expect(screen.getByText("Total Audit Records")).toBeInTheDocument();
    expect(screen.getByText("Tamper-Evidence")).toBeInTheDocument();
  });

  it("inspects audit record mutation payload in modal", async () => {
    render(<SecurityAuditPage />);

    await waitFor(() => {
      expect(screen.getByText("tenant.provision")).toBeInTheDocument();
    });

    const inspectBtns = screen.getAllByTitle("Inspect Payload");
    fireEvent.click(inspectBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Audit Payload: tenant\.provision/i)).toBeInTheDocument();
      expect(screen.getByText("RECORD MUTATION DETAILS (JSON):")).toBeInTheDocument();
    });
  });

  it("verifies SHA-256 hash chain for an operator", async () => {
    render(<SecurityAuditPage />);

    await waitFor(() => {
      expect(screen.getByText("tenant.provision")).toBeInTheDocument();
    });

    const verifyBtns = screen.getAllByTitle("Verify SHA-256 Hash Chain");
    fireEvent.click(verifyBtns[0]);

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining("/platform/v1/audit/verify-chain/operator-admin")
      );
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining("Verified 2 record(s). Chain is intact."),
        expect.any(String)
      );
    });
  });

  it("executes certified data retention purge", async () => {
    mockApi.post.mockResolvedValueOnce({ data: { certified: true } });

    render(<SecurityAuditPage />);

    await waitFor(() => {
      expect(screen.getByText("tenant.provision")).toBeInTheDocument();
    });

    const retentionBtn = screen.getByRole("button", { name: /Certified Retention/i });
    fireEvent.click(retentionBtn);

    await waitFor(() => {
      expect(screen.getByText("Execute Certified Data Retention")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Execute & Certify/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/platform/v1/retention-schedule/execute", {
        dataClass: "AUDIT_LOGS",
      });
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining("Retention policy executed and certified"),
        expect.any(String)
      );
    });
  });

  it("exports forensic evidence bundle", async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: "ev-bundle-1" } });

    render(<SecurityAuditPage />);

    await waitFor(() => {
      expect(screen.getByText("tenant.provision")).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: /Export Forensics/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText("Export Forensic Audit Bundle")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Export Bundle/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/compliance-controls/AUDIT-COMPLETE/evidence",
        expect.objectContaining({ auditorQuestion: expect.any(String) })
      );
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining("Signed cryptographic audit evidence archive generated."),
        expect.any(String)
      );
    });
  });
});
