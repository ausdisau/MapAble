import { getCurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";

export function verifyAdminCronBearer(request: Request): boolean {
  const secret = process.env.ADMIN_CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice("Bearer ".length).trim();
  return token.length > 0 && token === secret;
}

export async function verifyAdminSession(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user && isAdminRole(user.primaryRole));
}

export async function canTriggerAdminIngestion(
  request: Request,
): Promise<boolean> {
  if (verifyAdminCronBearer(request)) return true;
  return verifyAdminSession();
}
