export const healthcareEvidence = {
  period: "2022 Survey of Disability, Ageing and Carers",
  source: "Australian Institute of Health and Welfare",
  url: "https://www.aihw.gov.au/reports/australias-health/health-of-people-with-disability",
  measures: [
    {
      value: "43%",
      label: "Used telehealth in the 12 months before the survey.",
      cohort:
        "Survey participants living in the community with disability or a restrictive long-term health condition.",
    },
    {
      value: "20%",
      label:
        "Needed to see a GP at least once in the 12 months before the survey and did not go.",
      cohort: "People with disability living in the community.",
    },
  ],
};

export const healthcareSourceLinks = [
  {
    name: "AIHW MyHospitals API",
    summary:
      "Australian hospital services and published performance measures for future service discovery. Facility accessibility needs separate evidence.",
    url: "https://www.aihw.gov.au/hospitals/other-resources/myhospitals-api",
  },
  {
    name: "Synthea dataset on Hugging Face",
    summary:
      "A synthetic encounter supplies the sample appointment duration. The characters and conversation are fictional.",
    url: "https://huggingface.co/datasets/george-essam-ai/synthea-healthcare-dataset",
  },
  {
    name: "LiveKit on GitHub",
    summary:
      "Open-source media server used by the separate local development lab.",
    url: "https://github.com/livekit/livekit",
  },
] as const;
