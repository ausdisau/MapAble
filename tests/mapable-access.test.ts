import { describe, expect, it } from "vitest";

import {
  calculateAccreditationTotal,
  tierFromTotalScore,
  verifyCriteriaTotalWeight,
  weightedScoreForLevel,
} from "@/lib/access-accreditation/accreditation-scoring-service";
import { parseAccessibleLocationsGeoJson } from "@/lib/access-import/geojson-parser-service";
import { findDuplicatePlaceCandidates } from "@/lib/access-import/import-deduplication-service";
import { parseKmlXml, sanitizeKmlDescription } from "@/lib/access-import/kml-parser-service";
import { confidenceLabel } from "@/lib/access-map/access-confidence-service";
import {
  canEditPlace,
  canSuggestPlace,
} from "@/lib/access-map/access-place-policy";
import { scanReviewForModerationFlags } from "@/lib/access-moderation/content-safety-rules";
import { rankAccessPlaces } from "@/lib/access-search/access-ranking-service";
import { createAccessPlaceSchema } from "@/types/access-map";

describe("access place validation", () => {
  it("validates add place payload", () => {
    const r = createAccessPlaceSchema.safeParse({
      name: "Test Café",
      latitude: -33.87,
      longitude: 151.2,
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid coordinates", () => {
    const r = createAccessPlaceSchema.safeParse({
      name: "X",
      latitude: 200,
      longitude: 0,
    });
    expect(r.success).toBe(false);
  });
});

describe("access place policy", () => {
  it("blocks anonymous edit", () => {
    expect(canEditPlace(null)).toBe(false);
    expect(canSuggestPlace(null)).toBe(false);
  });
});

describe("confidence labels", () => {
  it("uses accreditation tier for mapable_accredited", () => {
    expect(confidenceLabel("mapable_accredited", "bronze")).toBe(
      "MapAble Accredited: Bronze"
    );
    expect(confidenceLabel("mapable_accredited", "silver")).toBe(
      "MapAble Accredited: Silver"
    );
    expect(confidenceLabel("mapable_accredited", "gold")).toBe(
      "MapAble Accredited: Gold"
    );
  });
});

describe("accreditation scoring", () => {
  it("has 18 criteria with weights summing to 100 (normalized scoring scale)", () => {
    expect(verifyCriteriaTotalWeight()).toBe(true);
  });

  it("calculates gold tier at 90+", () => {
    const scores = [
      { criterionCode: "P-1", level: "gold" as const },
      { criterionCode: "P-2", level: "gold" as const },
      { criterionCode: "P-3", level: "gold" as const },
      { criterionCode: "E-1", level: "gold" as const },
      { criterionCode: "E-2", level: "gold" as const },
      { criterionCode: "I-1", level: "gold" as const },
      { criterionCode: "I-2", level: "gold" as const },
      { criterionCode: "I-3", level: "gold" as const },
      { criterionCode: "I-4", level: "gold" as const },
      { criterionCode: "A-1", level: "gold" as const },
      { criterionCode: "A-2", level: "gold" as const },
      { criterionCode: "S-1", level: "gold" as const },
      { criterionCode: "S-2", level: "gold" as const },
      { criterionCode: "S-3", level: "gold" as const },
      { criterionCode: "S-4", level: "gold" as const },
      { criterionCode: "T-1", level: "gold" as const },
      { criterionCode: "T-2", level: "gold" as const },
      { criterionCode: "T-3", level: "gold" as const },
    ];
    const total = calculateAccreditationTotal(scores);
    expect(total).toBe(100);
    expect(tierFromTotalScore(total)).toBe("gold");
    expect(verifyCriteriaTotalWeight()).toBe(true);
  });

  it("bronze band 40-69.99", () => {
    expect(tierFromTotalScore(40)).toBe("bronze");
    expect(tierFromTotalScore(39.9)).toBe("not_accredited");
  });

  it("applies multipliers", () => {
    expect(weightedScoreForLevel("silver", 10)).toBe(7);
    expect(weightedScoreForLevel("bronze", 10)).toBe(4);
    expect(weightedScoreForLevel("fail", 10)).toBe(0);
  });
});

describe("kml parser", () => {
  it("parses placemark", () => {
    const xml = `<?xml version="1.0"?>
    <kml><Document>
      <Placemark>
        <name>Cafe Test</name>
        <description><![CDATA[<b>Hi</b>]]></description>
        <Point><coordinates>151.2,-33.87,0</coordinates></Point>
      </Placemark>
    </Document></kml>`;
    const doc = parseKmlXml(xml);
    expect(doc.placemarks).toHaveLength(1);
    expect(doc.placemarks[0].name).toBe("Cafe Test");
    expect(doc.placemarks[0].latitude).toBeCloseTo(-33.87);
  });

  it("detects network link", () => {
    const xml = `<kml><NetworkLink><Link><href>https://example.com/x.kml</href></Link></NetworkLink></kml>`;
    expect(parseKmlXml(xml).networkLinkHref).toContain("example.com");
  });

  it("decodes XML entities in network link href", () => {
    const xml = `<kml><NetworkLink><Link><href>https://example.com/x.kml?a=1&amp;b=2</href></Link></NetworkLink></kml>`;
    expect(parseKmlXml(xml).networkLinkHref).toBe(
      "https://example.com/x.kml?a=1&b=2"
    );
  });

  it("sanitizes description", () => {
    expect(sanitizeKmlDescription("<script>x</script>hello")).not.toContain("<script");
  });
});

describe("geojson parser", () => {
  it("parses feature collection", () => {
    const geo = JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Beach Access" },
          geometry: { type: "Point", coordinates: [150.1, -33.5] },
        },
      ],
    });
    const { placemarks } = parseAccessibleLocationsGeoJson(geo);
    expect(placemarks).toHaveLength(1);
    expect(placemarks[0].name).toBe("Beach Access");
  });
});

describe("content safety", () => {
  it("flags phone and legal claims", () => {
    const flags = scanReviewForModerationFlags(
      "Call 0412 345 678 — this place is DDA certified guaranteed accessible"
    );
    expect(flags.length).toBeGreaterThan(0);
  });
});

describe("ranking", () => {
  it("does not boost sponsored field (none exists)", () => {
    const places = [
      {
        id: "a",
        name: "Alpha",
        category: "shop",
        suburb: null,
        updatedAt: new Date(),
        confidence: "unknown",
        location: { latitude: -33.87, longitude: 151.2 },
        ratingSummaries: [],
        accreditationAssessments: [],
        _count: { reviews: 0 },
      },
    ];
    const ranked = rankAccessPlaces(places, {
      sort: "relevance",
      limit: 10,
      features: undefined,
    });
    expect(ranked[0].place.id).toBe("a");
  });
});

describe("deduplication", () => {
  it("exports function", () => {
    expect(typeof findDuplicatePlaceCandidates).toBe("function");
  });
});
