import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InvoiceDetailPage from "../../app/(control-plane)/billing/invoices/[id]/page";

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

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useParams: () => ({ id: "inv-101" }),
  usePathname: () => "/billing/invoices/inv-101",
}));

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
};
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => mockApi.get(url),
    post: (url: string, body: any) => mockApi.post(url, body),
  },
}));

describe("InvoiceDetailPage Component", () => {
  const mockInvoice = {
    id: "inv-101",
    invoiceNumber: "INV-2026-0042",
    tenantId: "tenant-acme",
    tenant: {
      id: "tenant-acme",
      name: "Acme Corporation",
      slug: "acme",
    },
    status: "PAID",
    currency: "USD",
    subtotal: 500,
    discountAmount: 50,
    taxAmount: 45,
    totalAmount: 495,
    amountPaid: 495,
    amountDue: 0,
    createdAt: "2026-03-01T00:00:00.000Z",
    dueDate: "2026-03-15T00:00:00.000Z",
    paidAt: "2026-03-05T00:00:00.000Z",
    lines: [
      {
        id: "line-1",
        description: "Enterprise Plan Monthly Subscription",
        type: "PLAN",
        quantity: 1,
        unitPrice: 500,
        totalPrice: 500,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockResolvedValue({ data: mockInvoice });
    mockApi.post.mockResolvedValue({ data: { success: true } });
  });

  it("renders invoice breakdown with line items, tax, and settlement status", async () => {
    render(<InvoiceDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "INV-2026-0042" })).toBeInTheDocument();
      expect(screen.getByText(/Acme Corporation/i)).toBeInTheDocument();
      expect(screen.getByText("Enterprise Plan Monthly Subscription")).toBeInTheDocument();
      expect(screen.getAllByText("$500.00").length).toBeGreaterThan(0);
      expect(screen.getByText("-$50.00")).toBeInTheDocument();
      expect(screen.getByText("$45.00")).toBeInTheDocument();
      expect(screen.getAllByText("$495.00").length).toBeGreaterThan(0);
    });
  });

  it("renders ForbiddenState when user lacks pcc.billing.view", () => {
    mockUsePermission.mockImplementation((perm) => perm !== "pcc.billing.view");

    render(<InvoiceDetailPage />);
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.queryByText("INV-2026-0042")).not.toBeInTheDocument();
  });

  it("opens credit note issuance drawer when 'Issue Credit Note' is clicked", async () => {
    render(<InvoiceDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "INV-2026-0042" })).toBeInTheDocument();
    });

    const creditBtn = screen.getByRole("button", { name: /Issue Credit Note/i });
    fireEvent.click(creditBtn);

    await waitFor(() => {
      expect(screen.getByText("Issue Credit Note: INV-2026-0042")).toBeInTheDocument();
    });
  });
});
