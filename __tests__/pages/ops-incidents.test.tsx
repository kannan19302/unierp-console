import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OpsIncidentsPage from "../../app/(control-plane)/ops/incidents/page";
import { clearDataCache } from "../../src/lib/data";

const mockUsePermission = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    usePermission: (permission: string) => mockUsePermission(permission),
    useToast: () => mockToast,
  };
});

vi.mock("@/lib/use-domain-realtime", () => ({ useDomainRealtime: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/ops/incidents",
}));

const mockApi = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() };
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      get: (url: string, params?: unknown) => mockApi.get(url, params),
      post: (url: string, body?: unknown) => mockApi.post(url, body),
      patch: (url: string, body?: unknown) => mockApi.patch(url, body),
      del: (url: string, params?: unknown) => mockApi.del(url, params),
    },
  };
});

describe("OpsIncidentsPage", () => {
  const incidents = [
    {
      id: "inc-01",
      title: "Gateway latency degradation",
      service: "api-gateway",
      severity: "CRITICAL",
      status: "INVESTIGATING",
      createdAt: "2026-03-20T10:00:00.000Z",
      updatedAt: "2026-03-20T11:00:00.000Z",
      timeline: [
        { timestamp: "2026-03-20T10:30:00.000Z", actor: "Platform operator", event: "Response team joined" },
        { timestamp: "2026-03-20T10:00:00.000Z", actor: "System monitor", event: "Latency alert triggered" },
      ],
    },
    {
      id: "inc-02",
      title: "Database replication lag",
      service: "db-primary",
      severity: "MAJOR",
      status: "IDENTIFIED",
      createdAt: "2026-03-20T08:00:00.000Z",
      updatedAt: "2026-03-20T09:00:00.000Z",
      timeline: [],
    },
  ];

  beforeEach(() => {
    clearDataCache();
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockImplementation((url: string) => {
      if (url.endsWith("inc-01")) return Promise.resolve({ data: incidents[0], status: 200 });
      if (url.endsWith("inc-02")) return Promise.resolve({ data: incidents[1], status: 200 });
      return Promise.resolve({ data: incidents, status: 200 });
    });
    mockApi.patch.mockResolvedValue({ data: {}, status: 200 });
  });

  it("renders source-reported incident metrics without fabricated SLO compliance", async () => {
    render(<OpsIncidentsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Incidents" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Gateway latency degradation")).toBeInTheDocument());
    expect(screen.getByText("Database replication lag")).toBeInTheDocument();
    expect(screen.queryByText("99.92%")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /simulate/i })).not.toBeInTheDocument();
  });

  it("opens the incident response drawer with chronological evidence", async () => {
    render(<OpsIncidentsPage />);
    await waitFor(() => expect(screen.getByText("Gateway latency degradation")).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("button", { name: "Open incident" })[0]!);

    const drawer = await screen.findByRole("dialog", { name: "Incident inc-01" });
    expect(within(drawer).getByText("Latency alert triggered")).toBeInTheDocument();
    expect(within(drawer).getByText("Response team joined")).toBeInTheDocument();
    const events = within(drawer).getAllByRole("listitem");
    expect(events[0]).toHaveTextContent("Latency alert triggered");
    expect(events[1]).toHaveTextContent("Response team joined");
  });

  it("requires an escalation rationale and sends no spoofed actor", async () => {
    render(<OpsIncidentsPage />);
    await waitFor(() => expect(screen.getByText("Database replication lag")).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("button", { name: "Open incident" })[1]!);
    const drawer = await screen.findByRole("dialog", { name: "Incident inc-02" });
    fireEvent.click(within(drawer).getByRole("button", { name: "Escalate severity" }));

    const dialog = await screen.findByRole("dialog", { name: "Escalate incident" });
    const confirm = within(dialog).getByRole("button", { name: "Escalate incident" });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(dialog).getByPlaceholderText("Describe the measured change requiring escalation"), { target: { value: "Replication lag is increasing" } });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);

    await waitFor(() => expect(mockApi.patch).toHaveBeenCalledWith(
      "/platform/v1/incidents/inc-02/escalate",
      { severity: "CRITICAL", note: "Replication lag is increasing" },
    ));
  });

  it("requires resolution evidence and sends no spoofed actor", async () => {
    render(<OpsIncidentsPage />);
    await waitFor(() => expect(screen.getByText("Gateway latency degradation")).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("button", { name: "Open incident" })[0]!);
    const drawer = await screen.findByRole("dialog", { name: "Incident inc-01" });
    fireEvent.click(within(drawer).getByRole("button", { name: "Resolve incident" }));

    const dialog = await screen.findByRole("dialog", { name: "Resolve incident" });
    const confirm = within(dialog).getByRole("button", { name: "Resolve incident" });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(dialog).getByPlaceholderText("Describe the direct cause of the incident"), { target: { value: "Connection pool exhaustion" } });
    fireEvent.change(within(dialog).getByPlaceholderText("Describe the durable remediation and prevention work"), { target: { value: "Raised pool limits and added saturation alerts" } });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);

    await waitFor(() => expect(mockApi.patch).toHaveBeenCalledWith(
      "/platform/v1/incidents/inc-01/resolve",
      { rootCause: "Connection pool exhaustion", correctiveAction: "Raised pool limits and added saturation alerts" },
    ));
  });

  it("shows a source failure instead of reporting zero incidents", async () => {
    clearDataCache();
    mockApi.get.mockRejectedValue(new Error("Incident service unavailable"));
    render(<OpsIncidentsPage />);
    expect(await screen.findByText("Incident source unavailable")).toBeInTheDocument();
    expect(screen.getAllByText("Unknown").length).toBeGreaterThan(0);
    expect(screen.getByRole("alert")).toHaveTextContent("Incident service unavailable");
  });
});
