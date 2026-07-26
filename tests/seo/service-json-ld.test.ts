import { describe, expect, it } from "vitest";

import {
  AUSTRALIAN_DISABILITY_LTD_ABN,
  AUSTRALIAN_DISABILITY_LTD_LEGAL_NAME,
  buildPublicJsonLd,
} from "@/lib/config/json-ld";
import { buildProviderProfileJsonLd } from "@/lib/seo/provider-profile-json-ld";
import {
  buildProviderLocalBusinessJsonLd,
  buildProviderServiceJsonLd,
} from "@/lib/seo/service-json-ld";

describe("Organization JSON-LD for Australian Disability Ltd", () => {
  it("includes legal name, ABN, logo, and MapAble alternateName", () => {
    const { organization, website } = buildPublicJsonLd({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://mapable.com.au",
    } as NodeJS.ProcessEnv);

    expect(organization.name).toBe(AUSTRALIAN_DISABILITY_LTD_LEGAL_NAME);
    expect(organization.legalName).toBe(AUSTRALIAN_DISABILITY_LTD_LEGAL_NAME);
    expect(organization.alternateName).toEqual(
      expect.arrayContaining(["MapAble", "MapAble Australia"]),
    );
    expect(organization.identifier).toMatchObject({
      "@type": "PropertyValue",
      name: "ABN",
      value: AUSTRALIAN_DISABILITY_LTD_ABN,
    });
    expect(organization.taxID).toBe("55641613541");
    expect(organization.logo).toMatchObject({
      "@type": "ImageObject",
      url: "https://mapable.com.au/brand/mapable-logo.png",
    });
    expect(website.name).toBe("MapAble Australia");
    expect(website.inLanguage).toBe("en-AU");
  });
});

describe("Provider LocalBusiness / Service JSON-LD", () => {
  it("builds LocalBusiness with AU address and NDIS flag", () => {
    const jsonLd = buildProviderLocalBusinessJsonLd({
      name: "Harbour Support Co.",
      url: "https://mapable.com.au/jonathan/profile/harbour-support-co",
      suburb: "Parramatta",
      state: "NSW",
      postcode: "2150",
      latitude: -33.815,
      longitude: 151.001,
      categories: ["Support Coordination"],
      ndisRegistered: true,
      abn: "12 345 678 901",
    });

    expect(jsonLd["@type"]).toEqual(
      expect.arrayContaining(["LocalBusiness", "MedicalBusiness"]),
    );
    expect(jsonLd.address).toMatchObject({
      "@type": "PostalAddress",
      addressLocality: "Parramatta",
      addressRegion: "NSW",
      postalCode: "2150",
      addressCountry: "AU",
    });
    expect(jsonLd.geo).toMatchObject({
      latitude: -33.815,
      longitude: 151.001,
    });
    expect(jsonLd.taxID).toBe("12345678901");
    expect(jsonLd.additionalProperty).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "ndisRegistered",
          value: "true",
        }),
      ]),
    );
  });

  it("builds Service schema linked to the provider", () => {
    const jsonLd = buildProviderServiceJsonLd({
      name: "Therapeutic Supports",
      url: "https://mapable.com.au/jonathan/profile/bright-steps-therapy",
      serviceType: ["Therapeutic Supports"],
      providerName: "Bright Steps Therapy",
      providerUrl: "https://mapable.com.au/jonathan/profile/bright-steps-therapy",
      ndisRegistered: true,
    });

    expect(jsonLd["@type"]).toBe("Service");
    expect(jsonLd.provider).toMatchObject({
      "@type": "LocalBusiness",
      name: "Bright Steps Therapy",
    });
    expect(jsonLd.areaServed).toMatchObject({
      "@type": "Country",
      name: "Australia",
    });
  });

  it("builds profile graph from a Provider record", () => {
    const graph = buildProviderProfileJsonLd(
      {
        id: "prov_001",
        slug: "harbour-support-co",
        name: "Harbour Support Co.",
        suburb: "Parramatta",
        state: "NSW",
        postcode: "2150",
        distanceKm: 4.2,
        rating: 4.7,
        reviewCount: 128,
        registered: true,
        categories: ["Support Coordination", "Community Participation"],
        supports: ["In-person", "Telehealth"],
        latitude: -33.815,
        longitude: 151.001,
      },
      {
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://mapable.com.au",
      } as NodeJS.ProcessEnv,
    );

    expect(graph).toHaveLength(2);
    expect(graph[0].url).toBe(
      "https://mapable.com.au/jonathan/profile/harbour-support-co",
    );
    expect(graph[1]["@type"]).toBe("Service");
  });
});
