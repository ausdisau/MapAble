/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GuidedSearchPanel } from "@/components/marketing/home/GuidedSearchPanel";
import MapAbleCareCombinedHomepage from "@/components/marketing/MapAbleCareCombinedHomepage";
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

describe("homepage marketing splash", () => {
  beforeEach(() => {
    render(<MapAbleCareCombinedHomepage />);
  });

  it("renders primary nav with pre-register and places links", () => {
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).toBeTruthy();
    expect(nav.querySelector('a[href="#pre-register"]')?.textContent).toBe(
      "Pre-register",
    );
    expect(nav.querySelector('a[href="/accessibility-map"]')?.textContent).toBe(
      "Places",
    );
    expect(nav.querySelector('a[href="/providers"]')?.textContent).toBe(
      "Providers",
    );
    expect(nav.querySelector('a[href="/ask"]')?.textContent).toBe(
      "NDIS Guidance",
    );
  });

  it("renders updated hero headline and single h1", () => {
    const h1 = screen.getByRole("heading", {
      level: 1,
      name: homepageHeroCopy.headline,
    });
    expect(h1.getAttribute("aria-label")).toBe(homepageHeroCopy.headline);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("renders hero CTAs for splash destinations", () => {
    const preRegLinks = screen.getAllByRole("link", {
      name: /Pre-register interest/i,
    });
    expect(preRegLinks[0]?.getAttribute("href")).toBe("#pre-register");
    expect(
      screen
        .getByRole("link", { name: homepageHeroCopy.secondaryCta })
        .getAttribute("href"),
    ).toBe("/accessibility-map");
    expect(
      screen.queryByRole("link", { name: /^Request support$/i }),
    ).toBeNull();
  });

  it("hides coming-soon progress signals and guided search panel", () => {
    expect(screen.queryByText("Honest progress signals")).toBeNull();
    expect(screen.queryByText("Coming soon")).toBeNull();
    expect(document.getElementById("guided-search-panel")).toBeNull();
    expect(document.getElementById("map-preview")).toBeNull();
  });

  it("renders pre-registration and final CTA", () => {
    expect(document.getElementById("pre-register")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /Help build Australia/i }),
    ).toBeTruthy();
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

    expect(screen.getByRole("status").textContent).toMatch(
      /at least 3 characters/i,
    );
    expect(screen.queryByTestId("guided-search-dialogue")).toBeNull();
  });

  it("launches chat from prompt chip", () => {
    const chip = screen.getByRole("button", { name: "Find a support worker" });
    fireEvent.click(chip);

    expect(screen.getByTestId("guided-search-dialogue")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
