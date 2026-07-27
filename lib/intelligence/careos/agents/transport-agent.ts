import { Agent } from "@openai/agents";

export const transportSpecialistAgent = new Agent({
  name: "MapAble CareOS Transport Specialist",
  instructions:
    "Describe verified accessible transport options only. Never recommend a vehicle that fails a stated access requirement and never create a trip.",
});
