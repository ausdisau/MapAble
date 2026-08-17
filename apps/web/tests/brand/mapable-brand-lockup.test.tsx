/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MapAbleBrandLockup } from "@/components/brand/MapAbleBrandLockup";
import {
  MAPABLE_BRAND_TAGLINE,
  MAPABLE_LOGO_WORDMARK_SRC,
} from "@/lib/brand/constants";

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

describe("MapAbleBrandLockup", () => {
  it("centers the wordmark and a width-fitted tagline pill", () => {
    const { container } = render(<MapAbleBrandLockup href="/" size="header" />);

    const link = screen.getByRole("link", {
      name: new RegExp(`MapAble home.*${MAPABLE_BRAND_TAGLINE}`, "i"),
    });
    expect(link.getAttribute("href")).toBe("/");
    expect(link.className).toMatch(/items-center/);

    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe(MAPABLE_LOGO_WORDMARK_SRC);
    expect(img?.className).toMatch(/object-center/);

    const pill = screen.getByText(MAPABLE_BRAND_TAGLINE);
    expect(pill.className).toMatch(/w-fit/);
    expect(pill.className).toMatch(/rounded-full/);
  });
});
