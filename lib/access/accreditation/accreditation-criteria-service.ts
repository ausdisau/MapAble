export interface AccreditationCriterionDef {
  code: string;
  domain: string;
  title: string;
  weight: number;
}

export const ACCREDITATION_CRITERIA: AccreditationCriterionDef[] = [
  { code: "P-1", domain: "Path of Travel External", title: "Accessible Parking", weight: 6 },
  { code: "P-2", domain: "Path of Travel External", title: "Public Transport / Drop-off", weight: 4 },
  { code: "P-3", domain: "Path of Travel External", title: "Path to Entrance", weight: 8 },
  { code: "E-1", domain: "Entry & Exit", title: "Main Entrance", weight: 10 },
  { code: "E-2", domain: "Entry & Exit", title: "Doorway", weight: 8 },
  { code: "I-1", domain: "Interior Layout & Movement", title: "Internal Corridors", weight: 6 },
  { code: "I-2", domain: "Interior Layout & Movement", title: "Internal Ramps / Lifts", weight: 8 },
  { code: "I-3", domain: "Interior Layout & Movement", title: "Service Counter", weight: 5 },
  { code: "I-4", domain: "Interior Layout & Movement", title: "Seating & Furniture", weight: 5 },
  { code: "A-1", domain: "Amenities Toilets", title: "Accessible Toilet", weight: 10 },
  { code: "A-2", domain: "Amenities Toilets", title: "Ambulant Toilets", weight: 5 },
  { code: "S-1", domain: "Information & Sensory", title: "Signage", weight: 5 },
  { code: "S-2", domain: "Information & Sensory", title: "Hearing", weight: 4 },
  { code: "S-3", domain: "Information & Sensory", title: "Lighting & Acoustics", weight: 4 },
  { code: "S-4", domain: "Information & Sensory", title: "Online Information", weight: 2 },
  { code: "T-1", domain: "Staff & Services", title: "Staff Training", weight: 3 },
  { code: "T-2", domain: "Staff & Services", title: "Service", weight: 3 },
  {
    code: "T-3",
    domain: "Staff & Services",
    title: "Emergency / evacuation information",
    weight: 4,
  },
];

export const CRITERIA_TOTAL_WEIGHT = ACCREDITATION_CRITERIA.reduce(
  (s, c) => s + c.weight,
  0
);
