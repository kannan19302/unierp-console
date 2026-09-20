import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProvisionTenantPage from "../../app/(control-plane)/tenants/provision/page";
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
    post: vi.fn(),
  },
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
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  usePathname: () => "/tenants/provision",
}));

describe("ProvisionTenantPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    (api.post as any).mockResolvedValue({
      data: { id: "new-tenant-101", name: "Cyberdyne Systems" },
    });
  });

  it("renders wizard and steps correctly", () => {
    render(<ProvisionTenantPage />);

    expect(screen.getByText("Provision new tenant")).toBeInTheDocument();
    expect(screen.getByText("Tenant Basics")).toBeInTheDocument();
    expect(screen.getByLabelText(/Tenant Name/i)).toBeInTheDocument();
  });

  it("validates step 0 and prevents progression if name is invalid", () => {
    render(<ProvisionTenantPage />);

    // Type 1 character to enable Next button and trigger minimum length validation (min 2)
    const nameInput = screen.getByPlaceholderText("Acme Corp");
    fireEvent.change(nameInput, { target: { value: "A" } });

    const nextButton = screen.getByText("Next step");
    fireEvent.click(nextButton);

    expect(
      screen.getByText("Tenant name must have at least 2 characters.")
    ).toBeInTheDocument();
  });

  it("progresses through wizard steps and submits provisioning request", async () => {
    render(<ProvisionTenantPage />);

    // Step 0: Fill Name
    const nameInput = screen.getByPlaceholderText("Acme Corp");
    fireEvent.change(nameInput, { target: { value: "Cyberdyne Systems" } });
    fireEvent.click(screen.getByText("Next step"));

    // Step 1: Configuration
    await waitFor(() => {
      expect(screen.getAllByText("Configuration")[0]).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText("admin@acme.com");
    fireEvent.change(emailInput, { target: { value: "admin@cyberdyne.io" } });
    fireEvent.click(screen.getByText("Next step"));

    // Step 2: Review and Submit
    await waitFor(() => {
      expect(screen.getByText("Review and Provision")).toBeInTheDocument();
      expect(screen.getByText("Cyberdyne Systems")).toBeInTheDocument();
      expect(screen.getByText("admin@cyberdyne.io")).toBeInTheDocument();
    });

    // Provide justification
    const justInput = screen.getByPlaceholderText(/JIRA-123/i);
    fireEvent.change(justInput, { target: { value: "Approved enterprise contract" } });

    fireEvent.click(screen.getByText("Provision tenant"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/platform/v1/super-admin/tenants",
        expect.objectContaining({
          name: "Cyberdyne Systems",
          adminEmail: "admin@cyberdyne.io",
        })
      );
      expect(mockPush).toHaveBeenCalledWith("/tenants/directory/new-tenant-101");
    });
  });

  it("renders ForbiddenState when user lacks system.tenant.create permission", () => {
    mockUsePermission.mockReturnValue(false);

    render(<ProvisionTenantPage />);

    expect(screen.getByText("Access restricted")).toBeInTheDocument();
    expect(screen.queryByText("Tenant Basics")).not.toBeInTheDocument();
  });
});
