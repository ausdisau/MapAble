// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ExchangeWorkspace } from "@/components/marketplace/dual-sided/ExchangeWorkspace";

afterEach(cleanup);

describe("MapAble dual-sided exchange UI", () => {
  it("shows an explicitly synthetic, non-financial, participant-led experience", () => {
    render(<ExchangeWorkspace />);
    expect(screen.getByRole("heading", { name: /One marketplace\. Different roles/ })).toBeTruthy();
    expect(screen.getByText(/Changing roles is not authentication/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Your buyer workspace" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /pay now|checkout|accept and pay/i })).toBeNull();
  });

  it("provides time-limited sharing and individual revocation controls", () => {
    render(<ExchangeWorkspace />);
    expect(screen.getByRole("button", { name: "Revoke Example equipment supplier A" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Revoke Example equipment supplier A" }));
    expect(screen.getByText(/permission withdrawn/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Equipment suppliers" }));
    expect(screen.getByRole("heading", { name: "No shared enquiries" })).toBeTruthy();
  });

  it("creates a new private enquiry without opening a seller grant", () => {
    render(<ExchangeWorkspace />);
    fireEvent.change(screen.getByRole("textbox", { name: /What would you like to understand/ }), {
      target: { value: "I would like to compare costs and availability of the example item." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create local draft/ }));
    expect(screen.getByText(/Private example request created/)).toBeTruthy();
    expect(screen.getByText("request-3 · Products · Example")).toBeTruthy();
  });

  it("limits the seller's visible enquiries to those granted by the participant", () => {
    render(<ExchangeWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Equipment suppliers" }));
    expect(screen.getByRole("heading", { name: "Example equipment supplier A" })).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", { name: /Choose a fictional equipment supplier/ }), {
      target: { value: "supplierGold" },
    });
    expect(screen.getByRole("heading", { name: "No shared enquiries" })).toBeTruthy();
  });

  it("supplier quote entry remains a nonbinding simulation and requires itemised prices", () => {
    render(<ExchangeWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Buyer workspace" }));
    fireEvent.click(screen.getByRole("button", { name: "Share with Example equipment supplier B" }));
    fireEvent.click(screen.getByRole("button", { name: "Equipment suppliers" }));
    fireEvent.change(screen.getByRole("combobox", { name: /Choose a fictional equipment supplier/ }), {
      target: { value: "supplierGold" },
    });
    expect(screen.getByRole("heading", { name: "Example equipment supplier B" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Add fictional quote to shared demonstration/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Add fictional quote to shared demonstration/ }));
    expect(screen.getByText(/nonbinding example quote was added/)).toBeTruthy();
  });

  it("demonstrates provider-specific quoting and no provider approval controls", () => {
    render(<ExchangeWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Service providers" }));
    expect(screen.getByRole("heading", { name: "Example training provider" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "AAC technology training session" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /approve NDIS|accept purchase/i })).toBeNull();
  });

  it("keeps independent advice separate from business quotations", () => {
    render(<ExchangeWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "AT advisors" }));
    expect(screen.getByRole("heading", { name: "Advisor / prescriber workbench" })).toBeTruthy();
    expect(screen.getByText(/No clinical assessment has occurred/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Shortlist \(not a purchase\)/i })).toBeNull();
  });

  it("coordinator guidance cannot create payment or participant permission", () => {
    render(<ExchangeWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Support coordinators" }));
    expect(screen.getByRole("heading", { name: "Support coordinator workspace" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Add local planning note/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Shortlist \(not a purchase\)/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Share with/i })).toBeNull();
  });

  it("displays a non-identifying, synthetic activity history and reset", () => {
    render(<ExchangeWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Activity history" }));
    expect(screen.getByRole("heading", { name: "Example consent and activity history" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Synthetic exchange events" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Reset synthetic workspace/ }));
    expect(screen.getByText(/workshop reset/)).toBeTruthy();
  });
});
