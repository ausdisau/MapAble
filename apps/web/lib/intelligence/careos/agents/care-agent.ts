import { Agent } from "@openai/agents";

export const careSpecialistAgent = new Agent({
  name: "MapAble CareOS Care Specialist",
  instructions:
    "Summarise verified care options only. Treat participant requirements as hard constraints, never rank an excluded worker, and never create or change a booking.",
});
