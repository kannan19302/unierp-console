import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SecurityComplianceControlsPage from "../../app/(control-plane)/security/compliance/controls/page";

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
  usePathname: () => "/security/compliance/controls",
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

describe("SecurityComplianceControlsPage Component", () => {
  const mockControls = [
    {
      code: "AUDIT-COMPLETE",
      title: "Control Plane Audit Completeness",
      frameworks: "SOC2,ISO27001",
      description: "Every operator mutation must write an immutable audit log row",
      status: "PASS",
      observed: 42,
      finding: null,
      evaluatedAt: "2026-09-18T10:00:00Z",
    },
    {
      code: "APPROVAL-TWO-PERSON",
      title: "Two-Person Rule for Privileged Operations",
      frameworks: "SOC2,GDPR",
      description: "Destructive operations require a second operator signature",
      status: "FAIL",
      observed: 0,
      finding: "0 approval records observed, 1 required",
      evaluatedAt: "2026-09-18T10:00:00Z",
    },
    {
      code: "CUSTOM-BACKUP-TEST",
      title: "Weekly Database Backup Verification",
      frameworks: "ISO27001",
      description: "Custom verification rule for backup completeness",
      status: null,
      observed: 0,
      finding: null,
      evaluatedAt: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockResolvedValue({ data: mockControls });
  });

  it("renders controls catalogue with stats and failing alert", async () => {
    render(<SecurityComplianceControlsPage />);

    await waitFor(() => {
      expect(screen.getByText("AUDIT-COMPLETE")).toBeInTheDocument();
      expect(screen.getByText("APPROVAL-TWO-PERSON")).toBeInTheDocument();
      expect(screen.getByText("CUSTOM-BACKUP-TEST")).toBeInTheDocument();
    });

    // Check stats
    expect(screen.getByText("Total Controls")).toBeInTheDocument();
    expect(screen.getAllByText("Passing (Compliant)").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Failing (Non-Compliant)").length).toBeGreaterThanOrEqual(1);

    // Check failing alert banner
    expect(screen.getByText(/1 Failing Control\(s\) Detected/i)).toBeInTheDocument();
  });

  it("evaluates a single control on demand", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        code: "AUDIT-COMPLETE",
        status: "PASS",
        observed: 43,
      },
    });

    render(<SecurityComplianceControlsPage />);

    await waitFor(() => {
      expect(screen.getByText("AUDIT-COMPLETE")).toBeInTheDocument();
    });

    const playBtns = screen.getAllByTitle("Evaluate this control against audit spine");
    fireEvent.click(playBtns[0]);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/platform/v1/compliance-controls/AUDIT-COMPLETE/evaluate");
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining("Control AUDIT-COMPLETE PASSED"),
        expect.any(String)
      );
    });
  });

  it("opens register control drawer and registers a new control", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        code: "CUSTOM-LOG-CHECK",
        title: "Log Rotation Verification",
      },
    });

    render(<SecurityComplianceControlsPage />);

    await waitFor(() => {
      expect(screen.getByText("AUDIT-COMPLETE")).toBeInTheDocument();
    });

    const registerBtn = screen.getByRole("button", { name: /Register Control/i });
    fireEvent.click(registerBtn);

    await waitFor(() => {
      expect(screen.getByText("Register Compliance Control")).toBeInTheDocument();
    });
  });

  it("allows deleting custom controls with confirmation dialog", async () => {
    mockApi.del.mockResolvedValueOnce({ data: { success: true } });

    render(<SecurityComplianceControlsPage />);

    await waitFor(() => {
      expect(screen.getByText("CUSTOM-BACKUP-TEST")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle("Delete Custom Control");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText(/Delete Control CUSTOM-BACKUP-TEST/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: "Delete Control" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApi.del).toHaveBeenCalledWith("/platform/v1/compliance-controls/CUSTOM-BACKUP-TEST");
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining("Custom control CUSTOM-BACKUP-TEST removed"),
        expect.any(String)
      );
    });
  });
});
