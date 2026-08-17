import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";

/** Returns the signed-in user, or null when the request is anonymous. */
export async function getOptionalApiUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return getCurrentUser();
}
