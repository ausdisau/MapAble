// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MarketplaceAlphaWeb } from "@/components/marketplace/alpha/MarketplaceAlphaWeb";

afterEach(cleanup);

describe("MapAble web and desktop closed-alpha experience", () => {
  it("shows an explicitly synthetic private alpha without checkout", () => {
    render(<MarketplaceAlphaWeb />);
    expect(screen.getByRole("heading", { name: /Explore access\. Compare options/i })).toBeTruthy();
    expect(screen.getByText(/SYNTHETIC, NO-CHECKOUT ALPHA/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /pay|checkout now|confirm order/i })).toBeNull();
    expect(screen.getByRole("searchbox", { name: "Search features" })).toBeTruthy();
  });
  it("filters options by functional feature and risk", () => {
    render(<MarketplaceAlphaWeb />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search features" }), {
      target: { value: "keyboard" },
    });
    expect(screen.getByRole("heading", { name: "Large-print keyboard — example" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Adapted kitchen grips — example" })).toBeNull();
    fireEvent.change(screen.getByRole("combobox", { name: "Review requirement" }), {
      target: { value: "review" },
    });
    expect(screen.getByRole("heading", { name: "No matching examples" })).toBeTruthy();
  });
  it("saves lower-risk examples privately and shows a nonpayable subtotal", () => {
    render(<MarketplaceAlphaWeb />);
    fireEvent.click(screen.getByRole("button", {
      name: "Save to private list: Adapted kitchen grips — example",
    }));
    expect(screen.getByText(/Example saved privately/)).toBeTruthy();
    expect(screen.getByText(/Stripe and checkout disabled/)).toBeTruthy();
    expect(screen.getByText("$28.00")).toBeTruthy();
  });
  it("compares a lower-risk option with specialist equipment without selling it", () => {
    render(<MarketplaceAlphaWeb />);
    fireEvent.click(screen.getByRole("button", { name: "Compare: Tablet mount — example" }));
    fireEvent.click(screen.getByRole("button", { name: "Compare (1)" }));
    expect(screen.getByRole("heading", { name: "Compare examples side by side" })).toBeTruthy();
    expect(screen.getByRole("table", {
      name: "Comparison of selected fictional assistive-technology examples",
    })).toBeTruthy();
    expect(screen.getByText(/Specialist review or trial required/)).toBeTruthy();
  });
  it("keeps specialist-review items out of the priced planning list", () => {
    render(<MarketplaceAlphaWeb />);
    expect(screen.getByRole("button", {
      name: "Needs specialist review: Wheelchair trial — example",
    }).hasAttribute("disabled")).toBe(true);
  });
  it("provides accessible alpha research tasks and local-only feedback", () => {
    render(<MarketplaceAlphaWeb />);
    fireEvent.click(screen.getByRole("button", { name: "Alpha testing" }));
    expect(screen.getByRole("heading", { name: "Closed-alpha testing checklist" })).toBeTruthy();
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Save a local text note" })).toBeTruthy();
  });
  it("connects the synthetic buyer/seller workspace without granting real roles", () => {
    render(<MarketplaceAlphaWeb />);
    fireEvent.click(screen.getByRole("button", { name: "Buyer–seller exchange" }));
    expect(screen.getByRole("heading", { name: /One marketplace\. Different roles/i })).toBeTruthy();
    expect(screen.getByText(/Changing roles is not authentication/)).toBeTruthy();
  });
});
