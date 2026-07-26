import { createHash, randomUUID } from "crypto";

import { getCommunicationPassport } from "@/lib/support/communication-passport/service";
import type { VisitPack } from "@/mobile-contracts/schemas/visit-pack";
import { visitPackSchema } from "@/mobile-contracts/schemas/visit-pack";

export type CompileVisitPackInput = {
  participantId: string;
  careSummary?: string;
  transportSummary?: string;
  venueSummary?: string;
  ttlHours?: number;
};

/**
 * Compile a bounded offline Visit Pack for Companion.
 * Redacted by design — no diagnosis, no unlimited PII.
 */
export async function compileVisitPack(
  input: CompileVisitPackInput,
): Promise<VisitPack> {
  const passport = await getCommunicationPassport(input.participantId);
  const compiledAt = new Date();
  const ttl = Math.min(Math.max(input.ttlHours ?? 24, 1), 72);
  const expiresAt = new Date(compiledAt.getTime() + ttl * 3600_000);

  const pack: VisitPack = {
    packId: randomUUID(),
    participantId: input.participantId,
    passportVersion: passport.version,
    compiledAt: compiledAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    careSummary: input.careSummary?.slice(0, 2000),
    transportSummary: input.transportSummary?.slice(0, 2000),
    venueSummary: input.venueSummary?.slice(0, 2000),
    instructions: passport.instructions.map((i) => ({
      id: i.id,
      mode: i.mode,
      workerFacingWording: i.workerFacingWording,
      required: i.required,
    })),
    redacted: true,
    offlineBounded: true,
  };

  return visitPackSchema.parse(pack);
}

export function visitPackIntegrityHash(pack: VisitPack): string {
  return createHash("sha256").update(JSON.stringify(pack)).digest("hex");
}
