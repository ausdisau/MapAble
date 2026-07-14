// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { ParticipantProviderDiscovery } from "@/components/marketplace/ParticipantProviderDiscovery";

describe("participant marketplace accessibility", () => {
  it("provides labelled filters, non-colour evidence and participant controls", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(
      <ParticipantProviderDiscovery
        initialProviders={[
          {
            organisationId: "org-1",
            displayName: "Synthetic Provider",
            evidence: [
              {
                capability: "plain_language",
                source: "provider",
                verificationStatus: "unverified",
                observedAt: "2026-07-14T00:00:00.000Z",
              },
            ],
            capacity: null,
            sponsored: false,
          },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Find support providers" })).toBeTruthy();
    expect(screen.getByLabelText("Service type")).toBeTruthy();
    expect(screen.getByLabelText("Service area")).toBeTruthy();
    expect(screen.getByText(/unverified \(provider\)/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add to shortlist" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hide provider" })).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
  });
});
