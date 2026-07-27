import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import {
  assertMandatoryTenantContext,
  requireTenantIdHeader,
  TenantIsolationError,
} from "@/lib/careos/opportunities/tenant-isolation";

export async function POST(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const headerTenant = requireTenantIdHeader(request.headers);
  const body = (await request.json()) as {
    tenantId?: string;
    resourceType?: string;
    resourceId?: string;
    resourceTenantId?: string;
  };

  try {
    const result = await assertMandatoryTenantContext({
      actorUserId: user.id,
      tenantId: body.tenantId ?? headerTenant,
      resourceType: body.resourceType ?? "enterprise_resource",
      resourceId: body.resourceId,
      resourceTenantId: body.resourceTenantId,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TenantIsolationError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: 403 },
      );
    }
    const message = error instanceof Error ? error.message : "TENANT_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
