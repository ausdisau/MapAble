import { randomUUID } from "crypto";

import type { DraftPrmsRecord, OfficialPrmsRecord , ActorType } from "@/lib/prms/types";

type StoredDraft = DraftPrmsRecord & { id: string; createdAt: string };

const drafts = new Map<string, StoredDraft>();
const official = new Map<string, OfficialPrmsRecord>();

export function createDraft(
  record: Omit<DraftPrmsRecord, "id">
): StoredDraft {
  const id = randomUUID();
  const stored: StoredDraft = {
    ...record,
    id,
    createdAt: new Date().toISOString(),
  };
  drafts.set(id, stored);
  return stored;
}

export function getDraft(id: string): StoredDraft | undefined {
  return drafts.get(id);
}

export function confirmDraft(
  draftId: string,
  confirmedBy: ActorType
): OfficialPrmsRecord | null {
  const draft = drafts.get(draftId);
  if (!draft) return null;

  const officialRecord: OfficialPrmsRecord = {
    ...draft,
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
    confirmedBy,
  };
  official.set(draftId, officialRecord);
  drafts.delete(draftId);
  return officialRecord;
}

export function listOfficialForParticipant(
  participantId: string
): OfficialPrmsRecord[] {
  return [...official.values()].filter(
    (r) => r.participantId === participantId
  );
}

export function resetDraftStoreForTests(): void {
  drafts.clear();
  official.clear();
}
