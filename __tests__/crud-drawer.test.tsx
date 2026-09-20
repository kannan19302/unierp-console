import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CrudDrawer } from "../src/components/CrudDrawer";
import { z } from "zod";

const testSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email"),
});

describe("CrudDrawer Component", () => {
  const fields = [
    { name: "name", label: "Full Name", required: true },
    { name: "email", label: "Email Address", type: "email" as const, required: true },
  ];

  it("renders with title and mode badge when open", () => {
    render(
      <CrudDrawer
        open={true}
        title="Add User"
        mode="create"
        fields={fields}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Add User")).toBeInTheDocument();
    expect(screen.getByText("create")).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
  });

  it("validates inputs against Zod schema on submit", async () => {
    const handleSubmit = vi.fn();
    render(
      <CrudDrawer
        open={true}
        title="Add User"
        mode="create"
        schema={testSchema}
        fields={fields}
        onSubmit={handleSubmit}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.getByText("Name must be at least 3 characters")).toBeInTheDocument();
    });
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("submits valid data successfully", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <CrudDrawer
        open={true}
        title="Add User"
        mode="create"
        schema={testSchema}
        fields={fields}
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    );

    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: "John Doe" } });
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: "john@example.com" } });

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("closes on Escape key", () => {
    const handleClose = vi.fn();
    render(
      <CrudDrawer
        open={true}
        title="Add User"
        mode="create"
        fields={fields}
        onSubmit={vi.fn()}
        onClose={handleClose}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalled();
  });
});
