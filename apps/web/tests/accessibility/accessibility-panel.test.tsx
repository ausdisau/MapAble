/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccessibilityPanelTrigger } from "@/components/accessibility/AccessibilityPanelTrigger";
import { AccessibilityPreferencesProvider } from "@/components/accessibility/AccessibilityPreferencesProvider";
import {
  ACCESSIBILITY_UI_STORAGE_KEY,
  clearPreferencesFromDocument,
  clearPreferencesStorage,
  DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
} from "@/lib/accessibility/ui-preferences";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "unauthenticated", data: null }),
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

function renderPanelShell() {
  return render(
    <AccessibilityPreferencesProvider>
      <AccessibilityPanelTrigger />
      <main>
        <h1>MapAble</h1>
        <button type="button">Outside control</button>
      </main>
    </AccessibilityPreferencesProvider>,
  );
}

describe("AccessibilityPanel", () => {
  beforeEach(() => {
    clearPreferencesStorage();
    clearPreferencesFromDocument();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
    };
  });

  afterEach(() => {
    cleanup();
    clearPreferencesStorage();
    clearPreferencesFromDocument();
  });

  it("exposes an accessible trigger name", () => {
    renderPanelShell();
    expect(
      screen.getByRole("button", { name: /open accessibility settings/i }),
    ).toBeTruthy();
  });

  it("opens the dialog and focuses the close control", async () => {
    const user = userEvent.setup();
    renderPanelShell();
    await user.click(
      screen.getByRole("button", { name: /open accessibility settings/i }),
    );

    const dialog = screen.getByTestId("accessibility-panel");
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(
      screen.getByRole("heading", { name: /accessibility settings/i }),
    ).toBeTruthy();
    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByTestId("accessibility-panel-close"),
      );
    });
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    renderPanelShell();
    const trigger = screen.getByRole("button", {
      name: /open accessibility settings/i,
    });
    await user.click(trigger);

    const dialog = screen.getByTestId("accessibility-panel");
    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));

    await waitFor(() => {
      expect(dialog.hasAttribute("open")).toBe(false);
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("closes via the close button", async () => {
    const user = userEvent.setup();
    renderPanelShell();
    await user.click(
      screen.getByRole("button", { name: /open accessibility settings/i }),
    );
    await user.click(screen.getByTestId("accessibility-panel-close"));
    await waitFor(() => {
      expect(
        screen.getByTestId("accessibility-panel").hasAttribute("open"),
      ).toBe(false);
    });
  });

  it("applies a preset and lists changed settings", async () => {
    const user = userEvent.setup();
    renderPanelShell();
    await user.click(
      screen.getByRole("button", { name: /open accessibility settings/i }),
    );
    await user.click(screen.getByRole("button", { name: /clearer vision/i }));
    expect(screen.getByText(/settings that changed/i)).toBeTruthy();
    expect(document.documentElement.dataset.a11yContrast).toBe("high");
    expect(document.documentElement.dataset.a11yTextScale).toBe("125");
  });

  it("supports individual control overrides", async () => {
    const user = userEvent.setup();
    renderPanelShell();
    await user.click(
      screen.getByRole("button", { name: /open accessibility settings/i }),
    );
    await user.click(screen.getByLabelText(/maximum \(200%\)/i));
    expect(document.documentElement.dataset.a11yTextScale).toBe("200");
  });

  it("confirms reset and restores defaults", async () => {
    const user = userEvent.setup();
    renderPanelShell();
    await user.click(
      screen.getByRole("button", { name: /open accessibility settings/i }),
    );
    await user.click(screen.getByRole("button", { name: /comfort mode/i }));
    await user.click(screen.getByTestId("accessibility-reset"));
    await user.click(screen.getByTestId("accessibility-reset-confirm"));
    expect(document.documentElement.dataset.a11yTextScale).toBeUndefined();
    expect(window.localStorage.getItem(ACCESSIBILITY_UI_STORAGE_KEY)).toBeNull();
  });

  it("announces saved-on-this-device status", async () => {
    const user = userEvent.setup();
    renderPanelShell();
    await user.click(
      screen.getByRole("button", { name: /open accessibility settings/i }),
    );
    const dialog = screen.getByTestId("accessibility-panel");
    expect(within(dialog).getByText(/saved on this device/i)).toBeTruthy();
  });

  it("keeps defaults equal to the schema defaults object", () => {
    expect(DEFAULT_ACCESSIBILITY_UI_PREFERENCES.disableSmoothScrolling).toBe(
      false,
    );
  });
});
