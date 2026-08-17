import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createJobDraft } from "@/lib/jobs/job-service";
import { prisma } from "@/lib/prisma";
import { createJobSchema } from "@/lib/validation/jobs";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const status = new URL(req.url).searchParams.get("status") ?? "published";
  const jobs = await prisma.job.findMany({
    where: { status: status as "published" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonOk({ jobs });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("jobs:manage:employer");
  if (user instanceof Response) return user;
  try {
    const parsed = createJobSchema.parse(await req.json());
    const job = await createJobDraft({
      ...parsed,
      createdById: user.id,
    });
    return jsonOk({ job }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Create failed", 500);
  }
}
