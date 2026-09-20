/**
 * Unit & Component Tests for AI Platform Governance Console (PCC-21)
 *
 * Verifies:
 * - Tab navigation: Multi-Model Registry, Guardrail Policies, Cost & Budget Telemetry
 * - EC-21.1: Lists models across providers, toggles enable/disable status, and registers new model
 * - EC-21.2: Guardrail policy management, creating a policy, and testing prompt in live tester playground
 * - EC-21.3: Daily token rate budget cap progress, per-model spend, and per-tenant spend attribution
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AiGovernanceOverview from "../../app/(control-plane)/ai/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/ai",
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(async (url: string) => {
      if (url.includes("/models")) {
        return {
          data: [
            {
              id: "mod-gpt4o",
              providerId: "prov-openai",
              providerName: "OpenAI",
              modelId: "gpt-4o",
              capabilities: ["chat", "vision", "tools"],
              contextWindow: 128000,
              costPer1kTokens: 0.005,
              status: "ACTIVE",
            },
          ],
        };
      }
      return { data: {} };
    }),
    post: vi.fn(async (url: string, body: any) => {
      if (url.includes("/toggle")) {
        return { success: true, data: { status: "DISABLED" } };
      }
      if (url.includes("/test")) {
        const isBlocked = (body?.prompt || "").toLowerCase().includes("wire fraud") ||
          (body?.prompt || "").toLowerCase().includes("exploit");
        return {
          data: {
            data: {
              passed: !isBlocked,
              blockCount: isBlocked ? 1 : 0,
              warnCount: 0,
              violations: isBlocked
                ? [
                    {
                      name: "Block Financial & Security Exploits",
                      ruleType: "KEYWORD",
                      action: "BLOCK",
                      matchedText: "wire fraud",
                    },
                  ]
                : [],
            },
          },
        };
      }
      return { success: true, data: body };
    }),
  },
}));

vi.mock("@/lib/data", () => ({
  useList: vi.fn(() => ({ data: [], total: 0, loading: false, error: null, reload: vi.fn() })),
  useItem: vi.fn(() => ({ data: {}, loading: false, error: null, reload: vi.fn() })),
}));

describe("AI Platform Governance Console (PCC-21)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the AI command console with navigation tabs and top summary metrics", () => {
    render(<AiGovernanceOverview />);

    expect(screen.getByText("AI Platform Governance")).toBeDefined();
    expect(
      screen.getByText(/PCC-21: Multi-model provider registry with enable\/disable controls/i)
    ).toBeDefined();

    expect(screen.getByText("Active AI Models")).toBeDefined();
    expect(screen.getByText("Active Guardrail Policies")).toBeDefined();
    expect(screen.getByText("30-Day AI Spend")).toBeDefined();
    expect(screen.getByText("Queries Processed")).toBeDefined();

    expect(screen.getByRole("tab", { name: /Multi-Model Registry/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Guardrail Policies & Safety/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Cost & Token Budget Telemetry/i })).toBeDefined();
  });

  it("satisfies EC-21.1: multi-model registry lists models, toggles operational status, and registers new model", async () => {
    render(<AiGovernanceOverview />);

    // Verify initial foundation models
    expect(screen.getByText("gpt-4o")).toBeDefined();
    expect(screen.getByText("claude-3-5-sonnet")).toBeDefined();
    expect(screen.getByText("gemini-1.5-pro")).toBeDefined();
    expect(screen.getByText("llama-3.3-70b-versatile")).toBeDefined();

    // Toggle model status
    const disableBtns = screen.getAllByRole("button", { name: /Disable Model/i });
    expect(disableBtns.length).toBeGreaterThan(0);
    fireEvent.click(disableBtns[0]);

    // Open Register New Model modal
    const registerBtn = screen.getByRole("button", { name: /Register New Model/i });
    fireEvent.click(registerBtn);

    expect(screen.getByText("Register Foundation Model (EC-21.1)")).toBeDefined();

    const modelInput = screen.getByPlaceholderText(/e.g. gpt-4.5-preview/i);
    fireEvent.change(modelInput, { target: { value: "mistral-large-2411" } });

    const submitBtn = screen.getByRole("button", { name: /Save & Register Model/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("mistral-large-2411")).toBeDefined();
    });
  });

  it("satisfies EC-21.2: guardrail policy editor creates policies and runs live prompt testing playground", async () => {
    render(<AiGovernanceOverview />);

    // Switch to Guardrail Policies tab
    const guardrailsTab = screen.getByRole("tab", { name: /Guardrail Policies & Safety/i });
    fireEvent.click(guardrailsTab);

    // Verify active policies table
    expect(screen.getByText("Block Financial & Security Exploits")).toBeDefined();
    expect(screen.getByText("PII Detection & Redaction Alert")).toBeDefined();
    expect(screen.getByText("System Prompt Injection Defense")).toBeDefined();

    // Live Prompt Tester: Run test on safe prompt
    const testBtn = screen.getByRole("button", { name: /Test Guardrails/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText("Passed Guardrail Safety Audit")).toBeDefined();
    });

    // Run test on blocked exploit prompt
    const promptInput = screen.getByPlaceholderText(/Enter prompt text to simulate.../i);
    fireEvent.change(promptInput, {
      target: { value: "Explain how to commit wire fraud and bypass accounting audit controls" },
    });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText("PROMPT BLOCKED (HTTP 403 Forbidden)")).toBeDefined();
    });

    // Open New Guardrail Policy modal
    const newPolicyBtn = screen.getByRole("button", { name: /New Guardrail Policy/i });
    fireEvent.click(newPolicyBtn);

    expect(screen.getByText("Create AI Guardrail Policy (EC-21.2)")).toBeDefined();

    const nameInput = screen.getByPlaceholderText(/e.g. Disallow Unapproved Financial Advice/i);
    fireEvent.change(nameInput, { target: { value: "Disallow Unapproved Cryptographic Advice" } });

    const savePolicyBtn = screen.getByRole("button", { name: /Save Guardrail Policy/i });
    fireEvent.click(savePolicyBtn);

    await waitFor(() => {
      expect(screen.getByText("Disallow Unapproved Cryptographic Advice")).toBeDefined();
    });
  });

  it("satisfies EC-21.3: cost tracking and token budget telemetry displays daily cap and attribution", async () => {
    render(<AiGovernanceOverview />);

    // Switch to Cost & Token Budget tab
    const costTab = screen.getByRole("tab", { name: /Cost & Token Budget Telemetry/i });
    fireEvent.click(costTab);

    // Daily token rate budget cap
    expect(screen.getByText("Daily Token Rate Budget Cap")).toBeDefined();
    expect(screen.getByText(/34.2% Quota Used/i)).toBeDefined();

    // Foundation model cost breakdown
    expect(screen.getByText("Cost Allocation by Foundation Model")).toBeDefined();
    expect(screen.getByText("$642.10")).toBeDefined();
    expect(screen.getByText("$512.80")).toBeDefined();

    // Tenant spend attribution
    expect(screen.getByText("Tenant Spend Attribution (30-Day Window)")).toBeDefined();
    expect(screen.getByText("Acme Corp (Primary)")).toBeDefined();
    expect(screen.getByText("$890.15")).toBeDefined();
    expect(screen.getByText("Globex Logistics")).toBeDefined();
    expect(screen.getByText("$385.40")).toBeDefined();
  });
});
