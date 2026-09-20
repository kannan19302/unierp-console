import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SecurityCompliancePage from "../../app/(control-plane)/security/compliance/page";

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/security/compliance",
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

describe("SecurityCompliancePage Component", () => {
  const mockFrameworks = [
    {
      id: "soc2",
      name: "SOC 2 Type II",
      version: "2026-Trust-Services",
      coveragePct: 100,
      status: "COMPLIANT",
      controls: 4,
      controlsPassed: 4,
    },
    {
      id: "iso27001",
      name: "ISO/IEC 27001:2022",
      version: "2022-Annex-A",
      coveragePct: 75,
      status: "PARTIAL",
      controls: 4,
      controlsPassed: 3,
    },
    {
      id: "gdpr",
      name: "GDPR Article 32 (Security)",
      version: "EU-2016/679",
      coveragePct: 50,
      status: "PARTIAL",
      controls: 2,
      controlsPassed: 1,
    },
  ];

  const mockEvidence = [
    {
      id: "ev-001",
      controlCode: "AUDIT-COMPLETE",
      auditorQuestion: "Show proof of tenant provisioning audit trail",
      generatedAt: "2026-09-18T10:00:00Z",
      generatedBy: "operator-admin",
      contentHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      recordCount: 14,
      artefact: {
        records: [{ id: "aud-1", action: "tenant.provision" }],
        metadata: {
          generatedAt: "2026-09-18T10:00:00Z",
          operatorId: "operator-admin",
          controlCode: "AUDIT-COMPLETE",
          auditorQuestion: "Show proof of tenant provisioning audit trail",
        },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("/frameworks")) {
        return Promise.resolve({ data: mockFrameworks });
      }
      if (url.includes("/evidence")) {
        return Promise.resolve({ data: mockEvidence });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it("renders framework cards with compliance status and progress", async () => {
    render(<SecurityCompliancePage />);

    await waitFor(() => {
      expect(screen.getByText("SOC 2 Type II")).toBeInTheDocument();
      expect(screen.getByText("ISO/IEC 27001:2022")).toBeInTheDocument();
      expect(screen.getByText("GDPR Article 32 (Security)")).toBeInTheDocument();
    });

    // Check stats
    expect(screen.getByText("Active Frameworks")).toBeInTheDocument();
    expect(screen.getByText("Fully Compliant")).toBeInTheDocument();
  });

  it("runs continuous monitoring across all controls when requested", async () => {
    mockApi.post.mockResolvedValueOnce({ data: { count: 3 } });

    render(<SecurityCompliancePage />);

    await waitFor(() => {
      expect(screen.getByText("SOC 2 Type II")).toBeInTheDocument();
    });

    const runBtn = screen.getByRole("button", { name: /Run Monitoring/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/platform/v1/compliance-controls/monitor");
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining("Continuous monitoring completed"),
        expect.any(String)
      );
    });
  });

  it("switches to the Evidence Vault tab and inspects evidence bundle", async () => {
    render(<SecurityCompliancePage />);

    await waitFor(() => {
      expect(screen.getByText("SOC 2 Type II")).toBeInTheDocument();
    });

    const vaultTab = screen.getByTestId("tab-evidence");
    fireEvent.click(vaultTab);

    await waitFor(() => {
      expect(screen.getAllByText("AUDIT-COMPLETE").length).toBeGreaterThan(0);
    });

    const inspectBtn = screen.getByRole("button", { name: /Inspect/i });
    fireEvent.click(inspectBtn);

    await waitFor(() => {
      expect(screen.getByText("Evidence Bundle: AUDIT-COMPLETE")).toBeInTheDocument();
      expect(screen.getByText("SAMPLE AUDIT RECORDS")).toBeInTheDocument();
    });
  });

  it("exports evidence for an auditor inquiry", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        id: "ev-002",
        controlCode: "APPROVAL-TWO-PERSON",
        recordCount: 5,
        contentHash: "abcd1234efgh5678",
      },
    });

    render(<SecurityCompliancePage />);

    await waitFor(() => {
      expect(screen.getByText("SOC 2 Type II")).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: /Export Evidence/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText("Export Cryptographic Compliance Evidence")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Generate Evidence/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/compliance-controls/"),
        expect.objectContaining({ auditorQuestion: expect.any(String) })
      );
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining("Generated cryptographically verifiable bundle"),
        expect.any(String)
      );
    });
  });
});
