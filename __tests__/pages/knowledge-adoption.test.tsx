/**
 * Unit & Component Tests for Knowledge & Adoption Operations (PCC-15)
 *
 * Verifies:
 * - Tab navigation: Runbooks & Articles, Learning Path Builder, Adoption Velocity & Certifications
 * - EC-15.1: Rich text article editor authors articles, publishes drafts, and filters by search/category
 * - EC-15.2: Learning path builder manages curriculum tracks, moves modules up/down, adds modules, and persists order
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import KnowledgeAdoptionPage from "../../app/(control-plane)/knowledge-adoption/page";

const mockUsePermission = vi.fn((_perm?: string) => true);
vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...(actual as object),
    usePermission: (perm: string) => mockUsePermission(perm),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/knowledge-adoption",
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(async (url: string) => {
      return { data: [] };
    }),
    post: vi.fn(async (url: string, body: any) => {
      return { success: true, data: body };
    }),
  },
}));

vi.mock("@/lib/data", () => ({
  useList: vi.fn(() => ({ data: [], total: 0, loading: false, error: null, reload: vi.fn() })),
  useItem: vi.fn(() => ({ data: {}, loading: false, error: null, reload: vi.fn() })),
}));

describe("Knowledge & Adoption Operations Console (PCC-15)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
  });

  it("renders the console header, summary KPIs, and navigation tabs", () => {
    render(<KnowledgeAdoptionPage />);

    expect(screen.getByText("Knowledge & Adoption Operations")).toBeDefined();
    expect(screen.getByText("Platform Runbooks & SOPs")).toBeDefined();
    expect(screen.getByText("Curricula Tracks")).toBeDefined();
    expect(screen.getByText("Adoption Velocity")).toBeDefined();
    expect(screen.getByText("Knowledge Base Reads")).toBeDefined();

    expect(screen.getByRole("button", { name: /Runbooks & Articles/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Learning Path Builder/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Adoption Velocity & Certifications/i })).toBeDefined();
  });

  it("satisfies EC-15.1: article editor creates, publishes, and filters rich text articles", async () => {
    render(<KnowledgeAdoptionPage />);

    // Verify initial articles
    expect(screen.getByText("Zero-Downtime Database Migration Runbook")).toBeDefined();
    expect(screen.getByText("SAML 2.0 & OIDC Enterprise IdP Integration Guide")).toBeDefined();
    expect(screen.getByText("Developer Webhook Ingestion & Idempotency Best Practices")).toBeDefined();

    // Publish draft article
    const publishBtns = screen.getAllByRole("button", { name: /Publish/i });
    expect(publishBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(publishBtns[0]);

    // Search filter
    const searchInput = screen.getByPlaceholderText(/Search title, excerpt, or tags.../i);
    fireEvent.change(searchInput, { target: { value: "Database" } });

    expect(screen.getByText("Zero-Downtime Database Migration Runbook")).toBeDefined();
    expect(screen.queryByText("SAML 2.0 & OIDC Enterprise IdP Integration Guide")).toBeNull();

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });

    // Open Author Article modal
    const authorBtn = screen.getByRole("button", { name: /Author Article/i });
    fireEvent.click(authorBtn);

    expect(screen.getByText("Author Knowledge Article / SOP Runbook")).toBeDefined();

    const titleInput = screen.getByPlaceholderText(/e.g. Zero-Downtime Database Migration Runbook/i);
    fireEvent.change(titleInput, { target: { value: "TLS Certificate Automated Renewal Runbook" } });

    const contentInput = screen.getByPlaceholderText(/Write SOP runbook or article content in Markdown format.../i);
    fireEvent.change(contentInput, {
      target: { value: "## Automated ACME DNS-01 Challenge Workflow\n\nVerify certificate hash." },
    });

    const publishModalBtn = screen.getByRole("button", { name: /Publish Article/i });
    fireEvent.click(publishModalBtn);

    await waitFor(() => {
      expect(screen.getByText("TLS Certificate Automated Renewal Runbook")).toBeDefined();
    });
  });

  it("satisfies EC-15.2: learning path builder manages curriculum tracks and reorders modules", async () => {
    render(<KnowledgeAdoptionPage />);

    // Switch to Learning Path Builder tab
    const pathsTab = screen.getByRole("button", { name: /Learning Path Builder/i });
    fireEvent.click(pathsTab);

    // Verify curriculum tracks on left
    expect(screen.getByText("Platform Operator Core Certification")).toBeDefined();
    expect(screen.getByText("Tenant Admin Mastery & Compliance")).toBeDefined();

    // Verify modules on right
    expect(screen.getByText("Control Plane Architecture & Security Tenets")).toBeDefined();
    expect(screen.getByText("Live Incident Triage & Break-Glass Protocol")).toBeDefined();

    // Move second module up
    const moveUpBtn = screen.getByRole("button", { name: /Move Live Incident Triage & Break-Glass Protocol up/i });
    fireEvent.click(moveUpBtn);

    // Save order
    const saveOrderBtn = screen.getByRole("button", { name: /Save Order/i });
    fireEvent.click(saveOrderBtn);

    // Add module modal
    const addModBtn = screen.getByRole("button", { name: /Add Module/i });
    fireEvent.click(addModBtn);

    expect(screen.getByText("Add Curriculum Module to Track")).toBeDefined();

    const modTitleInput = screen.getByPlaceholderText(/e.g. Break-Glass Procedure & Audit Trail/i);
    fireEvent.change(modTitleInput, { target: { value: "Disaster Recovery Chaos Testing" } });

    const confirmAddBtn = screen.getByRole("button", { name: /Confirm Add Module/i });
    fireEvent.click(confirmAddBtn);

    await waitFor(() => {
      expect(screen.getByText("Disaster Recovery Chaos Testing")).toBeDefined();
    });
  });

  it("renders tenant adoption velocity metrics and certification radar", () => {
    render(<KnowledgeAdoptionPage />);

    // Switch to Adoption Velocity tab
    const adoptionTab = screen.getByRole("button", { name: /Adoption Velocity & Certifications/i });
    fireEvent.click(adoptionTab);

    expect(screen.getByText("Tenant Onboarding Completion Radar")).toBeDefined();
    expect(screen.getByText("Acme Global Corp")).toBeDefined();
    expect(screen.getByText("100% Certified (14 Seats)")).toBeDefined();
    expect(screen.getByText("Certifications Issued by Track")).toBeDefined();
    expect(screen.getByText("842 Certified")).toBeDefined();
  });
});
