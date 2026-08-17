import type {
  CanvasBlock,
  CanvasModule,
  EcosystemLink,
  TrustPrinciple,
} from "@/lib/canvas/canvas-data";
import {
  canvasBlocks,
  providerBlockIds,
  providerJourneyStepRange,
  journeySteps,
  trustPrinciples,
} from "@/lib/canvas/canvas-data";
import {
  participantJourneyStepRange,
  resourceTrustPrincipleTitles,
} from "@/lib/canvas/resource-hub-data";

export function getBlocksForModule(module: CanvasModule): CanvasBlock[] {
  return canvasBlocks.filter((b) => b.modules.includes(module));
}

export function getBlocksByIds(ids: string[]): CanvasBlock[] {
  return canvasBlocks.filter((b) => ids.includes(b.id));
}

export function getProviderBlocks(): CanvasBlock[] {
  return getBlocksByIds(providerBlockIds);
}

export function getBlocksByEcosystemLink(link: EcosystemLink): CanvasBlock[] {
  return canvasBlocks.filter((b) => b.ecosystemLinks.includes(link));
}

export function getAllBlockTitles(): string[] {
  return canvasBlocks.map((b) => b.title);
}

export function getProviderJourneySteps() {
  return journeySteps.filter(
    (s) =>
      s.step >= providerJourneyStepRange.from &&
      s.step <= providerJourneyStepRange.to
  );
}

export function getParticipantJourneySteps() {
  return journeySteps.filter(
    (s) =>
      s.step >= participantJourneyStepRange.from &&
      s.step <= participantJourneyStepRange.to
  );
}

export function getResourceTrustPrinciples(): TrustPrinciple[] {
  return trustPrinciples.filter((principle) =>
    resourceTrustPrincipleTitles.includes(principle.title)
  );
}
