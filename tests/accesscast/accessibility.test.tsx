/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AccessCastCard } from "@/components/accesscast/AccessCastCard";
import { forecastHarbourPlaceOutlook } from "@/lib/accesscast";

describe("AccessCast accessibility", () => {
  afterEach(() => {
    cleanup();
  });

  it("exposes state as text with definition, not colour alone", () => {
    const result = forecastHarbourPlaceOutlook({ scenarioId: "harbour_place_baseline" });
    render(<AccessCastCard result={result} />);

    expect(screen.getByRole("heading", { name: /access outlook/i })).toBeTruthy();
    expect(screen.getByText(result.stateLabel)).toBeTruthy();
    expect(screen.getByText(/route steps \(list alternative to map\)/i)).toBeTruthy();
    expect(screen.getAllByRole("list").length).toBeGreaterThan(0);

    for (const step of result.listAlternative) {
      expect(screen.getAllByText(new RegExp(step.label)).length).toBeGreaterThan(0);
    }
  });

  it("provides a structured timeline list", () => {
    const result = forecastHarbourPlaceOutlook();
    render(<AccessCastCard result={result} showTimeline />);
    expect(screen.getByRole("heading", { name: /forecast timeline/i })).toBeTruthy();
    expect(
      screen.getAllByText(/structured list is authoritative/i).length,
    ).toBeGreaterThan(0);
  });
});
