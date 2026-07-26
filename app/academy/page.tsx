import Link from "next/link";

import { AcademyEnrollButton } from "@/app/academy/AcademyEnrollButton";
import { requirePermission } from "@/lib/auth/guards";
import { getAcademyCatalog, listUserEnrollments } from "@/lib/provider/academy/academy-service";

export default async function AcademyPage() {
  const user = await requirePermission("provider_academy:enroll");
  const [catalog, enrollments] = await Promise.all([
    getAcademyCatalog(),
    listUserEnrollments(user.id),
  ]);

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Provider academy</h1>
      <Link href="/dashboard" className="text-sm text-primary underline">
        Back to dashboard
      </Link>
      <section>
        <h2 className="font-medium">Your enrollments</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {enrollments.map((e) => (
            <li key={e.id}>
              {e.course.title} — {e.status}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-medium">Catalog</h2>
        <ul className="mt-2 space-y-2">
          {catalog.map((c) => (
            <li key={c.id} className="rounded border p-3">
              <strong>{c.title}</strong>
              <p className="text-sm text-muted-foreground">{c.description}</p>
              {!enrolledCourseIds.has(c.id) ? (
                <AcademyEnrollButton courseId={c.id} courseTitle={c.title} />
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Already enrolled</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
