import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import OpsIncidentsPage from "../../app/(control-plane)/ops/incidents/page";

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
  usePathname: () => "/ops/incidents",
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
      get: (url: string, params?: any) => mockApi.get(url, params),
      post: (url: string, body?: any) => mockApi.post(url, body),
      patch: (url: string, body?: any) => mockApi.patch(url, body),
      del: (url: string, params?: any) => mockApi.del(url, params),
    },
  };
});

describe("OpsIncidentsPage Component", () => {
  const mockIncidents = [
    {
      id: "inc-01",
      title: "API Gateway P99 Latency SLA Degradation",
      service: "api-gateway",
      severity: "CRITICAL",
      status: "INVESTIGATING",
      createdAt: "2026-03-20T10:00:00.000Z",
      updatedAt: "2026-03-20T11:00:00.000Z",
      timeline: [
        { timestamp: "2026-03-20T10:00:00.000Z", actor: "System Monitor", event: "Latency alert triggered" },
      ],
    },
    {
      id: "inc-02",
      title: "PostgreSQL Primary-Replica Lag",
      service: "db-primary",
      severity: "MAJOR",
      status: "IDENTIFIED",
      createdAt: "2026-03-20T08:00:00.000Z",
      updatedAt: "2026-03-20T09:00:00.000Z",
      timeline: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockResolvedValue({ data: mockIncidents, status: 200 });
  });

  it("renders the page with stat cards and incident rows", async () => {
    render(<OpsIncidentsPage />);
    expect(screen.getByText("Platform Operations — Incident War Room")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("API Gateway P99 Latency SLA Degradation")).toBeInTheDocument();
      expect(screen.getByText("PostgreSQL Primary-Replica Lag")).toBeInTheDocument();
    });
  });

  it("opens war room inspection drawer with timeline feed", async () => {
    render(<OpsIncidentsPage />);
    await waitFor(() => {
      expect(screen.getByText("API Gateway P99 Latency SLA Degradation")).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByText("Inspect War Room");
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("War Room — inc-01")).toBeInTheDocument();
      expect(screen.getByText("Latency alert triggered")).toBeInTheDocument();
    });
  });

  it("opens escalation modal and submits severity upgrade", async () => {
    mockApi.patch.mockResolvedValue({ id: "inc-01", severity: "CRITICAL" });
    render(<OpsIncidentsPage />);

    await waitFor(() => {
      expect(screen.getByText("API Gateway P99 Latency SLA Degradation")).toBeInTheDocument();
    });

    // Open drawer for second incident (MAJOR)
    const inspectButtons = screen.getAllByText("Inspect War Room");
    fireEvent.click(inspectButtons[1]);

    await waitFor(() => {
      expect(screen.getByText("War Room — inc-02")).toBeInTheDocument();
    });

    const escalateBtn = screen.getByText("Escalate Severity");
    fireEvent.click(escalateBtn);

    await waitFor(() => {
      expect(screen.getByText("Confirm Escalation")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Confirm Escalation"));

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith(
        "/platform/v1/incidents/inc-02/escalate",
        expect.objectContaining({ severity: "CRITICAL" })
      );
    });
  });

  it("resolves incident with root cause and corrective action", async () => {
    mockApi.patch.mockResolvedValue({ id: "inc-01", status: "RESOLVED" });
    render(<OpsIncidentsPage />);

    await waitFor(() => {
      expect(screen.getByText("API Gateway P99 Latency SLA Degradation")).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByText("Inspect War Room");
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("War Room — inc-01")).toBeInTheDocument();
    });

    const resolveBtn = screen.getByText("Resolve Incident");
    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(screen.getByText("Mark as Resolved")).toBeInTheDocument();
    });

    const rootCauseInput = screen.getByPlaceholderText("Describe what directly caused the anomaly or failure...");
    const correctiveActionInput = screen.getByPlaceholderText("Describe remediations applied to resolve and prevent reoccurrence...");
    fireEvent.change(rootCauseInput, { target: { value: "Ingress connection pool exhaustion" } });
    fireEvent.change(correctiveActionInput, { target: { value: "Scaled pool limit to 2000" } });

    fireEvent.click(screen.getByText("Mark as Resolved"));

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith(
        "/platform/v1/incidents/inc-01/resolve",
        expect.objectContaining({
          rootCause: "Ingress connection pool exhaustion",
          correctiveAction: "Scaled pool limit to 2000",
        })
      );
    });
  });
});
