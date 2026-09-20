import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TenantDetailPage from "../../app/(control-plane)/tenants/directory/[id]/page";
import { api } from "@/lib/api";

const mockUsePermission = vi.fn();
vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    usePermission: (perm: string) => mockUsePermission(perm),
  };
});

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock("@/lib/use-domain-realtime", () => ({
  useDomainRealtime: vi.fn(),
}));

vi.mock("@/lib/use-toast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "acme-123" }),
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  usePathname: () => "/tenants/directory/acme-123",
}));

describe("TenantDetailPage Component", () => {
  const mockTenant = {
    id: "acme-123",
    name: "Acme Corporation",
    slug: "acme-corp",
    plan: "ENTERPRISE",
    status: "ACTIVE",
    residencyRegion: "us-east-1",
    demoDataLoaded: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    metrics: {
      userCount: 42,
      errorsLast24h: 0,
      healthStatus: "HEALTHY",
    },
    organizations: [
      {
        id: "org-1",
        name: "Acme North America",
        currency: "USD",
        timezone: "America/New_York",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    subscription: {
      planName: "Enterprise Tier",
      status: "ACTIVE",
    },
    auditLogs: [
      {
        id: "log-1",
        action: "tenant.provision",
        actorId: "admin-1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    apps: ["Core CRM", "Inventory", "Finance"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    (api.get as any).mockResolvedValue({ data: mockTenant });
  });

  it("loads and displays tenant details and metrics", async () => {
    render(<TenantDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Acme Corporation")[0]).toBeInTheDocument();
      expect(screen.getByText(/ID: acme-123/i)).toBeInTheDocument();
    });

    expect(screen.getByText("HEALTHY")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Core CRM")).toBeInTheDocument();
    expect(screen.getByText("Inventory")).toBeInTheDocument();
  });

  it("switches tabs between Overview, Organizations, Subscription, and Audit Trail", async () => {
    render(<TenantDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Acme Corporation")[0]).toBeInTheDocument();
    });

    // Switch to Organizations
    fireEvent.click(screen.getByText(/Organizations \(1\)/i));
    expect(screen.getByText("Acme North America")).toBeInTheDocument();
    expect(screen.getByText("America/New_York")).toBeInTheDocument();

    // Switch to Subscription
    fireEvent.click(screen.getByText("Subscription & Entitlements"));
    expect(screen.getByText("Enterprise Tier")).toBeInTheDocument();
    expect(screen.getByText("Max Storage Quota")).toBeInTheDocument();

    // Switch to Audit Trail
    fireEvent.click(screen.getByText("Audit Trail"));
    expect(screen.getByText("tenant.provision")).toBeInTheDocument();
  });

  it("opens edit drawer and updates tenant", async () => {
    (api.patch as any).mockResolvedValue({ data: { ...mockTenant, name: "Acme Global" } });

    render(<TenantDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Acme Corporation")[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Edit Tenant"));

    await waitFor(() => {
      expect(screen.getByText("Edit Tenant: Acme Corporation")).toBeInTheDocument();
    });
  });

  it("renders ForbiddenState when user lacks view permission", () => {
    mockUsePermission.mockReturnValue(false);

    render(<TenantDetailPage />);

    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.queryByText("Acme Corporation")).not.toBeInTheDocument();
  });
});
