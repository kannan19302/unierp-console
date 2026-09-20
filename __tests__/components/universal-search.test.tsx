import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UniversalSearch } from "@/components/shell/UniversalSearch";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("UniversalSearch (WS8.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("does not render when open is false", () => {
    const { container } = render(<UniversalSearch open={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders command palette when open is true", () => {
    render(<UniversalSearch open={true} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "Universal Command Palette" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type a command, domain, or action/i)).toBeInTheDocument();
  });

  it("filters commands based on search input", () => {
    render(<UniversalSearch open={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Type a command, domain, or action/i);

    fireEvent.change(input, { target: { value: "tenant" } });

    expect(screen.getByText("Go to Tenant Directory & Provisioning")).toBeInTheDocument();
    expect(screen.getByText("Create New Tenant")).toBeInTheDocument();
  });

  it("navigates and executes command on Enter", () => {
    const onClose = vi.fn();
    render(<UniversalSearch open={true} onClose={onClose} />);
    const input = screen.getByPlaceholderText(/Type a command, domain, or action/i);

    fireEvent.change(input, { target: { value: "Create New Tenant" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/tenants?drawer=create");
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape key press", () => {
    const onClose = vi.fn();
    render(<UniversalSearch open={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
