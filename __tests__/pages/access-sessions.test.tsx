import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AccessSessionsPage from "../../app/(control-plane)/access/sessions/page";

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
  usePathname: () => "/access/sessions",
}));

const mockApi = {
  get: vi.fn(),
  del: vi.fn(),
  post: vi.fn(),
};
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => mockApi.get(url),
    del: (url: string) => mockApi.del(url),
    post: (url: string, body: any) => mockApi.post(url, body),
  },
}));

describe("AccessSessionsPage Component", () => {
  const mockSessions = [
    {
      id: "sess-1",
      userId: "user-alice",
      user: {
        id: "user-alice",
        name: "Alice Ops",
        firstName: "Alice",
        lastName: "Ops",
        email: "alice@unierp.internal",
      },
      browser: "Chrome 122.0",
      platform: "macOS Sonoma",
      ipAddress: "192.168.1.50",
      location: "San Francisco, CA",
      isActive: true,
      startedAt: "2026-03-20T08:30:00.000Z",
      lastActivityAt: "2026-03-20T10:15:00.000Z",
    },
    {
      id: "sess-2",
      userId: "user-bob",
      user: {
        id: "user-bob",
        name: "Bob Sec",
        firstName: "Bob",
        lastName: "Sec",
        email: "bob@unierp.internal",
      },
      browser: "Firefox 123.0",
      platform: "Ubuntu 22.04",
      ipAddress: "10.0.0.12",
      location: "Frankfurt, DE",
      isActive: false,
      startedAt: "2026-03-19T14:00:00.000Z",
      lastActivityAt: "2026-03-19T18:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockResolvedValue({ data: mockSessions });
    mockApi.del.mockResolvedValue({ data: { success: true } });
    mockApi.post.mockResolvedValue({ data: { count: 2 } });
  });

  it("renders operator sessions table with client postures and IP addresses", async () => {
    render(<AccessSessionsPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sessions" })).toBeInTheDocument();
      expect(screen.getByText("Alice Ops")).toBeInTheDocument();
      expect(screen.getByText("alice@unierp.internal")).toBeInTheDocument();
      expect(screen.getByText("192.168.1.50")).toBeInTheDocument();
      expect(screen.getByText("San Francisco, CA")).toBeInTheDocument();
      expect(screen.getByText("Bob Sec")).toBeInTheDocument();
      expect(screen.getByText("10.0.0.12")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Terminated")).toBeInTheDocument();
    });
  });

  it("renders ForbiddenState when user lacks pcc.identity-governance.access", () => {
    mockUsePermission.mockImplementation((perm) => perm !== "pcc.identity-governance.access");

    render(<AccessSessionsPage />);
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.queryByText("Alice Ops")).not.toBeInTheDocument();
  });

  it("opens revoke session confirm dialog when revoke button is clicked on active session", async () => {
    render(<AccessSessionsPage />);

    await waitFor(() => {
      expect(screen.getByText("Alice Ops")).toBeInTheDocument();
    });

    const revokeBtn = screen.getByTitle("Revoke Session");
    fireEvent.click(revokeBtn);

    await waitFor(() => {
      expect(screen.getAllByText("Revoke Session")[0]).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to terminate this active session from IP 192.168.1.50/i)
      ).toBeInTheDocument();
    });
  });

  it("opens revoke all sessions confirm dialog when 'Revoke All Sessions' button is clicked", async () => {
    render(<AccessSessionsPage />);

    await waitFor(() => {
      expect(screen.getByText("Alice Ops")).toBeInTheDocument();
    });

    const revokeAllBtn = screen.getByRole("button", { name: /Revoke All Sessions/i });
    fireEvent.click(revokeAllBtn);

    await waitFor(() => {
      expect(screen.getByText("Revoke All Operator Sessions")).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to terminate ALL active workforce sessions/i)
      ).toBeInTheDocument();
    });
  });
});
