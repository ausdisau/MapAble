import type { MapAbleUserRole } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { agentLog } from "@/lib/debug/agent-log";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  timezone: string;
  locale: string;
  primaryRole: UserRole;
  roles: UserRole[];
}

export async function getUserById(userId: string): Promise<CurrentUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roleAssignments: true },
  });

  if (!user) return null;

  const roles: UserRole[] = [
    user.primaryRole as UserRole,
    ...user.roleAssignments.map((r) => r.role as UserRole),
  ];
  const uniqueRoles = [...new Set(roles)];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    timezone: user.timezone,
    locale: user.locale,
    primaryRole: user.primaryRole as UserRole,
    roles: uniqueRoles,
  };
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  agentLog("E", "current-user.ts:getCurrentUser:session", "session read", {
    hasSession: Boolean(session),
    sessionUserId: session?.user?.id ?? null,
  });
  if (!session?.user?.id) return null;

  const user = await getUserById(session.user.id);
  agentLog("E", "current-user.ts:getCurrentUser:db", "db user lookup", {
    found: Boolean(user),
    primaryRole: user?.primaryRole ?? null,
  });
  return user;
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function userHasRole(
  user: CurrentUser,
  role: UserRole | MapAbleUserRole
): boolean {
  return user.roles.includes(role as UserRole);
}
