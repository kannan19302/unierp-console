import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { WorkflowShowcase } from "@/components/workflow/WorkflowShowcase";

describe("WorkflowShowcase (WS11)", () => {
  it("renders pipeline progression and lifecycle stages", () => {
    render(<WorkflowShowcase currentStage="review" />);

    expect(screen.getByText("Execution Pipeline Progression")).toBeInTheDocument();
    expect(screen.getByText("Tenant Lifecycle State")).toBeInTheDocument();
    expect(screen.getByText("Privileged Operation Approval Chain")).toBeInTheDocument();
    expect(screen.getByText("Configuration")).toBeInTheDocument();
    expect(screen.getByText("Compliance Review")).toBeInTheDocument();
  });
});
