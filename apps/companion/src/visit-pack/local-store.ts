import {
  getEncryptedStore,
  VISIT_PACK_KEY,
} from "../storage/encrypted-store";

export type LocalVisitPack = {
  packId: string;
  passportVersion: number;
  expiresAt: string;
  instructions: Array<{
    id: string;
    mode: string;
    workerFacingWording: string;
    required: boolean;
  }>;
};

export async function saveVisitPackLocal(pack: LocalVisitPack): Promise<void> {
  await getEncryptedStore().setItem(VISIT_PACK_KEY, JSON.stringify(pack));
}

export async function loadVisitPackLocal(): Promise<LocalVisitPack | null> {
  const raw = await getEncryptedStore().getItem(VISIT_PACK_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalVisitPack;
  } catch {
    return null;
  }
}

export async function clearVisitPackLocal(): Promise<void> {
  await getEncryptedStore().deleteItem(VISIT_PACK_KEY);
}
