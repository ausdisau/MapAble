import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { enrollInCourse } from "@/lib/provider/academy/academy-service";

export async function POST(req: Request) {
  const user = await requireApiPermission("provider_academy:enroll");
  if (user instanceof Response) return user;
  const body = await req.json();
  const enrollment = await enrollInCourse(body.courseId, user.id);
  return jsonOk({ enrollment }, 201);
}
