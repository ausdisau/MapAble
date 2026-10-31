// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MarketplaceOperationsLab } from "../components/marketplace/MarketplaceOperationsLab";

afterEach(cleanup);

describe("MapAble Marketplace synthetic assurance interface", () => {
  it("keeps the simulation and zero-payment caveats visible", () => {
    render(<MarketplaceOperationsLab />);
    expect(screen.getByRole("heading", { name: "Marketplace assurance workflow" })).toBeTruthy();
    expect(screen.getByText(/fictional sellers, checklist evidence, prices/)).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Acting role (simulation only)" })).toBeTruthy();
    expect(screen.getByText(/External payment captured:/)).toBeTruthy();
  });

  it("shows an accessible error when actor authority is missing", () => {
    render(<MarketplaceOperationsLab />);
    fireEvent.change(screen.getByRole("combobox", { name: "Acting role (simulation only)" }), {
      target: { value: "supporter" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Prepare synthetic quote" }));
    expect(screen.getByText(/Only participant or a currently authorised preparer may draft/)).toBeTruthy();
  });

  it("lets the participant grant preparation only, never purchase confirmation", () => {
    render(<MarketplaceOperationsLab />);
    fireEvent.click(screen.getByRole("button", { name: "Grant preparation only" }));
    expect(screen.getByText(/30-minute prepare-only simulated permission/)).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", { name: "Acting role (simulation only)" }), {
      target: { value: "supporter" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Participant confirms fictional order" }));
    expect(screen.getByText(/Only the simulated participant can confirm/)).toBeTruthy();
  });

  it("shows all supplier evidence categories and mock order controls", () => {
    render(<MarketplaceOperationsLab />);
    expect(screen.getByText(/Recall search \(sample evidence\)/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Approve simulated supplier" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Record mock delay" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reconcile zero-cash ledger" })).toBeTruthy();
  });
});
