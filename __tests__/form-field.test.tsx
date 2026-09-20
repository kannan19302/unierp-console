import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormField } from "../src/components/FormField";

describe("FormField Component", () => {
  it("renders text input with label and placeholder", () => {
    render(
      <FormField
        label="Username"
        name="username"
        placeholder="Enter username"
        required
      />
    );

    expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter username")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders error message and marks input aria-invalid", () => {
    render(
      <FormField
        label="Email"
        name="email"
        type="email"
        error="Invalid email address"
      />
    );

    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email address");
  });

  it("renders select dropdown with options", () => {
    const handleChange = vi.fn();
    render(
      <FormField
        label="Role"
        name="role"
        type="select"
        value="ADMIN"
        onChange={handleChange}
        options={[
          { label: "Admin", value: "ADMIN" },
          { label: "User", value: "USER" },
        ]}
      />
    );

    const select = screen.getByLabelText(/Role/) as HTMLSelectElement;
    expect(select.value).toBe("ADMIN");
    fireEvent.change(select, { target: { value: "USER" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("renders checkbox input correctly", () => {
    const handleChange = vi.fn();
    render(
      <FormField
        label="Enable Feature"
        name="enabled"
        type="checkbox"
        value={true}
        onChange={handleChange}
      />
    );

    const checkbox = screen.getByLabelText(/Enable Feature/) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalled();
  });

  it("renders custom children properly", () => {
    render(
      <FormField label="Custom Field" error="Child error">
        <input data-testid="custom-child" />
      </FormField>
    );

    expect(screen.getByText("Custom Field")).toBeInTheDocument();
    expect(screen.getByTestId("custom-child")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Child error");
  });
});
