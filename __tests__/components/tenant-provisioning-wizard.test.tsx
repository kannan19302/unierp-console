import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TenantProvisioningWizard } from "@/components/forms/TenantProvisioningWizard";

describe("TenantProvisioningWizard (WS11)", () => {
  it("renders wizard step 1 and validates required fields", () => {
    const onComplete = vi.fn();
    render(<TenantProvisioningWizard onComplete={onComplete} />);

    expect(screen.getByText("Provision Enterprise Tenant")).toBeInTheDocument();
    expect(screen.getByText("Tenant Profile")).toBeInTheDocument();
    expect(screen.getByLabelText(/Organization \/ Tenant Name/i)).toBeInTheDocument();
  });

  it("updates input fields and advances step", () => {
    const onComplete = vi.fn();
    render(<TenantProvisioningWizard onComplete={onComplete} />);

    const nameInput = screen.getByLabelText(/Organization \/ Tenant Name/i);
    fireEvent.change(nameInput, { target: { value: "Omega Corp" } });

    expect(screen.getByDisplayValue("Omega Corp")).toBeInTheDocument();
  });
});
