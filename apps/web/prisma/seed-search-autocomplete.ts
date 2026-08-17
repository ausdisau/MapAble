import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SERVICE_CATEGORIES = [
  { slug: "personal-care", name: "Personal care", keywords: ["personal", "care", "daily"] },
  { slug: "accessible-transport", name: "Accessible transport", keywords: ["transport", "wheelchair", "taxi"] },
  { slug: "occupational-therapy", name: "Occupational therapy", keywords: ["ot", "occupational"] },
  { slug: "physiotherapy", name: "Physiotherapy", keywords: ["physio", "physical"] },
  { slug: "support-coordination", name: "Support coordination", keywords: ["coordination", "sc"] },
];

const ACCESSIBILITY = [
  { slug: "wheelchair-accessible", label: "Wheelchair accessible", keywords: ["wheelchair", "access"] },
  { slug: "hoist-trained", label: "Hoist trained", keywords: ["hoist", "transfer"] },
  { slug: "auslan", label: "Auslan", keywords: ["auslan", "deaf"] },
  { slug: "low-sensory", label: "Low sensory", keywords: ["sensory", "quiet"] },
];

const LOCATIONS = [
  { displayName: "Sydney NSW", suburb: "Sydney", state: "NSW" },
  { displayName: "Parramatta NSW", suburb: "Parramatta", state: "NSW", postcode: "2150" },
  { displayName: "Newcastle NSW", suburb: "Newcastle", state: "NSW" },
  { displayName: "Wollongong NSW", suburb: "Wollongong", state: "NSW" },
];

const POPULAR = [
  "Support worker near St Ives",
  "Wheelchair accessible transport tomorrow",
  "OT assessment with NDIS registration",
  "Low sensory community access support",
  "Employment support with transport",
  "personal care",
  "accessible transport",
  "occupational therapy",
  "physiotherapy",
  "support coordination",
  "wheelchair accessible",
  "hoist trained",
  "Auslan",
  "low sensory",
];

const LANGUAGES = [{ slug: "auslan", label: "Auslan", keywords: ["auslan", "sign"] }];

async function main() {
  for (const s of SERVICE_CATEGORIES) {
    await prisma.serviceCategory.upsert({
      where: { slug: s.slug },
      create: s,
      update: { name: s.name, keywords: s.keywords },
    });
  }

  for (const a of ACCESSIBILITY) {
    await prisma.searchAccessibilityFeature.upsert({
      where: { slug: a.slug },
      create: a,
      update: { label: a.label, keywords: a.keywords },
    });
  }

  for (const loc of LOCATIONS) {
    const existing = await prisma.searchableLocation.findFirst({
      where: { displayName: loc.displayName },
    });
    if (!existing) {
      await prisma.searchableLocation.create({ data: loc });
    }
  }

  for (const [i, query] of POPULAR.entries()) {
    await prisma.popularSearch.upsert({
      where: { query_context: { query, context: "all" } },
      create: { query, context: "all", weight: POPULAR.length - i },
      update: { weight: POPULAR.length - i },
    });
  }

  for (const lang of LANGUAGES) {
    await prisma.searchLanguage.upsert({
      where: { slug: lang.slug },
      create: lang,
      update: lang,
    });
  }

  await prisma.providerProfile.upsert({
    where: { slug: "mapable-demo-provider" },
    create: {
      name: "MapAble Demo Provider",
      slug: "mapable-demo-provider",
      suburb: "Parramatta",
      state: "NSW",
      isVerified: true,
      isSearchVisible: true,
    },
    update: {
      isVerified: true,
      isSearchVisible: true,
    },
  });

  const hidden = await prisma.providerProfile.upsert({
    where: { slug: "hidden-unverified-provider" },
    create: {
      name: "Hidden Unverified Provider",
      slug: "hidden-unverified-provider",
      isVerified: false,
      isSearchVisible: false,
    },
    update: {},
  });
  void hidden;

  console.log("Search autocomplete seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
