/**
 * @vitest-environment jsdom
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyResourceGrid } from "@/components/canvas/PolicyResourceGrid";
import { ResourceModuleGrid } from "@/components/canvas/ResourceModuleGrid";
import {
  getParticipantJourneySteps,
  getResourceTrustPrinciples,
} from "@/lib/canvas/canvas-filters";
import {
  policyResourceLinks,
  resourceModuleLinks,
} from "@/lib/canvas/resource-hub-data";

describe("resource hub data", () => {
  it("defines module and policy links for the hub", () => {
    expect(resourceModuleLinks.length).toBeGreaterThanOrEqual(6);
    expect(policyResourceLinks).toHaveLength(4);
    resourceModuleLinks.forEach((module) => {
      expect(module.href).toMatch(/^\//);
      expect(module.label.length).toBeGreaterThan(0);
    });
  });

  it("provides participant journey and trust subsets", () => {
    const participantJourney = getParticipantJourneySteps();
    expect(participantJourney).toHaveLength(8);
    expect(participantJourney[0]?.step).toBe(1);
    expect(participantJourney.at(-1)?.step).toBe(8);

    const trustPrinciples = getResourceTrustPrinciples();
    expect(trustPrinciples).toHaveLength(4);
    expect(trustPrinciples.map((p) => p.title)).toContain("Consent first");
  });
});

describe("resource hub components", () => {
  it("renders module grid links", () => {
    render(<ResourceModuleGrid modules={resourceModuleLinks.slice(0, 2)} />);
    expect(screen.getByRole("heading", { name: "Explore MapAble modules" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /MapAble Care/i }).getAttribute("href")).toBe(
      "/care"
    );
  });

  it("renders policy resource grid", () => {
    render(<PolicyResourceGrid links={policyResourceLinks} />);
    expect(
      screen.getByRole("heading", { name: "Policy and safety resources" })
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Privacy notice/i }).getAttribute("href")
    ).toBe("/privacy");
  });
});

describe("resources page contract", () => {
  it("wires the resource hub sections in the page source", () => {
    const pagePath = join(process.cwd(), "app/(marketing)/resources/page.tsx");
    expect(existsSync(pagePath)).toBe(true);
    const source = readFileSync(pagePath, "utf8");
    expect(source).toContain("ResourceModuleGrid");
    expect(source).toContain("CanvasBlockGrid");
    expect(source).toContain("Participant support journey");
    expect(source).toContain("PolicyResourceGrid");
    expect(source).not.toContain("requireAuth");
  });
});
