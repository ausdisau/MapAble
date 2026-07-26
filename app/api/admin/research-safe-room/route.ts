import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  createResearchProject,
  listResearchProjects,
} from "@/lib/research/safe-room/safe-room-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await listResearchProjects());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const project = await createResearchProject(body);
  return jsonOk({ project }, 201);
}
