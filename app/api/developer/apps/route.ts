import { requireApiSession } from "@/lib/api/auth-handler";
import { createDeveloperApp } from "@/lib/api/developer/api-key-service";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const orgs = await prisma.developerOrganisation.findMany({
    include: { apps: true },
    take: 20,
  });
  return jsonOk({ organisations: orgs });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  let org = await prisma.developerOrganisation.findFirst();
  if (!org) {
    org = await prisma.developerOrganisation.create({
      data: { name: body.organisationName ?? "Developer org" },
    });
  }
  const app = await createDeveloperApp(org.id, body.name ?? "New app");
  return jsonOk({ app }, 201);
}
