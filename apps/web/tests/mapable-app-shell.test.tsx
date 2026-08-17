/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
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

afterEach(() => {
  cleanup();
});

describe("MapAbleAppShell", () => {
  it("renders marketing variant with main landmark and skip link", () => {
    render(
      <MapAbleAppShell variant="marketing">
        <p>Marketing body</p>
      </MapAbleAppShell>,
    );

    expect(screen.getByRole("link", { name: /skip to main content/i })).toBeTruthy();
    expect(screen.getByRole("main").getAttribute("id")).toBe("main-content");
    expect(screen.getByText("Marketing body")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /log in/i }).length).toBeGreaterThan(0);
  });

  it("renders app variant with compact header and slim footer", () => {
    render(
      <MapAbleAppShell variant="app" headerTitle="Dashboard" secondaryNav={<nav aria-label="Test nav">Nav</nav>}>
        <p>App body</p>
      </MapAbleAppShell>,
    );

    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Test nav" })).toBeTruthy();
    expect(screen.getByText("App body")).toBeTruthy();
    expect(screen.getByRole("link", { name: /privacy/i })).toBeTruthy();
  });

  it("renders minimal variant without footer", () => {
    render(
      <MapAbleAppShell variant="minimal">
        <p>Minimal body</p>
      </MapAbleAppShell>,
    );

    expect(screen.getByText("Minimal body")).toBeTruthy();
    expect(screen.queryByRole("contentinfo")).toBeNull();
  });
});
