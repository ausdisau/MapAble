/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

import { GuidedSearchChoiceChips } from "@/components/guided-search/GuidedSearchChoiceChips";
import { GuidedSearchDialogue } from "@/components/guided-search/GuidedSearchDialogue";
import { applyChoiceToSession } from "@/components/guided-search/types";

const sendMessage = vi.fn();
const mockUseChat = vi.fn();

vi.mock("@ai-sdk/react", () => ({
  useChat: (...args: unknown[]) => mockUseChat(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("GuidedSearchDialogue", () => {
  beforeEach(() => {
    mockUseChat.mockReturnValue({
      messages: [
        {
          id: "a1",
          role: "assistant",
          parts: [{ type: "text", text: "Which suburb should I search near?" }],
        },
      ],
      sendMessage,
      status: "ready",
      error: null,
    });
  });

  it("renders streaming assistant message and composer", () => {
    render(
      <GuidedSearchDialogue
        session={{
          query: "",
          location: "",
          providerName: "",
          serviceQuery: "",
          accessQuery: "",
        }}
        onInterpretation={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Which suburb should I search near?"),
    ).toBeTruthy();
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("maps service chip selection into session fields", () => {
    const session = {
      query: "help",
      location: "",
      providerName: "",
      serviceQuery: "",
      accessQuery: "",
    };

    expect(
      applyChoiceToSession(session, "service", "Transport").serviceQuery,
    ).toBe("Transport");
  });

  it("chip click invokes onSelect handler", () => {
    const onSelect = vi.fn();
    render(
      <GuidedSearchChoiceChips
        choices={[{ label: "Transport", value: "Transport" }]}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Transport" }));
    expect(onSelect).toHaveBeenCalledWith({
      label: "Transport",
      value: "Transport",
    });
  });
});
