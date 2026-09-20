import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "../src/components/ConfirmDialog";

describe("ConfirmDialog Component", () => {
  it("does not render when open is false", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete Item"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("triggers onConfirm when confirmed", async () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined);
    const handleCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        title="Delete Tenant"
        message="This action cannot be undone."
        confirmLabel="Yes, Delete"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete Tenant")).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Yes, Delete"));
    expect(handleConfirm).toHaveBeenCalled();
  });

  it("triggers onCancel when cancelled", () => {
    const handleCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        title="Delete Tenant"
        message="This action cannot be undone."
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(handleCancel).toHaveBeenCalled();
  });

  it("requires entity name typing when requireTyping is true", () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        title="Purge Database"
        message="Type the entity name to confirm."
        entityName="production-cluster"
        requireTyping={true}
        confirmLabel="Purge"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    const confirmBtn = screen.getByText("Purge");
    expect(confirmBtn).toBeDisabled();

    const input = screen.getByPlaceholderText("production-cluster");
    fireEvent.change(input, { target: { value: "wrong-name" } });
    expect(confirmBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: "production-cluster" } });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalled();
  });
});
