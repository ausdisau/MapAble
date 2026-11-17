/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MapAbleCareMarketingHeader } from "@/components/marketing/mapable-care-shared";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "unauthenticated", data: null }),
  signOut: vi.fn(),
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
  vi.unstubAllGlobals();
});

describe("MapAbleCareMarketingHeader", () => {
  it("renders primary nav instead of embedded GuidedSearch", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      }),
    );
    render(<MapAbleCareMarketingHeader />);

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Pre-register" }).getAttribute("href"),
    ).toBe("#pre-register");
    expect(screen.queryByLabelText("Search MapAble")).toBeNull();
  });

  it("renders session-aware sign-in actions in header", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      }),
    );
    render(<MapAbleCareMarketingHeader />);

    const signIn = screen.getByRole("link", { name: "Sign in" });
    expect(signIn.getAttribute("href")).toContain("/login?callbackUrl=");
    expect(
      decodeURIComponent(signIn.getAttribute("href") ?? ""),
    ).toContain("/login?callbackUrl=/");
    expect(
      screen.getByRole("link", { name: "Get started" }).getAttribute("href"),
    ).toContain("/register?callbackUrl=");
    expect(screen.getByTestId("mapable-user-bar-trigger")).toBeTruthy();
  });

  it("renders donate link to Australian Disability", () => {
    render(<MapAbleCareMarketingHeader />);

    const donate = screen.getByRole("link", { name: "Donate" });
    expect(donate.getAttribute("href")).toBe("https://paypal.me/ausdisau");
    expect(donate.getAttribute("target")).toBe("_blank");
    expect(donate.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
