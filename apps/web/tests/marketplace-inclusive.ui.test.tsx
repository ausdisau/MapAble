// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InclusiveMarketplace } from "../components/marketplace/InclusiveMarketplace";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe("Inclusive Marketplace accessibility and role boundaries", () => {
  it("provides a clearly synthetic, labelled storefront without checkout", () => {
    render(<InclusiveMarketplace />);
    expect(screen.getByRole("heading", { name: "Find what works for you." })).toBeTruthy();
    expect(screen.getByText(/No real sellers, stock, NDIS funding decision/)).toBeTruthy();
    expect(screen.getByRole("searchbox", { name: "Search listings" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Functional access feature" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Preview indicative amounts" }).hasAttribute("disabled")).toBe(true);
  });

  it("offers participant, carer and coordinator guidance without granting authority", () => {
    render(<InclusiveMarketplace />);
    fireEvent.change(screen.getByRole("combobox", { name: "Preview as" }), {
      target: { value: "supporter" },
    });
    expect(screen.getByText(/this view gives no authority/)).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", { name: "Preview as" }), {
      target: { value: "coordinator" },
    });
    expect(screen.getByText(/No participant records, delegated authority/)).toBeTruthy();
  });

  it("searches functional features and supports comparison by keyboard-oriented controls", () => {
    render(<InclusiveMarketplace />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search listings" }), {
      target: { value: "jar" },
    });
    expect(screen.getByRole("heading", { name: "Easy-grip jar opener" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Compare Easy-grip jar opener" }));
    expect(screen.getByRole("table", { name: /Evidence comparison/ })).toBeTruthy();
  });

  it("keeps restricted equipment out of the planning basket", () => {
    render(<InclusiveMarketplace />);
    const hoist = screen.getByRole("button", { name: "Not available — Lifting hoist (restricted example)" });
    expect(hoist.hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Add to planning basket — Easy-grip jar opener" }));
    expect(screen.getByRole("button", { name: "Preview indicative amounts" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "Preview indicative amounts" }).hasAttribute("disabled")).toBe(false);
  });

  it("previews seller listing locally without publishing it", () => {
    render(<InclusiveMarketplace />);
    fireEvent.change(screen.getByRole("textbox", { name: "Product or service name" }), {
      target: { value: "Example adapted cup" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Description \(without personal/ }), {
      target: { value: "A test listing without personal details" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview local listing" }));
    expect(screen.getByText("Private preview — never published")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download seller draft" }).hasAttribute("disabled")).toBe(false);
  });
});
