import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DomainDashboardComposite } from "@/components/dashboard/DomainDashboardComposite";

describe("DomainDashboardComposite (WS11)", () => {
  it("renders KPI cards and activity feed", () => {
    render(<DomainDashboardComposite />);

    expect(screen.getByText("Active Tenants")).toBeInTheDocument();
    expect(screen.getByText("PCC Fleet Health")).toBeInTheDocument();
    expect(screen.getByText("Platform Activity Stream")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });
});
