/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AskPageClient } from "@/app/ask/AskPageClient";

const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/components/copilot/CopilotPanel", () => ({
  CopilotPanel: ({ initialQuery }: { initialQuery?: string }) => (
    <div data-testid="copilot-initial-query">{initialQuery ?? ""}</div>
  ),
}));

afterEach(() => {
  cleanup();
  mockSearchParams.forEach((_, key) => mockSearchParams.delete(key));
});

describe("AskPageClient", () => {
  it("prefers q search param for initial copilot query", () => {
    mockSearchParams.set("q", "transport funding");
    render(<AskPageClient />);
    expect(screen.getByTestId("copilot-initial-query").textContent).toBe("transport funding");
  });

  it("falls back to provider slug when q is absent", () => {
    mockSearchParams.set("provider", "sunrise-care");
    render(<AskPageClient />);
    expect(screen.getByTestId("copilot-initial-query").textContent).toBe(
      "Tell me about sunrise care and what supports they offer",
    );
  });
});
