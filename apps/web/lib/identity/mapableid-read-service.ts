import type { CurrentUser } from "@/lib/auth/current-user";
import { roleLabel } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

import {
  buildMapAbleIdReadSnapshot,
  type MapAbleIdReadSnapshot,
} from "./mapableid-read-model";

/**
 * The only allowed subject is the already-authenticated current application
 * user. No arbitrary account ID, organisation ID or email lookup is accepted.
 *
 * Counts are scoped to existing Prisma data in MapAble's configured database.
 * No query is sent to the separate AD.iD Neon project or neon_auth schema.
 */
export async function readOwnMapAbleIdSnapshot(
  actor: CurrentUser,
): Promise<MapAbleIdReadSnapshot> {
  const now = new Date();
  const [profile, storedPasskeyCredentials, activeRecipientConsents] =
    await Promise.all([
      prisma.participantProfile.findUnique({
        where: { userId: actor.id },
        select: { preferredName: true },
      }),
      prisma.passkeyCredential.count({ where: { userId: actor.id } }),
      prisma.consentRecord.count({
        where: {
          subjectUserId: actor.id,
          status: "active",
          revokedAt: null,
          AND: [
            {
              OR: [
                { grantedToUserId: { not: null } },
                { grantedToOrganisationId: { not: null } },
              ],
            },
            { OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] },
          ],
        },
      }),
    ]);

  return buildMapAbleIdReadSnapshot({
    displayName: profile?.preferredName?.trim() || actor.name,
    email: actor.email,
    roleLabel: roleLabel(actor.primaryRole),
    storedPasskeyCredentials,
    activeRecipientConsents,
  });
}
