/**
 * @vitest-environment jsdom
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MapAbleCareCombinedHomepage, {
  mapAbleCareCombinedDesignTests,
} from "@/components/marketing/MapAbleCareCombinedHomepage";
import {
  companyRegistrationDetails,
  homepageHeroCopy,
  supportAreas,
} from "@/lib/marketing/mapable-care-combined-data";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/guided-search/GuidedSearchDialogue", () => ({
  GuidedSearchDialogue: () => <div data-testid="guided-search-dialogue" />,
}));

afterEach(() => {
  cleanup();
  mockPush.mockClear();
});

describe("mapAbleCareCombinedDesignTests", () => {
  it("exports the full design contract", () => {
    expect(mapAbleCareCombinedDesignTests).toHaveLength(11);
  });

  it("search field starts blank", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) => item.name === "search field starts blank",
    );
    expect(spec?.expectedInitialQuery).toBe("");
  });

  it("positioning uses combined care language", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) => item.name === "positioning uses combined care language",
    );
    expect(spec?.expectedHeadline).toBe(homepageHeroCopy.headline);
  });

  it("support selector uses user-facing areas instead of agents", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) => item.name === "support selector uses user-facing areas instead of agents",
    );
    expect(spec?.expectedAreas).toEqual(supportAreas);
  });

  it("footer displays current phone number", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) => item.name === "footer displays current phone number",
    );
    expect(spec?.expectedPhone).toBe("0434 083 624");
  });

  it("footer displays company ABN and NDIS registration number", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) =>
        item.name === "footer displays company ABN and NDIS registration number",
    );
    expect(spec?.expectedRegistrationDetails).toEqual(companyRegistrationDetails);
  });

  it("typography uses static wavy display treatment without animation", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) =>
        item.name === "typography uses static wavy display treatment without animation",
    );
    expect(spec?.expectedTypography).toBe("mapable-display + static WavyText");
  });

  it("wavy typography keeps clear spacing between words", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) => item.name === "wavy typography keeps clear spacing between words",
    );
    expect(spec?.expectedWordSpacing).toBe("0.34em");
  });

  it("design includes clearly labelled sponsored partner placements", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) =>
        item.name === "design includes clearly labelled sponsored partner placements",
    );
    expect(spec?.expectedSponsoredPlacements).toEqual(["primary", "search", "footer"]);
  });

  it("hero section is extracted to dedicated component", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) => item.name === "hero section is extracted to dedicated component",
    );
    const source = readFileSync(
      join(process.cwd(), "components/marketing/MapAbleCareCombinedHomepage.tsx"),
      "utf8",
    );
    expect(spec?.expectedDeclaration).toBe("HeroSection");
    expect(source).toContain("<HeroSection />");
  });

  it("guided landing includes primary homepage sections", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) => item.name === "guided landing includes primary homepage sections",
    );
    const source = readFileSync(
      join(process.cwd(), "components/marketing/MapAbleCareCombinedHomepage.tsx"),
      "utf8",
    );
    expect(spec?.expectedSections).toEqual([
      "HeroSection",
      "HomepageProofStrip",
      "CompetitorContrastStrip",
      "HomepageMapPreview",
      "HomepageSupportJourney",
      "HomepageProviderPitch",
      "HomepageFinalCta",
      "GuidedSearchPanel",
      "BoundaryNotice",
    ]);
    for (const section of spec?.expectedSections ?? []) {
      expect(source).toContain(`<${section}`);
    }
  });

  it("homepage has single guided search panel anchor", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) => item.name === "homepage has single guided search panel anchor",
    );
    expect(spec?.expectedGuidedSearchAnchor).toBe("guided-search-panel");
  });
});

describe("MapAbleCareCombinedHomepage", () => {
  beforeEach(() => {
    render(<MapAbleCareCombinedHomepage />);
  });

  it("renders guided landing headline and blank panel search field", () => {
    expect(screen.getByLabelText(homepageHeroCopy.headline)).toBeTruthy();
    const searchInput = screen.getByLabelText(
      "What support do you need?",
    ) as HTMLInputElement;
    expect(searchInput.value).toBe("");
  });

  it("renders a header donate link to Australian Disability", () => {
    const donate = screen.getByRole("link", { name: "Donate" });
    expect(donate.getAttribute("href")).toBe("https://paypal.me/ausdisau");
    expect(donate.getAttribute("target")).toBe("_blank");
    expect(donate.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders category chips and marketplace section", () => {
    expect(screen.getAllByRole("link", { name: "NDIS Guidance" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Help build Australia/i })).toBeTruthy();
    expect(document.getElementById("map-preview")).toBeTruthy();
  });


  it("renders footer contact and registration details", () => {
    expect(screen.getByText("0434 083 624")).toBeTruthy();
    expect(screen.getByText(/55 641 613 541/)).toBeTruthy();
    expect(screen.getByText("To be confirmed")).toBeTruthy();
  });

  it("renders competitor final CTA instead of sponsored home band", () => {
    expect(screen.getByRole("heading", { name: /Help build Australia/i })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Verify my venue" }).length).toBeGreaterThan(0);
  });

  it("opens guided chat on panel search submit", () => {
    const searchInput = screen.getByLabelText("What support do you need?");
    fireEvent.change(searchInput, { target: { value: "wheelchair transport" } });
    fireEvent.submit(searchInput.closest("form")!);
    expect(screen.getByTestId("guided-search-dialogue")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
