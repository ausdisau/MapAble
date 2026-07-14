// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { ParticipantShiftOffers } from "@/components/care/ParticipantShiftOffers";
import { WorkerShiftOffers } from "@/components/care/WorkerShiftOffers";
import { providerWorkforceConfig } from "@/lib/config/provider-workforce";

describe("provider workforce accessible UI", () => {
  it("renders participant options with headings and explicit confirmation", () => {
    render(
      <ParticipantShiftOffers
        offers={[
          {
            id: "offer-1",
            workerName: "Synthetic Worker",
            startsAt: "2026-07-20T09:00:00.000Z",
            matchedRequirements: ["First aid verified"],
            uncertainty: ["Worker acceptance is pending"],
          },
        ]}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Worker options" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Confirm this worker" }),
    ).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("renders worker offers with keyboard-operable accept controls", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(
      <WorkerShiftOffers
        offers={[
          {
            id: "offer-1",
            title: "Appointment support",
            startsAt: "2026-07-20T09:00:00.000Z",
            expiresAt: "2026-07-19T09:00:00.000Z",
          },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Accept shift" })).toBeTruthy();
  });

  it("hard-disables automatic assignment", () => {
    expect(providerWorkforceConfig.automaticAssignmentEnabled).toBe(false);
  });
});
