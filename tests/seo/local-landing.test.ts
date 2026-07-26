import { describe, expect, it } from "vitest";

import { PROVIDERS } from "@/app/provider-finder/providers";
import { buildLocalBusinessSchemaGraph } from "@/components/seo/LocalBusinessSchema";
import {
  buildLocalLandingCopy,
  buildLocalLandingStaticParams,
  filterProvidersForLocalLanding,
  resolveLocalService,
  titleCaseFromSlug,
  toSeoSlug,
} from "@/lib/seo/local-landing";

describe("programmatic local SEO landing helpers", () => {
  it("slugifies suburbs and services for hyper-local URLs", () => {
    expect(toSeoSlug("Allambie Heights")).toBe("allambie-heights");
    expect(toSeoSlug("Accessible Physiotherapy")).toBe(
      "accessible-physiotherapy",
    );
    expect(titleCaseFromSlug("allambie-heights")).toBe("Allambie Heights");
  });

  it("resolves facility-first service taxonomy", () => {
    const service = resolveLocalService("accessible-physiotherapy");
    expect(service?.label).toBe("Accessible physiotherapy");
    expect(resolveLocalService("not-a-real-service")).toBeNull();
  });

  it("filters providers for suburb + service and soft-falls back by service", () => {
    const exact = filterProvidersForLocalLanding(
      "parramatta",
      "support-coordination",
      PROVIDERS,
    );
    expect(exact.some((p) => p.slug === "harbour-support-co")).toBe(true);

    const soft = filterProvidersForLocalLanding(
      "allambie-heights",
      "accessible-physiotherapy",
      PROVIDERS,
    );
    expect(soft.length).toBeGreaterThan(0);
    expect(
      soft.every((p) =>
        p.categories.some((c) => c.toLowerCase().includes("therapeutic")),
      ),
    ).toBe(true);
  });

  it("builds exact-match metadata copy", () => {
    const service = resolveLocalService("ndis-transport");
    expect(service).not.toBeNull();
    const copy = buildLocalLandingCopy({
      suburbSlug: "bayswater",
      service: service!,
      resultCount: 1,
    });
    expect(copy.title).toContain("Bayswater");
    expect(copy.description.toLowerCase()).toContain("transport");
    expect(copy.description.toLowerCase()).toContain("facilities");
  });

  it("generates static params including seed suburb/service pairs", () => {
    const params = buildLocalLandingStaticParams(PROVIDERS);
    expect(params).toEqual(
      expect.arrayContaining([
        {
          suburb: "allambie-heights",
          service: "accessible-physiotherapy",
        },
      ]),
    );
  });
});

describe("LocalBusinessSchema AggregateRating graph", () => {
  it("emits LocalBusiness with AggregateRating and amenity features", () => {
    const graph = buildLocalBusinessSchemaGraph({
      name: "Harbour Support Co.",
      service: "Support coordination",
      suburb: "Parramatta",
      state: "NSW",
      postcode: "2150",
      url: "https://mapable.com.au/jonathan/profile/harbour-support-co",
      rating: 4.7,
      reviewCount: 128,
      ndisRegistered: true,
      accessibilityFeatures: {
        wheelchairAccess: true,
        stepFreeEntry: true,
      },
    });

    expect(graph["@type"]).toEqual(
      expect.arrayContaining(["LocalBusiness", "MedicalBusiness"]),
    );
    expect(graph.aggregateRating).toMatchObject({
      "@type": "AggregateRating",
      ratingValue: 4.7,
      reviewCount: 128,
      bestRating: 5,
    });
    expect(graph.amenityFeature).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "WheelchairAccessible" }),
      ]),
    );
  });

  it("omits AggregateRating when reviewCount is zero", () => {
    const graph = buildLocalBusinessSchemaGraph({
      name: "New Outlet",
      service: "Personal care",
      suburb: "Geelong",
      url: "https://mapable.com.au/jonathan/profile/new-outlet",
      rating: 5,
      reviewCount: 0,
    });
    expect(graph.aggregateRating).toBeUndefined();
  });
});
