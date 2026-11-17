/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  accountMenuDialogStyle,
  MapAbleUserBar,
} from "@/components/layout/MapAbleUserBar";

const sessionState = vi.hoisted(() => ({
  status: "unauthenticated" as "authenticated" | "unauthenticated" | "loading",
  data: null as null | {
    user: {
      id: string;
      name: string;
      email: string;
      role?: string;
      mfaVerified?: boolean;
      image?: string | null;
    };
  },
  pathname: "/",
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: sessionState.status, data: sessionState.data }),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => sessionState.pathname,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  sessionState.status = "unauthenticated";
  sessionState.data = null;
  sessionState.pathname = "/";
  window.history.replaceState(null, "", "/");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    }),
  );
});

describe("MapAbleUserBar", () => {
  it("shows a loading account control without signed-out CTAs", () => {
    sessionState.status = "loading";
    render(<MapAbleUserBar />);
    const trigger = screen.getByTestId("mapable-user-bar-trigger");
    expect(trigger.getAttribute("aria-label")).toBe(
      "Account menu, checking sign-in",
    );
    expect(trigger.getAttribute("aria-busy")).toBe("true");
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  });

  it("offers sign-in with a safe callback when signed out", async () => {
    sessionState.pathname = "/provider-finder";
    window.history.replaceState(
      null,
      "",
      "/provider-finder?q=therapy&location=Sydney",
    );
    const user = userEvent.setup();
    render(<MapAbleUserBar />);

    await user.click(screen.getByTestId("mapable-user-bar-trigger"));
    const dialog = screen.getByRole("dialog", { name: "Sign in" });
    expect(dialog).toBeTruthy();

    const signInLinks = screen.getAllByRole("link", { name: "Sign in" });
    expect(
      signInLinks.some((link) =>
        link
          .getAttribute("href")
          ?.includes(
            encodeURIComponent(
              "/provider-finder?q=therapy&location=Sydney",
            ),
          ),
      ),
    ).toBe(true);
  });

  it("shows My MapAble and account links when signed in", async () => {
    sessionState.status = "authenticated";
    sessionState.data = {
      user: {
        id: "user-1",
        name: "Jane Citizen",
        email: "jane@example.com",
        role: "participant",
        mfaVerified: true,
      },
    };
    const user = userEvent.setup();
    render(<MapAbleUserBar />);

    await user.click(
      screen.getByRole("button", {
        name: "Account menu, signed in as Jane Citizen",
      }),
    );

    expect(screen.getByRole("dialog", { name: "Your account" })).toBeTruthy();
    expect(screen.getByText("jane@example.com")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "My MapAble" }).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByRole("link", { name: "Profile" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Accessibility preferences" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  it("does not nest auth CTAs on the login page", async () => {
    sessionState.pathname = "/login";
    const user = userEvent.setup();
    render(<MapAbleUserBar />);
    await user.click(screen.getByTestId("mapable-user-bar-trigger"));
    expect(
      screen.getByText(
        "Use the form on this page to sign in or create an account.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Get started" })).toBeNull();
  });

  it("reports unavailable instead of signed-out when session probe fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: "down" }),
      }),
    );
    const user = userEvent.setup();
    render(<MapAbleUserBar />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Account menu, sign-in status unavailable",
        }),
      ).toBeTruthy();
    });

    await user.click(
      screen.getByRole("button", {
        name: "Account menu, sign-in status unavailable",
      }),
    );
    expect(
      screen.getByText(/could not confirm whether you are signed in/i),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("positions the account dialog inside the viewport", () => {
    const style = accountMenuDialogStyle(
      { bottom: 80, right: 900 },
      { width: 400, height: 700 },
    );
    expect(style.left).toBe(12);
    expect(style.width).toBe(376);
  });
});
