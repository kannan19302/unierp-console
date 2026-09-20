import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import { SkipToContent } from "@/components/shell/SkipToContent";
import { SetupChecklist } from "@/components/onboarding/SetupChecklist";
import { EmptyStateIllustration } from "@/components/feedback/EmptyStateIllustration";
import { DomainSkeleton } from "@/components/data-display/DomainSkeleton";
import { PaginatedTable } from "@/components/data-display/PaginatedTable";

expect.extend(matchers);

declare module "vitest" {
  interface Assertion<T = any> {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

describe("Accessibility Standards (WCAG 2.2 AA)", () => {
  it("SkipToContent has no accessibility violations", async () => {
    const { container } = render(<SkipToContent targetId="main-content" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("EmptyStateIllustration has no accessibility violations", async () => {
    const { container } = render(
      <EmptyStateIllustration
        type="no-data"
        title="No items found"
        description="Please create a new resource or check filters."
        action={{ label: "Create Item", onClick: () => {} }}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("DomainSkeleton has no accessibility violations", async () => {
    const { container } = render(<DomainSkeleton variant="table" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("SetupChecklist has no accessibility violations", async () => {
    const { container } = render(<SetupChecklist />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("PaginatedTable has no accessibility violations", async () => {
    const columns = [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "status", label: "Status" },
    ];
    const data = [
      { id: "1", name: "Alpha", status: "Active" },
      { id: "2", name: "Beta", status: "Inactive" },
    ];
    const { container } = render(
      <PaginatedTable columns={columns} data={data} total={2} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
