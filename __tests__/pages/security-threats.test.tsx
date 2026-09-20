import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SecurityThreatsPage from "../../app/(control-plane)/security/threats/page";

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
  usePathname: () => "/security/threats",
}));

const mockApi = {
  get: vi.fn(),
  patch: vi.fn(),
};
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => mockApi.get(url),
    patch: (url: string, body: any) => mockApi.patch(url, body),
  },
}));

describe("SecurityThreatsPage Component", () => {
  const mockThreats = [
    {
      id: "THR-101",
      type: "DATA_EXFILTRATION_PROBE",
      severity: "CRITICAL",
      title: "Cross-Tenant Partition Probing Detected",
      description: "Repeated unauthorized attempts to scan neighboring tenant schema objects",
      sourceIp: "198.51.100.44",
      targetTenant: "tenant-acme",
      status: "NEW",
      detectedAt: "2026-09-20T10:15:00.000Z",
      triageHistory: [],
    },
    {
      id: "THR-102",
      type: "ANOMALOUS_AUTH",
      severity: "HIGH",
      title: "Anomalous Geographic Privileged Login",
      description: "SuperAdmin credential accessed from unfamiliar region outside declared corporate CIDR",
      sourceIp: "203.0.113.88",
      targetTenant: "global",
      status: "ACKNOWLEDGED",
      detectedAt: "2026-09-20T11:42:00.000Z",
      triageHistory: [
        {
          action: "ACKNOWLEDGE",
          notes: "MFA challenge was satisfied but IP risk score is 92/100.",
          by: "sec-analyst-1",
          at: "2026-09-20T11:45:00.000Z",
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockResolvedValue({
      data: { data: mockThreats, total: mockThreats.length },
    });
    mockApi.patch.mockResolvedValue({ data: { success: true } });
  });

  it("renders live threats table with severities, anomaly titles, and origin IPs", async () => {
    render(<SecurityThreatsPage />);

    await waitFor(() => {
      expect(screen.getByText("Cross-Tenant Partition Probing Detected")).toBeInTheDocument();
      expect(screen.getByText("Anomalous Geographic Privileged Login")).toBeInTheDocument();
      expect(screen.getByText("Origin IP: 198.51.100.44")).toBeInTheDocument();
      expect(screen.getByText("CRITICAL")).toBeInTheDocument();
      expect(screen.getByText("HIGH")).toBeInTheDocument();
    });
  });

  it("renders ForbiddenState when user lacks pcc.security.view", () => {
    mockUsePermission.mockImplementation((perm) => perm !== "pcc.security.view");

    render(<SecurityThreatsPage />);
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.queryByText("Cross-Tenant Partition Probing Detected")).not.toBeInTheDocument();
  });

  it("triggers quick triage stage progression when Acknowledge is clicked", async () => {
    render(<SecurityThreatsPage />);

    await waitFor(() => {
      expect(screen.getByText("Cross-Tenant Partition Probing Detected")).toBeInTheDocument();
    });

    const acknowledgeBtn = screen.getByRole("button", { name: /Acknowledge/i });
    fireEvent.click(acknowledgeBtn);

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith(
        "/platform/v1/soc/threats/THR-101/triage",
        expect.objectContaining({ action: "ACKNOWLEDGE" })
      );
    });
  });

  it("opens forensic analysis side panel when inspect button is clicked", async () => {
    render(<SecurityThreatsPage />);

    await waitFor(() => {
      expect(screen.getByText("Cross-Tenant Partition Probing Detected")).toBeInTheDocument();
    });

    const inspectBtns = screen.getAllByTitle("Inspect Forensic Timeline");
    fireEvent.click(inspectBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Forensic Analysis: THR-101")).toBeInTheDocument();
      expect(screen.getByText("Anomaly Summary")).toBeInTheDocument();
      expect(screen.getByText("Triage History & Evidence Trail")).toBeInTheDocument();
    });
  });

  it("opens custom triage record drawer when history action button is clicked", async () => {
    render(<SecurityThreatsPage />);

    await waitFor(() => {
      expect(screen.getByText("Cross-Tenant Partition Probing Detected")).toBeInTheDocument();
    });

    const triageRecordBtns = screen.getAllByTitle("Add Triage Record");
    fireEvent.click(triageRecordBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Triage Threat: THR-101")).toBeInTheDocument();
      expect(screen.getByLabelText(/Triage & Remediation Notes/i)).toBeInTheDocument();
    });
  });
});
