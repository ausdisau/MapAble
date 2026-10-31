// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CommerceDesignLab } from "@/components/marketplace/commerce-design-lab/CommerceDesignLab";

afterEach(cleanup);

describe("MapAble commerce design lab: participant-facing UI", () => {
  it("shows a truthful, clearly synthetic storefront with labelled filters", () => {
    render(<CommerceDesignLab />);
    expect(screen.getByRole("heading", { name: /Good choices start with good information/i })).toBeTruthy();
    expect(screen.getByText(/Synthetic design preview/)).toBeTruthy();
    expect(screen.getByRole("searchbox", { name: "Search terms" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "What does it help with?" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Checkout" })).toBeNull();
  });

  it("keeps supporter and coordinator views informational, not authoritative", () => {
    render(<CommerceDesignLab />);
    fireEvent.change(screen.getByRole("combobox", { name: "Explore as" }), {
      target: { value: "supporter" },
    });
    expect(screen.getByText(/does not authorise you to purchase/)).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", { name: "Explore as" }), {
      target: { value: "coordinator" },
    });
    expect(screen.getByText(/no delegated account access/)).toBeTruthy();
  });

  it("can filter by AAC and recover from an empty result", () => {
    render(<CommerceDesignLab />);
    const search = screen.getByRole("searchbox", { name: "Search terms" });
    fireEvent.change(search, { target: { value: "AAC" } });
    expect(screen.getByRole("heading", { name: "AAC technology training session" })).toBeTruthy();
    fireEvent.change(search, { target: { value: "inexistent phrase abcdef" } });
    expect(screen.getByText(/No matching examples/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText(/17 of 17 synthetic examples shown/)).toBeTruthy();
  });

  it("supports independent comparison without determining suitability", () => {
    render(<CommerceDesignLab />);
    fireEvent.click(screen.getByRole("button", { name: "Compare: Easy-grip jar opener" }));
    fireEvent.click(screen.getByRole("button", { name: "Compare (1)" }));
    expect(screen.getByRole("heading", { name: "Side-by-side evidence" })).toBeTruthy();
    expect(screen.getByRole("table", { name: /Comparison of synthetic items/ })).toBeTruthy();
    expect(screen.getByText("Not assessed")).toBeTruthy();
  });

  it("prevents restricted hoists from being planned, while allowing a private list", () => {
    render(<CommerceDesignLab />);
    const restricted = screen.getByRole("button", {
      name: "Add to planning list: Used patient hoist — restricted example",
    });
    expect(restricted.hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Add to planning list: Easy-grip jar opener" }));
    fireEvent.click(screen.getByRole("button", { name: "Planning list (1)" }));
    expect(screen.getByRole("heading", { name: "Your private planning list" })).toBeTruthy();
    expect(screen.getByText(/This is not a payable total or quotation/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Save local text note/ }).hasAttribute("disabled")).toBe(false);
  });

  it("renders merchant review as simulation and previews a seller concept locally", () => {
    render(<CommerceDesignLab />);
    fireEvent.click(screen.getByRole("button", { name: "Seller workspace" }));
    expect(screen.getByRole("heading", { name: "Seller and reviewer workspace" })).toBeTruthy();
    expect(screen.getByText(/No real seller identity/)).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Product or service title" }), {
      target: { value: "Adapted example item" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Plain-language product or service description/ }), {
      target: { value: "Fictional accessible clothing illustration for the design lab." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Preview locally/ }));
    expect(screen.getByText("Private preview — not submitted")).toBeTruthy();
  });

  it("provides a readable research panel and larger-text preference", () => {
    render(<CommerceDesignLab />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Larger text" }));
    fireEvent.click(screen.getByRole("button", { name: "Design references" }));
    expect(screen.getByRole("heading", {
      name: "What we learned from four commerce platforms",
    })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Read official documentation" }).length).toBe(4);
  });
});
