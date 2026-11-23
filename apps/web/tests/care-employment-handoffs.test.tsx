/**
 * @vitest-environment jsdom
 *
 * D02 regression: Care/Employment entry links, destination filters,
 * catalog request, empty state, and demo-directory introduction removal.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Provider } from "@/app/provider-finder/providers";
import { ProviderDirectory } from "@/components/providers/ProviderDirectory";
import {
  supportAreaLandingRoutes,
  supportAreaToSupportTypeId,
} from "@/lib/marketing/mapable-care-routes";
import { PROVIDER_OUTLETS_JSON_URL } from "@/lib/provider/finder/provider-outlets";

const mockSearchParams = new URLSearchParams();

const mockReplace = vi.fn((href: string) => {
  const url = new URL(href, "https://mapable.com.au");
  mockSearchParams.forEach((_, key) => mockSearchParams.delete(key));
  url.searchParams.forEach((value, key) => {
    mockSearchParams.set(key, value);
  });
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    function DynamicStub() {
      return <div data-testid="dynamic-map-stub" />;
    }
    return DynamicStub;
  },
}));

vi.mock("@/components/map/LazyMapPanel", () => ({
  LazyMapPanel: ({
    list,
  }: {
    list: React.ReactNode;
  }) => <div data-testid="lazy-map-panel">{list}</div>,
}));

vi.mock("@/components/marketing/MapAbleCareCombinedSections", () => ({
  MapAbleCareCombinedSections: () => null,
}));

vi.mock("@/components/provider-finder/ProviderFinderAskPanel", () => ({
  ProviderFinderAskPanel: () => null,
}));

vi.mock("@/components/provider-finder/ProviderFinderHero", () => ({
  ProviderFinderHero: ({
    onShowResults,
  }: {
    onShowResults: () => void;
  }) => (
    <button type="button" onClick={onShowResults}>
      Show results
    </button>
  ),
}));

vi.mock("@/components/ads/mapable/AdPlacement", () => ({
  AdPlacement: () => null,
}));

const fixtureProviders: Provider[] = [
  {
    id: "care-1",
    slug: "care-one",
    name: "Synthetic Care Co",
    suburb: "St Ives",
    state: "NSW",
    postcode: "2075",
    distanceKm: 0,
    rating: 0,
    reviewCount: 0,
    registered: false,
    categories: ["Assistance with Daily Life"],
    supports: ["In-person"],
    source: "demo",
    directoryActivity: "unknown",
  },
  {
    id: "jobs-1",
    slug: "jobs-one",
    name: "Synthetic Jobs Co",
    suburb: "Parramatta",
    state: "NSW",
    postcode: "2150",
    distanceKm: 0,
    rating: 0,
    reviewCount: 0,
    registered: false,
    categories: ["Employment Supports"],
    supports: ["In-person"],
    source: "demo",
    directoryActivity: "unknown",
  },
];

const useProviderOutletsMock = vi.fn();

vi.mock("@/lib/provider/finder/use-provider-outlets", () => ({
  useProviderOutlets: () => useProviderOutletsMock(),
  PROVIDER_OUTLETS_QUERY_KEY: ["provider-outlets"],
}));

vi.mock("@/app/provider-finder/outletToProvider", () => ({
  mapOutletsToProviders: (outlets: Provider[]) => outlets,
}));

afterEach(() => {
  cleanup();
  mockReplace.mockClear();
  mockSearchParams.forEach((_, key) => mockSearchParams.delete(key));
  useProviderOutletsMock.mockReset();
});

describe("D02 Care and Employment handoffs", () => {
  it("routes Care and Jobs areas to provider-finder with Personal care / Employment filters", () => {
    expect(supportAreaLandingRoutes.Care).toBe("/provider-finder?area=Care");
    expect(supportAreaLandingRoutes.Jobs).toBe("/provider-finder?area=Jobs");
    expect(supportAreaToSupportTypeId("Care")).toBe("personal-care");
    expect(supportAreaToSupportTypeId("Jobs")).toBe("employment");
  });

  it("points Care and Employment entry pages at public discovery with clear link text", () => {
    const careSource = readFileSync(join(process.cwd(), "app/care/page.tsx"), "utf8");
    const employmentSource = readFileSync(
      join(process.cwd(), "app/employment/page.tsx"),
      "utf8",
    );

    expect(careSource).toContain("Find personal care providers");
    expect(careSource).toContain("supportAreaLandingRoutes.Care");
    expect(careSource).toContain("Ask about the pilot");
    expect(careSource).not.toContain('href: "/providers"');

    expect(employmentSource).toContain("Find employment support providers");
    expect(employmentSource).toContain("supportAreaLandingRoutes.Jobs");
    expect(employmentSource).toContain("Ask about the pilot");
    expect(employmentSource).not.toContain("/providers?service=employment");
  });

  it("applies Care area filter, requests the outlets catalog, and shows matches", async () => {
    mockSearchParams.set("area", "Care");
    useProviderOutletsMock.mockReturnValue({
      data: fixtureProviders,
      isLoading: false,
      isError: false,
      error: null,
    });

    const { default: ProviderFinderClient } = await import(
      "@/app/provider-finder/ProviderFinderClient"
    );
    render(<ProviderFinderClient />);

    await waitFor(() => {
      expect(screen.getByTestId("active-support-filter").getAttribute("data-support-type")).toBe(
        "personal-care",
      );
    });

    expect(screen.getByText(/active support filter/i).textContent).toMatch(
      /personal care/i,
    );
    expect(screen.getAllByText("Synthetic Care Co").length).toBeGreaterThan(0);
    expect(screen.queryByText("Synthetic Jobs Co")).toBeNull();
    expect(useProviderOutletsMock).toHaveBeenCalled();
    expect(PROVIDER_OUTLETS_JSON_URL).toBe("/data/provider-outlets.json");
  });

  it("applies Jobs area filter for employment support", async () => {
    mockSearchParams.set("area", "Jobs");
    useProviderOutletsMock.mockReturnValue({
      data: fixtureProviders,
      isLoading: false,
      isError: false,
      error: null,
    });

    const { default: ProviderFinderClient } = await import(
      "@/app/provider-finder/ProviderFinderClient"
    );
    render(<ProviderFinderClient />);

    await waitFor(() => {
      expect(screen.getByTestId("active-support-filter").getAttribute("data-support-type")).toBe(
        "employment",
      );
    });
    expect(screen.getAllByText("Synthetic Jobs Co").length).toBeGreaterThan(0);
    expect(screen.queryByText("Synthetic Care Co")).toBeNull();
  });

  it("shows empty state with refine and help paths when the active filter matches nothing", async () => {
    mockSearchParams.set("area", "Care");
    useProviderOutletsMock.mockReturnValue({
      data: [fixtureProviders[1]],
      isLoading: false,
      isError: false,
      error: null,
    });

    const { default: ProviderFinderClient } = await import(
      "@/app/provider-finder/ProviderFinderClient"
    );
    render(<ProviderFinderClient />);

    await waitFor(() => {
      expect(screen.getByTestId("provider-finder-empty-state")).toBeTruthy();
    });

    const empty = screen.getByTestId("provider-finder-empty-state");
    expect(within(empty).getByText(/no providers found/i)).toBeTruthy();
    expect(within(empty).getByText(/no matches for personal care/i)).toBeTruthy();
    expect(
      within(empty).getByRole("button", { name: /refine search — clear filters/i }),
    ).toBeTruthy();
    expect(
      within(empty).getByRole("link", { name: /ask for human help/i }).getAttribute("href"),
    ).toBe("/contact");

    fireEvent.click(
      within(empty).getByRole("button", { name: /refine search — clear filters/i }),
    );

    expect(mockReplace).toHaveBeenCalledWith("/provider-finder");
    expect(mockSearchParams.get("area")).toBeNull();

    await waitFor(() => {
      expect(screen.queryByTestId("active-support-filter")).toBeNull();
      expect(screen.getAllByText("Synthetic Jobs Co").length).toBeGreaterThan(0);
    });
  });
});

describe("D02 demo provider directory", () => {
  beforeEach(() => {
    useProviderOutletsMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("labels demo cards and profiles, omits introduction actions, and offers public discovery", () => {
    render(<ProviderDirectory />);

    expect(screen.getAllByText(/demo sample/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/request introduction/i)).toBeNull();
    expect(
      screen.getAllByRole("link", { name: /find providers with public discovery/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/unknown — not established by live evidence/i).length).toBeGreaterThan(
      0,
    );

    const source = readFileSync(
      join(process.cwd(), "components/providers/ProviderDirectory.tsx"),
      "utf8",
    );
    expect(source).not.toContain("Request introduction");
    expect(source).not.toContain("/care/request");
  });
});
