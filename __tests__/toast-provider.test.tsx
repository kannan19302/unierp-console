import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, useToastContext } from "../src/components/ToastProvider";

function TestConsumer() {
  const { showToast, success, error, warning, info, dismissToast } = useToastContext();
  return (
    <div>
      <button onClick={() => showToast({ message: "Default toast", title: "Notice" })}>
        Show Default
      </button>
      <button onClick={() => success("Operation succeeded", "Success!")}>Show Success</button>
      <button onClick={() => error("Something broke", "Error!")}>Show Error</button>
      <button onClick={() => warning("Watch out", "Warning!")}>Show Warning</button>
      <button onClick={() => info("Here is info", "Info!")}>Show Info</button>
    </div>
  );
}

describe("ToastProvider and useToast", () => {
  it("renders children properly", () => {
    render(
      <ToastProvider>
        <div>Hello App</div>
      </ToastProvider>
    );
    expect(screen.getByText("Hello App")).toBeInTheDocument();
  });

  it("triggers and displays success toast", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Operation succeeded")).toBeInTheDocument();
  });

  it("triggers and displays error toast", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Error"));
    expect(screen.getByText("Error!")).toBeInTheDocument();
    expect(screen.getByText("Something broke")).toBeInTheDocument();
  });

  it("can dismiss a toast via the close button", async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Warning"));
    expect(screen.getByText("Watch out")).toBeInTheDocument();

    const dismissBtn = screen.getByLabelText("Dismiss notification");
    fireEvent.click(dismissBtn);

    // Fast-forward exit animation
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText("Watch out")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("stacks up to 3 toasts max", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Default"));
    fireEvent.click(screen.getByText("Show Success"));
    fireEvent.click(screen.getByText("Show Error"));
    fireEvent.click(screen.getByText("Show Warning"));

    const alerts = screen.getAllByRole("alert");
    expect(alerts.length).toBeLessThanOrEqual(3);
  });
});
