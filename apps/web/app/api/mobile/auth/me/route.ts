import { requireMobileBearer } from "@/lib/api/auth-handler";

export async function GET(request: Request) {
  const user = await requireMobileBearer(request, "identity:read");
  if (user instanceof Response) return user;

  return Response.json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        primaryRole: user.primaryRole,
        roles: user.roles,
        locale: user.locale,
        timezone: user.timezone,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
