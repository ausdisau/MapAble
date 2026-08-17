export type AccessGuideStatusKey = "drafted" | "needs_verification" | "planned";

export type AccessGuide = {
  state: string;
  stateSlug: string;
  city: string;
  citySlug: string;
  guideType: string;
  href: string;
  priorityTier: string;
  launchAngle: string;
  mappingMissions: string[];
  status: string;
  statusKey: AccessGuideStatusKey;
};

export const accessGuideDownloads = {
  pdf: "/resources/access-guides/MapAble_Accessibility_Guides_Australia.pdf",
  docx: "/resources/access-guides/MapAble_Accessibility_Guides_Australia.docx",
  rolloutMatrix:
    "/resources/access-guides/MapAble_Accessibility_Guide_Rollout_Matrix.csv",
} as const;

export const accessGuides: AccessGuide[] = [
  {
    "state": "ACT",
    "stateSlug": "act",
    "city": "Canberra",
    "citySlug": "canberra-accessibility-guide",
    "guideType": "Capital",
    "href": "/guides/act/canberra-accessibility-guide",
    "priorityTier": "Capital launch",
    "launchAngle": "A compact capital where accessible outings often depend on linking bus, light rail, museums, civic precincts and lakeside paths into one predictable day.",
    "mappingMissions": [
      "Map the National Triangle accessible entrances and toilets.",
      "Verify light rail to museum and civic precinct routes.",
      "Create a sensory-friendly Canberra half-day itinerary."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Sydney",
    "citySlug": "sydney-accessibility-guide",
    "guideType": "Capital",
    "href": "/guides/nsw/sydney-accessibility-guide",
    "priorityTier": "Capital launch",
    "launchAngle": "Australia\u2019s largest visitor city needs a guide that separates broad accessibility claims from the real details: lifts, gradients, wharves, station exits, toilets, crowds and event-day detours.",
    "mappingMissions": [
      "Audit Circular Quay to Opera House and Royal Botanic Garden paths.",
      "Map step-free routes around Central, Town Hall and Barangaroo.",
      "Create a beach-access mini-guide covering mats, beach wheelchairs and nearby toilets."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Melbourne",
    "citySlug": "melbourne-accessibility-guide",
    "guideType": "Capital",
    "href": "/guides/vic/melbourne-accessibility-guide",
    "priorityTier": "Capital launch",
    "launchAngle": "Melbourne needs an access guide that explains the practical difference between trains, buses, trams, level-access stops, laneways, event crowds and CBD mobility maps.",
    "mappingMissions": [
      "Build a CBD mobility loop from Southern Cross to Federation Square.",
      "Verify accessible laneway dining routes.",
      "Map quiet exits and low-crowd alternatives around major venues."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Brisbane",
    "citySlug": "brisbane-accessibility-guide",
    "guideType": "Capital",
    "href": "/guides/qld/brisbane-accessibility-guide",
    "priorityTier": "Capital launch",
    "launchAngle": "A river city guide should connect trains, buses, CityCat-style river travel, bridges, South Bank, hospitals and event venues with heat-aware access planning.",
    "mappingMissions": [
      "Create a South Bank accessible day route.",
      "Map Roma Street and CBD interchange access details.",
      "Verify riverfront access with heat, shade and seating notes."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "state": "SA",
    "stateSlug": "sa",
    "city": "Adelaide",
    "citySlug": "adelaide-accessibility-guide",
    "guideType": "Capital",
    "href": "/guides/sa/adelaide-accessibility-guide",
    "priorityTier": "Capital launch",
    "launchAngle": "Adelaide\u2019s grid, parklands and festival calendar make it a strong guide for cultural access, quiet routes, tram/train/bus links and regional visitor planning.",
    "mappingMissions": [
      "Map an Adelaide Festival access route.",
      "Verify Rundle Mall and North Terrace accessible entries.",
      "Create a quiet Adelaide city rest-stop list."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "state": "WA",
    "stateSlug": "wa",
    "city": "Perth",
    "citySlug": "perth-accessibility-guide",
    "guideType": "Capital",
    "href": "/guides/wa/perth-accessibility-guide",
    "priorityTier": "Capital launch",
    "launchAngle": "Perth requires a guide that links long-distance city travel, rail stations, riverfront areas, beaches, hospitals and accessible parking into realistic itineraries.",
    "mappingMissions": [
      "Create a Perth CBD to Elizabeth Quay access loop.",
      "Verify Optus Stadium and event-day transport access.",
      "Map accessible beach infrastructure across metro beaches."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "state": "TAS",
    "stateSlug": "tas",
    "city": "Hobart",
    "citySlug": "hobart-accessibility-guide",
    "guideType": "Capital",
    "href": "/guides/tas/hobart-accessibility-guide",
    "priorityTier": "Capital launch",
    "launchAngle": "Hobart\u2019s hills, heritage buildings, waterfront and compact visitor core make it a guide where gradients and entrance details matter as much as destination lists.",
    "mappingMissions": [
      "Map Hobart waterfront to Salamanca step-free options.",
      "Create a hills and gradients warning layer for the CBD.",
      "Verify museum, market and ferry-adjacent access details."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "state": "NT",
    "stateSlug": "nt",
    "city": "Darwin",
    "citySlug": "darwin-accessibility-guide",
    "guideType": "Capital",
    "href": "/guides/nt/darwin-accessibility-guide",
    "priorityTier": "Capital launch",
    "launchAngle": "Darwin needs a heat-aware, wet-season-aware guide that connects buses, accessible taxis, waterfront spaces, cultural venues, parks and regional gateways.",
    "mappingMissions": [
      "Create a Darwin Waterfront access and shade route.",
      "Verify CBD to waterfront path surfaces and rest points.",
      "Build a Top End visitor access checklist for heat, toilets and transport."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Newcastle",
    "citySlug": "newcastle-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/nsw/newcastle-accessibility-guide",
    "priorityTier": "Tier 1",
    "launchAngle": "Beach, light rail, hospitals and waterfront access",
    "mappingMissions": [
      "Verify beach mats/wheelchairs, light rail stops, waterfront toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Wollongong",
    "citySlug": "wollongong-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/nsw/wollongong-accessibility-guide",
    "priorityTier": "Tier 1",
    "launchAngle": "Coastal paths, university, hospital and beach access",
    "mappingMissions": [
      "Map coastal path gradients, accessible beaches, station-to-hospital routes"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Central Coast / Gosford",
    "citySlug": "central-coast-accessibility-guide",
    "guideType": "Regional area",
    "href": "/guides/nsw/central-coast-accessibility-guide",
    "priorityTier": "Tier 1",
    "launchAngle": "Train-linked day trips, beaches and health precincts",
    "mappingMissions": [
      "Verify station access, accessible beaches, parking and toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Coffs Harbour",
    "citySlug": "coffs-harbour-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/nsw/coffs-harbour-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Coastal tourism and regional services",
    "mappingMissions": [
      "Map beach access, marina routes, accessible accommodation cluster"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Port Macquarie",
    "citySlug": "port-macquarie-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/nsw/port-macquarie-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Accessible coastal tourism and health services",
    "mappingMissions": [
      "Verify coastal walk alternatives, accessible toilets, hospital access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Tamworth",
    "citySlug": "tamworth-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/nsw/tamworth-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Events, country music venues and regional transport",
    "mappingMissions": [
      "Audit event venues, accommodation, accessible parking"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Dubbo",
    "citySlug": "dubbo-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/nsw/dubbo-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Zoo, health services and western NSW hub",
    "mappingMissions": [
      "Verify zoo access, accessible taxis, hospital precinct"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Orange",
    "citySlug": "orange-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/nsw/orange-accessibility-guide",
    "priorityTier": "Tier 3",
    "launchAngle": "Food, wine, hospital and heritage precincts",
    "mappingMissions": [
      "Map accessible dining, gradients, toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Wagga Wagga",
    "citySlug": "wagga-wagga-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/nsw/wagga-wagga-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Riverina health, education and transport hub",
    "mappingMissions": [
      "Verify station, hospital, civic precinct and river paths"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Albury",
    "citySlug": "albury-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/nsw/albury-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Cross-border access with Wodonga",
    "mappingMissions": [
      "Map rail/coach, river paths, hospital and civic routes"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Bathurst",
    "citySlug": "bathurst-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/nsw/bathurst-accessibility-guide",
    "priorityTier": "Tier 3",
    "launchAngle": "Events, university and heritage access",
    "mappingMissions": [
      "Audit event venues, heritage entrances, toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Lismore / Byron Bay",
    "citySlug": "lismore-byron-accessibility-guide",
    "guideType": "Regional area",
    "href": "/guides/nsw/lismore-byron-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Flood-aware services and accessible tourism",
    "mappingMissions": [
      "Map evacuation-aware facilities, beach access, transport gaps"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Geelong",
    "citySlug": "geelong-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/vic/geelong-accessibility-guide",
    "priorityTier": "Tier 1",
    "launchAngle": "Waterfront, hospitals and Bellarine gateway",
    "mappingMissions": [
      "Verify waterfront paths, station access, beach infrastructure"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Ballarat",
    "citySlug": "ballarat-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/vic/ballarat-accessibility-guide",
    "priorityTier": "Tier 1",
    "launchAngle": "Heritage, events and regional rail access",
    "mappingMissions": [
      "Map gradients, heritage entries, station-to-CBD routes"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Bendigo",
    "citySlug": "bendigo-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/vic/bendigo-accessibility-guide",
    "priorityTier": "Tier 1",
    "launchAngle": "Arts, hospital, heritage and tram tourism",
    "mappingMissions": [
      "Verify gallery/heritage access, hospital routes, toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Shepparton",
    "citySlug": "shepparton-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/vic/shepparton-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Health, multicultural services and regional transport",
    "mappingMissions": [
      "Map hospital access, civic services, public toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Mildura",
    "citySlug": "mildura-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/vic/mildura-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Murray River tourism and regional service hub",
    "mappingMissions": [
      "Verify riverfront access, heat-aware routes, accessible taxis"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Warrnambool",
    "citySlug": "warrnambool-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/vic/warrnambool-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Coastal tourism and regional health",
    "mappingMissions": [
      "Map beach lookouts, station access, hospital routes"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Traralgon / Latrobe Valley",
    "citySlug": "latrobe-valley-accessibility-guide",
    "guideType": "Regional area",
    "href": "/guides/vic/latrobe-valley-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Industry, services and Gippsland access",
    "mappingMissions": [
      "Audit intertown transport, health precincts, civic centres"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Wangaratta",
    "citySlug": "wangaratta-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/vic/wangaratta-accessibility-guide",
    "priorityTier": "Tier 3",
    "launchAngle": "Rail-linked regional town and health services",
    "mappingMissions": [
      "Verify station, hospital and accessible toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Wodonga",
    "citySlug": "wodonga-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/vic/wodonga-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Cross-border access with Albury",
    "mappingMissions": [
      "Map regional transport, river/civic routes, hospital access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Gold Coast",
    "citySlug": "gold-coast-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/qld/gold-coast-accessibility-guide",
    "priorityTier": "Tier 1",
    "launchAngle": "Beaches, light rail, theme parks and events",
    "mappingMissions": [
      "Verify beach mats, tram stops, accessible accommodation and toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Sunshine Coast",
    "citySlug": "sunshine-coast-accessibility-guide",
    "guideType": "Regional area",
    "href": "/guides/qld/sunshine-coast-accessibility-guide",
    "priorityTier": "Tier 1",
    "launchAngle": "Beaches, hinterland and health services",
    "mappingMissions": [
      "Map beach access, shade, toilets and transport gaps"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Cairns",
    "citySlug": "cairns-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/qld/cairns-accessibility-guide",
    "priorityTier": "Tier 1",
    "launchAngle": "Reef gateway, heat-aware tourism and hospital access",
    "mappingMissions": [
      "Verify marina access, tour operators, accessible taxis"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Townsville",
    "citySlug": "townsville-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/qld/townsville-accessibility-guide",
    "priorityTier": "Tier 1",
    "launchAngle": "Strand, Magnetic Island gateway and regional health",
    "mappingMissions": [
      "Map ferry access, waterfront paths, hospital and CBD"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Toowoomba",
    "citySlug": "toowoomba-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/qld/toowoomba-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Gardens, events, hills and health services",
    "mappingMissions": [
      "Verify gradients, parks, event venues and toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Mackay",
    "citySlug": "mackay-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/qld/mackay-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Regional services, beaches and mining-region access",
    "mappingMissions": [
      "Map bus links, beaches, hospital and civic spaces"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Rockhampton",
    "citySlug": "rockhampton-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/qld/rockhampton-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Beef capital, riverfront and health services",
    "mappingMissions": [
      "Verify riverfront, showgrounds, hospital routes"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Bundaberg",
    "citySlug": "bundaberg-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/qld/bundaberg-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Tourism, health and coastal access",
    "mappingMissions": [
      "Map accessible beaches, turtle tourism, hospital access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Hervey Bay",
    "citySlug": "hervey-bay-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/qld/hervey-bay-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Whale watching, foreshore and Fraser Coast access",
    "mappingMissions": [
      "Verify tour operators, foreshore paths, accessible toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Mount Isa",
    "citySlug": "mount-isa-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/qld/mount-isa-accessibility-guide",
    "priorityTier": "Tier 3",
    "launchAngle": "Remote services and heat-aware access",
    "mappingMissions": [
      "Map health precinct, taxis, shade and public toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "SA",
    "stateSlug": "sa",
    "city": "Mount Gambier",
    "citySlug": "mount-gambier-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/sa/mount-gambier-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Limestone Coast tourism and health services",
    "mappingMissions": [
      "Verify sinkhole/garden access, toilets, hospital routes"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "SA",
    "stateSlug": "sa",
    "city": "Whyalla",
    "citySlug": "whyalla-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/sa/whyalla-accessibility-guide",
    "priorityTier": "Tier 3",
    "launchAngle": "Spencer Gulf access and regional services",
    "mappingMissions": [
      "Map foreshore, hospital, civic services"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "SA",
    "stateSlug": "sa",
    "city": "Port Lincoln",
    "citySlug": "port-lincoln-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/sa/port-lincoln-accessibility-guide",
    "priorityTier": "Tier 3",
    "launchAngle": "Eyre Peninsula tourism and coastal access",
    "mappingMissions": [
      "Verify marina, foreshore and accommodation access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "SA",
    "stateSlug": "sa",
    "city": "Murray Bridge",
    "citySlug": "murray-bridge-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/sa/murray-bridge-accessibility-guide",
    "priorityTier": "Tier 3",
    "launchAngle": "Murray River routes and regional services",
    "mappingMissions": [
      "Map riverfront, toilets, civic access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "SA",
    "stateSlug": "sa",
    "city": "Victor Harbor",
    "citySlug": "victor-harbor-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/sa/victor-harbor-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Coastal day trips and older-traveller access",
    "mappingMissions": [
      "Verify foreshore, causeway, toilets and parking"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "SA",
    "stateSlug": "sa",
    "city": "Port Augusta",
    "citySlug": "port-augusta-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/sa/port-augusta-accessibility-guide",
    "priorityTier": "Tier 3",
    "launchAngle": "Gateway to north SA and remote travel",
    "mappingMissions": [
      "Map transport, hospital and rest facilities"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "WA",
    "stateSlug": "wa",
    "city": "Bunbury",
    "citySlug": "bunbury-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/wa/bunbury-accessibility-guide",
    "priorityTier": "Tier 1",
    "launchAngle": "South West hub, beaches and health services",
    "mappingMissions": [
      "Verify foreshore, station/bus, hospital, beach access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "WA",
    "stateSlug": "wa",
    "city": "Busselton",
    "citySlug": "busselton-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/wa/busselton-accessibility-guide",
    "priorityTier": "Tier 1",
    "launchAngle": "Jetty tourism and beach access",
    "mappingMissions": [
      "Map jetty access, beach equipment, accessible toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "WA",
    "stateSlug": "wa",
    "city": "Albany",
    "citySlug": "albany-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/wa/albany-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Heritage, coast and Great Southern services",
    "mappingMissions": [
      "Verify lookouts, foreshore paths, hospital access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "WA",
    "stateSlug": "wa",
    "city": "Geraldton",
    "citySlug": "geraldton-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/wa/geraldton-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Mid West coastal access and health services",
    "mappingMissions": [
      "Map foreshore, civic precinct, accessible taxis"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "WA",
    "stateSlug": "wa",
    "city": "Kalgoorlie",
    "citySlug": "kalgoorlie-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/wa/kalgoorlie-accessibility-guide",
    "priorityTier": "Tier 3",
    "launchAngle": "Goldfields access and regional services",
    "mappingMissions": [
      "Verify airport, hospital, accommodation and civic routes"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "WA",
    "stateSlug": "wa",
    "city": "Broome",
    "citySlug": "broome-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/wa/broome-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Accessible tourism, heat and seasonal access",
    "mappingMissions": [
      "Map Cable Beach access, taxis, shade and toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "WA",
    "stateSlug": "wa",
    "city": "Karratha",
    "citySlug": "karratha-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/wa/karratha-accessibility-guide",
    "priorityTier": "Tier 3",
    "launchAngle": "Pilbara services and heat-aware access",
    "mappingMissions": [
      "Verify health services, taxis, civic facilities"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "WA",
    "stateSlug": "wa",
    "city": "Margaret River",
    "citySlug": "margaret-river-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/wa/margaret-river-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Accessible food, wine and nature tourism",
    "mappingMissions": [
      "Map wineries, toilets, beach access and transport gaps"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "TAS",
    "stateSlug": "tas",
    "city": "Launceston",
    "citySlug": "launceston-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/tas/launceston-accessibility-guide",
    "priorityTier": "Tier 1",
    "launchAngle": "Heritage, parks and northern Tasmania services",
    "mappingMissions": [
      "Verify gradients, Cataract Gorge options, bus access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "TAS",
    "stateSlug": "tas",
    "city": "Devonport",
    "citySlug": "devonport-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/tas/devonport-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Ferry gateway and north-west services",
    "mappingMissions": [
      "Map ferry terminal, foreshore, toilets and transport"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "TAS",
    "stateSlug": "tas",
    "city": "Burnie",
    "citySlug": "burnie-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/tas/burnie-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "North-west health and coastal access",
    "mappingMissions": [
      "Verify buses, foreshore and civic facilities"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "TAS",
    "stateSlug": "tas",
    "city": "Queenstown / West Coast",
    "citySlug": "west-coast-accessibility-guide",
    "guideType": "Regional area",
    "href": "/guides/tas/west-coast-accessibility-guide",
    "priorityTier": "Tier 3",
    "launchAngle": "Remote tourism and heritage rail access",
    "mappingMissions": [
      "Map gradients, transport gaps, accommodation access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NT",
    "stateSlug": "nt",
    "city": "Alice Springs",
    "citySlug": "alice-springs-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/nt/alice-springs-accessibility-guide",
    "priorityTier": "Tier 1",
    "launchAngle": "Central Australia access, heat and remote services",
    "mappingMissions": [
      "Verify taxis, bus routes, cultural venues and health services"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NT",
    "stateSlug": "nt",
    "city": "Katherine",
    "citySlug": "katherine-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/nt/katherine-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Regional services and national park gateway",
    "mappingMissions": [
      "Map hospital, civic facilities, tour operator access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NT",
    "stateSlug": "nt",
    "city": "Palmerston",
    "citySlug": "palmerston-accessibility-guide",
    "guideType": "Regional city",
    "href": "/guides/nt/palmerston-accessibility-guide",
    "priorityTier": "Tier 2",
    "launchAngle": "Darwin-region services and transport links",
    "mappingMissions": [
      "Verify bus stops, civic precinct, parks and toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "state": "NT",
    "stateSlug": "nt",
    "city": "Tennant Creek",
    "citySlug": "tennant-creek-accessibility-guide",
    "guideType": "Regional town",
    "href": "/guides/nt/tennant-creek-accessibility-guide",
    "priorityTier": "Tier 3",
    "launchAngle": "Remote access and essential services",
    "mappingMissions": [
      "Map clinic, transport, toilets and accommodation"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  }
];

export function getCapitalAccessGuides(): AccessGuide[] {
  return accessGuides.filter((g) => g.priorityTier === "Capital launch");
}

export function getAccessGuideBySlug(
  stateSlug: string,
  citySlug: string,
): AccessGuide | undefined {
  return accessGuides.find(
    (g) => g.stateSlug === stateSlug && g.citySlug === citySlug,
  );
}

export function getAccessGuidesByTier(tier: string): AccessGuide[] {
  return accessGuides.filter((g) => g.priorityTier === tier);
}
