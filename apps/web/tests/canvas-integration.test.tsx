/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { CanvasBlockGrid } from "@/components/canvas/CanvasBlockGrid";
import { JourneyTimeline } from "@/components/canvas/JourneyTimeline";
import { StrategicContrast } from "@/components/canvas/StrategicContrast";
import { TrustLayer } from "@/components/canvas/TrustLayer";
import {
  canvasBlocks,
  journeySteps,
  metricGroups,
  providerBlockIds,
  trustPrinciples,
} from "@/lib/canvas/canvas-data";
import {
  getBlocksForModule,
  getProviderBlocks,
  getProviderJourneySteps,
} from "@/lib/canvas/canvas-filters";

describe("canvas data contract", () => {
  it("defines 12 ecosystem blocks with unique ids and module tags", () => {
    expect(canvasBlocks).toHaveLength(12);
    const ids = canvasBlocks.map((b) => b.id);
    expect(new Set(ids).size).toBe(12);
    expect(ids).toContain("access-pass");
    expect(ids).toContain("rights-navigator");
    canvasBlocks.forEach((block) => {
      expect(block.modules.length).toBeGreaterThan(0);
      expect(block.href).toMatch(/^\//);
    });
  });

  it("defines 12 journey steps and 9 trust principles", () => {
    expect(journeySteps).toHaveLength(12);
    expect(trustPrinciples).toHaveLength(9);
    expect(metricGroups).toHaveLength(4);
  });

  it("filters blocks per module", () => {
    const care = getBlocksForModule("care");
    expect(care.length).toBeGreaterThan(0);
    care.forEach((b) => expect(b.modules).toContain("care"));

    const transport = getBlocksForModule("transport");
    transport.forEach((b) => expect(b.modules).toContain("transport"));
  });

  it("provides provider-focused subset", () => {
    const providerBlocks = getProviderBlocks();
    expect(providerBlocks.length).toBe(providerBlockIds.length);
    const providerJourney = getProviderJourneySteps();
    expect(providerJourney.length).toBeGreaterThan(0);
    expect(providerJourney.length).toBeLessThanOrEqual(journeySteps.length);
  });
});

describe("canvas components", () => {
  it("renders strategic contrast", () => {
    render(<StrategicContrast />);
    expect(screen.getByText("Care-only platform")).toBeTruthy();
    expect(screen.getByText("MapAble Complete Support")).toBeTruthy();
  });

  it("renders block grid with all blocks", () => {
    render(<CanvasBlockGrid blocks={canvasBlocks} />);
    expect(screen.getByRole("heading", { name: "Complete Support ecosystem" })).toBeTruthy();
    canvasBlocks.forEach((block) => {
      expect(
        screen.getByRole("heading", { level: 3, name: block.title })
      ).toBeTruthy();
    });
  });

  it("renders journey timeline in compact mode", () => {
    render(
      <JourneyTimeline steps={journeySteps} compact title="Support journey" />
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Support journey" })
    ).toBeTruthy();
    expect(screen.getByText("Participant creates Access Pass")).toBeTruthy();
  });

  it("renders trust layer", () => {
    render(<TrustLayer principles={trustPrinciples} />);
    expect(screen.getByText("Trust is the product")).toBeTruthy();
    expect(screen.getByText("Consent first")).toBeTruthy();
  });
});
