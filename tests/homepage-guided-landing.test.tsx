/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MapAbleCareCombinedHomepage from "@/components/marketing/MapAbleCareCombinedHomepage";
import { GuidedSearchPanel } from "@/components/marketing/home/GuidedSearchPanel";
import { homepageHeroCopy } from "@/lib/marketing/mapable-care-combined-data";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/guided-search/GuidedSearchDialogue", () => ({
  GuidedSearchDialogue: ({ initialMessage }: { initialMessage?: string }) => (
    <div data-testid="guided-search-dialogue">
      {initialMessage ? `chat:${initialMessage}` : "chat"}
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  mockPush.mockClear();
});

describe("homepage guided landing", () => {
  beforeEach(() => {
    render(<MapAbleCareCombinedHomepage />);
  });

  it("renders primary nav links with homepage search anchor", () => {
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).toBeTruthy();
    expect(nav.querySelector('a[href="#guided-search-panel"]')?.textContent).toBe("Search");
    expect(nav.querySelector('a[href="#map-preview"]')?.textContent).toBe("Places");
    expect(nav.querySelector('a[href="/providers"]')?.textContent).toBe("Providers");
    expect(nav.querySelector('a[href="/ask"]')?.textContent).toBe("NDIS Guidance");
  });

  it("renders updated hero headline and single h1", () => {
    expect(screen.getByLabelText(homepageHeroCopy.headline)).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("renders hero CTAs targeting access journeys", () => {
    expect(
      screen.getByRole("link", { name: /Find accessible places/i }).getAttribute("href"),
    ).toBe("/accessibility-map");
    expect(
      screen.getByRole("link", { name: homepageHeroCopy.secondaryCta }).getAttribute("href"),
    ).toBe("/care/request");
  });

  it("renders guided search panel with labeled input", () => {
    const panel = document.getElementById("guided-search-panel");
    expect(panel).toBeTruthy();
    expect(screen.getByLabelText("What support do you need?")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Build your support pathway" })).toBeTruthy();
  });

  it("renders accessibility map preview and final CTA", () => {
    expect(document.getElementById("map-preview")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Help build Australia/i })).toBeTruthy();
  });

  it("renders map preview sample places", () => {
    expect(screen.getByRole("heading", { name: /Know before you go/i })).toBeTruthy();
  });
});

describe("GuidedSearchPanel chat launch", () => {
  beforeEach(() => {
    mockPush.mockReset();
    render(<GuidedSearchPanel />);
  });

  it("opens chat panel on submit instead of redirecting", () => {
    const input = screen.getByLabelText("What support do you need?");
    fireEvent.change(input, { target: { value: "support worker" } });
    fireEvent.submit(input.closest("form")!);

    expect(screen.getByTestId("guided-search-dialogue")).toBeTruthy();
    expect(screen.getByText("chat:support worker")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows status hint when query is too short", () => {
    const input = screen.getByLabelText("What support do you need?");
    fireEvent.change(input, { target: { value: "ot" } });
    fireEvent.submit(input.closest("form")!);

    expect(screen.getByRole("status").textContent).toMatch(/at least 3 characters/i);
    expect(screen.queryByTestId("guided-search-dialogue")).toBeNull();
  });

  it("launches chat from prompt chip", () => {
    const chip = screen.getByRole("button", { name: "Find a support worker" });
    fireEvent.click(chip);

    expect(screen.getByTestId("guided-search-dialogue")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
