/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MapAbleCareMarketingHeader } from "@/components/marketing/mapable-care-shared";
import { TransportPublicLanding } from "@/components/transport/public/TransportPublicLanding";
import {
  EXCLUDED_TRANSACTIONAL_PATH_PREFIXES,
  isExcludedTransactionalPath,
} from "@/lib/public/informational/routes";
import {
  TRANSPORT_PUBLIC_CTAS,
  TRANSPORT_PUBLIC_HEADLINE,
  TRANSPORT_PUBLIC_BRAND,
} from "@/lib/transport/public-copy";

vi.mock("next/navigation", () => ({
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

describe("Transport public copy CTAs", () => {
  it("keeps primary and secondary CTAs on informational-safe paths", () => {
    expect(isExcludedTransactionalPath(TRANSPORT_PUBLIC_CTAS.primary.href)).toBe(
      false,
    );
    expect(
      isExcludedTransactionalPath(TRANSPORT_PUBLIC_CTAS.secondary.href),
    ).toBe(false);
    expect(TRANSPORT_PUBLIC_CTAS.primary.href).toContain("Transport");
    expect(TRANSPORT_PUBLIC_CTAS.secondary.href).toBe("/contact");
  });

  it("does not use excluded transactional paths as the primary CTA", () => {
    for (const prefix of EXCLUDED_TRANSACTIONAL_PATH_PREFIXES) {
      expect(TRANSPORT_PUBLIC_CTAS.primary.href.startsWith(prefix)).toBe(false);
    }
  });
});

describe("TransportPublicLanding", () => {
  it("renders brand, accessible headline, and safe CTAs without forms", () => {
    render(<TransportPublicLanding />);

    expect(
      screen.getByRole("heading", { level: 1, name: TRANSPORT_PUBLIC_HEADLINE }),
    ).toBeTruthy();
    expect(screen.getAllByText(TRANSPORT_PUBLIC_BRAND).length).toBeGreaterThan(0);

    const primaryLinks = screen.getAllByRole("link", {
      name: TRANSPORT_PUBLIC_CTAS.primary.label,
    });
    expect(primaryLinks.length).toBeGreaterThanOrEqual(1);
    expect(primaryLinks[0].getAttribute("href")).toBe(
      TRANSPORT_PUBLIC_CTAS.primary.href,
    );

    const secondaryLinks = screen.getAllByRole("link", {
      name: TRANSPORT_PUBLIC_CTAS.secondary.label,
    });
    expect(secondaryLinks[0].getAttribute("href")).toBe(
      TRANSPORT_PUBLIC_CTAS.secondary.href,
    );

    expect(
      screen.getByRole("link", { name: TRANSPORT_PUBLIC_CTAS.tertiary.label }),
    ).toBeTruthy();

    expect(document.querySelectorAll("form").length).toBe(0);
    expect(document.body.textContent).not.toMatch(/\bbook transport\b/i);
  });

  it("includes how-a-trip-works and safety sections", () => {
    render(<TransportPublicLanding />);

    expect(
      screen.getByRole("heading", { name: "How a trip works" }),
    ).toBeTruthy();
    const safety = screen.getByRole("heading", { name: "Safety and privacy" });
    expect(safety).toBeTruthy();
    const safetySection = safety.closest("section");
    expect(safetySection?.textContent).toMatch(/call 000/i);
  });
});

describe("MarketingPrimaryNav Transport entry", () => {
  it("links Transport to the public explainer", () => {
    render(<MapAbleCareMarketingHeader />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    const transport = within(nav).getByRole("link", { name: "Transport" });
    expect(transport.getAttribute("href")).toBe("/transport");
  });
});
