import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import KeysSecretsPage from "../../app/(control-plane)/keys-secrets/page";

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

vi.mock("@/lib/use-domain-realtime", () => ({
  useDomainRealtime: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/keys-secrets",
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

describe("KeysSecretsPage Component (PCC-07)", () => {
  const mockCerts = [
    {
      id: "cert-acme-primary",
      tenantId: "00000000-0000-0000-0000-000000000001",
      domainId: "portal.acme.com",
      provider: "letsencrypt",
      status: "ACTIVE",
      notBefore: "2026-01-01T00:00:00.000Z",
      notAfter: "2026-04-01T00:00:00.000Z",
      daysRemaining: 12,
      autoRotateDaysBefore: 30,
      autoRotateScheduled: true,
      serialNumber: "SN-LE-2026-9901",
      issuer: "Let's Encrypt Authority X3",
      subject: "CN=portal.acme.com",
    },
    {
      id: "cert-api-gateway",
      tenantId: "00000000-0000-0000-0000-000000000001",
      domainId: "api.acme.internal",
      provider: "internal_ca",
      status: "ACTIVE",
      notBefore: "2026-01-01T00:00:00.000Z",
      notAfter: "2026-12-31T00:00:00.000Z",
      daysRemaining: 280,
      autoRotateDaysBefore: 15,
      autoRotateScheduled: false,
      serialNumber: "SN-VAULT-2026-0042",
      issuer: "UniERP Internal Root CA",
      subject: "CN=api.acme.internal",
    },
  ];

  const mockLeases = [
    {
      id: "lease-pg-billing-01",
      leaseId: "lease-pg-billing-01",
      secretKey: "database/creds/billing-rw",
      clientIdentity: "srv-invoice-worker",
      issuedAt: "2026-03-20T10:00:00.000Z",
      expiresAt: "2026-03-20T11:00:00.000Z",
      ttlSeconds: 3600,
      status: "ACTIVE",
    },
    {
      id: "lease-redis-cache-02",
      leaseId: "lease-redis-cache-02",
      secretKey: "kv/data/redis-auth",
      clientIdentity: "srv-frontend-ssr",
      issuedAt: "2026-03-19T10:00:00.000Z",
      expiresAt: "2026-03-19T11:00:00.000Z",
      ttlSeconds: 3600,
      status: "REVOKED",
    },
  ];

  const mockChain = {
    certificateId: "cert-acme-primary",
    domain: "portal.acme.com",
    chain: [
      {
        level: "ROOT",
        subject: "ISRG Root X1",
        issuer: "ISRG Root X1",
        fingerprintSha256: "96:BC:EC:06:26:49:76:F3:74:60:77:9A:CF:28:C5:A7:CF:E8:A3:C0:AA:E1:1A:8F:FC:EE:05:C0:BD:DF:08:C6",
        validUntil: "2035-06-04T11:04:38Z",
        isTrusted: true,
        keyAlgorithm: "RSA-4096",
        serialNumber: "00:82:10:CF:DC:D8:F0:4E",
      },
      {
        level: "INTERMEDIATE",
        subject: "R3 Intermediate CA",
        issuer: "ISRG Root X1",
        fingerprintSha256: "67:AD:D1:16:6B:02:0D:E6:13:5F:CD:0E:F7:F1:26:B0:0A:37:90:C3:4C:38:A2:52:A1:8E:2D:80:AC:E8:6C:5B",
        validUntil: "2027-03-13T00:00:00Z",
        isTrusted: true,
        keyAlgorithm: "RSA-2048",
        serialNumber: "40:01:77:21:37:D4:E9:42:B1:6D:2F:38:C4:E1:C2:14",
      },
      {
        level: "LEAF",
        subject: "CN=portal.acme.com",
        issuer: "R3 Intermediate CA",
        fingerprintSha256: "E3:B0:C4:42:98:FC:1C:14:9A:FB:F4:C8:99:6F:B9:24:27:AE:41:E4:64:9B:93:4C:A4:95:99:1B:78:52:B8:55",
        validUntil: "2026-04-01T00:00:00Z",
        isTrusted: true,
        keyAlgorithm: "ECDSA-P256",
        serialNumber: "03:F4:7A:91:22:84:10:99",
      },
    ],
    allTrusted: true,
    leafStatus: "ACTIVE",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("/chain/")) {
        return Promise.resolve({ data: mockChain, status: 200 });
      }
      if (url.includes("/leases")) {
        return Promise.resolve({ data: mockLeases, status: 200 });
      }
      return Promise.resolve({ data: mockCerts, status: 200 });
    });
  });

  it("renders certificates list, KPIs, and lifecycle stages", async () => {
    render(<KeysSecretsPage />);
    expect(screen.getByRole("heading", { name: /Key & Secrets Authority/i })).toBeInTheDocument();
    expect(screen.getByText("Automated Certificate Lifecycle Stages")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("portal.acme.com")).toBeInTheDocument();
      expect(screen.getByText("api.acme.internal")).toBeInTheDocument();
      expect(screen.getAllByText("Let's Encrypt").length).toBeGreaterThan(0);
      expect(screen.getByText("UniERP Internal CA")).toBeInTheDocument();
    });
  });

  it("inspects certificate trust chain in modal", async () => {
    render(<KeysSecretsPage />);

    await waitFor(() => {
      expect(screen.getByText("portal.acme.com")).toBeInTheDocument();
    });

    const chainButtons = screen.getAllByRole("button", { name: /chain/i });
    fireEvent.click(chainButtons[0]);

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith("/platform/v1/certificates/chain/cert-acme-primary");
    });

    await waitFor(() => {
      expect(screen.getByText("Root Certificate Authority")).toBeInTheDocument();
      expect(screen.getByText("Intermediate Certificate Authority")).toBeInTheDocument();
      expect(screen.getByText("Leaf Domain Certificate")).toBeInTheDocument();
      expect(screen.getAllByText("ISRG Root X1").length).toBeGreaterThan(0);
    });
  });

  it("configures auto-rotation threshold via modal", async () => {
    mockApi.post.mockResolvedValue({ success: true, autoRotateDaysBefore: 45 });
    render(<KeysSecretsPage />);

    await waitFor(() => {
      expect(screen.getByText("portal.acme.com")).toBeInTheDocument();
    });

    const scheduleButtons = screen.getAllByRole("button", { name: /schedule/i });
    fireEvent.click(scheduleButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Configure Auto-Rotation:/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /save auto-rotation schedule/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/certificates/cert-acme-primary/schedule-rotation",
        expect.objectContaining({ autoRotateDaysBefore: expect.any(Number) })
      );
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  it("rotates certificate immediately with confirmation", async () => {
    mockApi.post.mockResolvedValue({ success: true });
    render(<KeysSecretsPage />);

    await waitFor(() => {
      expect(screen.getByText("portal.acme.com")).toBeInTheDocument();
    });

    const rotateButtons = screen.getAllByRole("button", { name: /rotate/i });
    fireEvent.click(rotateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Rotate TLS Certificate")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: /rotate certificate now/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/platform/v1/certificates/cert-acme-primary/rotate", {});
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  it("switches to Dynamic Secret Leases tab and revokes a lease", async () => {
    mockApi.del.mockResolvedValue({ success: true });
    render(<KeysSecretsPage />);

    // Click tab
    const leasesTab = screen.getByRole("button", { name: /dynamic secret leases/i });
    fireEvent.click(leasesTab);

    await waitFor(() => {
      expect(screen.getByText("database/creds/billing-rw")).toBeInTheDocument();
      expect(screen.getByText("srv-invoice-worker")).toBeInTheDocument();
      expect(screen.getByText("Revoked Leases")).toBeInTheDocument();
    });

    // Revoke active lease
    const revokeBtn = screen.getAllByRole("button", { name: /revoke/i })[0];
    fireEvent.click(revokeBtn);

    await waitFor(() => {
      expect(screen.getByText("Revoke Dynamic Secret Lease")).toBeInTheDocument();
    });

    const confirmRevoke = screen.getByRole("button", { name: "Revoke Lease" });
    fireEvent.click(confirmRevoke);

    await waitFor(() => {
      expect(mockApi.del).toHaveBeenCalledWith(
        "/platform/v1/certificates/leases/lease-pg-billing-01"
      );
      expect(mockToast.success).toHaveBeenCalled();
    });
  });
});
