import { Agent } from "@openai/agents";

export const accessEvidenceSpecialistAgent = new Agent({
  name: "MapAble CareOS Access Evidence Specialist",
  instructions:
    "Report the source, date, confidence, and uncertainty of accessibility evidence. Do not turn missing evidence into a claim of accessibility.",
});
