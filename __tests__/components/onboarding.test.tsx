import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SetupChecklist } from "@/components/onboarding/SetupChecklist";
import { SpotlightTour } from "@/components/onboarding/SpotlightTour";
import { ContextualTip } from "@/components/onboarding/ContextualTip";

describe("Onboarding Components (WS3.6)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("SetupChecklist", () => {
    it("renders 5-step checklist with progress indicators", () => {
      render(<SetupChecklist />);

      expect(screen.getByRole("region", { name: "Platform Setup Checklist" })).toBeInTheDocument();
      expect(screen.getByText("Platform Onboarding Checklist")).toBeInTheDocument();

      // Check all 5 steps are rendered
      expect(screen.getByText("Complete Organization Profile")).toBeInTheDocument();
      expect(screen.getByText("Provision First Enterprise Tenant")).toBeInTheDocument();
      expect(screen.getByText("Connect Enterprise Identity Provider")).toBeInTheDocument();
      expect(screen.getByText("Establish Billing & Revenue Engine")).toBeInTheDocument();
      expect(screen.getByText("Configure ABAC Security Policies")).toBeInTheDocument();

      // Check progress bar
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toBeInTheDocument();
    });

    it("toggles step completion and updates progress", () => {
      render(<SetupChecklist />);

      // Find the checkbox button for the second step
      const stepBtn = screen.getByRole("button", {
        name: "Mark Provision First Enterprise Tenant complete",
      });
      fireEvent.click(stepBtn);

      // Now should show as complete
      expect(
        screen.getByRole("button", {
          name: "Mark Provision First Enterprise Tenant incomplete",
        })
      ).toBeInTheDocument();

      // LocalStorage should have updated
      const saved = JSON.parse(localStorage.getItem("unierp_setup_checklist_steps") || "{}");
      expect(saved["first-tenant"]).toBe(true);
    });

    it("dismisses the checklist when dismiss button is clicked", () => {
      render(<SetupChecklist />);

      const dismissBtn = screen.getByRole("button", { name: "Dismiss setup checklist" });
      fireEvent.click(dismissBtn);

      expect(screen.queryByText("Platform Onboarding Checklist")).not.toBeInTheDocument();
      expect(localStorage.getItem("unierp_setup_checklist_dismissed")).toBe("true");
    });
  });

  describe("SpotlightTour", () => {
    it("renders guided tour and steps forward through 4 steps", () => {
      render(<SpotlightTour forceOpen />);

      expect(screen.getByRole("dialog", { name: "Platform Guided Tour" })).toBeInTheDocument();
      expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
      expect(screen.getByText("Universal Desk Launcher")).toBeInTheDocument();

      // Advance to step 2
      fireEvent.click(screen.getByRole("button", { name: "Next tour step" }));
      expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
      expect(screen.getByText("Real-Time Telemetry & Search")).toBeInTheDocument();

      // Advance to step 3
      fireEvent.click(screen.getByRole("button", { name: "Next tour step" }));
      expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();

      // Advance to step 4
      fireEvent.click(screen.getByRole("button", { name: "Next tour step" }));
      expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Complete tour" })).toBeInTheDocument();

      // Complete the tour
      fireEvent.click(screen.getByRole("button", { name: "Complete tour" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(localStorage.getItem("unierp_spotlight_tour_completed")).toBe("true");
    });

    it("allows skipping the tour from any step", () => {
      render(<SpotlightTour forceOpen />);

      const skipBtn = screen.getByRole("button", { name: "Skip guided tour" });
      fireEvent.click(skipBtn);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(localStorage.getItem("unierp_spotlight_tour_completed")).toBe("true");
    });
  });

  describe("ContextualTip", () => {
    it("renders tip and dismisses cleanly", () => {
      render(
        <ContextualTip
          id="test-tip"
          title="Helpful Hint"
          text="This is an operator hint."
        />
      );

      expect(screen.getByRole("note", { name: "Helpful Hint" })).toBeInTheDocument();
      expect(screen.getByText("This is an operator hint.")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Dismiss helpful tip" }));
      expect(screen.queryByRole("note")).not.toBeInTheDocument();
      expect(localStorage.getItem("unierp_tip_test-tip_dismissed")).toBe("true");
    });
  });
});
