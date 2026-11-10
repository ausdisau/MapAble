/**
 * Editorial source of truth for the proposed AI-Enabled Care & Support
 * Community of Practice. Public copy must never imply a launched program,
 * an agreed partner, verified research impact, or an open membership process.
 */
export const proposal = {
  id: "ai-enabled-care-community-of-practice",
  revision: "2026-11-11",
  stage: "concept_proposal",
  statusLabel: "Concept proposal · For discussion only",
  organisation: "Australian Disability Ltd",
  platform: "MapAble",
  projectName: "Accessible Futures",
  fullName: "AI-Enabled Care & Support Community of Practice",
  heroEyebrow: "An invitation to shape a better care economy",
  heroTitle: "Care is a human right. Our technology should begin there.",
  heroDescription:
    "A proposal to connect people with disability, support workers, providers, researchers, businesses and public institutions around one question: how can AI make care more reliable and accessible without taking control away from the people who rely on it?",
  mission:
    "Not another technology showcase. A shared place to ask difficult questions, test practical ideas and publish evidence people can challenge.",
  partnershipDisclaimer:
    "This is a proposal by Australian Disability Ltd. The Community of Practice is not yet established. Organisations mentioned as sources or potential collaborators have not endorsed, joined, funded or partnered with this initiative.",
  pilotDisclaimer:
    "No pilot, study recruitment, shared dataset, formal research agreement or public service is being offered through this page.",
  lastReviewed: "11 November 2026",
  contactAddress: "info@ausdis.au",
  contactSubject: "Accessible Futures AI and Care Community of Practice — proposal discussion"
} as const;

export type Stakeholder = {
  id: string;
  title: string;
  contribution: string;
};

export const stakeholders: readonly Stakeholder[] = [
  { id: "participants", title: "People with disability", contribution: "Set priorities, define meaningful outcomes, exercise veto and review rights." },
  { id: "workforce", title: "Support workers and carers", contribution: "Identify workforce pressures, skills needs and safe uses of technology." },
  { id: "providers", title: "Care and support providers", contribution: "Bring practical service challenges and test proposed workflows." },
  { id: "business", title: "Businesses and technology developers", contribution: "Contribute interoperable tools, assistive technology and responsible engineering." },
  { id: "research", title: "Universities and research foundations", contribution: "Design studies, oversee ethics, evaluate evidence and share learning." },
  { id: "government", title: "Government and public agencies", contribution: "Contribute public-policy context and standards within their formal mandates." }
];

export const researchThemes = [
  {
    number: "01",
    title: "Care that follows the person",
    description:
      "Investigate continuity when support shifts change, transport fails or inaccessible environments disrupt everyday participation.",
    measure: "Participant-reported choice, disruption recovery, safe continuity and participation."
  },
  {
    number: "02",
    title: "AI that explains itself",
    description:
      "Test evidence-grounded decision support, accessible multimodal communication and transparent uncertainty—not unreviewable automated authority.",
    measure: "Evidence accuracy, human correction, accessibility and misuse resistance."
  },
  {
    number: "03",
    title: "A workforce with a voice",
    description:
      "Understand how AI affects care workers' time, autonomy, training, workload, safety and professional relationships.",
    measure: "Worker-reported conditions, skills confidence and coordination burden."
  },
  {
    number: "04",
    title: "Data with dignity",
    description:
      "Develop reproducible synthetic-data methods, consent-bound research governance and cross-country comparisons without indiscriminate data extraction.",
    measure: "Consent withdrawal, privacy protection, independent review and source provenance."
  }
] as const;

export const foundingPrinciples = [
  "People with disability and workers must be paid contributors and research decision-makers.",
  "No model makes clinical, safeguarding, funding, worker-screening or care-assignment decisions.",
  "Communication access, including AAC, is a prerequisite—not an optional accommodation.",
  "Participation, research consent and any data-sharing permissions are separate and revocable.",
  "Publish failures, uncertainty and workforce impacts alongside positive results.",
  "Keep a practical non-AI route and a named human escalation path."
] as const;

export const firstPilot = {
  eyebrow: "A possible first research question",
  title: "When a support worker cancels, what happens to the person's day?",
  description:
    "A support shift changes. Accessible transport may need to change too. Appointments, work and community participation can become harder to sustain. Could a human-approved coordination assistant make recovery easier while leaving the final choices with the participant?",
  scope:
    "Begin with synthetic scenarios and accessible co-design. Compare existing coordination with a bounded AI-assisted alternative. Any later human research would require agreements, ethics review, governance and separate consent.",
  nonGoals:
    "No automatic replacement booking, no real-time provider promises, no AI eligibility judgments, and no live participant data in the demonstrator."
} as const;

export const stages = [
  { step: "Listen", label: "Explore the problem", description: "Invite different perspectives. Agree on questions worth researching, not predetermined solutions." },
  { step: "Co-design", label: "Define the collaboration", description: "Develop accessible governance, contributions, shared methods and an ethical research protocol." },
  { step: "Evaluate", label: "Test before claiming", description: "Use synthetic evidence and independent evaluation to determine whether a pilot is justified." },
  { step: "Decide", label: "Publish and review", description: "Share findings and uncertainties. Move forward only with formal approval and participant confidence." }
] as const;

export const contextLinks = [
  {
    title: "Australian Disability Ltd",
    description: "The organisation's published purpose and rights-led approach.",
    href: "https://www.ausdis.com.au/about",
    role: "Organisational context"
  },
  {
    title: "Care Economy CRC",
    description:
      "Public research priorities spanning technology solutions, data innovation and workforce innovation. This is a reference, not a claimed partnership.",
    href: "https://www.careeconomycrc.com.au/",
    role: "External research context"
  },
  {
    title: "MapAble",
    description:
      "Australian Disability Ltd's connected accessibility, care and transport platform; current feature maturity varies and must be verified.",
    href: "https://mapable.com.au/",
    role: "Proposed demonstration platform"
  }
] as const;

/** No membership signup, paid offer, donations or claims of live research. */
export const proposalOnlyCapabilities = {
  publicPage: true,
  inquiryViaExternalEmail: true,
  membershipApplication: false,
  partnerDirectory: false,
  participantDataCollection: false,
  researchRecruitment: false,
  automatedActions: false,
  liveDataSharing: false,
  deployedPilot: false
} as const;
