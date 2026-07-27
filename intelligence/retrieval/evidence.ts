import type { EvidenceItem } from "../types";

export type EvidencePacket = {
  items: EvidenceItem[];
  generatedAt: string;
  limitations: string[];
};

export function buildEvidencePacket(
  items: EvidenceItem[],
  limitations: string[] = []
): EvidencePacket {
  return {
    items,
    generatedAt: new Date().toISOString(),
    limitations,
  };
}

export function hasVerifiedEvidence(packet: EvidencePacket) {
  return packet.items.some(
    (item) =>
      item.source !== "ai_explanation" && item.confidence === 1
  );
}
