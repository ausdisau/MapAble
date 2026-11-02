// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NdiswcLookupGuide } from "@/components/workers/NdiswcLookupGuide";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("multi-jurisdiction official worker screening navigation", () => {
  it("offers all eight states with visible, named jurisdiction selection", () => {
    render(<NdiswcLookupGuide />);
    const selector = screen.getByRole("combobox", {
      name: "State or territory for the worker screening unit",
    });
    expect(selector).toBeTruthy();
    expect(selector.querySelectorAll("option").length).toBe(8);
    expect(screen.getByText(/NDIS worker screening — find the right official lookup/))
      .toBeTruthy();
  });
  it("changes Victorian worker's official link while retaining non-verification", async () => {
    const user = userEvent.setup();
    render(<NdiswcLookupGuide />);
    await user.selectOptions(screen.getByRole("combobox", { name: "I am a..." }), "nsw_worker");
    await user.selectOptions(screen.getByRole("combobox", {
      name: "State or territory for the worker screening unit",
    }), "VIC");
    const link = screen.getByRole("link", { name: /Read the Victorian NDIS Check application/ });
    expect(link.getAttribute("href")).toBe("https://www.vic.gov.au/ndis-worker-screening-check");
    expect(screen.getByText(/no clearance, no start/i)).toBeTruthy();
    expect(screen.getByText(/does not replace the Victorian Working with Children Check/)).toBeTruthy();
    expect(screen.getByText(/CURRENT SCREENING STATUS: NOT INDEPENDENTLY VERIFIED/)).toBeTruthy();
  });
  it("explains ACT WWVP + NDIS clearance without claiming all WWVP cards certify NDIS work", async () => {
    const user = userEvent.setup();
    render(<NdiswcLookupGuide />);
    await user.selectOptions(screen.getByRole("combobox", { name: "I am a..." }), "nsw_worker");
    await user.selectOptions(screen.getByRole("combobox", {
      name: "State or territory for the worker screening unit",
    }), "ACT");
    const link = screen.getByRole("link", { name: /Read the ACT WWVP and NDIS clearance/ });
    expect(link.getAttribute("href")).toContain("/wwvp-and-the-ndis");
    expect(screen.getByText(/WWVP card by itself is not a general substitute/)).toBeTruthy();
    expect(screen.getByText(/NDIS ACTIVITIES - Yes/)).toBeTruthy();
  });
  it("directs Queensland workers to portal guidance and Blue Card requirements", async () => {
    const user = userEvent.setup();
    render(<NdiswcLookupGuide />);
    await user.selectOptions(screen.getByRole("combobox", { name: "I am a..." }), "nsw_worker");
    await user.selectOptions(screen.getByRole("combobox", {
      name: "State or territory for the worker screening unit",
    }), "QLD");
    expect(screen.getByRole("link", { name:/Check Queensland's disability-worker application steps/})
      .getAttribute("href")).toContain("workerscreening.qld.gov.au");
    expect(screen.getByText(/combined application, not an automatic substitution/)).toBeTruthy();
  });
  it("keeps WA's DoTDirect and WWC checks separate from national employer verification", async () => {
    const user = userEvent.setup();
    render(<NdiswcLookupGuide />);
    await user.selectOptions(screen.getByRole("combobox", { name: "I am a..." }), "nsw_worker");
    await user.selectOptions(screen.getByRole("combobox", {
      name: "State or territory for the worker screening unit",
    }), "WA");
    expect(screen.getByRole("link", { name:/Read WA's Applying for an NDIS Check instructions/})
      .getAttribute("href")).toContain("applying-ndis-check");
    expect(screen.getByText(/WA Working with Children Check requirements can apply/)).toBeTruthy();
    expect(screen.getByText(/Work permission cannot be determined from an application status alone/)).toBeTruthy();
  });
  it("changes jurisdiction locally without network calls, identity capture or storing clearance", async () => {
    const network = vi.fn().mockRejectedValue(new Error("Should never fetch"));
    vi.stubGlobal("fetch", network);
    const user = userEvent.setup();
    render(<NdiswcLookupGuide />);
    const region = screen.getByRole("combobox", {
      name: "State or territory for the worker screening unit",
    });
    await user.selectOptions(region, "WA");
    await user.selectOptions(region, "ACT");
    await user.selectOptions(region, "NSW");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByLabelText(/worker screening id/i)).toBeNull();
    expect(screen.queryByLabelText(/password/i)).toBeNull();
    expect(network).not.toHaveBeenCalled();
  });
});
